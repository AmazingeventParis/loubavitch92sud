const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// Ensure storage dirs and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(ARTICLES_FILE)) fs.writeFileSync(ARTICLES_FILE, '[]', 'utf8');

// Multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function readArticles() {
  try {
    if (!fs.existsSync(ARTICLES_FILE)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(ARTICLES_FILE, '[]', 'utf8');
    }
    return JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
  } catch (e) {
    console.error('readArticles error:', e.message);
    return [];
  }
}
function writeArticles(articles) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf8');
}

const ADMIN_PASSWORD = 'Laurytal2!';

function authMiddleware(req, res, next) {
  const pwd = req.headers['x-admin-password'] || req.query.password;
  if (pwd !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Mot de passe incorrect' });
  next();
}

// Import articles (pour restaurer apres redeploy)
app.post('/api/import', authMiddleware, (req, res) => {
  const { articles } = req.body;
  if (!Array.isArray(articles)) return res.status(400).json({ error: 'articles array requis' });
  writeArticles(articles);
  res.json({ ok: true, count: articles.length });
});

// GET articles (public)
app.get('/api/articles', (req, res) => {
  const articles = readArticles().filter(a => a.published);
  res.json(articles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

// GET all articles (admin)
app.get('/api/articles/all', authMiddleware, (req, res) => {
  const articles = readArticles();
  res.json(articles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

// POST create article
app.post('/api/articles', authMiddleware, upload.single('image'), (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });

  const articles = readArticles();
  const article = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title,
    content,
    image: req.file ? '/uploads/' + req.file.filename : null,
    published: true,
    created_at: new Date().toISOString()
  };
  articles.push(article);
  writeArticles(articles);
  res.json({ ok: true, article });
});

// PUT update article
app.put('/api/articles/:id', authMiddleware, upload.single('image'), (req, res) => {
  const articles = readArticles();
  const idx = articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Article non trouvé' });

  if (req.body.title) articles[idx].title = req.body.title;
  if (req.body.content) articles[idx].content = req.body.content;
  if (req.body.published !== undefined) articles[idx].published = req.body.published === 'true' || req.body.published === true;
  if (req.file) articles[idx].image = '/uploads/' + req.file.filename;

  writeArticles(articles);
  res.json({ ok: true, article: articles[idx] });
});

// DELETE article
app.delete('/api/articles/:id', authMiddleware, (req, res) => {
  let articles = readArticles();
  const article = articles.find(a => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: 'Article non trouvé' });

  // Delete image file
  if (article.image) {
    const imgPath = path.join(__dirname, article.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  articles = articles.filter(a => a.id !== req.params.id);
  writeArticles(articles);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Loubavitch92Sud on port ${PORT}`));
