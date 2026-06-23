"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailLog = void 0;
const typeorm_1 = require("typeorm");
let EmailLog = class EmailLog {
    id;
    toEmail;
    subject;
    templateName;
    status; // 'sent', 'failed', 'pending'
    errorMessage;
    sentAt;
};
exports.EmailLog = EmailLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EmailLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "to_email" }),
    __metadata("design:type", String)
], EmailLog.prototype, "toEmail", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailLog.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "template_name" }),
    __metadata("design:type", String)
], EmailLog.prototype, "templateName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "pending" }),
    __metadata("design:type", String)
], EmailLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "error_message", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], EmailLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "sent_at" }),
    __metadata("design:type", Date)
], EmailLog.prototype, "sentAt", void 0);
exports.EmailLog = EmailLog = __decorate([
    (0, typeorm_1.Entity)("email_logs")
], EmailLog);
