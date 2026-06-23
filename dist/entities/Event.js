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
exports.Event = void 0;
const typeorm_1 = require("typeorm");
let Event = class Event {
    id;
    title;
    description;
    content;
    startDate;
    endDate;
    registrationDeadline;
    eventType; // 'Conference', 'Workshop', 'Seminar', 'Webinar', 'Announcement'
    bannerUrl;
    scheduleDetails;
    venueDetails;
    registrationLink;
    createdAt;
    updatedAt;
};
exports.Event = Event;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Event.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Event.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: "text" }),
    __metadata("design:type", String)
], Event.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Event.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "start_date" }),
    __metadata("design:type", Date)
], Event.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "end_date" }),
    __metadata("design:type", Date)
], Event.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "registration_deadline", nullable: true, type: "timestamp" }),
    __metadata("design:type", Object)
], Event.prototype, "registrationDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "event_type", default: "Conference" }),
    __metadata("design:type", String)
], Event.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "banner_url", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], Event.prototype, "bannerUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "schedule_details", type: "json", nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "scheduleDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "venue_details", nullable: true }),
    __metadata("design:type", String)
], Event.prototype, "venueDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "registration_link", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], Event.prototype, "registrationLink", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Event.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Event.prototype, "updatedAt", void 0);
exports.Event = Event = __decorate([
    (0, typeorm_1.Entity)("events")
], Event);
