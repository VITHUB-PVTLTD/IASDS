import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { GalleryAlbum } from "./GalleryAlbum";

@Entity("gallery_images")
export class GalleryImage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => GalleryAlbum, (album) => album.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "album_id" })
  album!: GalleryAlbum;

  @Column({ name: "image_url", type: "text" })
  imageUrl!: string;

  @Column({ nullable: true })
  caption!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
