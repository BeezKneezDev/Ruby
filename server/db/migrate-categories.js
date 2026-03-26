import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'achievements.db'));

console.log('Running categories migration...');

try {
  // Check if featured_image column exists in categories
  const tableInfo = db.prepare("PRAGMA table_info(categories)").all();
  const hasFeaturedImage = tableInfo.some(col => col.name === 'featured_image');

  if (!hasFeaturedImage) {
    console.log('Adding featured_image column to categories table...');
    db.prepare('ALTER TABLE categories ADD COLUMN featured_image TEXT').run();
    console.log('✓ Featured_image column added successfully!');
  } else {
    console.log('✓ Featured_image column already exists, no migration needed.');
  }

  console.log('Migration complete!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}

db.close();
