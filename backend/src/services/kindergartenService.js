const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Kindergarten Service
 * Manages kindergarten profiles and settings
 */

/**
 * Create a new kindergarten
 * @param {Object} data - { name, address, phone, logo_url }
 * @param {number} createdBy - User ID
 * @returns {Promise<Object>} Created kindergarten
 */
exports.createKindergarten = async (data, createdBy) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { name, address, phone, logo_url } = data;
    const result = await client.query(
      `INSERT INTO kindergartens (name, address, phone, logo_url, principal_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address, phone = EXCLUDED.phone, updated_at = NOW()
       RETURNING id, name, address, phone, logo_url, is_active, created_at, updated_at`,
      [name || 'Trường mầm non', address || null, phone || null, logo_url || null, createdBy],
    );
    const kg = result.rows[0];
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, created_at)
       VALUES ($1, 'CREATE', 'kindergartens', $2, NOW())`,
      [createdBy, kg.id],
    );
    await client.query('COMMIT');
    return kg;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get kindergarten profile
 * @param {number} kindergartenId - Kindergarten ID
 * @returns {Promise<Object>} Kindergarten info with member counts
 */
exports.getKindergartenProfile = async (kindergartenId) => {
  const client = await db.connect();
  try {
    // Admin with no kindergarten_id: return empty profile
    if (!kindergartenId) {
      return {
        id: null,
        name: null,
        address: null,
        phone: null,
        principal_id: null,
        principal_name: null,
        logo_url: null,
        is_active: false,
        stats: { admin_count: 0, principal_count: 0, teacher_count: 0, parent_count: 0 },
        children_count: 0,
        active_plans_count: 0,
      };
    }
    // Get kindergarten
    const kgQuery = `
      SELECT
        k.id,
        k.name,
        k.address,
        k.phone,
        k.principal_id,
        u.fullname as principal_name,
        u.email as principal_email,
        k.logo_url,
        k.is_active,
        k.created_at,
        k.updated_at
      FROM kindergartens k
      LEFT JOIN users u ON k.principal_id = u.id
      WHERE k.id = $1
    `;

    const kgResult = await client.query(kgQuery, [kindergartenId]);
    if (kgResult.rows.length === 0) {
      const error = new Error('Kindergarten not found');
      error.statusCode = 404;
      throw error;
    }

    const kg = kgResult.rows[0];

    // Get member counts
    const statsQuery = `
      SELECT
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'principal' THEN 1 END) as principal_count,
        COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teacher_count,
        COUNT(CASE WHEN role = 'parent' THEN 1 END) as parent_count
      FROM users
      WHERE kindergarten_id = $1 AND is_active = true
    `;

    const statsResult = await client.query(statsQuery, [kindergartenId]);
    const stats = statsResult.rows[0];

    // Get children count
    const childrenQuery = `
      SELECT COUNT(*) as total
      FROM children
      WHERE kindergarten_id = $1
    `;

    const childrenResult = await client.query(childrenQuery, [kindergartenId]);
    const childrenCount = parseInt(childrenResult.rows[0].total, 10);

    return {
      id: kg.id,
      name: kg.name,
      address: kg.address,
      phone: kg.phone,
      principal_id: kg.principal_id,
      principal_name: kg.principal_name,
      principal_email: kg.principal_email,
      logo_url: kg.logo_url,
      is_active: kg.is_active,
      stats: {
        admin_count: parseInt(stats.admin_count, 10),
        principal_count: parseInt(stats.principal_count, 10),
        teacher_count: parseInt(stats.teacher_count, 10),
        parent_count: parseInt(stats.parent_count, 10),
        children_count: childrenCount,
      },
      created_at: kg.created_at,
      updated_at: kg.updated_at,
    };
  } finally {
    client.release();
  }
};

/**
 * Update kindergarten profile
 * @param {number} kindergartenId - Kindergarten ID
 * @param {Object} updates - Fields to update { name, address, phone, logo_url }
 * @param {number} updatedBy - User ID making update
 * @returns {Promise<Object>} Updated kindergarten info
 */
exports.updateKindergartenProfile = async (kindergartenId, updates, updatedBy) => {
  const client = await db.connect();
  try {
    // Cannot update without a valid kindergartenId
    if (!kindergartenId) {
      const error = new Error('Kindergarten not found for this account');
      error.statusCode = 404;
      throw error;
    }
    // Verify kindergarten exists
    const kgQuery = `
      SELECT * FROM kindergartens
      WHERE id = $1
    `;
    const kgResult = await client.query(kgQuery, [kindergartenId]);
    if (kgResult.rows.length === 0) {
      const error = new Error('Kindergarten not found');
      error.statusCode = 404;
      throw error;
    }

    const kg = kgResult.rows[0];

    // Build update query
    const fields = [];
    const params = [];
    let paramCount = 1;

    ['name', 'address', 'phone', 'logo_url', 'is_active'].forEach((field) => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        if (field === 'is_active' && typeof updates[field] === 'string') {
          params.push(updates[field] === 'true' || updates[field] === true);
        } else {
          params.push(updates[field]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return exports.getKindergartenProfile(kindergartenId);
    }

    params.push(kindergartenId);
    const updateQuery = `
      UPDATE kindergartens
      SET
        ${fields.join(', ')},
        updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, params);
    const updated = updateResult.rows[0];

    // Log activity
    const logQuery = `
      INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_value,
        new_value,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    await client.query(logQuery, [
      updatedBy,
      'UPDATE',
      'kindergartens',
      kindergartenId,
      JSON.stringify({ name: kg.name }),
      JSON.stringify({ name: updated.name }),
    ]);

    return {
      id: updated.id,
      name: updated.name,
      address: updated.address,
      phone: updated.phone,
      logo_url: updated.logo_url,
      is_active: updated.is_active,
      updated_at: updated.updated_at,
    };
  } finally {
    client.release();
  }
};

/**
 * Get all users in a kindergarten
 * @param {number} kindergartenId - Kindergarten ID
 * @param {Object} filters - { role, search, limit, offset }
 * @returns {Promise<Object>} Users list with total count
 */
exports.getKindergartenUsers = async (kindergartenId, filters = {}) => {
  const client = await db.connect();
  try {
    const { role, search, limit = 20, offset = 0 } = filters;

    let query = `
      SELECT
        u.id,
        u.fullname as name,
        u.email,
        u.phone,
        u.role,
        u.is_active,
        u.created_at
      FROM users u
      WHERE u.kindergarten_id = $1 AND u.is_active = true
    `;

    const params = [kindergartenId];
    let paramCount = 1;

    if (role) {
      paramCount++;
      query += ` AND u.role = $${paramCount}`;
      params.push(role);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.fullname ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Count total
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await client.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
      query += ` ORDER BY u.role ASC, u.fullname ASC
              LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    return {
      data: result.rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name || row.fullname,
        phone: row.phone,
        role: row.role,
        is_active: row.is_active,
        created_at: row.created_at,
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil(total / limit),
    };
  } finally {
    client.release();
  }
};

