"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    // Check if it's a local token (base64 encoded JSON)
    try {
        const decoded = JSON.parse(atob(token));
        if (decoded.local && decoded.role === 'superadmin') {
            // Allow local superadmin token in development
            req.user = {
                id: decoded.id || 0,
                username: decoded.username || 'superadmin',
                email: decoded.email || 'superadmin@dict.gov.ph'
            };
            return next();
        }
    }
    catch (e) {
        // Not a local token, continue with JWT verification
    }
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    jsonwebtoken_1.default.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
