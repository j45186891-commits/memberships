const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('membership_type_id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, first_name, last_name, phone, membership_type_id, custom_data } = req.body;
    const db = req.app.locals.db;

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: { message: 'Email already registered' } });
    }

    // Get default organization (for single-tenant, use first org)
    const orgResult = await db.query('SELECT id FROM organizations LIMIT 1');
    if (orgResult.rows.length === 0) {
      return res.status(500).json({ error: { message: 'No organization configured' } });
    }
    const organization_id = orgResult.rows[0].id;

    // Hash password
    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Create user
    const userResult = await db.query(`
      INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'member', 'pending')
      RETURNING id, email, first_name, last_name, role, status, created_at
    `, [organization_id, email, password_hash, first_name, last_name, phone]);

    const user = userResult.rows[0];

    // Get membership type details
    const membershipTypeResult = await db.query(
      'SELECT * FROM membership_types WHERE id = $1',
      [membership_type_id]
    );

    if (membershipTypeResult.rows.length === 0) {
      return res.status(400).json({ error: { message: 'Invalid membership type' } });
    }

    const membershipType = membershipTypeResult.rows[0];

    // Create membership application
    await db.query(`
      INSERT INTO memberships (organization_id, user_id, membership_type_id, status, custom_data, payment_status)
      VALUES ($1, $2, $3, 'pending', $4, 'unpaid')
    `, [organization_id, user.id, membership_type_id, JSON.stringify(custom_data || {})]);

    // Log audit
    await logAudit(db, {
      organization_id,
      user_id: user.id,
      action: 'user_registered',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: req.ip
    });

    // Trigger welcome workflow
    await db.query(`
      INSERT INTO workflow_executions (workflow_id, user_id, status, trigger_data)
      SELECT id, $1, 'pending', $2
      FROM workflows
      WHERE trigger_type = 'user_registered' AND is_active = true
    `, [user.id, JSON.stringify({ user_id: user.id })]);

    res.status(201).json({
      message: 'Registration successful. Your application is pending approval.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: { message: 'Registration failed' } });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, two_factor_code } = req.body;
    const db = req.app.locals.db;

    // Get user
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: { message: 'Account is not active' } });
    }

    // Check 2FA if enabled
    if (user.two_factor_enabled) {
      if (!two_factor_code) {
        return res.status(200).json({ requires_2fa: true });
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: two_factor_code,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({ error: { message: 'Invalid 2FA code' } });
      }
    }

    // Update login stats
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );

    // Log audit
    await logAudit(db, {
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'user_login',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: req.ip
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { message: 'Login failed' } });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: { message: 'No refresh token provided' } });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const db = req.app.locals.db;

    const result = await db.query(
      'SELECT id, email, role, organization_id, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || result.rows[0].status !== 'active') {
      return res.status(401).json({ error: { message: 'Invalid refresh token' } });
    }

    const user = result.rows[0];

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: { message: 'Invalid refresh token' } });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const result = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.status,
             u.email_verified, u.two_factor_enabled, u.last_login, u.created_at,
             o.name as organization_name, o.logo_url as organization_logo
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { message: 'Failed to get user' } });
  }
});

// Enable 2FA
router.post('/2fa/enable', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Membership System (${req.user.email})`
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (will be confirmed on verification)
    req.session.temp_2fa_secret = secret.base32;

    res.json({
      secret: secret.base32,
      qrCode
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: { message: 'Failed to enable 2FA' } });
  }
});

// Verify and confirm 2FA
router.post('/2fa/verify', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    const db = req.app.locals.db;

    if (!req.session.temp_2fa_secret) {
      return res.status(400).json({ error: { message: 'No 2FA setup in progress' } });
    }

    const verified = speakeasy.totp.verify({
      secret: req.session.temp_2fa_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: { message: 'Invalid code' } });
    }

    // Enable 2FA for user
    await db.query(
      'UPDATE users SET two_factor_enabled = true, two_factor_secret = $1 WHERE id = $2',
      [req.session.temp_2fa_secret, req.user.id]
    );

    delete req.session.temp_2fa_secret;

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: '2fa_enabled',
      entity_type: 'user',
      entity_id: req.user.id,
      ip_address: req.ip
    });

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: { message: 'Failed to verify 2FA' } });
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    const db = req.app.locals.db;

    // Verify password
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isValidPassword = await bcrypt.compare(password, result.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: { message: 'Invalid password' } });
    }

    // Disable 2FA
    await db.query(
      'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
      [req.user.id]
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: '2fa_disabled',
      entity_type: 'user',
      entity_id: req.user.id,
      ip_address: req.ip
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: { message: 'Failed to disable 2FA' } });
  }
});

// Change password
router.post('/change-password', authenticate, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;
    const db = req.app.locals.db;

    // Verify current password
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isValidPassword = await bcrypt.compare(current_password, result.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: { message: 'Current password is incorrect' } });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Update password
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'password_changed',
      entity_type: 'user',
      entity_id: req.user.id,
      ip_address: req.ip
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: { message: 'Failed to change password' } });
  }
});

module.exports = router;