import express from 'express';
import pool from '../database';
import { authenticateToken, AuthRequest } from '../middleware';

const router = express.Router();

// Get all activities
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.username as created_by_username, u.first_name, u.last_name, u.email, u.project as creator_project
      FROM activities a
      JOIN users u ON a.created_by_id = u.id
      ORDER BY a.date, a.time
    `);

    const activities = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      date: row.date,
      originalDate: row.original_date,
      time: row.time,
      endTime: row.end_time,
      location: row.location,
      venue: row.venue,
      venueAddress: row.venue_address,
      sector: row.sector,
      project: row.project,
      description: row.description,
      participants: row.participants,
      facilitator: row.facilitator,
      status: row.status,
      changeReason: row.change_reason,
      changeDate: row.change_date,
      createdBy: {
        idNumber: row.created_by_username,
        fullName: `${row.first_name} ${row.last_name}`,
        email: row.email,
        project: row.creator_project
      },
      priority: row.priority,
      partnerInstitution: row.partner_institution,
      mode: row.mode,
      platform: row.platform
    }));

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create activity
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      name, date, time, endTime, location, venue, sector, project, description,
      participants, facilitator, priority, partnerInstitution, mode, platform,
      venueAddress
    } = req.body;

    const result = await pool.query(
      `INSERT INTO activities (
        name, date, time, end_time, location, venue, sector, project, description,
        participants, facilitator, status, created_by_id, priority, partner_institution,
        mode, platform, venue_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [name, date, time, endTime, location, venue, sector, project, description,
       participants, facilitator, 'Scheduled', req.user!.id, priority, partnerInstitution,
       mode, platform, venueAddress]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update activity
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE activities SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete activity
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM activities WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;