import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  // Ensure local uploads directory exists
  const localUploadDir = path.join(__dirname, "../../public/uploads");
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }
}

export const uploadService = {
  /**
   * Uploads a file (provided as local file path or multer file) and returns the public url.
   * Cleans up local temp files if necessary.
   */
  async uploadFile(localPath: string, folder: string = "iasds"): Promise<string> {
    if (useCloudinary) {
      try {
        const result = await cloudinary.uploader.upload(localPath, {
          folder: folder,
          resource_type: "auto",
        });
        // Try deleting local temporary file
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
        return result.secure_url;
      } catch (err) {
        console.error("Cloudinary upload failed, falling back to local file hosting path.", err);
      }
    }

    // Local fallback: Move file from temp to public uploads if it's in a temporary location
    const fileName = path.basename(localPath);
    const destinationDir = path.join(__dirname, "../../public/uploads", folder);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    const destinationPath = path.join(destinationDir, fileName);
    if (localPath !== destinationPath && fs.existsSync(localPath)) {
      fs.copyFileSync(localPath, destinationPath);
      fs.unlinkSync(localPath);
    }

    const host = process.env.BACKEND_URL || "http://localhost:5000";
    return `${host}/uploads/${folder}/${fileName}`;
  }
};
