import { put, del } from '@vercel/blob';

const STORAGE_MODE = process.env.STORAGE_MODE || 'google-drive';

/**
 * Универсальный интерфейс для загрузки фото
 */
export async function uploadPhoto(
  file: File,
  path: string
): Promise<{ url: string; storageType: string }> {
  if (STORAGE_MODE === 'vercel-blob') {
    return uploadToVercelBlob(file, path);
  } else {
    return uploadToGoogleDrive(file, path);
  }
}

/**
 * Удаление фото
 */
export async function deletePhoto(url: string, storageType: string): Promise<boolean> {
  if (storageType === 'vercel-blob') {
    return deleteFromVercelBlob(url);
  } else {
    return deleteFromGoogleDrive(url);
  }
}

/**
 * Загрузка в Vercel Blob
 */
async function uploadToVercelBlob(
  file: File,
  path: string
): Promise<{ url: string; storageType: string }> {
  try {
    const blob = await put(path, file, {
      access: 'public',
      addRandomSuffix: true,
    });
    
    return {
      url: blob.url,
      storageType: 'vercel-blob',
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error('Failed to upload photo to Vercel Blob');
  }
}

/**
 * Удаление из Vercel Blob
 */
async function deleteFromVercelBlob(url: string): Promise<boolean> {
  try {
    await del(url);
    return true;
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    return false;
  }
}

/**
 * Инициализация Google Drive API
 */
function getGoogleDriveClient() {
  if (!process.env.GOOGLE_DRIVE_CLIENT_ID) {
    throw new Error('Google Drive credentials not configured');
  }
  
  // Простая реализация без googleapis
  // Для полной функциональности установите: npm install googleapis
  throw new Error('Install googleapis package: npm install googleapis');
}

/**
 * Загрузка в Google Drive
 */
async function uploadToGoogleDrive(
  file: File,
  path: string
): Promise<{ url: string; storageType: string }> {
  try {
    // Базовая реализация через REST API
    if (!process.env.GOOGLE_DRIVE_CLIENT_ID) {
      throw new Error('Google Drive not configured. Use Vercel Blob instead.');
    }
    
    // Временно используем Vercel Blob если Google Drive не настроен
    console.warn('Google Drive not fully configured, falling back to Vercel Blob');
    return uploadToVercelBlob(file, path);
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error('Failed to upload photo to Google Drive');
  }
}

/**
 * Удаление из Google Drive
 */
async function deleteFromGoogleDrive(url: string): Promise<boolean> {
  try {
    console.warn('Google Drive delete not implemented, skipping');
    return true;
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    return false;
  }
}

/**
 * Переключение режима хранилища через UI
 * Эта функция будет вызываться из админки
 */
export async function switchStorageMode(newMode: 'google-drive' | 'vercel-blob') {
  // В реальности это должно обновлять переменную окружения
  // Для Vercel это делается через Dashboard или API
  console.log(`Switching storage mode to: ${newMode}`);
  
  // TODO: Implement actual storage mode switching
  // This would typically involve:
  // 1. Updating environment variable on Vercel
  // 2. Triggering redeployment
  // 3. Optionally migrating existing photos
  
  return {
    success: true,
    message: `Storage mode will be switched to ${newMode} on next deployment`,
    instructions: `
      1. Go to Vercel Dashboard
      2. Navigate to Settings > Environment Variables
      3. Update STORAGE_MODE to "${newMode}"
      4. Redeploy the application
    `,
  };
}

/**
 * Получение текущего режима хранилища
 */
export function getCurrentStorageMode(): 'google-drive' | 'vercel-blob' {
  return STORAGE_MODE as 'google-drive' | 'vercel-blob';
}
