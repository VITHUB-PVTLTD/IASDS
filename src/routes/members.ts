import { Router, Response } from "express";
import { authenticateJWT } from "../middleware/authMiddleware";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { AppDataSource } from "../config/db";
import { Member } from "../entities/Member";
import { MemberProfile } from "../entities/MemberProfile";
import { MembershipPayment } from "../entities/MembershipPayment";
import { Notification } from "../entities/Notification";
import { generateMembershipCardPdf } from "../services/pdfService";
import multer from "multer";
import os from "os";
import fs from "fs";
import { uploadService } from "../services/uploadService";

// Helper: convert a multer temp file to a base64 data URI and clean up the temp file
function fileToBase64DataUri(filePath: string, originalName: string): string {
  const extMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
    bmp: "image/bmp", ico: "image/x-icon",
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

// Apply JWT authentication to all sub-routes
router.use(authenticateJWT as any);

// 1. GET MEMBER PROFILE & DASHBOARD DATA
router.get("/dashboard", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const memberRepo = AppDataSource.getRepository(Member);
    const notificationRepo = AppDataSource.getRepository(Notification);

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
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch dashboard data", error: err.message });
  }
});

// 2. UPDATE PROFILE DETAILS
router.put("/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profileRepo = AppDataSource.getRepository(MemberProfile);
    const memberRepo = AppDataSource.getRepository(Member);

    const member = await memberRepo.findOne({
      where: { user: { id: req.user?.id } },
      relations: ["profile"]
    });

    if (!member) {
      return res.status(404).json({ message: "Member profile not found" });
    }

    const profile = member.profile;
    const {
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
      address
    } = req.body;

    if (fullName) profile.fullName = fullName;
    if (gender !== undefined) profile.gender = gender;
    if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
    if (mobileNumber) profile.mobileNumber = mobileNumber;
    if (qualification !== undefined) profile.qualification = qualification;
    if (institution !== undefined) profile.institution = institution;
    if (specialization !== undefined) profile.specialization = specialization;
    if (organization !== undefined) profile.organization = organization;
    if (designation !== undefined) profile.designation = designation;
    if (experience !== undefined) profile.experience = experience;
    if (country !== undefined) profile.country = country;
    if (state !== undefined) profile.state = state;
    if (city !== undefined) profile.city = city;
    if (postalCode !== undefined) profile.postalCode = postalCode;
    if (address !== undefined) profile.address = address;

    await profileRepo.save(profile);

    return res.json({ message: "Profile updated successfully", profile });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

// 3. UPLOAD PROFILE PHOTO
router.post(
  "/profile/photo",
  upload.single("photo"),
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo file provided" });
      }

      const memberRepo = AppDataSource.getRepository(Member);
      const profileRepo = AppDataSource.getRepository(MemberProfile);

      const member = await memberRepo.findOne({
        where: { user: { id: req.user?.id } },
        relations: ["profile"]
      });

      if (!member) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const profilePhotoUrl = fileToBase64DataUri(req.file.path, req.file.originalname || req.file.filename);
      member.profile.profilePhotoUrl = profilePhotoUrl;
      await profileRepo.save(member.profile);

      return res.json({ message: "Photo uploaded successfully", photoUrl: profilePhotoUrl });
    } catch (err: any) {
      console.error("Photo upload error:", err);
      return res.status(500).json({ message: "Photo upload failed", error: err.message });
    }
  }
);

// 4. SUBMIT PAYMENT / RENEWAL RECEIPTS
router.post(
  "/payment",
  upload.single("receipt"),
  async (req: any, res: Response) => {
    try {
      const { transactionReference, amount, paymentMethod } = req.body;
      if (!amount || !paymentMethod) {
        return res.status(400).json({ message: "Amount and payment method are required" });
      }

      const memberRepo = AppDataSource.getRepository(Member);
      const member = await memberRepo.findOne({
        where: { user: { id: req.user?.id } }
      });

      if (!member) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      let receiptUrl: string | null = null;
      if (req.file) {
        receiptUrl = await uploadService.uploadFile(req.file.path, "payment_receipts");
      }

      const paymentRepo = AppDataSource.getRepository(MembershipPayment);
      const payment = new MembershipPayment();
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
    } catch (err: any) {
      console.error("Payment submission error:", err);
      return res.status(500).json({ message: "Failed to submit payment receipt", error: err.message });
    }
  }
);

// 5. DOWNLOAD MEMBERSHIP CARD PDF
router.get("/download-card", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const memberRepo = AppDataSource.getRepository(Member);
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

    const pdfBuffer = await generateMembershipCardPdf(member);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=iasds-membership-card.pdf`);
    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error("Card generation error:", err);
    return res.status(500).json({ message: "Failed to generate card PDF", error: err.message });
  }
});

// 6. GET NOTIFICATIONS
router.get("/notifications", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const notifications = await notificationRepo.find({
      where: { user: { id: req.user?.id } },
      order: { createdAt: "DESC" }
    });
    return res.json(notifications);
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.put("/notifications/:id/read", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
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
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to update notification" });
  }
});

export default router;
