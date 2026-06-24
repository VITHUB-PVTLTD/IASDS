import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import os from "os";
import { AppDataSource } from "../config/db";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { Member } from "../entities/Member";
import { MemberProfile } from "../entities/MemberProfile";
import { MembershipType } from "../entities/MembershipType";
import { MembershipApplication } from "../entities/MembershipApplication";
import { uploadService } from "../services/uploadService";
import { emailService } from "../services/emailService";
import fs from "fs";

// Helper: convert a multer temp file to a base64 data URI and clean up the temp file
function fileToBase64DataUri(filePath: string, originalName: string): string {
  const extMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
    bmp: "image/bmp", ico: "image/x-icon",
    pdf: "application/pdf",
  };
  const ext = (originalName.split(".").pop() || "jpeg").toLowerCase();
  const mime = extMap[ext] || "image/jpeg";
  const data = fs.readFileSync(filePath);
  const base64 = data.toString("base64");
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return `data:${mime};base64,${base64}`;
}

const router = Router();
const upload = multer({ dest: os.tmpdir() });

const JWT_SECRET = process.env.JWT_SECRET || "iasds_secret_jwt_key_2026";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "iasds_refresh_jwt_key_2026";

// Helper to generate access and refresh tokens
function generateTokens(user: User) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role.name,
    memberId: user.member?.id || undefined,
  };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

  return { accessToken, refreshToken };
}

// 1. REGISTER MEMBER (with photo and document uploads)
router.post(
  "/register",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "supportingDocument", maxCount: 1 }
  ]),
  async (req: any, res: Response) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        email,
        password,
        fullName,
        gender,
        dateOfBirth,
        mobileNumber,
        qualification,
        institution,
        specialization,
        organization,
        designation,
        experience,
        country,
        state,
        city,
        postalCode,
        address,
        membershipTypeId
      } = req.body;

      // Validate unique email
      const userRepo = queryRunner.manager.getRepository(User);
      const existingUser = await userRepo.findOneBy({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      // Upload profile photo as base64 data URI
      let profilePhotoUrl: string | null = null;
      if (req.files && req.files.profilePhoto) {
        const photoFile = req.files.profilePhoto[0];
        profilePhotoUrl = fileToBase64DataUri(photoFile.path, photoFile.originalname || photoFile.filename);
      }

      // Convert supporting document (image or PDF) to base64 data URI for DB storage
      let supportingDocsUrl: string | null = null;
      if (req.files && req.files.supportingDocument) {
        const docFile = req.files.supportingDocument[0];
        supportingDocsUrl = fileToBase64DataUri(docFile.path, docFile.originalname || docFile.filename);
      }

      // Get standard Member Role
      const roleRepo = queryRunner.manager.getRepository(Role);
      let memberRole = await roleRepo.findOneBy({ name: "Member" });
      if (!memberRole) {
        memberRole = new Role();
        memberRole.name = "Member";
        memberRole.description = "Default member access level";
        memberRole = await roleRepo.save(memberRole);
      }

      // Create User
      const user = new User();
      user.email = email;
      user.passwordHash = await bcrypt.hash(password, 10);
      user.role = memberRole;
      user.status = "active";
      const savedUser = await queryRunner.manager.save(user);

      // Fetch chosen Membership Type
      const typeRepo = queryRunner.manager.getRepository(MembershipType);
      const membershipType = await typeRepo.findOneBy({ id: parseInt(membershipTypeId || "1") });
      if (!membershipType) {
        throw new Error("Invalid membership type selected");
      }

      // Create Member profile shell
      const member = new Member();
      member.user = savedUser;
      member.membershipType = membershipType;
      member.status = "pending_review";
      const savedMember = await queryRunner.manager.save(member);

      // Create Detailed Profile Record
      const profile = new MemberProfile();
      profile.member = savedMember;
      profile.fullName = fullName;
      profile.gender = gender || null;
      profile.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      profile.mobileNumber = mobileNumber;
      profile.qualification = qualification || null;
      profile.institution = institution || null;
      profile.specialization = specialization || null;
      profile.organization = organization || null;
      profile.designation = designation || null;
      profile.experience = experience || null;
      profile.country = country || null;
      profile.state = state || null;
      profile.city = city || null;
      profile.postalCode = postalCode || null;
      profile.address = address || null;
      profile.profilePhotoUrl = profilePhotoUrl;
      profile.supportingDocumentsUrl = supportingDocsUrl;
      await queryRunner.manager.save(profile);

      // Create Membership Application record for admin reviewing
      const application = new MembershipApplication();
      application.user = savedUser;
      application.status = "pending";
      await queryRunner.manager.save(application);

      // Commit Transaction
      await queryRunner.commitTransaction();

      // Trigger Email Notification
      await emailService.sendRegistrationSubmitted(email, fullName);

      return res.status(201).json({
        message: "Registration successful. Your application is under review.",
        memberId: savedMember.id,
      });

    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      console.error("Error during member registration:", err);
      return res.status(500).json({ message: "Registration failed", error: err.message });
    } finally {
      await queryRunner.release();
    }
  }
);

// 2. LOGIN USER
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { email },
      relations: ["role", "member", "member.membershipType", "member.profile"]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: `Your user account is currently: ${user.status}` });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await userRepo.save(user);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        status: user.status,
        member: user.member ? {
          id: user.member.id,
          status: user.member.status,
          membershipNumber: user.member.membershipNumber,
          fullName: user.member.profile?.fullName,
          photoUrl: user.member.profile?.profilePhotoUrl
        } : null
      }
    });

  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// 3. REFRESH TOKEN
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
      }

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: decoded.id },
        relations: ["role", "member", "member.membershipType", "member.profile"]
      });

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      const tokens = generateTokens(user);
      return res.json({
        accessToken: tokens.accessToken,
        refreshToken: user.refreshToken
      });
    });

  } catch (err: any) {
    console.error("Token refresh error:", err);
    return res.status(500).json({ message: "Token refresh failed", error: err.message });
  }
});

// 4. LOGOUT
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOneBy({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await userRepo.save(user);
      }
    }
    return res.json({ message: "Logged out successfully" });
  } catch (err: any) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Logout failed" });
  }
});

// 5. FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ email });

    if (!user) {
      // Don't disclose if email exists for security
      return res.json({ message: "If the email is registered, a reset link has been sent." });
    }

    // Generate quick reset token (expires in 1 hour)
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });
    await emailService.sendPasswordReset(email, resetToken);

    return res.json({ message: "If the email is registered, a reset link has been sent." });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Password reset request failed" });
  }
});

// 6. RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.status(400).json({ message: "Invalid or expired password reset token" });
      }

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOneBy({ id: decoded.id });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.refreshToken = null; // Clear active sessions
      await userRepo.save(user);

      return res.json({ message: "Password has been reset successfully. Please log in." });
    });

  } catch (err: any) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Password reset failed" });
  }
});

export default router;
