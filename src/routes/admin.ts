import { Router, Response } from "express";
import { authenticateJWT, requireRole } from "../middleware/authMiddleware";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { AppDataSource } from "../config/db";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { Member } from "../entities/Member";
import { MembershipApplication } from "../entities/MembershipApplication";
import { ExecutiveCouncilMember } from "../entities/ExecutiveCouncilMember";
import { Publication } from "../entities/Publication";
import { PublicationCategory } from "../entities/PublicationCategory";
import { News } from "../entities/News";
import { Event } from "../entities/Event";
import { GalleryAlbum } from "../entities/GalleryAlbum";
import { GalleryImage } from "../entities/GalleryImage";
import { GalleryVideo } from "../entities/GalleryVideo";
import { Achievement } from "../entities/Achievement";
import { HonorsAwards } from "../entities/HonorsAwards";
import { ContactMessage } from "../entities/ContactMessage";
import { WebsiteSetting } from "../entities/WebsiteSetting";
import { Notification } from "../entities/Notification";
import { CarouselSlide } from "../entities/CarouselSlide";
import { emailService } from "../services/emailService";
import { uploadService } from "../services/uploadService";
import multer from "multer";
import os from "os";
import bcrypt from "bcryptjs";

const router = Router();
const upload = multer({ dest: os.tmpdir() });

// Restrict all routes in this file to administrators/editors
router.use(authenticateJWT as any);
router.use(requireRole(["Super Admin", "Admin", "Editor"]) as any);

// ============================================================
// 1. DASHBOARD STATS
// ============================================================
router.get("/stats", async (req, res) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const memberRepo = AppDataSource.getRepository(Member);
    const pubRepo = AppDataSource.getRepository(Publication);
    const contactRepo = AppDataSource.getRepository(ContactMessage);
    const appRepo = AppDataSource.getRepository(MembershipApplication);
    const newsRepo = AppDataSource.getRepository(News);
    const eventRepo = AppDataSource.getRepository(Event);
    const achRepo = AppDataSource.getRepository(Achievement);

    const totalUsers = await userRepo.count();
    const approvedMembers = await memberRepo.countBy({ status: "approved" });
    const pendingMembers = await memberRepo.countBy({ status: "pending_review" });
    const rejectedMembers = await memberRepo.countBy({ status: "rejected" });

    const downloadsSum = await pubRepo.createQueryBuilder("pub")
      .select("SUM(pub.downloadCount)", "sum")
      .getRawOne();

    const totalPublications = await pubRepo.count();
    const unreadMessages = await contactRepo.countBy({ status: "unread" });
    const totalMessages = await contactRepo.count();
    const totalNews = await newsRepo.count();
    const totalEvents = await eventRepo.count();
    const totalAchievements = await achRepo.count();

    const recentApplications = await appRepo.find({
      order: { submittedAt: "DESC" },
      take: 5
    });

    const recentMembers = await memberRepo.find({
      relations: ["profile", "user"],
      order: { createdAt: "DESC" },
      take: 5
    });

    return res.json({
      counters: {
        totalUsers,
        approvedMembers,
        pendingMembers,
        rejectedMembers,
        totalDownloads: parseInt(downloadsSum?.sum || "0"),
        totalPublications,
        unreadMessages,
        totalMessages,
        totalNews,
        totalEvents,
        totalAchievements
      },
      recentApplications,
      recentMembers
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch admin statistics", error: err.message });
  }
});

// ============================================================
// 2. MEMBERSHIP APPLICATIONS
// ============================================================
router.get("/applications", async (req, res) => {
  try {
    const memberRepo = AppDataSource.getRepository(Member);
    const list = await memberRepo.find({
      relations: ["profile", "membershipType", "user"],
      order: { createdAt: "DESC" }
    });
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch applications" });
  }
});

