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
exports.MembershipType = void 0;
const typeorm_1 = require("typeorm");
const Member_1 = require("./Member");
let MembershipType = class MembershipType {
    id;
    name; // e.g., 'Life Member', 'Annual Member', 'Student Member'
    description;
    durationMonths;
    feeAmount;
    currency;
    members;
};
exports.MembershipType = MembershipType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MembershipType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], MembershipType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: "text" }),
    __metadata("design:type", String)
], MembershipType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "duration_months" }),
    __metadata("design:type", Number)
], MembershipType.prototype, "durationMonths", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "fee_amount", type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], MembershipType.prototype, "feeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "INR" }),
    __metadata("design:type", String)
], MembershipType.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Member_1.Member, (member) => member.membershipType),
    __metadata("design:type", Array)
], MembershipType.prototype, "members", void 0);
exports.MembershipType = MembershipType = __decorate([
    (0, typeorm_1.Entity)("membership_types")
], MembershipType);
