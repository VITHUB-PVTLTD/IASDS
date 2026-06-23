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
exports.Publication = void 0;
const typeorm_1 = require("typeorm");
const PublicationCategory_1 = require("./PublicationCategory");
let Publication = class Publication {
    id;
    title;
    description;
    fileUrl;
    downloadCount;
    category;
    uploadedBy;
    createdAt;
};
exports.Publication = Publication;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Publication.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Publication.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: "text" }),
    __metadata("design:type", String)
], Publication.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "file_url", type: "text" }),
    __metadata("design:type", String)
], Publication.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "download_count", default: 0 }),
    __metadata("design:type", Number)
], Publication.prototype, "downloadCount", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PublicationCategory_1.PublicationCategory, (cat) => cat.publications, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: "category_id" }),
    __metadata("design:type", PublicationCategory_1.PublicationCategory)
], Publication.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "uploaded_by", nullable: true }),
    __metadata("design:type", String)
], Publication.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Publication.prototype, "createdAt", void 0);
exports.Publication = Publication = __decorate([
    (0, typeorm_1.Entity)("publications")
], Publication);
