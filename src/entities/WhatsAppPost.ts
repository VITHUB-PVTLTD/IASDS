import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("whatsapp_posts")
export class WhatsAppPost {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true, type: "text" })
  description!: string | null;

  @Column({ name: "post_date", type: "date" })
  postDate!: string;

  @Column({ name: "image_url", nullable: true, type: "text" })
  imageUrl!: string | null;

  @Column({ name: "file_url", nullable: true, type: "text" })
  fileUrl!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
