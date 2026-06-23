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
exports.HonorsAwards = void 0;
const typeorm_1 = require("typeorm");
let HonorsAwards = class HonorsAwards {
    id;
    title;
    recipientName;
    designation;
    institution;
    year;
    details;
    imageUrl;
    createdAt;
};
exports.HonorsAwards = HonorsAwards;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], HonorsAwards.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HonorsAwards.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "recipient_name" }),
    __metadata("design:type", String)
], HonorsAwards.prototype, "recipientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], HonorsAwards.prototype, "designation", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], HonorsAwards.prototype, "institution", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HonorsAwards.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], HonorsAwards.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "image_url", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], HonorsAwards.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], HonorsAwards.prototype, "createdAt", void 0);
exports.HonorsAwards = HonorsAwards = __decorate([
    (0, typeorm_1.Entity)("honors_awards")
], HonorsAwards);