router.post("/applications/:id/review", async (req: AuthenticatedRequest, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { action, reviewerNotes } = req.body;
    const memberRepo = queryRunner.manager.getRepository(Member);
    const userRepo = queryRunner.manager.getRepository(User);
    const appRepo = queryRunner.manager.getRepository(MembershipApplication);
    const notifRepo = queryRunner.manager.getRepository(Notification);

    const member = await memberRepo.findOne({
      where: { id: req.params.id },
      relations: ["profile", "membershipType", "user"]
    });

    if (!member) return res.status(404).json({ message: "Member record not found" });

    const application = await appRepo.findOneBy({ user: { id: member.user.id }, status: "pending" });

    if (action === "approve") {
      member.status = "approved";
      member.joinedDate = new Date();

      const durationMonths = member.membershipType?.durationMonths || 12;
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + durationMonths);
      member.expiryDate = expiry;

      const approvedCount = await memberRepo.countBy({ status: "approved" });
      const seqStr = String(approvedCount + 1).padStart(4, "0");
      const currentYear = new Date().getFullYear();
      member.membershipNumber = `IASDS-${currentYear}-${seqStr}`;

      await queryRunner.manager.save(member);

      if (application) {
        application.status = "approved";
        application.reviewedBy = req.user?.id || null;
        application.reviewedAt = new Date();
        application.reviewerNotes = reviewerNotes || "Approved by admin";
        await queryRunner.manager.save(application);
      }

      const notif = new Notification();
      notif.user = member.user;
      notif.title = "Membership Approved!";
      notif.message = `Congratulations, your membership request has been approved. Your ID is ${member.membershipNumber}.`;
      await queryRunner.manager.save(notif);

      await queryRunner.commitTransaction();
      await emailService.sendRegistrationApproved(member.user.email, member.profile.fullName, member.membershipNumber);
      return res.json({ message: "Member application approved successfully", membershipNumber: member.membershipNumber });

    } else if (action === "reject") {
      member.status = "rejected";
      await queryRunner.manager.save(member);

      if (application) {
        application.status = "rejected";
        application.reviewedBy = req.user?.id || null;
        application.reviewedAt = new Date();
        application.reviewerNotes = reviewerNotes || "Application does not meet guidelines.";
        await queryRunner.manager.save(application);
      }

      const notif = new Notification();
      notif.user = member.user;
      notif.title = "Membership Application Status Update";
      notif.message = `We regret to inform you that your application was rejected. Reason: ${reviewerNotes || "N/A"}`;
      await queryRunner.manager.save(notif);

      await queryRunner.commitTransaction();
      await emailService.sendRegistrationRejected(member.user.email, member.profile.fullName, reviewerNotes || "Does not meet requirements.");
      return res.json({ message: "Member application rejected successfully" });
    }

    return res.status(400).json({ message: "Invalid action. Choose 'approve' or 'reject'" });

  } catch (err: any) {
    await queryRunner.rollbackTransaction();
    return res.status(500).json({ message: "Review process failed", error: err.message });
  } finally {
    await queryRunner.release();
  }
});

// ============================================================
// 3. MEMBER MANAGEMENT
// ============================================================
router.get("/members", async (req, res) => {
  try {
    const memberRepo = AppDataSource.getRepository(Member);
    const list = await memberRepo.find({
      relations: ["profile", "membershipType", "user"],
      order: { createdAt: "DESC" }
    });
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch members", error: err.message });
  }
});

router.get("/members/:id", async (req, res) => {
  try {
    const memberRepo = AppDataSource.getRepository(Member);
    const member = await memberRepo.findOne({
      where: { id: req.params.id },
      relations: ["profile", "membershipType", "user"]
    });
    if (!member) return res.status(404).json({ message: "Member not found" });
    return res.json(member);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch member", error: err.message });
  }
});

router.put("/members/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // 'approved', 'suspended', 'pending_review', 'rejected'
    const memberRepo = AppDataSource.getRepository(Member);
    const member = await memberRepo.findOneBy({ id: req.params.id });
    if (!member) return res.status(404).json({ message: "Member not found" });

    member.status = status;
    await memberRepo.save(member);
    return res.json({ message: "Member status updated successfully", member });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to update member status", error: err.message });
  }
});

