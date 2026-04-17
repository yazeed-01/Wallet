// Database Diagnostics and Manual Migration Utilities
// FOR DEVELOPMENT USE ONLY
import { getDatabase } from '../database';
import { runMigrations } from '../database/migrations';
import { SCHEMA_VERSION } from '../database/schema';

/**
 * Check the current database schema version and table structure
 */
export async function checkDatabaseStatus() {
  try {
    const db = getDatabase();

    console.log('[DBDiag] === Database Status Check ===');

    // Check schema version
    const [versionResult] = await db.executeSql(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );
    const currentVersion = versionResult.rows.length > 0
      ? versionResult.rows.item(0).version
      : 0;

    console.log(`[DBDiag] Current schema version: ${currentVersion}`);
    console.log(`[DBDiag] Expected schema version: ${SCHEMA_VERSION}`);

    // Check if transactions table has image_path column
    const [tableInfo] = await db.executeSql(
      'PRAGMA table_info(transactions)'
    );

    console.log('[DBDiag] Transactions table columns:');
    const hasImagePath = [];
    for (let i = 0; i < tableInfo.rows.length; i++) {
      const col = tableInfo.rows.item(i);
      console.log(`  - ${col.name} (${col.type})`);
      if (col.name === 'image_path') {
        hasImagePath.push(true);
      }
    }

    if (hasImagePath.length > 0) {
      console.log('[DBDiag] ✅ image_path column EXISTS');
    } else {
      console.log('[DBDiag] ❌ image_path column MISSING');
    }

    return {
      currentVersion,
      expectedVersion: SCHEMA_VERSION,
      hasImagePath: hasImagePath.length > 0,
      needsMigration: currentVersion < SCHEMA_VERSION,
    };
  } catch (error) {
    console.error('[DBDiag] Error checking database status:', error);
    throw error;
  }
}

/**
 * Manually run migrations from current version to latest
 */
export async function runManualMigration() {
  try {
    const db = getDatabase();

    console.log('[DBDiag] === Running Manual Migration ===');

    // Get current version
    const [versionResult] = await db.executeSql(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );
    const currentVersion = versionResult.rows.length > 0
      ? versionResult.rows.item(0).version
      : 0;

    console.log(`[DBDiag] Current version: ${currentVersion}`);
    console.log(`[DBDiag] Target version: ${SCHEMA_VERSION}`);

    if (currentVersion >= SCHEMA_VERSION) {
      console.log('[DBDiag] Database is already up to date!');
      return { success: true, message: 'Already up to date' };
    }

    // Run migrations
    console.log('[DBDiag] Running migrations...');
    await runMigrations(db, currentVersion, SCHEMA_VERSION);

    // Update schema version
    await db.executeSql(
      'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
      [SCHEMA_VERSION, Date.now()]
    );

    console.log('[DBDiag] ✅ Migration completed successfully!');

    // Verify the column was added
    const status = await checkDatabaseStatus();

    return {
      success: true,
      message: 'Migration completed',
      hasImagePath: status.hasImagePath,
    };
  } catch (error) {
    console.error('[DBDiag] Error running manual migration:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add image_path column directly (emergency fix)
 * Use this only if the migration system is not working
 */
export async function addImagePathColumn() {
  try {
    const db = getDatabase();

    console.log('[DBDiag] === Adding image_path Column Directly ===');

    // Check if column already exists
    const [tableInfo] = await db.executeSql('PRAGMA table_info(transactions)');
    for (let i = 0; i < tableInfo.rows.length; i++) {
      const col = tableInfo.rows.item(i);
      if (col.name === 'image_path') {
        console.log('[DBDiag] Column already exists!');
        return { success: true, message: 'Column already exists' };
      }
    }

    // Add the column
    await db.executeSql('ALTER TABLE transactions ADD COLUMN image_path TEXT');

    console.log('[DBDiag] ✅ image_path column added successfully!');

    // Verify
    const status = await checkDatabaseStatus();

    return {
      success: true,
      message: 'Column added successfully',
      hasImagePath: status.hasImagePath,
    };
  } catch (error) {
    console.error('[DBDiag] Error adding image_path column:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export all diagnostic functions for easy console access
export default {
  checkDatabaseStatus,
  runManualMigration,
  addImagePathColumn,
};
