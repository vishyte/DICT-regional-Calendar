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
        const { username, email, password, firstName, middleName, lastName, project } = req.body;
        // Validate required fields
        if (!username || !email || !password || !firstName || !lastName || !project) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Check if user exists
        const existingUser = database_1.default.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Insert user
        const result = database_1.default.query(`INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, project)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [username, email, passwordHash, firstName, middleName || null, lastName, project]);
        // Fetch inserted user
        const userResult = database_1.default.query('SELECT id, username, email, first_name, middle_name, last_name, project FROM users WHERE username = ?', [username]);
        const user = userResult.rows[0];
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
        // Backup registration data if database fails
        const backupData = {
            username: req.body.username,
            email: req.body.email,
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            project: req.body.project
        };
        const backedUpSuccessfully = await saveRegistrationBackup(backupData);
        res.status(500).json({
            error: 'Internal server error',
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
        const result = database_1.default.query('SELECT * FROM users WHERE username = ?', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
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
                project: user.project
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
        const result = database_1.default.query('SELECT id, username, email, first_name, middle_name, last_name, project FROM users WHERE id = ?', [req.user.id]);
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
            project: user.project
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
                    database_1.default.query(`INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, project)
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
exports.default = router;