// ============================================================
// 4. USER MANAGEMENT
// ============================================================
router.get("/users", async (req, res) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find({
      relations: ["role"],
      order: { createdAt: "DESC" }
    });
    // Strip password hashes
    const safe = users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt
    }));
    return res.json(safe);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

router.put("/users/:id/role", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roleName } = req.body;
    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);

    const user = await userRepo.findOne({ where: { id: req.params.id }, relations: ["role"] });
    if (!user) return res.status(404).json({ message: "User not found" });

    const role = await roleRepo.findOneBy({ name: roleName });
    if (!role) return res.status(400).json({ message: "Invalid role specified" });

    user.role = role;
    await userRepo.save(user);
    return res.json({ message: "User role updated successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to update user role", error: err.message });
  }
});

router.put("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // 'active', 'suspended'
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: req.params.id });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = status;
    await userRepo.save(user);
    return res.json({ message: "User status updated successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to update user status", error: err.message });
  }
});

router.post("/users", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, roleName } = req.body;
    if (!email || !password || !roleName) {
      return res.status(400).json({ message: "Email, password and role are required" });
    }
    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);

    const existing = await userRepo.findOneBy({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const role = await roleRepo.findOneBy({ name: roleName });
    if (!role) return res.status(400).json({ message: "Invalid role specified" });

    const user = new User();
    user.email = email;
    user.passwordHash = await bcrypt.hash(password, 10);
    user.role = role;
    user.status = "active";
    await userRepo.save(user);

    return res.status(201).json({ message: "Admin user created successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to create user", error: err.message });
  }
});

// ============================================================
// 5. EXECUTIVE COUNCIL CRUD & REORDER
// ============================================================
router.post("/council", upload.single("photo"), async (req: any, res: Response) => {
  try {
    const { name, designation, institution, email, phone, year, memberType } = req.body;
    let photoUrl: string | null = null;
    if (req.file) photoUrl = await uploadService.uploadFile(req.file.path, "executive_council");

    const councilRepo = AppDataSource.getRepository(ExecutiveCouncilMember);
    const maxOrder = await councilRepo.maximum("displayOrder") || 0;

    const council = new ExecutiveCouncilMember();
    council.name = name;
    council.designation = designation;
    council.institution = institution;
    council.email = email || null;
    council.phoneNumber = phone || null;
    council.photoUrl = photoUrl;
    council.displayOrder = maxOrder + 1;
    council.year = year || "2026";
    council.memberType = memberType || "Executive Council Members";

    await councilRepo.save(council);
    return res.status(201).json({ message: "Council member added successfully", council });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to add council member", error: err.message });
  }
});

router.put("/council/:id", upload.single("photo"), async (req: any, res: Response) => {
  try {
    const councilRepo = AppDataSource.getRepository(ExecutiveCouncilMember);
    const council = await councilRepo.findOneBy({ id: parseInt(req.params.id) });
    if (!council) return res.status(404).json({ message: "Member not found" });

    const { name, designation, institution, email, phone, year, displayOrder, memberType } = req.body;
    if (name) council.name = name;
    if (designation) council.designation = designation;
    if (institution) council.institution = institution;
    if (email !== undefined) council.email = email;
    if (phone !== undefined) council.phoneNumber = phone;
    if (year) council.year = year;
    if (displayOrder !== undefined) council.displayOrder = parseInt(displayOrder);
    if (memberType) council.memberType = memberType;
    if (req.file) council.photoUrl = await uploadService.uploadFile(req.file.path, "executive_council");

    await councilRepo.save(council);
    return res.json({ message: "Council member updated successfully", council });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to update member" });
  }
});

router.delete("/council/:id", async (req, res) => {
  try {
    const councilRepo = AppDataSource.getRepository(ExecutiveCouncilMember);
    await councilRepo.delete({ id: parseInt(req.params.id) });
    return res.json({ message: "Council member deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete member" });
  }
});

