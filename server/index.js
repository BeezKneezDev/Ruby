import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool, initializeDatabase } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ruby-achievements',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm'],
    resource_type: 'auto',
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
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
  const { category_id, status } = req.query;
  const showAll = status === 'all';

  let query = `
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM achievements a
    JOIN categories c ON a.category_id = c.id
  `;

  const conditions = [];
  const params = [];

  if (!showAll) {
    conditions.push(`a.status = 'completed'`);
  }

  if (category_id) {
    params.push(category_id);
    conditions.push(`a.category_id = $${params.length}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY a.title ASC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

app.get('/api/achievements/:id', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM achievements a
    JOIN categories c ON a.category_id = c.id
    WHERE a.id = $1 AND a.status = 'completed'
  `, [req.params.id]);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Achievement not found' });
  }

  res.json(rows[0]);
});

// Protected routes - Achievements (admin only, edit only)
app.put('/api/admin/achievements/:id', requireAuth, upload.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  const { title, description, content, content_sections, category_id, date, status, keep_featured, keep_gallery, existing_gallery, checklist, keep_video } = req.body;

  try {
    const { rows: currentRows } = await pool.query('SELECT * FROM achievements WHERE id = $1', [req.params.id]);
    const current = currentRows[0];

    let featured_image = current.featured_image;
    if (req.files?.featured_image?.[0]) {
      featured_image = req.files.featured_image[0].path;
    } else if (req.body.featured_image_url) {
      featured_image = req.body.featured_image_url;
    } else if (keep_featured === 'false') {
      featured_image = null;
    }

    let video = current.video;
    if (req.files?.video?.[0]) {
      video = req.files.video[0].path;
    } else if (req.body.video_url) {
      video = req.body.video_url;
    } else if (keep_video === 'false') {
      video = null;
    }

    let gallery_images = current.gallery_images || [];
    if (existing_gallery) {
      gallery_images = JSON.parse(existing_gallery);
    }
    if (req.files?.gallery_images) {
      const newImages = req.files.gallery_images.map(f => f.path);
      gallery_images = [...gallery_images, ...newImages];
    } else if (!existing_gallery && keep_gallery === 'false') {
      gallery_images = [];
    }
    const gallery_json = gallery_images.length > 0 ? JSON.stringify(gallery_images) : null;
    const achievementStatus = status || current.status || 'completed';
    const checklistJson = checklist ? checklist : current.checklist;
    const contentSectionsJson = content_sections ? content_sections : current.content_sections;

    const { rows } = await pool.query(`
      UPDATE achievements SET title = $1, description = $2, content = $3, category_id = $4, date = $5, featured_image = $6, gallery_images = $7, status = $8, checklist = $9, video = $10, content_sections = $11
      WHERE id = $12
      RETURNING *, (SELECT name FROM categories WHERE id = $4) as category_name, (SELECT slug FROM categories WHERE id = $4) as category_slug
    `, [title, description, content, category_id, date, featured_image, gallery_json, achievementStatus, checklistJson, video, contentSectionsJson, req.params.id]);

    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Public route - Site settings
app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM site_settings');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected route - Update site settings
app.put('/api/admin/settings', requireAuth, upload.single('hero_image'), async (req, res) => {
  try {
    const fields = ['home_title', 'home_subtitle', 'home_bio_1', 'home_bio_2'];
    for (const key of fields) {
      if (req.body[key] !== undefined) {
        await pool.query(
          `INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
          [key, req.body[key]]
        );
      }
    }

    if (req.file) {
      await pool.query(
        `INSERT INTO site_settings (key, value) VALUES ('hero_image', $1) ON CONFLICT (key) DO UPDATE SET value = $1`,
        [req.file.path]
      );
    } else if (req.body.remove_hero === 'true') {
      await pool.query(
        `INSERT INTO site_settings (key, value) VALUES ('hero_image', '') ON CONFLICT (key) DO UPDATE SET value = ''`
      );
    }

    const { rows } = await pool.query('SELECT key, value FROM site_settings');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Media Library routes
app.get('/api/admin/media', requireAuth, async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM media_library';
    const params = [];
    if (type) {
      params.push(type);
      query += ' WHERE resource_type = $1';
    }
    query += ' ORDER BY uploaded_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/media', requireAuth, upload.array('files', 20), async (req, res) => {
  try {
    const inserted = [];
    for (const file of req.files) {
      const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
      const publicId = file.filename || null;
      const { rows } = await pool.query(
        'INSERT INTO media_library (url, filename, resource_type, cloudinary_public_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [file.path, file.originalname, resourceType, publicId]
      );
      inserted.push(rows[0]);
    }
    res.json(inserted);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/admin/media/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM media_library WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }
    const media = rows[0];
    if (media.cloudinary_public_id) {
      await cloudinary.uploader.destroy(media.cloudinary_public_id, {
        resource_type: media.resource_type,
      });
    }
    await pool.query('DELETE FROM media_library WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  app.get('{*path}', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// Initialize database then start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
