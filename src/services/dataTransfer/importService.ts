import RNFS from 'react-native-fs';
import { pick, keepLocalCopy } from '@react-native-documents/picker';
import JSZip from 'jszip';
import { executeSql } from '../../database';
import type {
  Category,
  Transaction,
  Subscription,
  RecurringExpense,
  Goal,
  Debt,
} from '../../types/models';

const IMAGES_DEST = `${RNFS.DocumentDirectoryPath}/transaction-images/originals`;

interface ExportPayload {
  version: string;
  exportedAt: string;
  data: {
    categories: Category[];
    transactions: (Transaction & { images?: string[] })[];
    subscriptions: Subscription[];
    recurringExpenses: RecurringExpense[];
    goals: Goal[];
    debts: Debt[];
  };
}

export async function pickAndImportData(currentAccountId: string): Promise<{
  imported: Record<string, number>;
}> {
  const [result] = await pick({ allowMultiSelection: false });

  // Copy to local cache so RNFS can access it
  const [localCopy] = await keepLocalCopy({
    files: [{ uri: result.uri, fileName: result.name ?? 'backup' }],
    destination: 'cachesDirectory',
  });

  if (localCopy.status === 'error') {
    throw new Error(localCopy.copyError ?? 'Failed to copy file');
  }

  const filePath = decodeURIComponent(localCopy.localUri.replace('file://', ''));
  const isZip = (result.name ?? filePath).toLowerCase().endsWith('.zip') ||
    (result.type ?? '').includes('zip');

  let payload: ExportPayload;

  if (isZip) {
    // Read ZIP from disk and parse with JSZip
    const zipBase64 = await RNFS.readFile(filePath, 'base64');
    const zip = await JSZip.loadAsync(zipBase64, { base64: true });

    const dataFile = zip.file('data.json');
    if (!dataFile) throw new Error('Invalid backup: data.json not found inside ZIP');

    const raw = await dataFile.async('string');
    payload = JSON.parse(raw);

    // Extract images
    const imageFiles = Object.keys(zip.files).filter(
      name => name.startsWith('images/') && !zip.files[name].dir
    );

    if (!(await RNFS.exists(IMAGES_DEST))) await RNFS.mkdir(IMAGES_DEST);

    await importPayload(payload, currentAccountId, async (fileName: string) => {
      const zipEntry = zip.file(`images/${fileName}`);
      if (!zipEntry) return null;
      const destPath = `${IMAGES_DEST}/${fileName}`;
      if (!(await RNFS.exists(destPath))) {
        const imgBase64 = await zipEntry.async('base64');
        await RNFS.writeFile(destPath, imgBase64, 'base64');
      }
      return (await RNFS.exists(destPath)) ? destPath : null;
    });

    // Also restore any images not referenced by transactions
    for (const name of imageFiles) {
      const fileName = name.replace('images/', '');
      const destPath = `${IMAGES_DEST}/${fileName}`;
      if (!(await RNFS.exists(destPath))) {
        const zipEntry = zip.file(name)!;
        const imgBase64 = await zipEntry.async('base64');
        await RNFS.writeFile(destPath, imgBase64, 'base64');
      }
    }
  } else {
    // Legacy plain JSON backup
    const raw = await RNFS.readFile(filePath, 'utf8');
    payload = JSON.parse(raw);
    await importPayload(payload, currentAccountId, null);
  }

  return { imported: countImported(payload) };
}

type ImageResolver = ((fileName: string) => Promise<string | null>) | null;

