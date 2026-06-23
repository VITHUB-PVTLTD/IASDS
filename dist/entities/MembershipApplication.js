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
exports.MembershipApplication = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let MembershipApplication = class MembershipApplication {
    id;
    user;
    status; // 'pending', 'approved', 'rejected'
    reviewerNotes;
    reviewedBy;
    reviewedAt;
    submittedAt;
    updatedAt;
};
exports.MembershipApplication = MembershipApplication;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MembershipApplication.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.applications, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], MembershipApplication.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "pending" }),
    __metadata("design:type", String)
], MembershipApplication.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "reviewer_notes", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], MembershipApplication.prototype, "reviewerNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "reviewed_by", nullable: true, type: "varchar" }),
    __metadata("design:type", Object)
], MembershipApplication.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "reviewed_at", nullable: true, type: "timestamp" }),
    __metadata("design:type", Object)
], MembershipApplication.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "submitted_at" }),
    __metadata("design:type", Date)
], MembershipApplication.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], MembershipApplication.prototype, "updatedAt", void 0);
exports.MembershipApplication = MembershipApplication = __decorate([
    (0, typeorm_1.Entity)("membership_applications")
], MembershipApplication);
