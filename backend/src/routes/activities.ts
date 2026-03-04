import express from 'express';
import pool from '../database';
import { authenticateToken, AuthRequest } from '../middleware';
import multer from 'multer';

const router = express.Router();

// configure multer to store files in memory (buffers)
const upload = multer({ storage: multer.memoryStorage() });

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
      SELECT a.*, 
        u.username as created_by_username, u.first_name, u.last_name, u.email, u.project as creator_project,
        ap.first_name as approver_first_name, ap.last_name as approver_last_name, ap.email as approver_email
      FROM activities a
      JOIN users u ON a.created_by_id = u.id
      LEFT JOIN users ap ON a.approved_by_id = ap.id
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
      platform: row.platform,
      // Approval fields
      approvedBy: row.approved_by_id ? {
        id: row.approved_by_id,
        fullName: row.approver_first_name ? `${row.approver_first_name} ${row.approver_last_name || ''}` : undefined,
        email: row.approver_email
      } : null,
      approvedAt: row.approved_at ? formatDate(row.approved_at) : null,
      approvalNotes: row.approval_notes,
      attendanceFileName: row.attendance_file_name,
      todaFileName: row.toda_file_name,
      // we don't send file_data here; frontend will call download endpoint if needed
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

// Upload attendance/TODA files (multipart/form-data)
router.post('/:id/upload', authenticateToken, upload.fields([{ name: 'attendance' }, { name: 'toda' }]), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const updates: any = {};

    if (files.attendance && files.attendance[0]) {
      const f = files.attendance[0];
      updates.attendance_file_name = f.originalname;
      updates.attendance_upload_date = new Date();
      updates.attendance_file_data = f.buffer;
    }
    if (files.toda && files.toda[0]) {
      const f = files.toda[0];
      updates.toda_file_name = f.originalname;
      updates.toda_upload_date = new Date();
      updates.toda_file_data = f.buffer;
    }

    // if participant count sent
    if (req.body.participants !== undefined) {
      const p = parseInt(req.body.participants, 10);
      if (!isNaN(p)) updates.participants = p;
    }

    // if any file was uploaded, mark for approval
    if (updates.attendance_file_name || updates.toda_file_name) {
      updates.status = 'For Approval';
    }

    const fields: string[] = [];
    const values: any[] = [];
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });

    values.push(id);
    const query = `UPDATE activities SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.query(query, values);
    res.json({ message: 'Files uploaded' });
  } catch (error: any) {
    console.error('Upload files error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Download stored file
router.get('/:id/file/:type', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, type } = req.params;
    const columnData = type === 'attendance' ? 'attendance_file_data' : 'toda_file_data';
    const columnName = type === 'attendance' ? 'attendance_file_name' : 'toda_file_name';

    const result = await pool.query(`SELECT ${columnData} as data, ${columnName} as name FROM activities WHERE id = ?`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    const row = result.rows[0] as any;
    if (!row.data) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filename = row.name || 'file';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(row.data);
  } catch (error: any) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      'timeStart': 'time',
      'timeEnd': 'end_time',
      'approvedBy': 'approved_by_id',
      'approvedAt': 'approved_at',
      'approvalNotes': 'approval_notes',
      'attendanceFileName': 'attendance_file_name',
      'attendanceUploadDate': 'attendance_upload_date',
      'todaFileName': 'toda_file_name',
      'todaUploadDate': 'toda_upload_date'
    };

    // Fields that should NOT be updated by the client
    const protectedFields = ['id', 'createdBy', 'created_by_id', 'created_at', 'approvedBy', 'approved_by_id', 'approvedAt', 'approved_at', 'approvalNotes', 'approval_notes'];

    const fields: string[] = [];
    const values: any[] = [];

    Object.keys(updates).forEach(key => {
      // Skip protected fields
      if (protectedFields.includes(key)) {
        return;
      }

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
    const query = `UPDATE activities SET ${fields.join(', ')} WHERE id = ?`;

    console.log('Update activity query:', query);
    console.log('Values:', values);

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity updated' });
  } catch (error: any) {
    console.error('Update activity error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
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

// Approve activity (admin only)
router.post('/:id/approve', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;
    const adminId = req.user!.id;

    // Check if activity exists
    const activityResult = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    if (activityResult.rowCount === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Update with approval info and change status to Completed
    await pool.query(
      `UPDATE activities SET 
        approved_by_id = ?, 
        approved_at = NOW(), 
        approval_notes = ?,
        status = 'Completed'
      WHERE id = ?`,
      [adminId, approvalNotes || null, id]
    );

    res.json({ message: 'Activity approved successfully' });
  } catch (error: any) {
    console.error('Approve activity error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Reject activity (admin only)
router.post('/:id/reject', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;
    const adminId = req.user!.id;

    // Check if activity exists
    const activityResult = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
    if (activityResult.rowCount === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Update with rejection info
    await pool.query(
      `UPDATE activities SET 
        approved_by_id = ?, 
        approved_at = NOW(), 
        approval_notes = ?,
        status = 'Rejected'
      WHERE id = ?`,
      [adminId, approvalNotes || 'Rejected', id]
    );

    res.json({ message: 'Activity rejected' });
  } catch (error: any) {
    console.error('Reject activity error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
