const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const multer = require('multer');
const path = require('path');

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get organization details
router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const result = await db.query(
      'SELECT * FROM organizations WHERE id = $1',
      [req.user.organization_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Organization not found' } });
    }

    res.json({ organization: result.rows[0] });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: { message: 'Failed to get organization' } });
  }
});

// Update organization
router.put('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      name,
      email,
      phone,
      address,
      primary_color,
      secondary_color,
      timezone,
      currency,
      settings
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }
    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }
    if (phone !== undefined) {
      paramCount++;
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
    }
    if (address !== undefined) {
      paramCount++;
      updates.push(`address = $${paramCount}`);
      params.push(address);
    }
    if (primary_color !== undefined) {
      paramCount++;
      updates.push(`primary_color = $${paramCount}`);
      params.push(primary_color);
    }
    if (secondary_color !== undefined) {
      paramCount++;
      updates.push(`secondary_color = $${paramCount}`);
      params.push(secondary_color);
    }
    if (timezone !== undefined) {
      paramCount++;
      updates.push(`timezone = $${paramCount}`);
      params.push(timezone);
    }
    if (currency !== undefined) {
      paramCount++;
      updates.push(`currency = $${paramCount}`);
      params.push(currency);
    }
    if (settings !== undefined) {
      paramCount++;
      updates.push(`settings = $${paramCount}`);
      params.push(JSON.stringify(settings));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: { message: 'No updates provided' } });
    }

    paramCount++;
    params.push(req.user.organization_id);

    await db.query(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'organization_updated',
      entity_type: 'organization',
      entity_id: req.user.organization_id,
      changes: req.body,
      ip_address: req.ip
    });

    res.json({ message: 'Organization updated successfully' });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: { message: 'Failed to update organization' } });
  }
});

// Upload organization logo
router.post('/logo', authenticate, authorize('admin', 'super_admin'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const db = req.app.locals.db;
    const logo_url = `/uploads/logos/${req.file.filename}`;

    await db.query(
      'UPDATE organizations SET logo_url = $1 WHERE id = $2',
      [logo_url, req.user.organization_id]
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'logo_updated',
      entity_type: 'organization',
      entity_id: req.user.organization_id,
      ip_address: req.ip
    });

    res.json({ logo_url });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: { message: 'Failed to upload logo' } });
  }
});

// Get organization statistics
router.get('/statistics', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const stats = {};

    // Total members
    const membersResult = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND role = $2',
      [req.user.organization_id, 'member']
    );
    stats.total_members = parseInt(membersResult.rows[0].count);

    // Active memberships
    const activeMembershipsResult = await db.query(
      'SELECT COUNT(*) as count FROM memberships WHERE organization_id = $1 AND status = $2',
      [req.user.organization_id, 'active']
    );
    stats.active_memberships = parseInt(activeMembershipsResult.rows[0].count);

    // Pending memberships
    const pendingMembershipsResult = await db.query(
      'SELECT COUNT(*) as count FROM memberships WHERE organization_id = $1 AND status = $2',
      [req.user.organization_id, 'pending']
    );
    stats.pending_memberships = parseInt(pendingMembershipsResult.rows[0].count);

    // Expiring soon (next 30 days)
    const expiringResult = await db.query(`
      SELECT COUNT(*) as count FROM memberships 
      WHERE organization_id = $1 AND status = 'active'
      AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    `, [req.user.organization_id]);
    stats.expiring_soon = parseInt(expiringResult.rows[0].count);

    // Total revenue (this year)
    const revenueResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE organization_id = $1 AND status = 'completed'
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `, [req.user.organization_id]);
    stats.revenue_this_year = parseFloat(revenueResult.rows[0].total);

    // Upcoming events
    const eventsResult = await db.query(
      'SELECT COUNT(*) as count FROM events WHERE organization_id = $1 AND start_date > CURRENT_TIMESTAMP',
      [req.user.organization_id]
    );
    stats.upcoming_events = parseInt(eventsResult.rows[0].count);

    // Active committees
    const committeesResult = await db.query(
      'SELECT COUNT(*) as count FROM committees WHERE organization_id = $1 AND is_active = true',
      [req.user.organization_id]
    );
    stats.active_committees = parseInt(committeesResult.rows[0].count);

    // Recent activity (last 7 days)
    const activityResult = await db.query(
      'SELECT COUNT(*) as count FROM audit_log WHERE organization_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL \'7 days\'',
      [req.user.organization_id]
    );
    stats.recent_activity = parseInt(activityResult.rows[0].count);

    res.json({ statistics: stats });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: { message: 'Failed to get statistics' } });
  }
});

module.exports = router;