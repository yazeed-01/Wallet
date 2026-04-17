// Image storage and compression utility for transaction attachments
import RNFS from 'react-native-fs';
import ImageResizer from '@bam.tech/react-native-image-resizer';

// Directory paths for storing images
const IMAGES_DIR = `${RNFS.DocumentDirectoryPath}/transaction-images`;
const ORIGINALS_DIR = `${IMAGES_DIR}/originals`;
const THUMBNAILS_DIR = `${IMAGES_DIR}/thumbnails`;

// Image configuration
const THUMBNAIL_SIZE = 400;
const THUMBNAIL_QUALITY = 70;
const ORIGINAL_QUALITY = 95;

/**
 * Initialize image storage directories
 */
export const initializeImageStorage = async (): Promise<void> => {
    try {
        // Create directories if they don't exist
        const dirsToCreate = [IMAGES_DIR, ORIGINALS_DIR, THUMBNAILS_DIR];

        for (const dir of dirsToCreate) {
            const exists = await RNFS.exists(dir);
            if (!exists) {
                await RNFS.mkdir(dir);
                console.log('[ImageStorage] Created directory:', dir);
            }
        }
    } catch (error) {
        console.error('[ImageStorage] Error initializing directories:', error);
        throw error;
    }
};

/**
 * Compress and save transaction image
 * Creates both thumbnail and original quality versions
 */
export const compressAndSaveImage = async (
    imageUri: string,
    transactionId: string
): Promise<{ thumbnailPath: string; originalPath: string }> => {
    try {
        console.log('[ImageStorage] Processing image for transaction:', transactionId);

        // Ensure directories exist
        await initializeImageStorage();

        const originalPath = `${ORIGINALS_DIR}/${transactionId}.jpg`;

        // Save at full quality using ImageResizer (handles file:// and content:// URIs)
        const result = await ImageResizer.createResizedImage(
            imageUri,
            9999,
            9999,
            'JPEG',
            100,
            0,
            undefined,
            false,
            { mode: 'contain', onlyScaleDown: true }
        );

        await RNFS.moveFile(result.uri, originalPath);
        console.log('[ImageStorage] Image saved:', originalPath);

        return { thumbnailPath: originalPath, originalPath };
    } catch (error) {
        console.error('[ImageStorage] Error compressing image:', error);
        throw error;
    }
};

/**
 * Delete transaction image files
 */
export const deleteTransactionImage = async (transactionId: string): Promise<void> => {
    try {
        const thumbnailPath = `${THUMBNAILS_DIR}/${transactionId}.jpg`;
        const originalPath = `${ORIGINALS_DIR}/${transactionId}.jpg`;

        // Delete thumbnail if exists
        const thumbnailExists = await RNFS.exists(thumbnailPath);
        if (thumbnailExists) {
            await RNFS.unlink(thumbnailPath);
            console.log('[ImageStorage] Deleted thumbnail:', thumbnailPath);
        }

        // Delete original if exists
        const originalExists = await RNFS.exists(originalPath);
        if (originalExists) {
            await RNFS.unlink(originalPath);
            console.log('[ImageStorage] Deleted original:', originalPath);
        }
    } catch (error) {
        console.error('[ImageStorage] Error deleting image:', error);
        // Don't throw - deletion failures shouldn't block transactions
    }
};

/**
 * Get thumbnail path for a transaction
 */
export const getThumbnailPath = (transactionId: string): string => {
    return `${THUMBNAILS_DIR}/${transactionId}.jpg`;
};

/**
 * Get original image path for a transaction
 */
export const getOriginalPath = (transactionId: string): string => {
    return `${ORIGINALS_DIR}/${transactionId}.jpg`;
};

/**
 * Check if transaction has an image
 */
export const hasTransactionImage = async (transactionId: string): Promise<boolean> => {
    try {
        const thumbnailPath = getThumbnailPath(transactionId);
        return await RNFS.exists(thumbnailPath);
    } catch (error) {
        console.error('[ImageStorage] Error checking image existence:', error);
        return false;
    }
};

/**
 * Get image file info (size, dimensions, etc.)
 */
export const getImageInfo = async (
    path: string
): Promise<{ size: number; exists: boolean } | null> => {
    try {
        const exists = await RNFS.exists(path);
        if (!exists) {
            return { size: 0, exists: false };
        }

        const stats = await RNFS.stat(path);
        return {
            size: stats.size,
            exists: true,
        };
    } catch (error) {
        console.error('[ImageStorage] Error getting image info:', error);
        return null;
    }
};

/**
 * Clean up orphaned images (images without corresponding transactions)
 * This should be called periodically for maintenance
 */
export const cleanupOrphanedImages = async (
    validTransactionIds: string[]
): Promise<number> => {
    try {
        let cleanedCount = 0;

        // Check thumbnails directory
        const thumbnails = await RNFS.readDir(THUMBNAILS_DIR);
        for (const file of thumbnails) {
            const transactionId = file.name.replace('.jpg', '');
            if (!validTransactionIds.includes(transactionId)) {
                await RNFS.unlink(file.path);
                cleanedCount++;
            }
        }

        // Check originals directory
        const originals = await RNFS.readDir(ORIGINALS_DIR);
        for (const file of originals) {
            const transactionId = file.name.replace('.jpg', '');
            if (!validTransactionIds.includes(transactionId)) {
                await RNFS.unlink(file.path);
                cleanedCount++;
            }
        }

        console.log('[ImageStorage] Cleaned up', cleanedCount, 'orphaned images');
        return cleanedCount;
    } catch (error) {
        console.error('[ImageStorage] Error cleaning up orphaned images:', error);
        return 0;
    }
};

/**
 * Get total storage used by transaction images
 */
export const getTotalImageStorageSize = async (): Promise<number> => {
    try {
        let totalSize = 0;

        const thumbnails = await RNFS.readDir(THUMBNAILS_DIR);
        for (const file of thumbnails) {
            const stats = await RNFS.stat(file.path);
            totalSize += stats.size;
        }

        const originals = await RNFS.readDir(ORIGINALS_DIR);
        for (const file of originals) {
            const stats = await RNFS.stat(file.path);
            totalSize += stats.size;
        }

        return totalSize;
    } catch (error) {
        console.error('[ImageStorage] Error calculating storage size:', error);
        return 0;
    }
};
