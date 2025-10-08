const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

// Get all campaigns
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM email_campaigns WHERE organization_id = $1 ORDER BY created_at DESC',
      [req.user.organization_id]
    );
    res.json({ campaigns: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get campaigns' } });
  }
});

// Get campaign by ID
router.get('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM email_campaigns WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.user.organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Campaign not found' } });
    }
    
    res.json({ campaign: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get campaign' } });
  }
});

// Create campaign
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, template_id, subject, body_html, body_text, scheduled_at } = req.body;

    const result = await db.query(`
      INSERT INTO email_campaigns (organization_id, name, template_id, subject, body_html, body_text, status, scheduled_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8)
      RETURNING *
    `, [req.user.organization_id, name, template_id, subject, body_html, body_text, scheduled_at, req.user.id]);

    res.status(201).json({ campaign: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create campaign' } });
  }
});

// Update campaign
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, template_id, subject, body_html, body_text, scheduled_at, status } = req.body;
    
    // Check if campaign has been sent
    const campaignResult = await db.query(
      'SELECT status FROM email_campaigns WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );
    
    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Campaign not found' } });
    }
    
    if (campaignResult.rows[0].status === 'sent') {
      return res.status(400).json({ error: { message: 'Cannot edit a campaign that has been sent' } });
    }
    
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }
    if (template_id !== undefined) {
      paramCount++;
      updates.push(`template_id = $${paramCount}`);
      params.push(template_id);
    }
    if (subject !== undefined) {
      paramCount++;
      updates.push(`subject = $${paramCount}`);
      params.push(subject);
    }
    if (body_html !== undefined) {
      paramCount++;
      updates.push(`body_html = $${paramCount}`);
      params.push(body_html);
    }
    if (body_text !== undefined) {
      paramCount++;
      updates.push(`body_text = $${paramCount}`);
      params.push(body_text);
    }
    if (scheduled_at !== undefined) {
      paramCount++;
      updates.push(`scheduled_at = $${paramCount}`);
      params.push(scheduled_at);
    }
    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: { message: 'No updates provided' } });
    }
    
    paramCount++;
    params.push(id);
    paramCount++;
    params.push(req.user.organization_id);
    
    await db.query(
      `UPDATE email_campaigns SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}`,
      params
    );
    
    res.json({ message: 'Campaign updated successfully' });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: { message: 'Failed to update campaign' } });
  }
});

// Delete campaign
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Check if campaign has been sent
    const campaignResult = await db.query(
      'SELECT status FROM email_campaigns WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );
    
    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Campaign not found' } });
    }
    
    if (campaignResult.rows[0].status === 'sent' || campaignResult.rows[0].status === 'sending') {
      return res.status(400).json({ 
        error: { message: 'Cannot delete a campaign that has been sent or is being sent' } 
      });
    }
    
    // Delete recipients first
    await db.query('DELETE FROM email_campaign_recipients WHERE campaign_id = $1', [id]);
    
    // Delete campaign
    await db.query(
      'DELETE FROM email_campaigns WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );
    
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: { message: 'Failed to delete campaign' } });
  }
});

// Send campaign
router.post('/:id/send', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { recipient_user_ids } = req.body;

    // Get campaign
    const campaignResult = await db.query(
      'SELECT * FROM email_campaigns WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.user.organization_id]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Campaign not found' } });
    }

    const campaign = campaignResult.rows[0];

    // Get recipients
    let recipients;
    if (recipient_user_ids && recipient_user_ids.length > 0) {
      const recipientsResult = await db.query(
        'SELECT id, email, first_name, last_name FROM users WHERE id = ANY($1)',
        [recipient_user_ids]
      );
      recipients = recipientsResult.rows;
    } else {
      const recipientsResult = await db.query(
        'SELECT id, email, first_name, last_name FROM users WHERE organization_id = $1 AND status = $2',
        [req.user.organization_id, 'active']
      );
      recipients = recipientsResult.rows;
    }

    // Create recipient records
    for (const recipient of recipients) {
      await db.query(`
        INSERT INTO email_campaign_recipients (campaign_id, user_id, status)
        VALUES ($1, $2, 'pending')
      `, [campaign.id, recipient.id]);
    }

    // Update campaign
    await db.query(
      'UPDATE email_campaigns SET status = $1, recipient_count = $2 WHERE id = $3',
      ['sending', recipients.length, campaign.id]
    );

    // Send emails asynchronously
    setImmediate(async () => {
      for (const recipient of recipients) {
        try {
          await sendEmail({
            to: recipient.email,
            subject: campaign.subject,
            html: campaign.body_html
          });

          await db.query(
            'UPDATE email_campaign_recipients SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE campaign_id = $2 AND user_id = $3',
            ['sent', campaign.id, recipient.id]
          );
        } catch (error) {
          await db.query(
            'UPDATE email_campaign_recipients SET status = $1, error_message = $2 WHERE campaign_id = $3 AND user_id = $4',
            ['failed', error.message, campaign.id, recipient.id]
          );
        }
      }

      await db.query(
        'UPDATE email_campaigns SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['sent', campaign.id]
      );
    });

    res.json({ message: 'Campaign is being sent', recipient_count: recipients.length });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to send campaign' } });
  }
});

module.exports = router;