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
exports.MembershipPayment = void 0;
const typeorm_1 = require("typeorm");
const Member_1 = require("./Member");
let MembershipPayment = class MembershipPayment {
    id;
    member;
    amount;
    paymentStatus; // 'pending', 'successful', 'failed'
    paymentMethod; // 'online', 'bank_transfer'
    transactionReference;
    receiptUrl;
    paidAt;
};
exports.MembershipPayment = MembershipPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MembershipPayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Member_1.Member, (member) => member.payments),
    (0, typeorm_1.JoinColumn)({ name: "member_id" }),
    __metadata("design:type", Member_1.Member)
], MembershipPayment.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], MembershipPayment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "payment_status", default: "pending" }),
    __metadata("design:type", String)
], MembershipPayment.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "payment_method", default: "online" }),
    __metadata("design:type", String)
], MembershipPayment.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "transaction_reference", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "transactionReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "receipt_url", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "receiptUrl", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "paid_at" }),
    __metadata("design:type", Date)
], MembershipPayment.prototype, "paidAt", void 0);
exports.MembershipPayment = MembershipPayment = __decorate([
    (0, typeorm_1.Entity)("membership_payments")
], MembershipPayment);
