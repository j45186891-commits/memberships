const jwt = require('jsonwebtoken');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: { message: 'No token provided' } });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await req.app.locals.db.query(
      'SELECT id, email, first_name, last_name, role, organization_id, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: { message: 'User not found' } });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ error: { message: 'Account is not active' } });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { message: 'Token expired' } });
    }
    return res.status(401).json({ error: { message: 'Invalid token' } });
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Insufficient permissions' } });
    }

    next();
  };
};

// Check specific permissions
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Not authenticated' } });
      }

      // Super admins have all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Check if user has permission through committee position
      const result = await req.app.locals.db.query(`
        SELECT cp.permissions
        FROM committee_members cm
        JOIN committee_positions cp ON cm.position_id = cp.id
        WHERE cm.user_id = $1 AND cm.is_active = true
      `, [req.user.id]);

      let hasPermission = false;
      for (const row of result.rows) {
        if (row.permissions && row.permissions.includes(permission)) {
          hasPermission = true;
          break;
        }
      }

      if (!hasPermission) {
        return res.status(403).json({ error: { message: 'Insufficient permissions' } });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: { message: 'Error checking permissions' } });
    }
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await req.app.locals.db.query(
        'SELECT id, email, first_name, last_name, role, organization_id, status FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length > 0 && result.rows[0].status === 'active') {
        req.user = result.rows[0];
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  optionalAuth
};