"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
const Role_1 = require("./entities/Role");
const User_1 = require("./entities/User");
const MembershipType_1 = require("./entities/MembershipType");
const WebsiteSetting_1 = require("./entities/WebsiteSetting");
const SocialLink_1 = require("./entities/SocialLink");
const ExecutiveCouncilMember_1 = require("./entities/ExecutiveCouncilMember");
const PublicationCategory_1 = require("./entities/PublicationCategory");
const News_1 = require("./entities/News");
const Event_1 = require("./entities/Event");
const Achievement_1 = require("./entities/Achievement");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seed() {
    try {
        console.log("Initializing database connection for seeding...");
        await db_1.AppDataSource.initialize();
        console.log("Database connected successfully.");
        const roleRepo = db_1.AppDataSource.getRepository(Role_1.Role);
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const typeRepo = db_1.AppDataSource.getRepository(MembershipType_1.MembershipType);
        const settingRepo = db_1.AppDataSource.getRepository(WebsiteSetting_1.WebsiteSetting);
        const socialRepo = db_1.AppDataSource.getRepository(SocialLink_1.SocialLink);
        const councilRepo = db_1.AppDataSource.getRepository(ExecutiveCouncilMember_1.ExecutiveCouncilMember);
        const pubCatRepo = db_1.AppDataSource.getRepository(PublicationCategory_1.PublicationCategory);
        const newsRepo = db_1.AppDataSource.getRepository(News_1.News);
        const eventRepo = db_1.AppDataSource.getRepository(Event_1.Event);
        const achRepo = db_1.AppDataSource.getRepository(Achievement_1.Achievement);
        // 1. Seed Roles
        console.log("Seeding Roles...");
        const roleNames = ["Super Admin", "Admin", "Editor", "Member"];
        const roles = [];
        for (const name of roleNames) {
            let role = await roleRepo.findOneBy({ name });
            if (!role) {
                role = new Role_1.Role();
                role.name = name;
                role.description = `${name} role for IASDS portal`;
                role = await roleRepo.save(role);
                console.log(`Created Role: ${name}`);
            }
            roles.push(role);
        }
        const superAdminRole = roles.find((r) => r.name === "Super Admin");
        const adminRole = roles.find((r) => r.name === "Admin");
        const editorRole = roles.find((r) => r.name === "Editor");
        const memberRole = roles.find((r) => r.name === "Member");
        // 2. Seed Super Admin User
        console.log("Seeding Super Admin...");
        const adminEmail = "admin@iasds.org";
        let adminUser = await userRepo.findOneBy({ email: adminEmail });
        if (!adminUser) {
            adminUser = new User_1.User();
            adminUser.email = adminEmail;
            adminUser.passwordHash = await bcryptjs_1.default.hash("admin123", 10);
            adminUser.role = superAdminRole;
            adminUser.status = "active";
            await userRepo.save(adminUser);
            console.log(`Created Super Admin user: ${adminEmail} (password: admin123)`);
        }
        // 3. Seed Membership Types
        console.log("Seeding Membership Types...");
        const membershipTypes = [
            { name: "Life Member", description: "Lifetime association membership benefits", durationMonths: 1200, feeAmount: 5000.0 },
            { name: "Annual Member", description: "Standard annual membership benefits renewed yearly", durationMonths: 12, feeAmount: 1000.0 },
            { name: "Student Member", description: "Discounted membership rate for active university students", durationMonths: 12, feeAmount: 300.0 },
        ];
        for (const mt of membershipTypes) {
            let type = await typeRepo.findOneBy({ name: mt.name });
            if (!type) {
                type = new MembershipType_1.MembershipType();
                type.name = mt.name;
                type.description = mt.description;
                type.durationMonths = mt.durationMonths;
                type.feeAmount = mt.feeAmount;
                type.currency = "INR";
                await typeRepo.save(type);
                console.log(`Created Membership Type: ${mt.name}`);
            }
        }
        // 4. Seed Website Settings
        console.log("Seeding Website Settings...");
        const settings = [
            { key: "logo_url", value: "", description: "Branding logo URL path" },
            { key: "about_origin", value: "The Indian Association of Statistics & Data Science (IASDS) was established to advance statistical research, promote data science education, and bridge the gap between academic theory and industry applications in India and worldwide.", description: "Origin narrative of IASDS" },
            { key: "about_vision", value: "To be a leading global voice for statisticians and data scientists, inspiring discoveries and shaping policy through logical analytical frameworks.", description: "IASDS Vision Statement" },
            { key: "about_mission", value: "To build a robust network of researchers, academic instructors, and industrial practitioners by delivering state-of-the-art training, editing high-quality journals, and hosting professional conferences.", description: "IASDS Mission Statement" },
            { key: "contact_address", value: "IASDS Headquarters, Department of Statistics, Academic Plaza, New Delhi, India - 110001", description: "Physical office address" },
            { key: "contact_email", value: "info@iasds.org", description: "Official contact email address" },
            { key: "contact_phone", value: "+91-11-23456789", description: "Official contact phone number" },
        ];
        for (const set of settings) {
            let setting = await settingRepo.findOneBy({ key: set.key });
            if (!setting) {
                setting = new WebsiteSetting_1.WebsiteSetting();
                setting.key = set.key;
                setting.value = set.value;
                setting.description = set.description;
                await settingRepo.save(setting);
                console.log(`Created Website Setting: ${set.key}`);
            }
        }
        // 5. Seed Social Links
        console.log("Seeding Social Links...");
        const socialLinks = [
            { platformName: "LinkedIn", url: "https://linkedin.com/company/iasds", icon: "pi pi-linkedin" },
            { platformName: "Twitter", url: "https://twitter.com/iasds_org", icon: "pi pi-twitter" },
            { platformName: "Facebook", url: "https://facebook.com/iasds", icon: "pi pi-facebook" },
        ];
        for (const sl of socialLinks) {
            let link = await socialRepo.findOneBy({ platformName: sl.platformName });
            if (!link) {
                link = new SocialLink_1.SocialLink();
                link.platformName = sl.platformName;
                link.url = sl.url;
                link.icon = sl.icon;
                await socialRepo.save(link);
                console.log(`Created Social Link: ${sl.platformName}`);
            }
        }
        // 6. Seed Publication Categories
        console.log("Seeding Publication Categories...");
        const pubCats = ["Research Papers", "Journals", "Proceedings", "Reports", "Newsletters"];
        for (const cat of pubCats) {
            let pc = await pubCatRepo.findOneBy({ name: cat });
            if (!pc) {
                pc = new PublicationCategory_1.PublicationCategory();
                pc.name = cat;
                pc.description = `${cat} publication materials category`;
                await pubCatRepo.save(pc);
                console.log(`Created Publication Category: ${cat}`);
            }
        }
        // 7. Seed Council Members (2026)
        console.log("Seeding Council Members (2026)...");
        const councilMembers = [
            { name: "Prof. Rakesh Sharma", designation: "President", institution: "Indian Institute of Science", email: "president@iasds.org", phone: "+91-9876543210", order: 1 },
            { name: "Dr. Priya Iyer", designation: "Vice President", institution: "Indian Statistical Institute", email: "priya.iyer@iasds.org", phone: "+91-9876543211", order: 2 },
            { name: "Prof. Vikram Sen", designation: "General Secretary", institution: "Delhi University", email: "secretary@iasds.org", phone: "+91-9876543212", order: 3 },
        ];
        for (const cm of councilMembers) {
            let member = await councilRepo.findOneBy({ name: cm.name });
            if (!member) {
                member = new ExecutiveCouncilMember_1.ExecutiveCouncilMember();
                member.name = cm.name;
                member.designation = cm.designation;
                member.institution = cm.institution;
                member.email = cm.email;
                member.phoneNumber = cm.phone;
                member.displayOrder = cm.order;
                member.year = "2026";
                await councilRepo.save(member);
                console.log(`Created Council Member: ${cm.name}`);
            }
        }
        // 8. Seed News & Events
        console.log("Seeding News & Events...");
        let sampleNews = await newsRepo.findOneBy({ title: "IASDS Annual General Meeting Announcement" });
        if (!sampleNews) {
            sampleNews = new News_1.News();
            sampleNews.title = "IASDS Annual General Meeting Announcement";
            sampleNews.description = "Official scheduling for the virtual IASDS General Council meeting of 2026.";
            sampleNews.content = "<p>The General Council meeting of IASDS will be held on August 15, 2026, at 3:00 PM IST. Agenda items include budget review, publication highlights, and voting results for the new journal editorial board.</p>";
            await newsRepo.save(sampleNews);
            console.log("Seeded sample news announcement.");
        }
        let sampleEvent = await eventRepo.findOneBy({ title: "International Conference on Data Science & Analytics (ICDSA 2026)" });
        if (!sampleEvent) {
            sampleEvent = new Event_1.Event();
            sampleEvent.title = "International Conference on Data Science & Analytics (ICDSA 2026)";
            sampleEvent.description = "The flagship annual conference of IASDS showcasing innovations in statistics and neural architectures.";
            sampleEvent.content = "<p>Welcome to ICDSA 2026. Join leading scholars, statisticians, and researchers from across the globe in New Delhi. Submit abstracts by July 1, 2026.</p>";
            sampleEvent.startDate = new Date("2026-10-10T09:00:00Z");
            sampleEvent.endDate = new Date("2026-10-12T17:00:00Z");
            sampleEvent.registrationDeadline = new Date("2026-09-01T23:59:59Z");
            sampleEvent.eventType = "Conference";
            sampleEvent.venueDetails = "Academic Plaza Auditorium, New Delhi";
            sampleEvent.registrationLink = "https://iasds.org/register-event/icdsa-2026";
            sampleEvent.scheduleDetails = [
                { day: "Day 1", time: "09:00 AM - 10:30 AM", topic: "Keynote Address on High-Dimensional Statistics" },
                { day: "Day 1", time: "11:00 AM - 01:00 PM", topic: "Parallel Sessions: Statistical Learning & Neural Networks" },
                { day: "Day 2", time: "09:30 AM - 12:00 PM", topic: "Workshop: Predictive Modeling and Inference" }
            ];
            await eventRepo.save(sampleEvent);
            console.log("Seeded sample flagship conference event.");
        }
        // 9. Seed Achievements
        console.log("Seeding Achievements...");
        let sampleAch = await achRepo.findOneBy({ title: "IASDS Reaches 2,500 Lifetime Members" });
        if (!sampleAch) {
            sampleAch = new Achievement_1.Achievement();
            sampleAch.title = "IASDS Reaches 2,500 Lifetime Members";
            sampleAch.description = "Our professional research network has expanded to over 2,500 registered statisticians, teachers, and data professionals from 40+ countries.";
            sampleAch.date = "May 2026";
            sampleAch.category = "Milestones";
            await achRepo.save(sampleAch);
            console.log("Seeded sample achievements record.");
        }
        console.log("Database seeding completed successfully.");
        await db_1.AppDataSource.destroy();
    }
    catch (err) {
        console.error("Error occurred while seeding database:", err);
    }
}
seed();