router.post("/council/reorder", async (req, res) => {
  try {
    const { orderList } = req.body;
    if (!Array.isArray(orderList)) return res.status(400).json({ message: "Invalid order list format" });

    const councilRepo = AppDataSource.getRepository(ExecutiveCouncilMember);
    for (const item of orderList) {
      await councilRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return res.json({ message: "Council reordered successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to reorder council members" });
  }
});

// ============================================================
// 6. PUBLICATIONS CRUD
// ============================================================
router.get("/publications", async (req, res) => {
  try {
    const pubRepo = AppDataSource.getRepository(Publication);
    const pubs = await pubRepo.find({
      relations: ["category"],
      order: { createdAt: "DESC" }
    });
    return res.json(pubs);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch publications", error: err.message });
  }
});

router.post("/publications", upload.single("file"), async (req: any, res: Response) => {
  try {
    const { title, description, categoryId } = req.body;
    if (!req.file || !title || !categoryId) {
      return res.status(400).json({ message: "Title, category, and file document are required" });
    }

    const fileUrl = await uploadService.uploadFile(req.file.path, "publications");
    const pubRepo = AppDataSource.getRepository(Publication);
    const catRepo = AppDataSource.getRepository(PublicationCategory);

    const category = await catRepo.findOneBy({ id: parseInt(categoryId) });
    if (!category) return res.status(400).json({ message: "Invalid category ID" });

    const pub = new Publication();
    pub.title = title;
    pub.description = description || null;
    pub.fileUrl = fileUrl;
    pub.category = category;
    pub.uploadedBy = req.user?.email || "Admin";

    await pubRepo.save(pub);
    return res.status(201).json({ message: "Publication uploaded successfully", pub });
  } catch (err: any) {
    return res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

router.delete("/publications/:id", async (req, res) => {
  try {
    const pubRepo = AppDataSource.getRepository(Publication);
    await pubRepo.delete({ id: req.params.id });
    return res.json({ message: "Publication deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete publication" });
  }
});

// ============================================================
// 7. NEWS CRUD
// ============================================================
router.get("/news", async (req, res) => {
  try {
    const newsRepo = AppDataSource.getRepository(News);
    const news = await newsRepo.find({ order: { createdAt: "DESC" } });
    return res.json(news);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch news", error: err.message });
  }
});

router.post(
  "/news",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "attachment", maxCount: 1 }
  ]),
  async (req: any, res: Response) => {
    try {
      const { title, description, content } = req.body;
      let imageUrl: string | null = null;
      let attachmentUrl: string | null = null;

      if (req.files) {
        if (req.files.image) {
          imageUrl = await uploadService.uploadFile(req.files.image[0].path, "news");
        }
        if (req.files.attachment) {
          attachmentUrl = await uploadService.uploadFile(req.files.attachment[0].path, "news_attachments");
        }
      }

      const newsRepo = AppDataSource.getRepository(News);
      const news = new News();
      news.title = title;
      news.description = description || null;
      news.content = content;
      news.imageUrl = imageUrl;
      news.attachmentUrl = attachmentUrl;
      await newsRepo.save(news);

      return res.status(201).json({ message: "News bulletin created successfully", news });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to create news bulletin", error: err.message });
    }
  }
);

router.put(
  "/news/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "attachment", maxCount: 1 }
  ]),
  async (req: any, res: Response) => {
    try {
      const newsRepo = AppDataSource.getRepository(News);
      const news = await newsRepo.findOneBy({ id: req.params.id });
      if (!news) return res.status(404).json({ message: "News post not found" });

      const { title, description, content } = req.body;
      if (title) news.title = title;
      if (description !== undefined) news.description = description;
      if (content) news.content = content;

      if (req.files) {
        if (req.files.image) {
          news.imageUrl = await uploadService.uploadFile(req.files.image[0].path, "news");
        }
        if (req.files.attachment) {
          news.attachmentUrl = await uploadService.uploadFile(req.files.attachment[0].path, "news_attachments");
        }
      }

      await newsRepo.save(news);
      return res.json({ message: "News post updated successfully", news });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to update news post", error: err.message });
    }
  }
);

router.delete("/news/:id", async (req, res) => {
  try {
    const newsRepo = AppDataSource.getRepository(News);
    await newsRepo.delete({ id: req.params.id });
    return res.json({ message: "News post deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete news post" });
  }
});

