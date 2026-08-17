import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // Directory creation fallback
  }
}

export class FileStorageAdapter {
  static readData<T>(fileName: string, fallbackData: T[] = []): T[] {
    try {
      const filePath = path.join(DATA_DIR, fileName);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err: any) {
      console.warn(`[FileStorage] Read error for ${fileName}:`, err.message);
    }
    return fallbackData;
  }

  static saveData<T>(fileName: string, data: T[]): void {
    try {
      const filePath = path.join(DATA_DIR, fileName);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err: any) {
      console.warn(`[FileStorage] Save error for ${fileName}:`, err.message);
    }
  }
}
