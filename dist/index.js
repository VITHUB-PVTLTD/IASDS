"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const auth_1 = __importDefault(require("./routes/auth"));
const public_1 = __importDefault(require("./routes/public"));
const members_1 = __importDefault(require("./routes/members"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false, // Allows images hosted locally to be displayed by frontend
}));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request Rate Limiter to prevent abuse
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter);
// Serve static uploaded files (Profile photos, receipts, documents)
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../public/uploads")));
// Mount REST APIs
app.use("/api/auth", auth_1.default);
app.use("/api/public", public_1.default);
app.use("/api/members", members_1.default);
app.use("/api/admin", admin_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled exception caught:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error occurred.",
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});
// Database Connection & Server Startup
console.log("Connecting to database...");
db_1.AppDataSource.initialize()
    .then(() => {
    console.log("Database connected successfully.");
    app.listen(PORT, () => {
        console.log(`=================================================`);
        console.log(`  IASDS Backend server running on port ${PORT}`);
        console.log(`  Local Address: http://localhost:${PORT}`);
        console.log(`=================================================`);
    });
})
    .catch((err) => {
    console.error("Critical database connection error:", err);
    process.exit(1);
});
