const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const stats = {};

    // Membership statistics
    const membershipStats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'expired') as expired
      FROM memberships WHERE organization_id = $1
    `, [req.user.organization_id]);
    stats.memberships = membershipStats.rows[0];

    // Revenue statistics
    const revenueStats = await db.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM payments 
      WHERE organization_id = $1 AND status = 'completed'
      AND created_at >= date_trunc('month', CURRENT_DATE)
    `, [req.user.organization_id]);
    stats.revenue = revenueStats.rows[0];

    // Member growth (last 12 months)
    const growthStats = await db.query(`
      SELECT 
        date_trunc('month', created_at) as month,
        COUNT(*) as count
      FROM users
      WHERE organization_id = $1
      AND created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY month
    `, [req.user.organization_id]);
    stats.growth = growthStats.rows;

    res.json({ analytics: stats });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get analytics' } });
  }
});

router.get('/reports/memberships', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(`
      SELECT 
        mt.name as membership_type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE m.status = 'active') as active,
        COUNT(*) FILTER (WHERE m.status = 'pending') as pending,
        COUNT(*) FILTER (WHERE m.status = 'expired') as expired
      FROM memberships m
      LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.organization_id = $1
      GROUP BY mt.name
    `, [req.user.organization_id]);
    res.json({ report: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to generate report' } });
  }
});

module.exports = router;