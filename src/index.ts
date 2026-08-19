import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { AppDataSource } from "./config/db";
import authRoutes from "./routes/auth";
import publicRoutes from "./routes/public";
import memberRoutes from "./routes/members";
import adminRoutes from "./routes/admin";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows images/files hosted locally to be loaded by frontend
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      // Allow data: URIs for base64-encoded images stored in the database
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "https:"],
    },
  },
}));
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL1,
    ].filter(Boolean) as string[],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Rate Limiter to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter);

// Serve static uploaded files (Profile photos, receipts, documents)
// Resolve from process.cwd() so it works correctly in both dev (ts-node) and prod (compiled dist/)
const uploadsDir = path.join(process.cwd(), "public", "uploads");
app.use("/uploads", express.static(uploadsDir));

// Mount REST APIs
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/admin", adminRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled exception caught:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error occurred.",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

// Database Connection & Server Startup
console.log("Connecting to database...");
AppDataSource.initialize()
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
