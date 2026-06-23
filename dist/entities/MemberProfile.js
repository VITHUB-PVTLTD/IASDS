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
exports.MemberProfile = void 0;
const typeorm_1 = require("typeorm");
const Member_1 = require("./Member");
let MemberProfile = class MemberProfile {
    id;
    member;
    fullName;
    gender;
    dateOfBirth;
    mobileNumber;
    qualification;
    institution;
    specialization;
    organization;
    designation;
    experience;
    country;
    state;
    city;
    postalCode;
    address;
    profilePhotoUrl;
    supportingDocumentsUrl;
};
exports.MemberProfile = MemberProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MemberProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Member_1.Member, (member) => member.profile),
    (0, typeorm_1.JoinColumn)({ name: "member_id" }),
    __metadata("design:type", Member_1.Member)
], MemberProfile.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "full_name" }),
    __metadata("design:type", String)
], MemberProfile.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "date_of_birth", type: "date", nullable: true }),
    __metadata("design:type", Object)
], MemberProfile.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "mobile_number" }),
    __metadata("design:type", String)
], MemberProfile.prototype, "mobileNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "qualification", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "institution", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "specialization", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "designation", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "experience", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "postal_code", nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "postalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], MemberProfile.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "profile_photo_url", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], MemberProfile.prototype, "profilePhotoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "supporting_documents_url", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], MemberProfile.prototype, "supportingDocumentsUrl", void 0);
exports.MemberProfile = MemberProfile = __decorate([
    (0, typeorm_1.Entity)("member_profiles")
], MemberProfile);
