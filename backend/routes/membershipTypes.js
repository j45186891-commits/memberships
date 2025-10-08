const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logAudit } = require('../utils/auditLogger');

// Get all membership types
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { is_active } = req.query;

    let query = 'SELECT * FROM membership_types WHERE organization_id = $1';
    const params = [req.user?.organization_id || (await db.query('SELECT id FROM organizations LIMIT 1')).rows[0].id];

    if (is_active !== undefined) {
      query += ' AND is_active = $2';
      params.push(is_active === 'true');
    }

    query += ' ORDER BY name';

    const result = await db.query(query, params);

    // Get custom fields for each type
    for (const type of result.rows) {
      const fieldsResult = await db.query(
        'SELECT * FROM custom_fields WHERE membership_type_id = $1 ORDER BY display_order',
        [type.id]
      );
      type.custom_fields = fieldsResult.rows;
    }

    res.json({ membership_types: result.rows });
  } catch (error) {
    console.error('Get membership types error:', error);
    res.status(500).json({ error: { message: 'Failed to get membership types' } });
  }
});

// Get membership type by ID
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM membership_types WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Membership type not found' } });
    }

    const membershipType = result.rows[0];

    // Get custom fields
    const fieldsResult = await db.query(
      'SELECT * FROM custom_fields WHERE membership_type_id = $1 ORDER BY display_order',
      [id]
    );
    membershipType.custom_fields = fieldsResult.rows;

    res.json({ membership_type: membershipType });
  } catch (error) {
    console.error('Get membership type error:', error);
    res.status(500).json({ error: { message: 'Failed to get membership type' } });
  }
});

// Create membership type
router.post('/', authenticate, authorize('admin', 'super_admin'), [
  body('name').trim().notEmpty(),
  body('slug').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('duration_months').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = req.app.locals.db;
    const {
      name,
      slug,
      description,
      price,
      duration_months,
      max_members,
      requires_approval,
      is_active,
      settings,
      custom_fields
    } = req.body;

    // Check if slug exists
    const existing = await db.query(
      'SELECT id FROM membership_types WHERE slug = $1 AND organization_id = $2',
      [slug, req.user.organization_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: { message: 'Slug already exists' } });
    }

    // Create membership type
    const result = await db.query(`
      INSERT INTO membership_types (
        organization_id, name, slug, description, price, duration_months,
        max_members, requires_approval, is_active, settings
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      req.user.organization_id,
      name,
      slug,
      description,
      price,
      duration_months,
      max_members || 1,
      requires_approval !== false,
      is_active !== false,
      JSON.stringify(settings || {})
    ]);

    const membershipType = result.rows[0];

    // Create custom fields
    if (custom_fields && Array.isArray(custom_fields)) {
      for (let i = 0; i < custom_fields.length; i++) {
        const field = custom_fields[i];
        await db.query(`
          INSERT INTO custom_fields (
            organization_id, membership_type_id, field_name, field_label,
            field_type, field_options, is_required, display_order, validation_rules
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          req.user.organization_id,
          membershipType.id,
          field.field_name,
          field.field_label,
          field.field_type,
          JSON.stringify(field.field_options || null),
          field.is_required || false,
          i,
          JSON.stringify(field.validation_rules || null)
        ]);
      }
    }

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'membership_type_created',
      entity_type: 'membership_type',
      entity_id: membershipType.id,
      ip_address: req.ip
    });

    res.status(201).json({ membership_type: membershipType });
  } catch (error) {
    console.error('Create membership type error:', error);
    res.status(500).json({ error: { message: 'Failed to create membership type' } });
  }
});

// Update membership type
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const {
      name,
      description,
      price,
      duration_months,
      max_members,
      requires_approval,
      is_active,
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
    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }
    if (price !== undefined) {
      paramCount++;
      updates.push(`price = $${paramCount}`);
      params.push(price);
    }
    if (duration_months !== undefined) {
      paramCount++;
      updates.push(`duration_months = $${paramCount}`);
      params.push(duration_months);
    }
    if (max_members !== undefined) {
      paramCount++;
      updates.push(`max_members = $${paramCount}`);
      params.push(max_members);
    }
    if (requires_approval !== undefined) {
      paramCount++;
      updates.push(`requires_approval = $${paramCount}`);
      params.push(requires_approval);
    }
    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
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
    params.push(id);
    paramCount++;
    params.push(req.user.organization_id);

    await db.query(
      `UPDATE membership_types SET ${updates.join(', ')} WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}`,
      params
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'membership_type_updated',
      entity_type: 'membership_type',
      entity_id: id,
      changes: req.body,
      ip_address: req.ip
    });

    res.json({ message: 'Membership type updated successfully' });
  } catch (error) {
    console.error('Update membership type error:', error);
    res.status(500).json({ error: { message: 'Failed to update membership type' } });
  }
});

// Delete membership type
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Check if type is in use
    const inUse = await db.query(
      'SELECT COUNT(*) as count FROM memberships WHERE membership_type_id = $1',
      [id]
    );

    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: { message: 'Cannot delete membership type that is in use. Deactivate it instead.' } 
      });
    }

    await db.query(
      'DELETE FROM membership_types WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'membership_type_deleted',
      entity_type: 'membership_type',
      entity_id: id,
      ip_address: req.ip
    });

    res.json({ message: 'Membership type deleted successfully' });
  } catch (error) {
    console.error('Delete membership type error:', error);
    res.status(500).json({ error: { message: 'Failed to delete membership type' } });
  }
});

// Add custom field to membership type
router.post('/:id/custom-fields', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { field_name, field_label, field_type, field_options, is_required, validation_rules } = req.body;

    // Get current max display order
    const orderResult = await db.query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM custom_fields WHERE membership_type_id = $1',
      [id]
    );
    const display_order = orderResult.rows[0].next_order;

    const result = await db.query(`
      INSERT INTO custom_fields (
        organization_id, membership_type_id, field_name, field_label,
        field_type, field_options, is_required, display_order, validation_rules
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      req.user.organization_id,
      id,
      field_name,
      field_label,
      field_type,
      JSON.stringify(field_options || null),
      is_required || false,
      display_order,
      JSON.stringify(validation_rules || null)
    ]);

    res.status(201).json({ custom_field: result.rows[0] });
  } catch (error) {
    console.error('Add custom field error:', error);
    res.status(500).json({ error: { message: 'Failed to add custom field' } });
  }
});

// Delete custom field
router.delete('/:id/custom-fields/:field_id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { field_id } = req.params;

    await db.query('DELETE FROM custom_fields WHERE id = $1', [field_id]);

    res.json({ message: 'Custom field deleted successfully' });
  } catch (error) {
    console.error('Delete custom field error:', error);
    res.status(500).json({ error: { message: 'Failed to delete custom field' } });
  }
});

module.exports = router;