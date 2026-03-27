import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool, initializeDatabase } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://beezkneezdev.github.io'
  ],
  credentials: true
}));
app.use(bodyParser.json());
app.use('/uploads', express.static(join(__dirname, '../public/uploads')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'ruby-achievements-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  proxy: process.env.NODE_ENV === 'production'
}));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Auth routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = rows[0];

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;

  res.json({
    success: true,
    user: { id: user.id, username: user.username }
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      user: { id: req.session.userId, username: req.session.username }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Public routes - Categories
app.get('/api/categories', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
  res.json(rows);
});

app.get('/api/categories/:slug', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories WHERE slug = $1', [req.params.slug]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json(rows[0]);
});

// Public routes - Achievements
app.get('/api/achievements', async (req, res) => {
  const { category_id } = req.query;

  let query = `
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM achievements a
    JOIN categories c ON a.category_id = c.id
  `;

  if (category_id) {
    query += ' WHERE a.category_id = $1 ORDER BY a.date DESC';
    const { rows } = await pool.query(query, [category_id]);
    return res.json(rows);
  }

  const { rows } = await pool.query(query + ' ORDER BY a.date DESC');
  res.json(rows);
});

app.get('/api/achievements/:id', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM achievements a
    JOIN categories c ON a.category_id = c.id
    WHERE a.id = $1
  `, [req.params.id]);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Achievement not found' });
  }

  res.json(rows[0]);
});

// Protected routes - Categories (admin only)
app.post('/api/admin/categories', requireAuth, upload.single('featured_image'), async (req, res) => {
  const { name, slug, description } = req.body;

  try {
    const featured_image = req.file?.filename || null;
    const { rows } = await pool.query(
      'INSERT INTO categories (name, slug, description, featured_image) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, description, featured_image]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/admin/categories/:id', requireAuth, upload.single('featured_image'), async (req, res) => {
  const { name, slug, description, keep_featured } = req.body;

  try {
    const { rows: currentRows } = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    const current = currentRows[0];

    let featured_image = current.featured_image;
    if (req.file) {
      featured_image = req.file.filename;
    } else if (keep_featured === 'false') {
      featured_image = null;
    }

    const { rows } = await pool.query(
      'UPDATE categories SET name = $1, slug = $2, description = $3, featured_image = $4 WHERE id = $5 RETURNING *',
      [name, slug, description, featured_image, req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Protected routes - Achievements (admin only)
app.post('/api/admin/achievements', requireAuth, upload.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 10 }
]), async (req, res) => {
  const { title, description, content, category_id, date, status } = req.body;

  try {
    const featured_image = req.files?.featured_image?.[0]?.filename || null;
    const gallery_images = req.files?.gallery_images?.map(f => f.filename) || [];
    const gallery_json = gallery_images.length > 0 ? JSON.stringify(gallery_images) : null;
    const achievementStatus = status || 'completed';

    const { rows } = await pool.query(`
      INSERT INTO achievements (title, description, content, category_id, date, featured_image, gallery_images, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *, (SELECT name FROM categories WHERE id = $4) as category_name, (SELECT slug FROM categories WHERE id = $4) as category_slug
    `, [title, description, content, category_id, date, featured_image, gallery_json, achievementStatus]);

    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/admin/achievements/:id', requireAuth, upload.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 10 }
]), async (req, res) => {
  const { title, description, content, category_id, date, status, keep_featured, keep_gallery } = req.body;

  try {
    const { rows: currentRows } = await pool.query('SELECT * FROM achievements WHERE id = $1', [req.params.id]);
    const current = currentRows[0];

    let featured_image = current.featured_image;
    if (req.files?.featured_image?.[0]) {
      featured_image = req.files.featured_image[0].filename;
    } else if (keep_featured === 'false') {
      featured_image = null;
    }

    let gallery_images = current.gallery_images || [];
    if (req.files?.gallery_images) {
      const newImages = req.files.gallery_images.map(f => f.filename);
      gallery_images = keep_gallery === 'true' ? [...gallery_images, ...newImages] : newImages;
    } else if (keep_gallery === 'false') {
      gallery_images = [];
    }
    const gallery_json = gallery_images.length > 0 ? JSON.stringify(gallery_images) : null;
    const achievementStatus = status || current.status || 'completed';

    const { rows } = await pool.query(`
      UPDATE achievements SET title = $1, description = $2, content = $3, category_id = $4, date = $5, featured_image = $6, gallery_images = $7, status = $8
      WHERE id = $9
      RETURNING *, (SELECT name FROM categories WHERE id = $4) as category_name, (SELECT slug FROM categories WHERE id = $4) as category_slug
    `, [title, description, content, category_id, date, featured_image, gallery_json, achievementStatus, req.params.id]);

    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/admin/achievements/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM achievements WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Initialize database then start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
