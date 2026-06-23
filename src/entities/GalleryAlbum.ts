import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { GalleryImage } from "./GalleryImage";
import { GalleryVideo } from "./GalleryVideo";

@Entity("gallery_albums")
export class GalleryAlbum {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true, type: "text" })
  description!: string;

  @Column({ name: "cover_image_url", nullable: true, type: "text" })
  coverImageUrl!: string | null;

  @OneToMany(() => GalleryImage, (img) => img.album, { cascade: true })
  images!: GalleryImage[];

  @OneToMany(() => GalleryVideo, (vid) => vid.album, { cascade: true })
  videos!: GalleryVideo[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
