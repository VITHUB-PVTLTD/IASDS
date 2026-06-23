"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadService = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);
if (useCloudinary) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
else {
    // Ensure local uploads directory exists
    const localUploadDir = path_1.default.join(__dirname, "../../public/uploads");
    if (!fs_1.default.existsSync(localUploadDir)) {
        fs_1.default.mkdirSync(localUploadDir, { recursive: true });
    }
}
exports.uploadService = {
    /**
     * Uploads a file (provided as local file path or multer file) and returns the public url.
     * Cleans up local temp files if necessary.
     */
    async uploadFile(localPath, folder = "iasds") {
        if (useCloudinary) {
            try {
                const result = await cloudinary_1.v2.uploader.upload(localPath, {
                    folder: folder,
                    resource_type: "auto",
                });
                // Try deleting local temporary file
                if (fs_1.default.existsSync(localPath)) {
                    fs_1.default.unlinkSync(localPath);
                }
                return result.secure_url;
            }
            catch (err) {
                console.error("Cloudinary upload failed, falling back to local file hosting path.", err);
            }
        }
        // Local fallback: Move file from temp to public uploads if it's in a temporary location
        const fileName = path_1.default.basename(localPath);
        const destinationDir = path_1.default.join(__dirname, "../../public/uploads", folder);
        if (!fs_1.default.existsSync(destinationDir)) {
            fs_1.default.mkdirSync(destinationDir, { recursive: true });
        }
        const destinationPath = path_1.default.join(destinationDir, fileName);
        if (localPath !== destinationPath && fs_1.default.existsSync(localPath)) {
            fs_1.default.renameSync(localPath, destinationPath);
        }
        const host = process.env.BACKEND_URL || "http://localhost:5000";
        return `${host}/uploads/${folder}/${fileName}`;
    }
};
