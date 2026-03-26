import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'achievements.db'));

console.log('Running database migration...');

try {
  // Check if content column exists
  const tableInfo = db.prepare("PRAGMA table_info(achievements)").all();
  const hasContentColumn = tableInfo.some(col => col.name === 'content');

  if (!hasContentColumn) {
    console.log('Adding content column to achievements table...');
    db.prepare('ALTER TABLE achievements ADD COLUMN content TEXT').run();
    console.log('✓ Content column added successfully!');
  } else {
    console.log('✓ Content column already exists, no migration needed.');
  }

  console.log('Migration complete!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}

db.close();
