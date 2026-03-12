"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("../database"));
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
// Fallback function to save registration data to JSON file
async function saveRegistrationBackup(userData) {
    try {
        const backupDir = path_1.default.join(process.cwd(), 'registration_backup');
        if (!fs_1.default.existsSync(backupDir)) {
            fs_1.default.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path_1.default.join(backupDir, `registration_${timestamp}_${userData.username}.json`);
        const backupData = {
            ...userData,
            password_hash: undefined, // Don't save plain password
            backedUp_at: new Date().toISOString(),
            status: 'pending_database_entry'
        };
        fs_1.default.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        console.log(`Registration data backed up to: ${backupFile}`);
        return true;
    }
    catch (backupError) {
        console.error('Failed to backup registration data:', backupError);
        return false;
    }
}
// Register user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, middleName, lastName, project, officeAssignment } = req.body;
        // Validate required fields
        if (!username || !email || !password || !firstName || !lastName || !project || !officeAssignment) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Check if user exists
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Insert user (default role = 'user')
        const result = await database_1.default.query(`INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, project, office_assignment, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`, [username, email, passwordHash, firstName, middleName || null, lastName, project, officeAssignment, 'user']);
        // Fetch inserted user (include role)
        const userResult = await database_1.default.query('SELECT id, username, email, first_name, middle_name, last_name, project, role FROM users WHERE id = ?', [result.rows[0]?.id]);
        const user = userResult.rows[0];
        if (!user) {
            return res.status(500).json({ error: 'User registration completed but failed to retrieve user data' });
        }
        res.status(201).json({ message: 'User registered successfully', user });
    }
    catch (error) {
        console.error('Registration error:', error);
        // Log the detailed error for debugging
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            detail: error.detail
        });
        // Determine error type
        let errorMessage = 'Registration failed. Please try again.';
        if (error.message?.includes('UNIQUE constraint failed')) {
            if (error.message?.includes('username')) {
                errorMessage = 'Username already exists';
            }
            else if (error.message?.includes('email')) {
                errorMessage = 'Email already registered';
            }
        }
        else if (error.message?.includes('NOT NULL constraint failed')) {
            errorMessage = 'Missing required information';
        }
        // Backup registration data if database fails
        const backupData = {
            username: req.body.username,
            email: req.body.email,
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            project: req.body.project,
            officeAssignment: req.body.officeAssignment
        };
        const backedUpSuccessfully = await saveRegistrationBackup(backupData);
        res.status(500).json({
            error: errorMessage,
            message: backedUpSuccessfully
                ? 'Registration data has been saved. Please try again later.'
                : 'Registration failed. Please contact support.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await database_1.default.query('SELECT * FROM users WHERE username = ?', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email, role: user.role || 'user' }, jwtSecret, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
                firstName: user.first_name,
                middleName: user.middle_name,
                lastName: user.last_name,
                idNumber: user.username,
                email: user.email,
                project: user.project,
                officeAssignment: user.office_assignment,
                role: user.role || 'user'
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get current user profile
router.get('/profile', middleware_1.authenticateToken, async (req, res) => {
    try {
        const result = await database_1.default.query('SELECT id, username, email, first_name, middle_name, last_name, project, office_assignment, role FROM users WHERE id = ?', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        res.json({
            id: user.id,
            username: user.username,
            fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
            firstName: user.first_name,
            middleName: user.middle_name,
            lastName: user.last_name,
            idNumber: user.username,
            email: user.email,
            project: user.project,
            officeAssignment: user.office_assignment,
            role: user.role || 'user'
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Recovery endpoint - process backed-up registrations
router.post('/recover-backups', async (req, res) => {
    try {
        const backupDir = path_1.default.join(process.cwd(), 'registration_backup');
        if (!fs_1.default.existsSync(backupDir)) {
            return res.json({
                message: 'No backup directory found',
                recovered: 0,
                failed: 0
            });
        }
        const files = fs_1.default.readdirSync(backupDir);
        let recovered = 0;
        let failed = 0;
        const results = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const filePath = path_1.default.join(backupDir, file);
                    const backupData = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
                    // Hash password (since it wasn't saved)
                    // For recovery, we'll use a temporary password that user should change
                    const tempPassword = Math.random().toString(36).slice(-8);
                    const passwordHash = await bcryptjs_1.default.hash(tempPassword, 10);
                    // Try to insert the user
                    await database_1.default.query(`INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, project)
             VALUES (?, ?, ?, ?, ?, ?, ?)`, [backupData.username, backupData.email, passwordHash, backupData.firstName,
                        backupData.middleName || null, backupData.lastName, backupData.project]);
                    // Move file to processed folder
                    const processedDir = path_1.default.join(backupDir, 'processed');
                    if (!fs_1.default.existsSync(processedDir)) {
                        fs_1.default.mkdirSync(processedDir, { recursive: true });
                    }
                    fs_1.default.renameSync(filePath, path_1.default.join(processedDir, file));
                    recovered++;
                    results.push({ username: backupData.username, status: 'recovered' });
                }
                catch (fileError) {
                    failed++;
                    results.push({
                        file,
                        status: 'failed',
                        error: fileError.message
                    });
                    console.error(`Failed to recover ${file}:`, fileError);
                }
            }
        }
        res.json({
            message: 'Recovery process completed',
            recovered,
            failed,
            results
        });
    }
    catch (error) {
        console.error('Recovery error:', error);
        res.status(500).json({ error: 'Recovery process failed' });
    }
});
// Check backup status
router.get('/backup-status', async (req, res) => {
    try {
        const backupDir = path_1.default.join(process.cwd(), 'registration_backup');
        if (!fs_1.default.existsSync(backupDir)) {
            return res.json({
                pendingBackups: 0,
                backupDirectory: 'not created'
            });
        }
        const files = fs_1.default.readdirSync(backupDir).filter(f => f.endsWith('.json'));
        res.json({
            pendingBackups: files.length,
            backupDirectory: backupDir,
            files: files.map(f => ({
                name: f,
                createdAt: fs_1.default.statSync(path_1.default.join(backupDir, f)).mtime
            }))
        });
    }
    catch (error) {
        console.error('Backup status error:', error);
        res.status(500).json({ error: 'Failed to get backup status' });
    }
});
// Superadmin login
router.post('/superadmin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Validate superadmin credentials
        // TODO: Move these to environment variables or database for production
        const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME || 'superadmin';
        const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'admin123';
        if (username !== SUPERADMIN_USERNAME || password !== SUPERADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Invalid superadmin credentials' });
        }
        // Create a token for superadmin
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const token = jsonwebtoken_1.default.sign({ id: 0, username: 'superadmin', email: 'superadmin@dict.gov.ph', role: 'superadmin' }, jwtSecret, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: 0,
                username: 'superadmin',
                email: 'superadmin@dict.gov.ph',
                role: 'superadmin'
            }
        });
    }
    catch (error) {
        console.error('Superadmin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Superadmin endpoints for user management
// Get all users (for superadmin)
router.get('/all', middleware_1.authenticateToken, async (req, res) => {
    try {
        const result = await database_1.default.query(`SELECT id, username, email, first_name, middle_name, last_name, project, office_assignment, role, created_at 
       FROM users 
       ORDER BY created_at DESC`);
        const users = result.rows.map((user) => ({
            id: user.id,
            username: user.username,
            fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
            email: user.email,
            project: user.project,
            officeAssignment: user.office_assignment,
            role: user.role || 'user',
            createdAt: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: 'active'
        }));
        res.json(users);
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Create user (for superadmin)
router.post('/', middleware_1.authenticateToken, async (req, res) => {
    try {
        const { username, email, password, fullName, project, officeAssignment, role } = req.body;
        // Validate required fields
        if (!username || !email || !password || !fullName || !project || !officeAssignment) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Parse full name
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        if (!firstName || !lastName) {
            return res.status(400).json({ error: 'Full name must include at least first and last name' });
        }
        // Check if user exists
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Insert user (include role and office assignment)
        const result = await database_1.default.query(`INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, project, office_assignment, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`, [username, email, passwordHash, firstName, middleName || null, lastName, project, officeAssignment, role || 'user']);
        // Fetch inserted user
        const userResult = await database_1.default.query('SELECT id, username, email, first_name, middle_name, last_name, project, role, created_at FROM users WHERE id = ?', [result.rows[0]?.id]);
        const user = userResult.rows[0];
        if (!user) {
            return res.status(500).json({ error: 'User creation completed but failed to retrieve user data' });
        }
        res.status(201).json({
            id: user.id,
            username: user.username,
            fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
            email: user.email,
            project: user.project,
            officeAssignment: user.office_assignment,
            role: user.role || role || 'user',
            createdAt: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: 'active'
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        let errorMessage = 'Failed to create user';
        if (error.message?.includes('UNIQUE constraint failed')) {
            errorMessage = 'Username or email already exists';
        }
        res.status(500).json({ error: errorMessage });
    }
});
// Update user (for superadmin)
router.put('/:id', middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { username, email, fullName, project, officeAssignment, role, password } = req.body;
        console.log(`PUT /users/${userId} payload:`, { username, email, fullName, project, officeAssignment, role, password: password ? '[REDACTED]' : undefined });
        // Check if user exists
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Parse full name if provided
        let firstName, middleName, lastName;
        if (fullName) {
            const nameParts = fullName.trim().split(/\s+/);
            firstName = nameParts[0] || '';
            middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;
            lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        }
        // Build update query dynamically
        const updates = [];
        const params = [];
        if (username) {
            // Check if username is already taken by another user
            const usernameCheck = await database_1.default.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
            if (usernameCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            updates.push('username = ?');
            params.push(username);
        }
        if (email) {
            // Check if email is already taken by another user
            const emailCheck = await database_1.default.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Email already taken' });
            }
            updates.push('email = ?');
            params.push(email);
        }
        if (firstName) {
            updates.push('first_name = ?');
            params.push(firstName);
        }
        if (middleName !== undefined) {
            updates.push('middle_name = ?');
            params.push(middleName);
        }
        if (lastName) {
            updates.push('last_name = ?');
            params.push(lastName);
        }
        if (project) {
            updates.push('project = ?');
            params.push(project);
        }
        if (officeAssignment !== undefined) {
            updates.push('office_assignment = ?');
            params.push(officeAssignment);
        }
        if (password) {
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            updates.push('password_hash = ?');
            params.push(passwordHash);
        }
        if (role) {
            updates.push('role = ?');
            params.push(role);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);
        await database_1.default.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        console.log(`Executed UPDATE users for id=${userId} with updates: ${updates.join(', ')}`);
        // Fetch updated user (include role)
        const userResult = await database_1.default.query('SELECT id, username, email, first_name, middle_name, last_name, project, office_assignment, role, created_at FROM users WHERE id = ?', [userId]);
        const user = userResult.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found after update' });
        }
        res.json({
            id: user.id,
            username: user.username,
            fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
            email: user.email,
            project: user.project,
            officeAssignment: user.office_assignment,
            role: user.role || role || 'user',
            createdAt: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: 'active'
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// Delete user (for superadmin)
router.delete('/:id', middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        // Check if user exists
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Nullify any activities.created_by_id referencing this user to avoid FK constraint errors
        try {
            await database_1.default.query('UPDATE activities SET created_by_id = NULL WHERE created_by_id = ?', [userId]);
            console.log(`Cleared created_by_id for activities referencing user id=${userId}`);
        }
        catch (err) {
            console.warn('Failed to clear activity references before deleting user:', err);
        }
        // Delete user
        await database_1.default.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.default = router;
