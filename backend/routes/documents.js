const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/documents/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    let query = 'SELECT * FROM documents WHERE organization_id = $1';
    const params = [req.user.organization_id];
    
    if (req.user.role === 'member') {
      query += ' AND (visibility = $2 OR uploaded_by = $3)';
      params.push('public', req.user.id);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json({ documents: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get documents' } });
  }
});

router.post('/', authenticate, authorize('admin', 'super_admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }
    const db = req.app.locals.db;
    const { title, description, category, visibility } = req.body;
    const result = await db.query(
      'INSERT INTO documents (organization_id, title, description, file_name, file_path, file_size, mime_type, category, visibility, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [req.user.organization_id, title, description, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, category, visibility || 'private', req.user.id]
    );
    res.status(201).json({ document: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to upload document' } });
  }
});

router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM documents WHERE id = $1 AND organization_id = $2', [req.params.id, req.user.organization_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }
    const doc = result.rows[0];
    await db.query('UPDATE documents SET download_count = download_count + 1 WHERE id = $1', [doc.id]);
    await db.query('INSERT INTO document_access_log (document_id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)', [doc.id, req.user.id, 'download', req.ip]);
    res.download(doc.file_path, doc.file_name);
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to download document' } });
  }
});

module.exports = router;