/**
 * Get kindergarten settings/statistics
 * @param {number} kindergartenId - Kindergarten ID
 * @returns {Promise<Object>} Settings and stats
 */
exports.getKindergartenSettings = async (kindergartenId) => {
  const client = await db.connect();
  try {
    // Get profile
    const profile = await exports.getKindergartenProfile(kindergartenId);

    // Handle null kindergartenId case
    if (!kindergartenId) {
      return { profile, class_distribution: [], active_plans_this_month: 0 };
    }

    // Get children by classroom/class stats
    const classStatsQuery = `
      SELECT
        u.id,
        u.fullname as teacher_name,
        COUNT(DISTINCT c.id) as children_count
      FROM users u
      LEFT JOIN children c ON u.id = c.teacher_id
      WHERE u.kindergarten_id = $1 AND u.role = 'teacher' AND u.is_active = true
      GROUP BY u.id, u.fullname
      ORDER BY u.fullname ASC
    `;

    const classStatsResult = await client.query(classStatsQuery, [kindergartenId]);

    // Get active plans this month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const activePlansQuery = `
      SELECT COUNT(*) as total
      FROM education_plans
      WHERE kindergarten_id = $1
        AND month = $2
        AND year = $3
        AND status != 'completed'
        AND deleted_at IS NULL
    `;

    const activePlansResult = await client.query(activePlansQuery, [
      kindergartenId,
      currentMonth,
      currentYear,
    ]);

    return {
      profile,
      class_distribution: classStatsResult.rows.map((row) => ({
        teacher_id: row.id,
        teacher_name: row.teacher_name,
        children_count: parseInt(row.children_count, 10),
      })),
      active_plans_this_month: parseInt(activePlansResult.rows[0].total, 10),
    };
  } finally {
    client.release();
  }
};