async function importPayload(
  payload: ExportPayload,
  currentAccountId: string,
  resolveImage: ImageResolver
): Promise<void> {
  if (!payload.version || !payload.data) {
    throw new Error('Invalid backup file format');
  }

  const { categories, transactions, subscriptions, recurringExpenses, goals, debts } = payload.data;

  // Import categories
  for (const c of categories ?? []) {
    await executeSql(
      `INSERT OR IGNORE INTO categories (id, user_id, name, type, icon, color, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.userId, c.name, c.type, c.icon, c.color, c.isDefault ? 1 : 0, c.createdAt]
    );
  }

  // Import transactions + their images
  for (const t of transactions ?? []) {
    const newImagePaths: string[] = [];

    if (resolveImage && t.images?.length) {
      for (const oldPath of t.images) {
        const fileName = oldPath.replace('file://', '').split('/').pop()!;
        const destPath = await resolveImage(fileName);
        if (destPath) newImagePaths.push(destPath);
      }
    }

    // Remap legacy imagePath
    let restoredImagePath = t.imagePath ?? null;
    if (resolveImage && t.imagePath) {
      const fileName = t.imagePath.replace('file://', '').split('/').pop()!;
      restoredImagePath = await resolveImage(fileName);
    }

    await executeSql(
      `INSERT OR IGNORE INTO transactions
       (id, account_id, type, amount, category_id, description, date, vault_type,
        is_recurring, recurring_expense_id, subscription_id, image_path, currency,
        original_amount, exchange_rate, converted_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id, currentAccountId, t.type, t.amount, t.categoryId, t.description ?? null,
        t.date, t.vaultType, t.isRecurring ? 1 : 0,
        t.recurringExpenseId ?? null, t.subscriptionId ?? null,
        restoredImagePath,
        t.currency ?? 'USD', t.originalAmount ?? null,
        t.exchangeRate ?? null, t.convertedAmount ?? null,
        t.createdAt, t.updatedAt,
      ]
    );

    for (let i = 0; i < newImagePaths.length; i++) {
      const id = `${t.id}-img-${i}`;
      await executeSql(
        `INSERT OR IGNORE INTO transaction_images (id, transaction_id, image_path, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, t.id, newImagePaths[i], i, Date.now()]
      );
    }
  }

  // Import subscriptions
  for (const s of subscriptions ?? []) {
    await executeSql(
      `INSERT OR IGNORE INTO subscriptions
       (id, account_id, name, amount, category_id, billing_day, is_active,
        vault_type, last_processed, next_processing, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id, currentAccountId, s.name, s.amount, s.categoryId, s.billingDay,
        s.isActive ? 1 : 0, s.vaultType, s.lastProcessed ?? null,
        s.nextProcessing, s.createdAt, s.updatedAt,
      ]
    );
  }

  // Import recurring expenses
  for (const r of recurringExpenses ?? []) {
    await executeSql(
      `INSERT OR IGNORE INTO recurring_expenses
       (id, account_id, name, amount, category_id, frequency, interval,
        next_occurrence, vault_type, is_active, auto_deduct, last_processed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id, currentAccountId, r.name, r.amount, r.categoryId, r.frequency,
        r.interval, r.nextOccurrence, r.vaultType, r.isActive ? 1 : 0,
        r.autoDeduct ? 1 : 0, r.lastProcessed ?? null, r.createdAt, r.updatedAt,
      ]
    );
  }

  // Import goals
  for (const g of goals ?? []) {
    await executeSql(
      `INSERT OR IGNORE INTO goals
       (id, account_id, name, target_amount, current_amount, funding_source,
        icon, color, is_completed, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        g.id, currentAccountId, g.name, g.targetAmount, g.currentAmount,
        g.fundingSource, g.icon, g.color, g.isCompleted ? 1 : 0,
        g.completedAt ?? null, g.createdAt, g.updatedAt,
      ]
    );
  }

  // Import debts
  for (const d of debts ?? []) {
    await executeSql(
      `INSERT OR IGNORE INTO debts
       (id, account_id, type, person_name, amount, amount_paid, due_date,
        status, description, category_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.id, currentAccountId, d.type, d.personName, d.amount, d.amountPaid,
        d.dueDate ?? null, d.status, d.description ?? null,
        d.categoryId ?? null, d.createdAt, d.updatedAt,
      ]
    );
  }
}

function countImported(payload: ExportPayload): Record<string, number> {
  const d = payload.data;
  return {
    categories: d.categories?.length ?? 0,
    transactions: d.transactions?.length ?? 0,
    subscriptions: d.subscriptions?.length ?? 0,
    recurringExpenses: d.recurringExpenses?.length ?? 0,
    goals: d.goals?.length ?? 0,
    debts: d.debts?.length ?? 0,
  };
}
