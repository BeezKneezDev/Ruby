import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'achievements.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category_id INTEGER NOT NULL,
    date TEXT,
    featured_image TEXT,
    gallery_images TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
`);

// Create default admin user if not exists (username: ruby, password: ruby123)
const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');
const user = checkUser.get('ruby');

if (!user) {
  const hashedPassword = bcrypt.hashSync('ruby123', 10);
  const insertUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  insertUser.run('ruby', hashedPassword);
  console.log('Default user created: username=ruby, password=ruby123');
}

// Create default categories if they don't exist
const checkCategory = db.prepare('SELECT id FROM categories WHERE slug = ?');
const defaultCategories = [
  { name: 'Academic', slug: 'academic', description: 'Academic achievements and awards' },
  { name: 'Sports', slug: 'sports', description: 'Sports and athletic achievements' },
  { name: 'Arts', slug: 'arts', description: 'Creative and artistic achievements' }
];

const insertCategory = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)');

defaultCategories.forEach(cat => {
  const exists = checkCategory.get(cat.slug);
  if (!exists) {
    insertCategory.run(cat.name, cat.slug, cat.description);
    console.log(`Category created: ${cat.name}`);
  }
});

export default db;
