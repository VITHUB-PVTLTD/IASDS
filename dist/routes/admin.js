"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
const Member_1 = require("../entities/Member");
const MembershipApplication_1 = require("../entities/MembershipApplication");
const ExecutiveCouncilMember_1 = require("../entities/ExecutiveCouncilMember");
const Publication_1 = require("../entities/Publication");
const PublicationCategory_1 = require("../entities/PublicationCategory");
const News_1 = require("../entities/News");
const Event_1 = require("../entities/Event");
const GalleryAlbum_1 = require("../entities/GalleryAlbum");
const GalleryImage_1 = require("../entities/GalleryImage");
const ContactMessage_1 = require("../entities/ContactMessage");
const WebsiteSetting_1 = require("../entities/WebsiteSetting");
const Notification_1 = require("../entities/Notification");
const emailService_1 = require("../services/emailService");
const uploadService_1 = require("../services/uploadService");
const multer_1 = __importDefault(require("multer"));
const os_1 = __importDefault(require("os"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: os_1.default.tmpdir() });
// Restrict all routes in this file to administrators/editors
router.use(authMiddleware_1.authenticateJWT);
router.use((0, authMiddleware_1.requireRole)(["Super Admin", "Admin", "Editor"]));
// 1. GET ADMIN DASHBOARD STATS
router.get("/stats", async (req, res) => {
    try {
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const memberRepo = db_1.AppDataSource.getRepository(Member_1.Member);
        const pubRepo = db_1.AppDataSource.getRepository(Publication_1.Publication);
        const contactRepo = db_1.AppDataSource.getRepository(ContactMessage_1.ContactMessage);
        const appRepo = db_1.AppDataSource.getRepository(MembershipApplication_1.MembershipApplication);
        const totalUsers = await userRepo.count();
        const approvedMembers = await memberRepo.countBy({ status: "approved" });
        const pendingMembers = await memberRepo.countBy({ status: "pending_review" });
        const downloadsSum = await pubRepo.createQueryBuilder("pub")
            .select("SUM(pub.downloadCount)", "sum")
            .getRawOne();
        const unreadMessages = await contactRepo.countBy({ status: "unread" });
        const recentApplications = await appRepo.find({
            order: { submittedAt: "DESC" },
            take: 5
        });
        return res.json({
            counters: {
                totalUsers,
                approvedMembers,
                pendingMembers,
                totalDownloads: parseInt(downloadsSum?.sum || "0"),
                unreadMessages
            },
            recentApplications
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch admin statistics", error: err.message });
    }
});
// 2. GET & REVIEW MEMBERSHIP APPLICATIONS
router.get("/applications", async (req, res) => {
    try {
        const memberRepo = db_1.AppDataSource.getRepository(Member_1.Member);
        const list = await memberRepo.find({
            relations: ["profile", "membershipType", "user"],
            order: { createdAt: "DESC" }
        });
        return res.json(list);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch applications" });
    }
});
router.post("/applications/:id/review", async (req, res) => {
    const queryRunner = db_1.AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        const { action, reviewerNotes } = req.body; // 'approve' or 'reject'
        const memberRepo = queryRunner.manager.getRepository(Member_1.Member);
        const userRepo = queryRunner.manager.getRepository(User_1.User);
        const appRepo = queryRunner.manager.getRepository(MembershipApplication_1.MembershipApplication);
        const notifRepo = queryRunner.manager.getRepository(Notification_1.Notification);
        const member = await memberRepo.findOne({
            where: { id: req.params.id },
            relations: ["profile", "membershipType", "user"]
        });
        if (!member) {
            return res.status(404).json({ message: "Member record not found" });
        }
        const application = await appRepo.findOneBy({ user: { id: member.user.id }, status: "pending" });
        if (action === "approve") {
            member.status = "approved";
            member.joinedDate = new Date();
            // Calculate expiry date based on membership type duration
            const durationMonths = member.membershipType?.durationMonths || 12;
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + durationMonths);
            member.expiryDate = expiry;
            // Generate sequential membership number (e.g. IASDS-2026-0012)
            const approvedCount = await memberRepo.countBy({ status: "approved" });
            const seqStr = String(approvedCount + 1).padStart(4, "0");
            const currentYear = new Date().getFullYear();
            member.membershipNumber = `IASDS-${currentYear}-${seqStr}`;
            // Save Member
            await queryRunner.manager.save(member);
            // Update Application status
            if (application) {
                application.status = "approved";
                application.reviewedBy = req.user?.id || null;
                application.reviewedAt = new Date();
                application.reviewerNotes = reviewerNotes || "Approved by admin";
                await queryRunner.manager.save(application);
            }
            // Create Notification
            const notif = new Notification_1.Notification();
            notif.user = member.user;
            notif.title = "Membership Approved!";
            notif.message = `Congratulations, your membership request has been approved. Your ID is ${member.membershipNumber}. You can now download your digital membership card.`;
            await queryRunner.manager.save(notif);
            await queryRunner.commitTransaction();
            // Send approved email notification
            await emailService_1.emailService.sendRegistrationApproved(member.user.email, member.profile.fullName, member.membershipNumber);
            return res.json({ message: "Member application approved successfully", membershipNumber: member.membershipNumber });
        }
        else if (action === "reject") {
            member.status = "rejected";
            await queryRunner.manager.save(member);
            if (application) {
                application.status = "rejected";
                application.reviewedBy = req.user?.id || null;
                application.reviewedAt = new Date();
                application.reviewerNotes = reviewerNotes || "Application does not meet guidelines.";
                await queryRunner.manager.save(application);
            }
            const notif = new Notification_1.Notification();
            notif.user = member.user;
            notif.title = "Membership Application Status Update";
            notif.message = `We regret to inform you that your application was rejected. Reason: ${reviewerNotes || "N/A"}`;
            await queryRunner.manager.save(notif);
            await queryRunner.commitTransaction();
            // Send rejection email notification
            await emailService_1.emailService.sendRegistrationRejected(member.user.email, member.profile.fullName, reviewerNotes || "Does not meet requirements.");
            return res.json({ message: "Member application rejected successfully" });
        }
        return res.status(400).json({ message: "Invalid action. Choose 'approve' or 'reject'" });
    }
    catch (err) {
        await queryRunner.rollbackTransaction();
        console.error("Error reviewing application:", err);
        return res.status(500).json({ message: "Review process failed", error: err.message });
    }
    finally {
        await queryRunner.release();
    }
});
// 3. EXECUTIVE COUNCIL CRUD & REORDER
router.post("/council", upload.single("photo"), async (req, res) => {
    try {
        const { name, designation, institution, email, phone, year } = req.body;
        let photoUrl = null;
        if (req.file) {
            photoUrl = await uploadService_1.uploadService.uploadFile(req.file.path, "executive_council");
        }
        const councilRepo = db_1.AppDataSource.getRepository(ExecutiveCouncilMember_1.ExecutiveCouncilMember);
        // Auto increment order
        const maxOrder = await councilRepo.maximum("displayOrder") || 0;
        const council = new ExecutiveCouncilMember_1.ExecutiveCouncilMember();
        council.name = name;
        council.designation = designation;
        council.institution = institution;
        council.email = email || null;
        council.phoneNumber = phone || null;
        council.photoUrl = photoUrl;
        council.displayOrder = maxOrder + 1;
        council.year = year || "2026";
        await councilRepo.save(council);
        return res.status(201).json({ message: "Council member added successfully", council });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to add council member", error: err.message });
    }
});
router.put("/council/:id", upload.single("photo"), async (req, res) => {
    try {
        const councilRepo = db_1.AppDataSource.getRepository(ExecutiveCouncilMember_1.ExecutiveCouncilMember);
        const council = await councilRepo.findOneBy({ id: parseInt(req.params.id) });
        if (!council)
            return res.status(404).json({ message: "Member not found" });
        const { name, designation, institution, email, phone, year, displayOrder } = req.body;
        if (name)
            council.name = name;
        if (designation)
            council.designation = designation;
        if (institution)
            council.institution = institution;
        if (email !== undefined)
            council.email = email;
        if (phone !== undefined)
            council.phoneNumber = phone;
        if (year)
            council.year = year;
        if (displayOrder !== undefined)
            council.displayOrder = parseInt(displayOrder);
        if (req.file) {
            council.photoUrl = await uploadService_1.uploadService.uploadFile(req.file.path, "executive_council");
        }
        await councilRepo.save(council);
        return res.json({ message: "Council member updated successfully", council });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to update member" });
    }
});
router.delete("/council/:id", async (req, res) => {
    try {
        const councilRepo = db_1.AppDataSource.getRepository(ExecutiveCouncilMember_1.ExecutiveCouncilMember);
        await councilRepo.delete({ id: parseInt(req.params.id) });
        return res.json({ message: "Council member deleted successfully" });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to delete member" });
    }
});
router.post("/council/reorder", async (req, res) => {
    try {
        const { orderList } = req.body; // array of { id: number, displayOrder: number }
        if (!Array.isArray(orderList)) {
            return res.status(400).json({ message: "Invalid order list format" });
        }
        const councilRepo = db_1.AppDataSource.getRepository(ExecutiveCouncilMember_1.ExecutiveCouncilMember);
        for (const item of orderList) {
            await councilRepo.update(item.id, { displayOrder: item.displayOrder });
        }
        return res.json({ message: "Council reordered successfully" });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to reorder council members" });
    }
});
// 4. PUBLICATIONS CRUD
router.post("/publications", upload.single("file"), async (req, res) => {
    try {
        const { title, description, categoryId } = req.body;
        if (!req.file || !title || !categoryId) {
            return res.status(400).json({ message: "Title, category, and file document are required" });
        }
        const fileUrl = await uploadService_1.uploadService.uploadFile(req.file.path, "publications");
        const pubRepo = db_1.AppDataSource.getRepository(Publication_1.Publication);
        const catRepo = db_1.AppDataSource.getRepository(PublicationCategory_1.PublicationCategory);
        const category = await catRepo.findOneBy({ id: parseInt(categoryId) });
        if (!category)
            return res.status(400).json({ message: "Invalid category ID" });
        const pub = new Publication_1.Publication();
        pub.title = title;
        pub.description = description || null;
        pub.fileUrl = fileUrl;
        pub.category = category;
        pub.uploadedBy = req.user?.email || "Admin";
        await pubRepo.save(pub);
        return res.status(201).json({ message: "Publication uploaded successfully", pub });
    }
    catch (err) {
        console.error("Publication upload error:", err);
        return res.status(500).json({ message: "Upload failed", error: err.message });
    }
});
router.delete("/publications/:id", async (req, res) => {
    try {
        const pubRepo = db_1.AppDataSource.getRepository(Publication_1.Publication);
        await pubRepo.delete({ id: req.params.id });
        return res.json({ message: "Publication deleted successfully" });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to delete publication" });
    }
});
// 5. NEWS CRUD
router.post("/news", upload.single("image"), async (req, res) => {
    try {
        const { title, description, content } = req.body;
        let imageUrl = null;
        if (req.file) {
            imageUrl = await uploadService_1.uploadService.uploadFile(req.file.path, "news");
        }
        const newsRepo = db_1.AppDataSource.getRepository(News_1.News);
        const news = new News_1.News();
        news.title = title;
        news.description = description || null;
        news.content = content;
        news.imageUrl = imageUrl;
        await newsRepo.save(news);
        return res.status(201).json({ message: "News bulletin created successfully", news });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to create news bulletin", error: err.message });
    }
});
router.put("/news/:id", upload.single("image"), async (req, res) => {
    try {
        const newsRepo = db_1.AppDataSource.getRepository(News_1.News);
        const news = await newsRepo.findOneBy({ id: req.params.id });
        if (!news)
            return res.status(404).json({ message: "News post not found" });
        const { title, description, content } = req.body;
        if (title)
            news.title = title;
        if (description !== undefined)
            news.description = description;
        if (content)
            news.content = content;
        if (req.file) {
            news.imageUrl = await uploadService_1.uploadService.uploadFile(req.file.path, "news");
        }
        await newsRepo.save(news);
        return res.json({ message: "News post updated successfully", news });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to update news post" });
    }
});
router.delete("/news/:id", async (req, res) => {
    try {
        const newsRepo = db_1.AppDataSource.getRepository(News_1.News);
        await newsRepo.delete({ id: req.params.id });
        return res.json({ message: "News post deleted successfully" });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to delete news post" });
    }
});
// 6. EVENTS CRUD
router.post("/events", upload.single("banner"), async (req, res) => {
    try {
        const { title, description, content, startDate, endDate, registrationDeadline, eventType, venueDetails, registrationLink, scheduleDetails } = req.body;
        let bannerUrl = null;
        if (req.file) {
            bannerUrl = await uploadService_1.uploadService.uploadFile(req.file.path, "events");
        }
        const eventRepo = db_1.AppDataSource.getRepository(Event_1.Event);
        const event = new Event_1.Event();
        event.title = title;
        event.description = description || null;
        event.content = content;
        event.startDate = new Date(startDate);
        event.endDate = new Date(endDate);
        event.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
        event.eventType = eventType || "Conference";
        event.venueDetails = venueDetails || null;
        event.registrationLink = registrationLink || null;
        event.bannerUrl = bannerUrl;
        if (scheduleDetails) {
            event.scheduleDetails = typeof scheduleDetails === "string" ? JSON.parse(scheduleDetails) : scheduleDetails;
        }
        await eventRepo.save(event);
        return res.status(201).json({ message: "Event created successfully", event });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to create event", error: err.message });
    }
});
router.delete("/events/:id", async (req, res) => {
    try {
        const eventRepo = db_1.AppDataSource.getRepository(Event_1.Event);
        await eventRepo.delete({ id: req.params.id });
        return res.json({ message: "Event deleted successfully" });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to delete event" });
    }
});
// 7. GALLERY MANAGEMENT
router.post("/gallery/albums", upload.single("cover"), async (req, res) => {
    try {
        const { name, description } = req.body;
        let coverImageUrl = null;
        if (req.file) {
            coverImageUrl = await uploadService_1.uploadService.uploadFile(req.file.path, "gallery");
        }
        const albumRepo = db_1.AppDataSource.getRepository(GalleryAlbum_1.GalleryAlbum);
        const album = new GalleryAlbum_1.GalleryAlbum();
        album.name = name;
        album.description = description || null;
        album.coverImageUrl = coverImageUrl;
        await albumRepo.save(album);
        return res.status(201).json({ message: "Album created successfully", album });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to create gallery album" });
    }
});
router.post("/gallery/albums/:id/photos", upload.single("photo"), async (req, res) => {
    try {
        const albumRepo = db_1.AppDataSource.getRepository(GalleryAlbum_1.GalleryAlbum);
        const photoRepo = db_1.AppDataSource.getRepository(GalleryImage_1.GalleryImage);
        const album = await albumRepo.findOneBy({ id: req.params.id });
        if (!album)
            return res.status(404).json({ message: "Album not found" });
        if (!req.file)
            return res.status(400).json({ message: "No photo file provided" });
        const imageUrl = await uploadService_1.uploadService.uploadFile(req.file.path, "gallery");
        const img = new GalleryImage_1.GalleryImage();
        img.album = album;
        img.imageUrl = imageUrl;
        img.caption = req.body.caption || null;
        await photoRepo.save(img);
        return res.status(201).json({ message: "Photo added to album successfully", photo: img });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to add photo", error: err.message });
    }
});
// 8. CONTACT MESSAGES MANAGER
router.get("/contacts", async (req, res) => {
    try {
        const msgRepo = db_1.AppDataSource.getRepository(ContactMessage_1.ContactMessage);
        const msgs = await msgRepo.find({ order: { createdAt: "DESC" } });
        return res.json(msgs);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch contact inquiries" });
    }
});
router.post("/contacts/:id/reply", async (req, res) => {
    try {
        const { replyContent } = req.body;
        if (!replyContent)
            return res.status(400).json({ message: "Reply content is required" });
        const msgRepo = db_1.AppDataSource.getRepository(ContactMessage_1.ContactMessage);
        const msg = await msgRepo.findOneBy({ id: req.params.id });
        if (!msg)
            return res.status(404).json({ message: "Inquiry not found" });
        // Send reply via mock/smtp service
        const subject = `Re: ${msg.subject}`;
        await emailService_1.emailService.sendPasswordReset(msg.email, `Custom reply context: ${replyContent}`); // Using nodemailer logic
        msg.status = "replied";
        msg.adminReply = replyContent;
        msg.repliedAt = new Date();
        await msgRepo.save(msg);
        return res.json({ message: "Reply sent and recorded successfully", msg });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to send reply to contact", error: err.message });
    }
});
// 9. WEBSITE SETTINGS UPDATE
router.put("/settings", async (req, res) => {
    try {
        const settingRepo = db_1.AppDataSource.getRepository(WebsiteSetting_1.WebsiteSetting);
        const payload = req.body; // e.g. { about_origin: 'new text', contact_phone: '+91...' }
        for (const key of Object.keys(payload)) {
            let setting = await settingRepo.findOneBy({ key });
            if (setting) {
                setting.value = payload[key];
                await settingRepo.save(setting);
            }
            else {
                setting = new WebsiteSetting_1.WebsiteSetting();
                setting.key = key;
                setting.value = payload[key];
                await settingRepo.save(setting);
            }
        }
        return res.json({ message: "Website configurations saved successfully" });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to update configurations", error: err.message });
    }
});
exports.default = router;
