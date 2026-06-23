import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("honors_awards")
export class HonorsAwards {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ name: "recipient_name" })
  recipientName!: string;

  @Column({ nullable: true })
  designation!: string;

  @Column({ nullable: true })
  institution!: string;

  @Column()
  year!: string;

  @Column({ type: "text", nullable: true })
  details!: string;

  @Column({ name: "image_url", nullable: true, type: "text" })
  imageUrl!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
