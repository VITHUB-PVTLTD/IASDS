import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { Member } from "../entities/Member";
import { MemberProfile } from "../entities/MemberProfile";
import { MembershipApplication } from "../entities/MembershipApplication";
import { MembershipType } from "../entities/MembershipType";
import { MembershipPayment } from "../entities/MembershipPayment";
import { MembershipCard } from "../entities/MembershipCard";
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
import { Notification } from "../entities/Notification";
import { EmailLog } from "../entities/EmailLog";
import { WebsiteSetting } from "../entities/WebsiteSetting";
import { SocialLink } from "../entities/SocialLink";
import { AuditLog } from "../entities/AuditLog";
import { CarouselSlide } from "../entities/CarouselSlide";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || "localhost"),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DATABASE_URL ? undefined : (process.env.DB_USERNAME || "postgres"),
  password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || "Rakesh"),
  database: process.env.DATABASE_URL ? undefined : (process.env.DB_DATABASE || "testing"),
  synchronize: true, // auto sync in dev, use migrations in production
  logging: !isProduction ? ["error", "warn"] : false,
  entities: [
    User,
    Role,
    Member,
    MemberProfile,
    MembershipApplication,
    MembershipType,
    MembershipPayment,
    MembershipCard,
    ExecutiveCouncilMember,
    Publication,
    PublicationCategory,
    News,
    Event,
    GalleryAlbum,
    GalleryImage,
    GalleryVideo,
    Achievement,
    HonorsAwards,
    ContactMessage,
    Notification,
    EmailLog,
    WebsiteSetting,
    SocialLink,
    AuditLog,
    CarouselSlide
  ],
  subscribers: [],
  migrations: [],
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});
