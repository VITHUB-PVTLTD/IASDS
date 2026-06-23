"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../entities/User");
const Role_1 = require("../entities/Role");
const Member_1 = require("../entities/Member");
const MemberProfile_1 = require("../entities/MemberProfile");
const MembershipApplication_1 = require("../entities/MembershipApplication");
const MembershipType_1 = require("../entities/MembershipType");
const MembershipPayment_1 = require("../entities/MembershipPayment");
const MembershipCard_1 = require("../entities/MembershipCard");
const ExecutiveCouncilMember_1 = require("../entities/ExecutiveCouncilMember");
const Publication_1 = require("../entities/Publication");
const PublicationCategory_1 = require("../entities/PublicationCategory");
const News_1 = require("../entities/News");
const Event_1 = require("../entities/Event");
const GalleryAlbum_1 = require("../entities/GalleryAlbum");
const GalleryImage_1 = require("../entities/GalleryImage");
const GalleryVideo_1 = require("../entities/GalleryVideo");
const Achievement_1 = require("../entities/Achievement");
const HonorsAwards_1 = require("../entities/HonorsAwards");
const ContactMessage_1 = require("../entities/ContactMessage");
const Notification_1 = require("../entities/Notification");
const EmailLog_1 = require("../entities/EmailLog");
const WebsiteSetting_1 = require("../entities/WebsiteSetting");
const SocialLink_1 = require("../entities/SocialLink");
const AuditLog_1 = require("../entities/AuditLog");
const CarouselSlide_1 = require("../entities/CarouselSlide");
dotenv_1.default.config();
const isProduction = process.env.NODE_ENV === "production";
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || "localhost"),
    port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DATABASE_URL ? undefined : (process.env.DB_USERNAME || "postgres"),
    password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || "Rakesh"),
    database: process.env.DATABASE_URL ? undefined : (process.env.DB_DATABASE || "testing"),
    synchronize: !isProduction, // auto sync in dev, use migrations in production
    logging: !isProduction ? ["error", "warn"] : false,
    entities: [
        User_1.User,
        Role_1.Role,
        Member_1.Member,
        MemberProfile_1.MemberProfile,
        MembershipApplication_1.MembershipApplication,
        MembershipType_1.MembershipType,
        MembershipPayment_1.MembershipPayment,
        MembershipCard_1.MembershipCard,
        ExecutiveCouncilMember_1.ExecutiveCouncilMember,
        Publication_1.Publication,
        PublicationCategory_1.PublicationCategory,
        News_1.News,
        Event_1.Event,
        GalleryAlbum_1.GalleryAlbum,
        GalleryImage_1.GalleryImage,
        GalleryVideo_1.GalleryVideo,
        Achievement_1.Achievement,
        HonorsAwards_1.HonorsAwards,
        ContactMessage_1.ContactMessage,
        Notification_1.Notification,
        EmailLog_1.EmailLog,
        WebsiteSetting_1.WebsiteSetting,
        SocialLink_1.SocialLink,
        AuditLog_1.AuditLog,
        CarouselSlide_1.CarouselSlide
    ],
    subscribers: [],
    migrations: [],
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});
