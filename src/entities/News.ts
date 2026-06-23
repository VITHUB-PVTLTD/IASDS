import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("news")
export class News {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true, type: "text" })
  description!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "image_url", nullable: true, type: "text" })
  imageUrl!: string | null;

  @Column({ name: "attachment_url", nullable: true, type: "text" })
  attachmentUrl!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
