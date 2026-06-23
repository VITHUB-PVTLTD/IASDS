import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { GalleryAlbum } from "./GalleryAlbum";

@Entity("gallery_videos")
export class GalleryVideo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => GalleryAlbum, (album) => album.videos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "album_id" })
  album!: GalleryAlbum;

  @Column({ name: "video_url", type: "text" })
  videoUrl!: string;

  @Column({ nullable: true })
  caption!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
