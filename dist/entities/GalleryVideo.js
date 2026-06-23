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
exports.GalleryVideo = void 0;
const typeorm_1 = require("typeorm");
const GalleryAlbum_1 = require("./GalleryAlbum");
let GalleryVideo = class GalleryVideo {
    id;
    album;
    videoUrl;
    caption;
    createdAt;
};
exports.GalleryVideo = GalleryVideo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], GalleryVideo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => GalleryAlbum_1.GalleryAlbum, (album) => album.videos, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "album_id" }),
    __metadata("design:type", GalleryAlbum_1.GalleryAlbum)
], GalleryVideo.prototype, "album", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "video_url", type: "text" }),
    __metadata("design:type", String)
], GalleryVideo.prototype, "videoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GalleryVideo.prototype, "caption", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], GalleryVideo.prototype, "createdAt", void 0);
exports.GalleryVideo = GalleryVideo = __decorate([
    (0, typeorm_1.Entity)("gallery_videos")
], GalleryVideo);
