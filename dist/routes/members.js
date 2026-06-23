"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const db_1 = require("../config/db");
const Member_1 = require("../entities/Member");
const MemberProfile_1 = require("../entities/MemberProfile");
const MembershipPayment_1 = require("../entities/MembershipPayment");
const Notification_1 = require("../entities/Notification");
const pdfService_1 = require("../services/pdfService");
const multer_1 = __importDefault(require("multer"));
const os_1 = __importDefault(require("os"));
const uploadService_1 = require("../services/uploadService");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: os_1.default.tmpdir() });
// Apply JWT authentication to all sub-routes
router.use(authMiddleware_1.authenticateJWT);
// 1. GET MEMBER PROFILE & DASHBOARD DATA
router.get("/dashboard", async (req, res) => {
    try {
        const memberRepo = db_1.AppDataSource.getRepository(Member_1.Member);
        const notificationRepo = db_1.AppDataSource.getRepository(Notification_1.Notification);
        const member = await memberRepo.findOne({
            where: { user: { id: req.user?.id } },
            relations: ["profile", "membershipType", "payments", "cards"]
        });
        if (!member) {
            return res.status(404).json({ message: "Member profile not found" });
        }
        const notifications = await notificationRepo.find({
            where: { user: { id: req.user?.id } },
            order: { createdAt: "DESC" },
            take: 5
        });
        return res.json({
            member,
            notifications
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch dashboard data", error: err.message });
    }
});
// 2. UPDATE PROFILE DETAILS
router.put("/profile", async (req, res) => {
    try {
        const profileRepo = db_1.AppDataSource.getRepository(MemberProfile_1.MemberProfile);
        const memberRepo = db_1.AppDataSource.getRepository(Member_1.Member);
        const member = await memberRepo.findOne({
            where: { user: { id: req.user?.id } },
            relations: ["profile"]
        });
        if (!member) {
            return res.status(404).json({ message: "Member profile not found" });
        }
        const profile = member.profile;
        const { fullName, gender, dateOfBirth, mobileNumber, qualification, institution, specialization, organization, designation, experience, country, state, city, postalCode, address } = req.body;
        if (fullName)
            profile.fullName = fullName;
        if (gender !== undefined)
            profile.gender = gender;
        if (dateOfBirth !== undefined)
            profile.dateOfBirth = dateOfBirth;
        if (mobileNumber)
            profile.mobileNumber = mobileNumber;
        if (qualification !== undefined)
            profile.qualification = qualification;
        if (institution !== undefined)
            profile.institution = institution;
        if (specialization !== undefined)
            profile.specialization = specialization;
        if (organization !== undefined)
            profile.organization = organization;
        if (designation !== undefined)
            profile.designation = designation;
        if (experience !== undefined)
            profile.experience = experience;
        if (country !== undefined)
            profile.country = country;
        if (state !== undefined)
            profile.state = state;
        if (city !== undefined)
            profile.city = city;
        if (postalCode !== undefined)
            profile.postalCode = postalCode;
        if (address !== undefined)
            profile.address = address;
        await profileRepo.save(profile);
        return res.json({ message: "Profile updated successfully", profile });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to update profile", error: err.message });
    }
});
// 3. UPLOAD PROFILE PHOTO
router.post("/profile/photo", upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No photo file provided" });
        }
        const memberRepo = db_1.AppDataSource.getRepository(Member_1.Member);
        const profileRepo = db_1.AppDataSource.getRepository(MemberProfile_1.MemberProfile);
        const member = await memberRepo.findOne({
            where: { user: { id: req.user?.id } },
            relations: ["profile"]
        });
        if (!member) {
            return res.status(404).json({ message: "Member profile not found" });
        }
        const profilePhotoUrl = await uploadService_1.uploadService.uploadFile(req.file.path, "profile_photos");
        member.profile.profilePhotoUrl = profilePhotoUrl;
        await profileRepo.save(member.profile);
        return res.json({ message: "Photo uploaded successfully", photoUrl: profilePhotoUrl });
    }
    catch (err) {
        console.error("Photo upload error:", err);
        return res.status(500).json({ message: "Photo upload failed", error: err.message });
    }
});
// 4. SUBMIT PAYMENT / RENEWAL RECEIPTS
router.post("/payment", upload.single("receipt"), async (req, res) => {
    try {
        const { transactionReference, amount, paymentMethod } = req.body;
        if (!amount || !paymentMethod) {
            return res.status(400).json({ message: "Amount and payment method are required" });
        }
        const memberRepo = db_1.AppDataSource.getRepository(Member_1.Member);
        const member = await memberRepo.findOne({
            where: { user: { id: req.user?.id } }
        });
        if (!member) {
            return res.status(404).json({ message: "Member profile not found" });
        }
        let receiptUrl = null;
        if (req.file) {
            receiptUrl = await uploadService_1.uploadService.uploadFile(req.file.path, "payment_receipts");
        }
        const paymentRepo = db_1.AppDataSource.getRepository(MembershipPayment_1.MembershipPayment);
        const payment = new MembershipPayment_1.MembershipPayment();
        payment.member = member;
        payment.amount = parseFloat(amount);
        payment.paymentStatus = "pending"; // awaits admin approval
        payment.paymentMethod = paymentMethod;
        payment.transactionReference = transactionReference || null;
        payment.receiptUrl = receiptUrl;
        await paymentRepo.save(payment);
        return res.status(201).json({
            message: "Payment receipt uploaded successfully. Status is pending review.",
            payment
        });
    }
    catch (err) {
        console.error("Payment submission error:", err);
        return res.status(500).json({ message: "Failed to submit payment receipt", error: err.message });
    }
});
// 5. DOWNLOAD MEMBERSHIP CARD PDF
router.get("/download-card", async (req, res) => {
    try {
        const memberRepo = db_1.AppDataSource.getRepository(Member_1.Member);
        const member = await memberRepo.findOne({
            where: { user: { id: req.user?.id } },
            relations: ["profile", "membershipType"]
        });
        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }
        if (member.status !== "approved") {
            return res.status(403).json({ message: "Your membership is not approved. Card download is unavailable." });
        }
        const pdfBuffer = await (0, pdfService_1.generateMembershipCardPdf)(member);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=iasds-membership-card.pdf`);
        return res.send(pdfBuffer);
    }
    catch (err) {
        console.error("Card generation error:", err);
        return res.status(500).json({ message: "Failed to generate card PDF", error: err.message });
    }
});
// 6. GET NOTIFICATIONS
router.get("/notifications", async (req, res) => {
    try {
        const notificationRepo = db_1.AppDataSource.getRepository(Notification_1.Notification);
        const notifications = await notificationRepo.find({
            where: { user: { id: req.user?.id } },
            order: { createdAt: "DESC" }
        });
        return res.json(notifications);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch notifications" });
    }
});
router.put("/notifications/:id/read", async (req, res) => {
    try {
        const notificationRepo = db_1.AppDataSource.getRepository(Notification_1.Notification);
        const notif = await notificationRepo.findOneBy({
            id: req.params.id,
            user: { id: req.user?.id }
        });
        if (!notif) {
            return res.status(404).json({ message: "Notification not found" });
        }
        notif.isRead = true;
        await notificationRepo.save(notif);
        return res.json({ message: "Notification marked as read" });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to update notification" });
    }
});
exports.default = router;
