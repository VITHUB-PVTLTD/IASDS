"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || "iasds_secret_jwt_key_2026";
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Invalid or expired access token" });
            }
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                memberId: decoded.memberId
            };
            next();
        });
    }
    else {
        res.status(401).json({ message: "Authorization header with Bearer token is required" });
    }
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: authentication required" });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: insufficient permissions" });
        }
        next();
    };
}
