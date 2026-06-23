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
exports.MembershipCard = void 0;
const typeorm_1 = require("typeorm");
const Member_1 = require("./Member");
let MembershipCard = class MembershipCard {
    id;
    member;
    cardNumber;
    cardPdfUrl;
    generatedAt;
};
exports.MembershipCard = MembershipCard;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MembershipCard.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Member_1.Member, (member) => member.cards),
    (0, typeorm_1.JoinColumn)({ name: "member_id" }),
    __metadata("design:type", Member_1.Member)
], MembershipCard.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "card_number" }),
    __metadata("design:type", String)
], MembershipCard.prototype, "cardNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "card_pdf_url", type: "text" }),
    __metadata("design:type", String)
], MembershipCard.prototype, "cardPdfUrl", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "generated_at" }),
    __metadata("design:type", Date)
], MembershipCard.prototype, "generatedAt", void 0);
exports.MembershipCard = MembershipCard = __decorate([
    (0, typeorm_1.Entity)("membership_cards")
], MembershipCard);
