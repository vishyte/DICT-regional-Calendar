import express from 'express';
import pool from '../database';
import { authenticateToken, AuthRequest } from '../middleware';

const router = express.Router();

// Helper to format date as YYYY-MM-DD
function formatDate(date: any): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') return date.split('T')[0];
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get all activities (public)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.username as created_by_username, u.first_name, u.last_name, u.email, u.project as creator_project
      FROM activities a
      JOIN users u ON a.created_by_id = u.id
      ORDER BY a.date, a.time
    `);

    const activities = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      date: formatDate(row.date),
      endDate: formatDate(row.end_date),
      originalDate: formatDate(row.original_date),
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
      changeDate: formatDate(row.change_date),
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
    console.log('Creating activity, user:', req.user);
    
    const {
      name, date, endDate, time, endTime, location, venue, sector, project, description,
      participants, facilitator, priority, partnerInstitution, mode, platform,
      venueAddress
    } = req.body;

    console.log('Activity data:', { name, date, time, endTime, location, venue, sector, project });

    // Validate required fields
    if (!name || !date || !time || !endTime || !location || !venue || !sector || !project) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Inserting into activities table...');
    
    const result = await pool.query(
      `INSERT INTO activities (
        name, date, end_date, time, end_time, location, venue, sector, project, description,
        participants, facilitator, status, created_by_id, priority, partner_institution,
        mode, platform, venue_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [name, date, endDate || null, time, endTime, location, venue, sector, project, description,
       participants, facilitator, 'Scheduled', req.user!.id, priority, partnerInstitution,
       mode, platform, venueAddress]
    );

    console.log('Insert result:', result);

    // Get the inserted activity ID
    const insertedId = result.rows[0]?.id;
    console.log('Inserted ID:', insertedId);
    
    const insertedResult = await pool.query(
      'SELECT * FROM activities WHERE id = ?',
      [insertedId]
    );

    const activity = insertedResult.rows[0] as any;
    if (!activity) {
      return res.status(500).json({ error: 'Failed to retrieve created activity' });
    }

    res.status(201).json({ 
      message: 'Activity created successfully',
      activity: {
        id: activity.id,
        name: activity.name,
        date: activity.date,
        time: activity.time,
        endTime: activity.end_time
      }
    });
  } catch (error: any) {
    console.error('Create activity error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      stack: error.stack
    });
    
    let errorMessage = 'Failed to create activity';
    if (error.message?.includes('FOREIGN KEY')) {
      errorMessage = 'User not found. Please log in again.';
    } else if (error.message?.includes('relation "activities" does not exist')) {
      errorMessage = 'Database table not found. Please run migrations.';
    }
    
    res.status(500).json({ error: errorMessage, details: error.message });
  }
});

// Update activity
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Map camelCase keys to snake_case for database columns
    const fieldMap: {[key: string]: string} = {
      'endDate': 'end_date',
      'endTime': 'end_time',
      'originalDate': 'original_date',
      'venueAddress': 'venue_address',
      'partnerInstitution': 'partner_institution',
      'changeReason': 'change_reason',
      'changeDate': 'change_date',
      'createdBy': 'created_by_id',
      'timeStart': 'time',
      'timeEnd': 'end_time'
    };

    const fields: string[] = [];
    const values: any[] = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        const dbColumn = fieldMap[key] || key;
        fields.push(`${dbColumn} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE activities SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity updated' });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete activity
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM activities WHERE id = ?', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