// ============================================================
// 8. EVENTS CRUD
// ============================================================
router.get("/events", async (req, res) => {
  try {
    const eventRepo = AppDataSource.getRepository(Event);
    const events = await eventRepo.find({ order: { createdAt: "DESC" } });
    return res.json(events);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch events", error: err.message });
  }
});

router.post("/events", upload.single("banner"), async (req: any, res: Response) => {
  try {
    const { title, description, content, startDate, endDate, registrationDeadline, eventType, venueDetails, registrationLink, scheduleDetails } = req.body;
    let bannerUrl: string | null = null;
    if (req.file) bannerUrl = await uploadService.uploadFile(req.file.path, "events");

    const eventRepo = AppDataSource.getRepository(Event);
    const event = new Event();
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
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to create event", error: err.message });
  }
});

router.put("/events/:id", upload.single("banner"), async (req: any, res: Response) => {
  try {
    const eventRepo = AppDataSource.getRepository(Event);
    const event = await eventRepo.findOneBy({ id: req.params.id });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const { title, description, content, startDate, endDate, registrationDeadline, eventType, venueDetails, registrationLink } = req.body;
    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (content) event.content = content;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate) event.endDate = new Date(endDate);
    if (registrationDeadline !== undefined) event.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    if (eventType) event.eventType = eventType;
    if (venueDetails !== undefined) event.venueDetails = venueDetails;
    if (registrationLink !== undefined) event.registrationLink = registrationLink;
    if (req.file) event.bannerUrl = await uploadService.uploadFile(req.file.path, "events");

    await eventRepo.save(event);
    return res.json({ message: "Event updated successfully", event });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to update event", error: err.message });
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    const eventRepo = AppDataSource.getRepository(Event);
    await eventRepo.delete({ id: req.params.id });
    return res.json({ message: "Event deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete event" });
  }
});

// ============================================================
// 9. GALLERY MANAGEMENT
// ============================================================
router.get("/gallery", async (req, res) => {
  try {
    const albumRepo = AppDataSource.getRepository(GalleryAlbum);
    const albums = await albumRepo.find({
      relations: ["images"],
      order: { createdAt: "DESC" }
    });
    return res.json(albums);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch gallery albums", error: err.message });
  }
});

router.post("/gallery/albums", upload.single("cover"), async (req: any, res: Response) => {
  try {
    const { name, description } = req.body;
    let coverImageUrl: string | null = null;
    if (req.file) coverImageUrl = await uploadService.uploadFile(req.file.path, "gallery");

    const albumRepo = AppDataSource.getRepository(GalleryAlbum);
    const album = new GalleryAlbum();
    album.name = name;
    album.description = description || null;
    album.coverImageUrl = coverImageUrl;
    await albumRepo.save(album);

    return res.status(201).json({ message: "Album created successfully", album });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to create gallery album" });
  }
});

router.delete("/gallery/albums/:id", async (req, res) => {
  try {
    const albumRepo = AppDataSource.getRepository(GalleryAlbum);
    await albumRepo.delete({ id: req.params.id });
    return res.json({ message: "Gallery album deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete gallery album" });
  }
});

router.post("/gallery/albums/:id/photos", upload.single("photo"), async (req: any, res: Response) => {
  try {
    const albumRepo = AppDataSource.getRepository(GalleryAlbum);
    const photoRepo = AppDataSource.getRepository(GalleryImage);

    const album = await albumRepo.findOneBy({ id: req.params.id });
    if (!album) return res.status(404).json({ message: "Album not found" });
    if (!req.file) return res.status(400).json({ message: "No photo file provided" });

    const imageUrl = await uploadService.uploadFile(req.file.path, "gallery");
    const img = new GalleryImage();
    img.album = album;
    img.imageUrl = imageUrl;
    img.caption = req.body.caption || null;
    await photoRepo.save(img);

    return res.status(201).json({ message: "Photo added to album successfully", photo: img });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to add photo", error: err.message });
  }
});

