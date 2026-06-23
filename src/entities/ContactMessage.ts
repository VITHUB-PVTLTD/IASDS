import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("contact_messages")
export class ContactMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column()
  subject!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ default: "unread" })
  status!: string; // 'unread', 'read', 'replied'

  @Column({ name: "admin_reply", nullable: true, type: "text" })
  adminReply!: string | null;

  @Column({ name: "replied_at", nullable: true, type: "timestamp" })
  repliedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
