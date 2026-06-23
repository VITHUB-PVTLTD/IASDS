"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../config/db");
const WebsiteSetting_1 = require("../entities/WebsiteSetting");
const SocialLink_1 = require("../entities/SocialLink");
const ExecutiveCouncilMember_1 = require("../entities/ExecutiveCouncilMember");
const MembershipType_1 = require("../entities/MembershipType");
const Publication_1 = require("../entities/Publication");
const GalleryAlbum_1 = require("../entities/GalleryAlbum");
const News_1 = require("../entities/News");
const Event_1 = require("../entities/Event");
const Achievement_1 = require("../entities/Achievement");
const HonorsAwards_1 = require("../entities/HonorsAwards");
const ContactMessage_1 = require("../entities/ContactMessage");
const Member_1 = require("../entities/Member");
const CarouselSlide_1 = require("../entities/CarouselSlide");
const typeorm_1 = require("typeorm");
const emailService_1 = require("../services/emailService");
const router = (0, express_1.Router)();
// 1. GET WEBSITE CONFIGS & SOCIAL LINKS
router.get("/settings", async (req, res) => {
    try {
        const settingRepo = db_1.AppDataSource.getRepository(WebsiteSetting_1.WebsiteSetting);
        const socialRepo = db_1.AppDataSource.getRepository(SocialLink_1.SocialLink);
        const settings = await settingRepo.find();
        const socialLinks = await socialRepo.find();
        const configMap = {};
        settings.forEach((s) => {
            configMap[s.key] = s.value;
        });
        return res.json({ settings: configMap, socialLinks });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch settings", error: err.message });
    }
});
// 2. GET EXECUTIVE COUNCIL (grouped by member type)
router.get("/council", async (req, res) => {
    try {
        const councilRepo = db_1.AppDataSource.getRepository(ExecutiveCouncilMember_1.ExecutiveCouncilMember);
        const members = await councilRepo.find({
            order: { memberType: "ASC", displayOrder: "ASC" }
        });
        const TYPES = [
            "Executive Council",
            "Executive Council Members",
            "Advisory Council Members",
        ];
        const grouped = TYPES.map((type) => ({
            type,
            members: members.filter((m) => m.memberType === type),
        }));
        return res.json(grouped);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch council members" });
    }
});
// 3. GET MEMBERSHIP TYPES
router.get("/membership-types", async (req, res) => {
    try {
        const typeRepo = db_1.AppDataSource.getRepository(MembershipType_1.MembershipType);
        const types = await typeRepo.find();
        return res.json(types);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch membership plans" });
    }
});
// 4. GET PUBLICATIONS (with filters & search)
router.get("/publications", async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        const pubRepo = db_1.AppDataSource.getRepository(Publication_1.Publication);
        const where = {};
        if (category) {
            where.category = { name: category };
        }
        if (search) {
            where.title = (0, typeorm_1.Like)(`%${search}%`);
        }
        const [publications, total] = await pubRepo.findAndCount({
            where,
            relations: ["category"],
            order: { createdAt: "DESC" },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });
        return res.json({
            publications,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch publications", error: err.message });
    }
});
// Increment download count for tracking
router.post("/publications/:id/download", async (req, res) => {
    try {
        const pubRepo = db_1.AppDataSource.getRepository(Publication_1.Publication);
        const pub = await pubRepo.findOneBy({ id: req.params.id });
        if (!pub) {
            return res.status(404).json({ message: "Publication not found" });
        }
        pub.downloadCount += 1;
        await pubRepo.save(pub);
        return res.json({ downloadCount: pub.downloadCount });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to increment download counter" });
    }
});
// 5. GET GALLERY ALBUMS & MEDIA
router.get("/gallery", async (req, res) => {
    try {
        const albumRepo = db_1.AppDataSource.getRepository(GalleryAlbum_1.GalleryAlbum);
        const albums = await albumRepo.find({
            relations: ["images", "videos"],
            order: { createdAt: "DESC" }
        });
        return res.json(albums);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch gallery media" });
    }
});
// 6. GET NEWS BULLETIN
router.get("/news", async (req, res) => {
    try {
        const newsRepo = db_1.AppDataSource.getRepository(News_1.News);
        const news = await newsRepo.find({ order: { createdAt: "DESC" } });
        return res.json(news);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch news posts" });
    }
});
// 7. GET EVENTS (Upcoming / Past separation)
router.get("/events", async (req, res) => {
    try {
        const eventRepo = db_1.AppDataSource.getRepository(Event_1.Event);
        const now = new Date();
        const upcoming = await eventRepo.find({
            where: { startDate: (0, typeorm_1.MoreThanOrEqual)(now) },
            order: { startDate: "ASC" }
        });
        const past = await eventRepo.find({
            where: { startDate: (0, typeorm_1.LessThan)(now) },
            order: { startDate: "DESC" }
        });
        return res.json({ upcoming, past });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch event schedule" });
    }
});
// 8. GET ACHIEVEMENTS
router.get("/achievements", async (req, res) => {
    try {
        const achRepo = db_1.AppDataSource.getRepository(Achievement_1.Achievement);
        const ach = await achRepo.find({ order: { createdAt: "DESC" } });
        return res.json(ach);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch achievements" });
    }
});
// 9. GET HONORS & AWARDS
router.get("/awards", async (req, res) => {
    try {
        const awardRepo = db_1.AppDataSource.getRepository(HonorsAwards_1.HonorsAwards);
        const awards = await awardRepo.find({ order: { year: "DESC", createdAt: "DESC" } });
        return res.json(awards);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch awards lists" });
    }
});
// 10. SUBMIT CONTACT MESSAGE
router.post("/contact", async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }
        const msgRepo = db_1.AppDataSource.getRepository(ContactMessage_1.ContactMessage);
        const msg = new ContactMessage_1.ContactMessage();
        msg.name = name;
        msg.email = email;
        msg.phone = phone || null;
        msg.subject = subject;
        msg.message = message;
        await msgRepo.save(msg);
        // Send acknowledgement email
        await emailService_1.emailService.sendContactFormSubmission(email, name, subject);
        return res.status(201).json({ message: "Thank you for contacting us. Your message has been received." });
    }
    catch (err) {
        console.error("Contact form error:", err);
        return res.status(500).json({ message: "Failed to submit inquiry message" });
    }
});
// 11. PUBLIC MEMBERS SEARCH DIRECTORY
router.get("/members-directory", async (req, res) => {
    try {
        const { search, state, institution, page = 1, limit = 12 } = req.query;
        const memberRepo = db_1.AppDataSource.getRepository(Member_1.Member);
        // Build relational where statement
        // We only display 'approved' members publicly
        const queryBuilder = memberRepo.createQueryBuilder("member")
            .leftJoinAndSelect("member.profile", "profile")
            .leftJoinAndSelect("member.membershipType", "type")
            .where("member.status = :status", { status: "approved" });
        if (search) {
            queryBuilder.andWhere("(profile.fullName ILIKE :search OR member.membershipNumber ILIKE :search)", { search: `%${search}%` });
        }
        if (state) {
            queryBuilder.andWhere("profile.state ILIKE :state", { state: `%${state}%` });
        }
        if (institution) {
            queryBuilder.andWhere("profile.institution ILIKE :inst", { inst: `%${institution}%` });
        }
        queryBuilder
            .orderBy("profile.fullName", "ASC")
            .skip((parseInt(page) - 1) * parseInt(limit))
            .take(parseInt(limit));
        const [members, total] = await queryBuilder.getManyAndCount();
        return res.json({
            members: members.map((m) => ({
                id: m.id,
                membershipNumber: m.membershipNumber,
                fullName: m.profile?.fullName,
                institution: m.profile?.institution,
                state: m.profile?.state,
                joinedDate: m.joinedDate,
                membershipType: m.membershipType?.name
            })),
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    }
    catch (err) {
        console.error("Directory fetch error:", err);
        return res.status(500).json({ message: "Failed to search member directory" });
    }
});
// 12. QR CODE VERIFICATION API
router.get("/verify-member/:id", async (req, res) => {
    try {
        const memberRepo = db_1.AppDataSource.getRepository(Member_1.Member);
        const member = await memberRepo.findOne({
            where: { id: req.params.id },
            relations: ["profile", "membershipType"]
        });
        if (!member) {
            return res.status(404).json({ verified: false, message: "Membership ID not found in IASDS registry." });
        }
        return res.json({
            verified: member.status === "approved",
            member: {
                fullName: member.profile?.fullName,
                membershipNumber: member.membershipNumber,
                membershipType: member.membershipType?.name,
                joinedDate: member.joinedDate,
                expiryDate: member.expiryDate,
                status: member.status,
                institution: member.profile?.institution
            }
        });
    }
    catch (err) {
        return res.status(500).json({ verified: false, message: "Verification lookup failure." });
    }
});
// 13. GET ACTIVE CAROUSEL SLIDES
router.get("/carousel", async (req, res) => {
    try {
        const slideRepo = db_1.AppDataSource.getRepository(CarouselSlide_1.CarouselSlide);
        const slides = await slideRepo.find({
            where: { isActive: true },
            order: { displayOrder: "ASC" }
        });
        return res.json(slides);
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch carousel slides", error: err.message });
    }
});
exports.default = router;
