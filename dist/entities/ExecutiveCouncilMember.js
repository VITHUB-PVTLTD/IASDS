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
exports.ExecutiveCouncilMember = void 0;
const typeorm_1 = require("typeorm");
let ExecutiveCouncilMember = class ExecutiveCouncilMember {
    id;
    photoUrl;
    name;
    designation;
    institution;
    email;
    phoneNumber;
    displayOrder;
    year;
};
exports.ExecutiveCouncilMember = ExecutiveCouncilMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ExecutiveCouncilMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "photo_url", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], ExecutiveCouncilMember.prototype, "photoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ExecutiveCouncilMember.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ExecutiveCouncilMember.prototype, "designation", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ExecutiveCouncilMember.prototype, "institution", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ExecutiveCouncilMember.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "phone_number", nullable: true }),
    __metadata("design:type", String)
], ExecutiveCouncilMember.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "display_order", default: 0 }),
    __metadata("design:type", Number)
], ExecutiveCouncilMember.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "2026" }),
    __metadata("design:type", String)
], ExecutiveCouncilMember.prototype, "year", void 0);
exports.ExecutiveCouncilMember = ExecutiveCouncilMember = __decorate([
    (0, typeorm_1.Entity)("executive_council_members")
], ExecutiveCouncilMember);
