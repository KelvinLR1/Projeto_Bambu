import { DatabaseSync, StatementSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bambu.db');
const rawDb = new DatabaseSync(dbPath);

export interface ExtendedDatabase extends DatabaseSync {
  pragma(pragmaStr: string): void;
  transaction<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T>;
}

export const db: ExtendedDatabase = Object.assign(rawDb, {
  pragma(pragmaStr: string) {
    rawDb.exec(`PRAGMA ${pragmaStr};`);
  },
  transaction<T extends (...args: any[]) => any>(fn: T) {
    return (...args: Parameters<T>): ReturnType<T> => {
      rawDb.exec('BEGIN');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT');
        return result;
      } catch (error) {
        rawDb.exec('ROLLBACK');
        throw error;
      }
    };
  },
});

// Enable WAL mode for high concurrent performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
