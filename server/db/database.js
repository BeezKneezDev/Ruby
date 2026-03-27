import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ruby_achievements',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      featured_image TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      date TEXT,
      featured_image TEXT,
      gallery_images JSONB,
      status TEXT DEFAULT 'completed',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Seed default admin user
  const { rows: existingUsers } = await pool.query('SELECT id FROM users WHERE username = $1', ['ruby']);
  if (existingUsers.length === 0) {
    const hashedPassword = bcrypt.hashSync('ruby123', 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['ruby', hashedPassword]);
    console.log('Default user created: username=ruby, password=ruby123');
  }

  // Seed default categories
  const defaultCategories = [
    { name: 'Academic', slug: 'academic', description: 'Academic achievements and awards' },
    { name: 'Sports', slug: 'sports', description: 'Sports and athletic achievements' },
    { name: 'Arts', slug: 'arts', description: 'Creative and artistic achievements' }
  ];

  for (const cat of defaultCategories) {
    const { rows } = await pool.query('SELECT id FROM categories WHERE slug = $1', [cat.slug]);
    if (rows.length === 0) {
      await pool.query('INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)', [cat.name, cat.slug, cat.description]);
      console.log(`Category created: ${cat.name}`);
    }
  }

  console.log('Database initialized');
}

export { pool, initializeDatabase };
