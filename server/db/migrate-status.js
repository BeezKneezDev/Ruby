import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'achievements.db'));

console.log('Running status migration...');

try {
  // Check if status column exists
  const tableInfo = db.prepare("PRAGMA table_info(achievements)").all();
  const hasStatusColumn = tableInfo.some(col => col.name === 'status');

  if (!hasStatusColumn) {
    console.log('Adding status column to achievements table...');
    db.prepare('ALTER TABLE achievements ADD COLUMN status TEXT DEFAULT "completed"').run();
    console.log('✓ Status column added successfully!');
  } else {
    console.log('✓ Status column already exists, no migration needed.');
  }

  console.log('Migration complete!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}

db.close();
