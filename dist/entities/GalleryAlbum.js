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
exports.GalleryAlbum = void 0;
const typeorm_1 = require("typeorm");
const GalleryImage_1 = require("./GalleryImage");
const GalleryVideo_1 = require("./GalleryVideo");
let GalleryAlbum = class GalleryAlbum {
    id;
    name;
    description;
    coverImageUrl;
    images;
    videos;
    createdAt;
};
exports.GalleryAlbum = GalleryAlbum;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], GalleryAlbum.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GalleryAlbum.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: "text" }),
    __metadata("design:type", String)
], GalleryAlbum.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "cover_image_url", nullable: true, type: "text" }),
    __metadata("design:type", Object)
], GalleryAlbum.prototype, "coverImageUrl", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => GalleryImage_1.GalleryImage, (img) => img.album, { cascade: true }),
    __metadata("design:type", Array)
], GalleryAlbum.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => GalleryVideo_1.GalleryVideo, (vid) => vid.album, { cascade: true }),
    __metadata("design:type", Array)
], GalleryAlbum.prototype, "videos", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], GalleryAlbum.prototype, "createdAt", void 0);
exports.GalleryAlbum = GalleryAlbum = __decorate([
    (0, typeorm_1.Entity)("gallery_albums")
], GalleryAlbum);
