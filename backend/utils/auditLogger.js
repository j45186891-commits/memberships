const logAudit = async (db, data) => {
  try {
    const {
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      changes,
      ip_address,
      user_agent
    } = data;

    await db.query(`
      INSERT INTO audit_log (
        organization_id, user_id, action, entity_type, entity_id, 
        changes, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      changes ? JSON.stringify(changes) : null,
      ip_address,
      user_agent
    ]);
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

module.exports = { logAudit };