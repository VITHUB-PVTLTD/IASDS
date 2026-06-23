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
exports.Member = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const MembershipType_1 = require("./MembershipType");
const MemberProfile_1 = require("./MemberProfile");
const MembershipPayment_1 = require("./MembershipPayment");
const MembershipCard_1 = require("./MembershipCard");
let Member = class Member {
    id;
    user;
    membershipNumber;
    membershipType;
    status; // 'pending_review', 'approved', 'rejected', 'expired'
    joinedDate;
    expiryDate;
    qrCodeUrl;
    profile;
    payments;
    cards;
    createdAt;
    updatedAt;
};
exports.Member = Member;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Member.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.User, (user) => user.member),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], Member.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "membership_number", unique: true, nullable: true }),
    __metadata("design:type", Object)
], Member.prototype, "membershipNumber", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MembershipType_1.MembershipType, (type) => type.members, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: "membership_type_id" }),
    __metadata("design:type", MembershipType_1.MembershipType)
], Member.prototype, "membershipType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "pending_review" }),
    __metadata("design:type", String)
], Member.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "joined_date", nullable: true }),
    __metadata("design:type", Object)
], Member.prototype, "joinedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "expiry_date", nullable: true }),
    __metadata("design:type", Object)
], Member.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "qr_code_url", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], Member.prototype, "qrCodeUrl", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => MemberProfile_1.MemberProfile, (profile) => profile.member, { cascade: true, eager: true }),
    __metadata("design:type", MemberProfile_1.MemberProfile)
], Member.prototype, "profile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MembershipPayment_1.MembershipPayment, (payment) => payment.member),
    __metadata("design:type", Array)
], Member.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MembershipCard_1.MembershipCard, (card) => card.member),
    __metadata("design:type", Array)
], Member.prototype, "cards", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Member.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Member.prototype, "updatedAt", void 0);
exports.Member = Member = __decorate([
    (0, typeorm_1.Entity)("members")
], Member);
