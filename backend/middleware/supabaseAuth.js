const { supabase } = require('../config/supabase');

// Supabase Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    // Get user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Add user to request object
    req.user = userData;
    req.supabaseUser = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Organization-based authorization middleware
const authorizeOrganization = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const organizationId = req.params.orgId || req.body.organization_id || req.query.organization_id;

    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization ID required' 
      });
    }

    // Check if user belongs to the organization
    if (req.user.organization_id !== organizationId && req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied for this organization' 
      });
    }

    next();
  } catch (error) {
    console.error('Organization auth error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authorization error' 
    });
  }
};

// Admin authorization middleware
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }

  next();
};

// Super admin authorization middleware
const authorizeSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Super admin access required' 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizeOrganization,
  authorizeAdmin,
  authorizeSuperAdmin
};