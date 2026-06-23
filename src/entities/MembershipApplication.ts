import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@Entity("membership_applications")
export class MembershipApplication {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.applications, { eager: true })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ default: "pending" })
  status!: string; // 'pending', 'approved', 'rejected'

  @Column({ name: "reviewer_notes", nullable: true, type: "text" })
  reviewerNotes!: string | null;

  @Column({ name: "reviewed_by", nullable: true, type: "varchar" })
  reviewedBy!: string | null;

  @Column({ name: "reviewed_at", nullable: true, type: "timestamp" })
  reviewedAt!: Date | null;

  @CreateDateColumn({ name: "submitted_at" })
  submittedAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
