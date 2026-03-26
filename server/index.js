import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db/database.js';

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
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

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
app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(categories);
});

app.get('/api/categories/:slug', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json(category);
});

// Public routes - Achievements
app.get('/api/achievements', (req, res) => {
  const { category_id } = req.query;

  let query = `
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM achievements a
    JOIN categories c ON a.category_id = c.id
  `;

  if (category_id) {
    query += ' WHERE a.category_id = ?';
    const achievements = db.prepare(query + ' ORDER BY a.date DESC').all(category_id);
    // Parse gallery_images JSON
    achievements.forEach(a => {
      if (a.gallery_images) a.gallery_images = JSON.parse(a.gallery_images);
    });
    return res.json(achievements);
  }

  const achievements = db.prepare(query + ' ORDER BY a.date DESC').all();
  // Parse gallery_images JSON
  achievements.forEach(a => {
    if (a.gallery_images) a.gallery_images = JSON.parse(a.gallery_images);
  });
  res.json(achievements);
});

app.get('/api/achievements/:id', (req, res) => {
  const achievement = db.prepare(`
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM achievements a
    JOIN categories c ON a.category_id = c.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!achievement) {
    return res.status(404).json({ error: 'Achievement not found' });
  }

  // Parse gallery_images JSON
  if (achievement.gallery_images) {
    achievement.gallery_images = JSON.parse(achievement.gallery_images);
  }

  res.json(achievement);
});

// Protected routes - Categories (admin only)
app.post('/api/admin/categories', requireAuth, upload.single('featured_image'), (req, res) => {
  const { name, slug, description } = req.body;

  try {
    const featured_image = req.file?.filename || null;
    const result = db.prepare('INSERT INTO categories (name, slug, description, featured_image) VALUES (?, ?, ?, ?)').run(name, slug, description, featured_image);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/admin/categories/:id', requireAuth, upload.single('featured_image'), (req, res) => {
  const { name, slug, description, keep_featured } = req.body;

  try {
    // Get current category
    const current = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);

    // Handle featured image
    let featured_image = current.featured_image;
    if (req.file) {
      featured_image = req.file.filename;
    } else if (keep_featured === 'false') {
      featured_image = null;
    }

    db.prepare('UPDATE categories SET name = ?, slug = ?, description = ?, featured_image = ? WHERE id = ?').run(name, slug, description, featured_image, req.params.id);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/admin/categories/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Protected routes - Achievements (admin only)
app.post('/api/admin/achievements', requireAuth, upload.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 10 }
]), (req, res) => {
  const { title, description, content, category_id, date, status } = req.body;

  try {
    const featured_image = req.files?.featured_image?.[0]?.filename || null;
    const gallery_images = req.files?.gallery_images?.map(f => f.filename) || [];
    const gallery_json = gallery_images.length > 0 ? JSON.stringify(gallery_images) : null;
    const achievementStatus = status || 'completed';

    const result = db.prepare('INSERT INTO achievements (title, description, content, category_id, date, featured_image, gallery_images, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(title, description, content, category_id, date, featured_image, gallery_json, achievementStatus);
    const achievement = db.prepare(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM achievements a
      JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    // Parse gallery_images JSON for response
    if (achievement.gallery_images) {
      achievement.gallery_images = JSON.parse(achievement.gallery_images);
    }

    res.json(achievement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/admin/achievements/:id', requireAuth, upload.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 10 }
]), (req, res) => {
  const { title, description, content, category_id, date, status, keep_featured, keep_gallery } = req.body;

  try {
    // Get current achievement
    const current = db.prepare('SELECT * FROM achievements WHERE id = ?').get(req.params.id);

    // Handle featured image
    let featured_image = current.featured_image;
    if (req.files?.featured_image?.[0]) {
      featured_image = req.files.featured_image[0].filename;
    } else if (keep_featured === 'false') {
      featured_image = null;
    }

    // Handle gallery images
    let gallery_images = current.gallery_images ? JSON.parse(current.gallery_images) : [];
    if (req.files?.gallery_images) {
      const newImages = req.files.gallery_images.map(f => f.filename);
      gallery_images = keep_gallery === 'true' ? [...gallery_images, ...newImages] : newImages;
    } else if (keep_gallery === 'false') {
      gallery_images = [];
    }
    const gallery_json = gallery_images.length > 0 ? JSON.stringify(gallery_images) : null;
    const achievementStatus = status || current.status || 'completed';

    db.prepare('UPDATE achievements SET title = ?, description = ?, content = ?, category_id = ?, date = ?, featured_image = ?, gallery_images = ?, status = ? WHERE id = ?').run(title, description, content, category_id, date, featured_image, gallery_json, achievementStatus, req.params.id);

    const achievement = db.prepare(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM achievements a
      JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `).get(req.params.id);

    // Parse gallery_images JSON for response
    if (achievement.gallery_images) {
      achievement.gallery_images = JSON.parse(achievement.gallery_images);
    }

    res.json(achievement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/admin/achievements/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM achievements WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
