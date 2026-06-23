import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("email_logs")
export class EmailLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "to_email" })
  toEmail!: string;

  @Column()
  subject!: string;

  @Column({ name: "template_name" })
  templateName!: string;

  @Column({ default: "pending" })
  status!: string; // 'sent', 'failed', 'pending'

  @Column({ name: "error_message", nullable: true, type: "text" })
  errorMessage!: string | null;

  @CreateDateColumn({ name: "sent_at" })
  sentAt!: Date;
}
