"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const EmailLog_1 = require("../entities/EmailLog");
dotenv_1.default.config();
// Create nodemailer transporter if credentials exist, otherwise default to console logging transport
const useRealMail = !!(process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS);
const transporter = useRealMail
    ? nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })
    : null;
async function logEmail(toEmail, subject, templateName, status, errorMsg) {
    try {
        const logRepo = db_1.AppDataSource.getRepository(EmailLog_1.EmailLog);
        const log = new EmailLog_1.EmailLog();
        log.toEmail = toEmail;
        log.subject = subject;
        log.templateName = templateName;
        log.status = status;
        log.errorMessage = errorMsg || null;
        await logRepo.save(log);
    }
    catch (err) {
        console.error("Failed to write email audit log to database:", err);
    }
}
async function sendMail(to, subject, html, templateName) {
    const sender = process.env.SMTP_FROM || "no-reply@iasds.org";
    if (useRealMail && transporter) {
        try {
            await transporter.sendMail({
                from: sender,
                to,
                subject,
                html,
            });
            await logEmail(to, subject, templateName, "sent");
        }
        catch (err) {
            console.error(`Error sending email to ${to}:`, err);
            await logEmail(to, subject, templateName, "failed", err.message);
        }
    }
    else {
        // Mock logging
        console.log("=========================================");
        console.log(`[MOCK EMAIL SENT]`);
        console.log(`From: ${sender}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Template: ${templateName}`);
        console.log(`Body Snippet: ${html.replace(/<[^>]*>/g, "").substring(0, 150)}...`);
        console.log("=========================================");
        await logEmail(to, subject, templateName, "sent");
    }
}
exports.emailService = {
    async sendRegistrationSubmitted(email, name) {
        const subject = "IASDS Membership Application Received";
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #0D5C99;">Welcome to IASDS</h2>
        <p>Dear ${name},</p>
        <p>Thank you for submitting your application to the <strong>Indian Association of Statistics & Data Science (IASDS)</strong>.</p>
        <p>Your application has been received and is currently under review by our executive committee. You will receive an email update once your membership has been approved.</p>
        <p>Best regards,<br>Executive Council, IASDS</p>
      </div>
    `;
        await sendMail(email, subject, html, "registration_submitted");
    },
    async sendRegistrationApproved(email, name, membershipNumber) {
        const subject = "IASDS Membership Approved!";
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #0D5C99;">Congratulations!</h2>
        <p>Dear ${name},</p>
        <p>We are pleased to inform you that your application for the <strong>Indian Association of Statistics & Data Science (IASDS)</strong> has been approved.</p>
        <p>Your Membership Number is: <strong style="font-size: 1.1em; color: #2563EB;">${membershipNumber}</strong></p>
        <p>You can now log in to the member portal to view your status and download your Digital Membership Card.</p>
        <p>Best regards,<br>Executive Council, IASDS</p>
      </div>
    `;
        await sendMail(email, subject, html, "registration_approved");
    },
    async sendRegistrationRejected(email, name, reason) {
        const subject = "IASDS Membership Application Status";
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #EF4444;">Application Review Update</h2>
        <p>Dear ${name},</p>
        <p>Thank you for your interest in the <strong>Indian Association of Statistics & Data Science (IASDS)</strong>.</p>
        <p>After reviewing your application details, we regret to inform you that we are unable to approve your membership at this time for the following reason:</p>
        <blockquote style="background: #F3F4F6; padding: 10px; border-left: 4px solid #EF4444; margin: 10px 0;">${reason}</blockquote>
        <p>If you believe there has been a mistake or wish to provide supplementary documents, please contact us at support@iasds.org.</p>
        <p>Best regards,<br>Review Board, IASDS</p>
      </div>
    `;
        await sendMail(email, subject, html, "registration_rejected");
    },
    async sendRenewalReminder(email, name, expiryDate) {
        const expiryStr = new Date(expiryDate).toLocaleDateString();
        const subject = "IASDS Membership Renewal Reminder";
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #0D5C99;">Membership Expiration Alert</h2>
        <p>Dear ${name},</p>
        <p>This is a friendly reminder that your active membership with the <strong>Indian Association of Statistics & Data Science (IASDS)</strong> is set to expire on <strong>${expiryStr}</strong>.</p>
        <p>To continue receiving publication access, conference discounts, and directory visibility, please log in to the portal and initiate renewal payment.</p>
        <p>Best regards,<br>Membership Team, IASDS</p>
      </div>
    `;
        await sendMail(email, subject, html, "renewal_reminder");
    },
    async sendPasswordReset(email, token) {
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
        const subject = "Reset Your IASDS Password";
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #0D5C99;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your IASDS account. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>Best regards,<br>Support Team, IASDS</p>
      </div>
    `;
        await sendMail(email, subject, html, "password_reset");
    },
    async sendContactFormSubmission(email, name, formSubject) {
        const subject = "Thank you for contacting IASDS";
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #0D5C99;">Inquiry Received</h2>
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to the <strong>Indian Association of Statistics & Data Science (IASDS)</strong> regarding "<em>${formSubject}</em>".</p>
        <p>Our representative will review your query and respond as soon as possible.</p>
        <p>Best regards,<br>Office Staff, IASDS</p>
      </div>
    `;
        await sendMail(email, subject, html, "contact_submitted");
    }
};
