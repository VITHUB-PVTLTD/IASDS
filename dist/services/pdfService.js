"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMembershipCardPdf = generateMembershipCardPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
/**
 * Generates a standard CR80-sized (approx 400x250pt) PDF card as a buffer.
 */
async function generateMembershipCardPdf(member) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({ size: [400, 250], margin: 0 });
            const buffers = [];
            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            // 1. Draw Background
            doc.rect(0, 0, 400, 250).fill("#FFFFFF");
            // 2. Draw Top Bar (Primary Color #0D5C99)
            doc.rect(0, 0, 400, 60).fill("#0D5C99");
            // 3. Header Text
            doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold").text("INDIAN ASSOCIATION OF STATISTICS & DATA SCIENCE", 15, 15, { align: "center", width: 370 });
            doc.fontSize(8).font("Helvetica").text("MEMBERSHIP CARD", 15, 36, { align: "center", width: 370 });
            // 4. Accent Separator Line (Secondary Color #D87AB4)
            doc.rect(0, 60, 400, 4).fill("#D87AB4");
            // 5. Draw Profile Photo Frame (Placeholder since files require async downloading)
            doc.rect(20, 80, 90, 110).stroke("#D1D5DB");
            doc.rect(21, 81, 88, 108).fill("#F3F4F6");
            doc.fillColor("#9CA3AF").font("Helvetica-Bold").fontSize(8).text("MEMBER\nPHOTO", 21, 125, { align: "center", width: 88 });
            // 6. Draw Member Profile Metadata
            doc.fillColor("#1F2937").font("Helvetica-Bold").fontSize(10);
            doc.text(member.profile?.fullName ? member.profile.fullName.toUpperCase() : "MEMBER NAME", 125, 80);
            doc.font("Helvetica").fontSize(8).fillColor("#4B5563");
            doc.text(`Member ID: ${member.membershipNumber || "PENDING"}`, 125, 100);
            doc.text(`Type: ${member.membershipType?.name || "N/A"}`, 125, 115);
            const joinedStr = member.joinedDate ? new Date(member.joinedDate).toLocaleDateString() : "N/A";
            const expiryStr = member.expiryDate ? new Date(member.expiryDate).toLocaleDateString() : "N/A";
            doc.text(`Issued: ${joinedStr}`, 125, 130);
            doc.text(`Expires: ${expiryStr}`, 125, 145);
            doc.text(`Status: ${member.status?.toUpperCase() || "PENDING"}`, 125, 160);
            // 7. QR Code Generation for Verification Link
            const qrValue = `https://iasds.org/verify-member/${member.id}`;
            const qrDataUrl = await qrcode_1.default.toDataURL(qrValue, { width: 80, margin: 1 });
            const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
            doc.image(qrBuffer, 290, 80, { width: 90, height: 90 });
            // 8. Footer Bar (Primary Color #0D5C99)
            doc.rect(0, 210, 400, 40).fill("#0D5C99");
            doc.fillColor("#FFFFFF").font("Helvetica").fontSize(7).text("This card is a digital asset of IASDS. Please scan the QR code to verify active membership.", 15, 218, { align: "left", width: 250 });
            doc.font("Helvetica-Bold").text("www.iasds.org", 280, 226, { align: "right", width: 100 });
            doc.end();
        }
        catch (err) {
            reject(err);
        }
    });
}
