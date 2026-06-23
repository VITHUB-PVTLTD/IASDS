"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const os_1 = __importDefault(require("os"));
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
const Role_1 = require("../entities/Role");
const Member_1 = require("../entities/Member");
const MemberProfile_1 = require("../entities/MemberProfile");
const MembershipType_1 = require("../entities/MembershipType");
const MembershipApplication_1 = require("../entities/MembershipApplication");
const uploadService_1 = require("../services/uploadService");
const emailService_1 = require("../services/emailService");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: os_1.default.tmpdir() });
const JWT_SECRET = process.env.JWT_SECRET || "iasds_secret_jwt_key_2026";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "iasds_refresh_jwt_key_2026";
// Helper to generate access and refresh tokens
function generateTokens(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role.name,
        memberId: user.member?.id || undefined,
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
}
// 1. REGISTER MEMBER (with photo and document uploads)
router.post("/register", upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "supportingDocument", maxCount: 1 }
]), async (req, res) => {
    const queryRunner = db_1.AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        const { email, password, fullName, gender, dateOfBirth, mobileNumber, qualification, institution, specialization, organization, designation, experience, country, state, city, postalCode, address, membershipTypeId } = req.body;
        // Validate unique email
        const userRepo = queryRunner.manager.getRepository(User_1.User);
        const existingUser = await userRepo.findOneBy({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered" });
        }
        // Upload profile photo
        let profilePhotoUrl = null;
        if (req.files && req.files.profilePhoto) {
            const photoFile = req.files.profilePhoto[0];
            profilePhotoUrl = await uploadService_1.uploadService.uploadFile(photoFile.path, "profile_photos");
        }
        // Upload supporting documents
        let supportingDocsUrl = null;
        if (req.files && req.files.supportingDocument) {
            const docFile = req.files.supportingDocument[0];
            supportingDocsUrl = await uploadService_1.uploadService.uploadFile(docFile.path, "supporting_documents");
        }
        // Get standard Member Role
        const roleRepo = queryRunner.manager.getRepository(Role_1.Role);
        let memberRole = await roleRepo.findOneBy({ name: "Member" });
        if (!memberRole) {
            memberRole = new Role_1.Role();
            memberRole.name = "Member";
            memberRole.description = "Default member access level";
            memberRole = await roleRepo.save(memberRole);
        }
        // Create User
        const user = new User_1.User();
        user.email = email;
        user.passwordHash = await bcryptjs_1.default.hash(password, 10);
        user.role = memberRole;
        user.status = "active";
        const savedUser = await queryRunner.manager.save(user);
        // Fetch chosen Membership Type
        const typeRepo = queryRunner.manager.getRepository(MembershipType_1.MembershipType);
        const membershipType = await typeRepo.findOneBy({ id: parseInt(membershipTypeId || "1") });
        if (!membershipType) {
            throw new Error("Invalid membership type selected");
        }
        // Create Member profile shell
        const member = new Member_1.Member();
        member.user = savedUser;
        member.membershipType = membershipType;
        member.status = "pending_review";
        const savedMember = await queryRunner.manager.save(member);
        // Create Detailed Profile Record
        const profile = new MemberProfile_1.MemberProfile();
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
        const application = new MembershipApplication_1.MembershipApplication();
        application.user = savedUser;
        application.status = "pending";
        await queryRunner.manager.save(application);
        // Commit Transaction
        await queryRunner.commitTransaction();
        // Trigger Email Notification
        await emailService_1.emailService.sendRegistrationSubmitted(email, fullName);
        return res.status(201).json({
            message: "Registration successful. Your application is under review.",
            memberId: savedMember.id,
        });
    }
    catch (err) {
        await queryRunner.rollbackTransaction();
        console.error("Error during member registration:", err);
        return res.status(500).json({ message: "Registration failed", error: err.message });
    }
    finally {
        await queryRunner.release();
    }
});
// 2. LOGIN USER
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({
            where: { email },
            relations: ["role", "member", "member.membershipType", "member.profile"]
        });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
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
    }
    catch (err) {
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
        jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Invalid or expired refresh token" });
            }
            const userRepo = db_1.AppDataSource.getRepository(User_1.User);
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
    }
    catch (err) {
        console.error("Token refresh error:", err);
        return res.status(500).json({ message: "Token refresh failed", error: err.message });
    }
});
// 4. LOGOUT
router.post("/logout", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            const userRepo = db_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepo.findOneBy({ refreshToken });
            if (user) {
                user.refreshToken = null;
                await userRepo.save(user);
            }
        }
        return res.json({ message: "Logged out successfully" });
    }
    catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
    }
});
// 5. FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOneBy({ email });
        if (!user) {
            // Don't disclose if email exists for security
            return res.json({ message: "If the email is registered, a reset link has been sent." });
        }
        // Generate quick reset token (expires in 1 hour)
        const resetToken = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });
        await emailService_1.emailService.sendPasswordReset(email, resetToken);
        return res.json({ message: "If the email is registered, a reset link has been sent." });
    }
    catch (err) {
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
        jsonwebtoken_1.default.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(400).json({ message: "Invalid or expired password reset token" });
            }
            const userRepo = db_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepo.findOneBy({ id: decoded.id });
            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }
            user.passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
            user.refreshToken = null; // Clear active sessions
            await userRepo.save(user);
            return res.json({ message: "Password has been reset successfully. Please log in." });
        });
    }
    catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json({ message: "Password reset failed" });
    }
});
exports.default = router;
