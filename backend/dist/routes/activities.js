"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../database"));
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
// Get all activities (public)
router.get('/', async (req, res) => {
    try {
        const result = database_1.default.query(`
      SELECT a.*, u.username as created_by_username, u.first_name, u.last_name, u.email, u.project as creator_project
      FROM activities a
      JOIN users u ON a.created_by_id = u.id
      ORDER BY a.date, a.time
    `);
        const activities = result.rows.map((row) => ({
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
    }
    catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create activity
router.post('/', middleware_1.authenticateToken, async (req, res) => {
    try {
        const { name, date, time, endTime, location, venue, sector, project, description, participants, facilitator, priority, partnerInstitution, mode, platform, venueAddress } = req.body;
        database_1.default.query(`INSERT INTO activities (
        name, date, time, end_time, location, venue, sector, project, description,
        participants, facilitator, status, created_by_id, priority, partner_institution,
        mode, platform, venue_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [name, date, time, endTime, location, venue, sector, project, description,
            participants, facilitator, 'Scheduled', req.user.id, priority, partnerInstitution,
            mode, platform, venueAddress]);
        res.status(201).json({ id: 1, name, date, time, endTime });
    }
    catch (error) {
        console.error('Create activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update activity
router.put('/:id', middleware_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const fields = [];
        const values = [];
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        values.push(id);
        const query = `UPDATE activities SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const result = database_1.default.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.json({ message: 'Activity updated' });
    }
    catch (error) {
        console.error('Update activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete activity
router.delete('/:id', middleware_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = database_1.default.query('DELETE FROM activities WHERE id = ?', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.json({ message: 'Activity deleted successfully' });
    }
    catch (error) {
        console.error('Delete activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