router.delete("/gallery/photos/:id", async (req, res) => {
  try {
    const photoRepo = AppDataSource.getRepository(GalleryImage);
    await photoRepo.delete({ id: req.params.id });
    return res.json({ message: "Photo deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete photo" });
  }
});

// ============================================================
// 10. ACHIEVEMENTS CRUD
// ============================================================
router.get("/achievements", async (req, res) => {
  try {
    const achRepo = AppDataSource.getRepository(Achievement);
    const achievements = await achRepo.find({ order: { createdAt: "DESC" } });
    return res.json(achievements);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch achievements", error: err.message });
  }
});

router.post("/achievements", upload.single("image"), async (req: any, res: Response) => {
  try {
    const { title, description, date, category } = req.body;
    if (!title || !description) return res.status(400).json({ message: "Title and description are required" });

    let imageUrl: string | null = null;
    if (req.file) imageUrl = await uploadService.uploadFile(req.file.path, "achievements");

    const achRepo = AppDataSource.getRepository(Achievement);
    const achievement = new Achievement();
    achievement.title = title;
    achievement.description = description;
    achievement.date = date || null;
    achievement.category = category || "Milestones";
    achievement.imageUrl = imageUrl;
    await achRepo.save(achievement);

    return res.status(201).json({ message: "Achievement added successfully", achievement });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to add achievement", error: err.message });
  }
});

router.put("/achievements/:id", upload.single("image"), async (req: any, res: Response) => {
  try {
    const achRepo = AppDataSource.getRepository(Achievement);
    const achievement = await achRepo.findOneBy({ id: req.params.id });
    if (!achievement) return res.status(404).json({ message: "Achievement not found" });

    const { title, description, date, category } = req.body;
    if (title) achievement.title = title;
    if (description) achievement.description = description;
    if (date !== undefined) achievement.date = date;
    if (category) achievement.category = category;
    if (req.file) achievement.imageUrl = await uploadService.uploadFile(req.file.path, "achievements");

    await achRepo.save(achievement);
    return res.json({ message: "Achievement updated successfully", achievement });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to update achievement", error: err.message });
  }
});

router.delete("/achievements/:id", async (req, res) => {
  try {
    const achRepo = AppDataSource.getRepository(Achievement);
    await achRepo.delete({ id: req.params.id });
    return res.json({ message: "Achievement deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete achievement" });
  }
});

// ============================================================
// 11. CONTACT MESSAGES MANAGER
// ============================================================
router.get("/contacts", async (req, res) => {
  try {
    const msgRepo = AppDataSource.getRepository(ContactMessage);
    const msgs = await msgRepo.find({ order: { createdAt: "DESC" } });
    return res.json(msgs);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch contact inquiries" });
  }
});

router.put("/contacts/:id/read", async (req, res) => {
  try {
    const msgRepo = AppDataSource.getRepository(ContactMessage);
    const msg = await msgRepo.findOneBy({ id: req.params.id });
    if (!msg) return res.status(404).json({ message: "Message not found" });

    msg.status = "read";
    await msgRepo.save(msg);
    return res.json({ message: "Message marked as read" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to mark message as read" });
  }
});

router.post("/contacts/:id/reply", async (req, res) => {
  try {
    const { replyContent } = req.body;
    if (!replyContent) return res.status(400).json({ message: "Reply content is required" });

    const msgRepo = AppDataSource.getRepository(ContactMessage);
    const msg = await msgRepo.findOneBy({ id: req.params.id });
    if (!msg) return res.status(404).json({ message: "Inquiry not found" });

    await emailService.sendPasswordReset(msg.email, `Custom reply context: ${replyContent}`);

    msg.status = "replied";
    msg.adminReply = replyContent;
    msg.repliedAt = new Date();
    await msgRepo.save(msg);

    return res.json({ message: "Reply sent and recorded successfully", msg });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to send reply to contact", error: err.message });
  }
});

router.delete("/contacts/:id", async (req, res) => {
  try {
    const msgRepo = AppDataSource.getRepository(ContactMessage);
    await msgRepo.delete({ id: req.params.id });
    return res.json({ message: "Contact message deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete contact message" });
  }
});

// ============================================================
// 12. WEBSITE SETTINGS
// ============================================================
router.put("/settings", async (req, res) => {
  try {
    const settingRepo = AppDataSource.getRepository(WebsiteSetting);
    const payload = req.body;

    for (const key of Object.keys(payload)) {
      let setting = await settingRepo.findOneBy({ key });
      if (setting) {
        setting.value = payload[key];
        await settingRepo.save(setting);
      } else {
        setting = new WebsiteSetting();
        setting.key = key;
        setting.value = payload[key];
        await settingRepo.save(setting);
      }
    }

    return res.json({ message: "Website configurations saved successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to update configurations", error: err.message });
  }
});

// ============================================================
// 13. CAROUSEL SLIDE MANAGEMENT
// ============================================================
router.get("/carousel", async (req, res) => {
  try {
    const slideRepo = AppDataSource.getRepository(CarouselSlide);
    const slides = await slideRepo.find({ order: { displayOrder: "ASC" } });
    return res.json(slides);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch carousel slides", error: err.message });
  }
});

router.post("/carousel", upload.single("image"), async (req: any, res: Response) => {
  try {
    const { title, subtitle, buttonLabel, buttonLink, displayOrder, isActive } = req.body;
    if (!req.file) return res.status(400).json({ message: "Slide image is required" });

    const imageUrl = await uploadService.uploadFile(req.file.path, "carousel");
    const slideRepo = AppDataSource.getRepository(CarouselSlide);

    const maxOrder = await slideRepo.maximum("displayOrder") || 0;
    const slide = new CarouselSlide();
    slide.imageUrl = imageUrl;
    slide.title = title || null;
    slide.subtitle = subtitle || null;
    slide.buttonLabel = buttonLabel || null;
    slide.buttonLink = buttonLink || null;
    slide.displayOrder = displayOrder !== undefined ? parseInt(displayOrder) : maxOrder + 1;
    slide.isActive = isActive !== undefined ? isActive === "true" || isActive === true : true;

    await slideRepo.save(slide);
    return res.status(201).json({ message: "Carousel slide created successfully", slide });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to create carousel slide", error: err.message });
  }
});

router.put("/carousel/:id", upload.single("image"), async (req: any, res: Response) => {
  try {
    const slideRepo = AppDataSource.getRepository(CarouselSlide);
    const slide = await slideRepo.findOneBy({ id: parseInt(req.params.id) });
    if (!slide) return res.status(404).json({ message: "Carousel slide not found" });

    const { title, subtitle, buttonLabel, buttonLink, displayOrder, isActive } = req.body;
    slide.title = title || null;
    if (subtitle !== undefined) slide.subtitle = subtitle || null;
    if (buttonLabel !== undefined) slide.buttonLabel = buttonLabel || null;
    if (buttonLink !== undefined) slide.buttonLink = buttonLink || null;
    if (displayOrder !== undefined) slide.displayOrder = parseInt(displayOrder);
    if (isActive !== undefined) slide.isActive = isActive === "true" || isActive === true;
    if (req.file) slide.imageUrl = await uploadService.uploadFile(req.file.path, "carousel");

    await slideRepo.save(slide);
    return res.json({ message: "Carousel slide updated successfully", slide });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to update carousel slide", error: err.message });
  }
});

router.delete("/carousel/:id", async (req, res) => {
  try {
    const slideRepo = AppDataSource.getRepository(CarouselSlide);
    await slideRepo.delete({ id: parseInt(req.params.id) });
    return res.json({ message: "Carousel slide deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete carousel slide" });
  }
});

router.post("/carousel/reorder", async (req, res) => {
  try {
    const { orderList } = req.body;
    if (!Array.isArray(orderList)) return res.status(400).json({ message: "Invalid order list" });
    const slideRepo = AppDataSource.getRepository(CarouselSlide);
    for (const item of orderList) {
      await slideRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return res.json({ message: "Carousel reordered successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to reorder carousel slides" });
  }
});

export default router;
