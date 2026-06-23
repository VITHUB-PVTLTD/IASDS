import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";
import { MembershipType } from "./MembershipType";
import { MemberProfile } from "./MemberProfile";
import { MembershipPayment } from "./MembershipPayment";
import { MembershipCard } from "./MembershipCard";

@Entity("members")
export class Member {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => User, (user) => user.member)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "membership_number", unique: true, nullable: true, type: "varchar" })
  membershipNumber!: string | null;

  @ManyToOne(() => MembershipType, (type) => type.members, { eager: true })
  @JoinColumn({ name: "membership_type_id" })
  membershipType!: MembershipType;

  @Column({ default: "pending_review" })
  status!: string; // 'pending_review', 'approved', 'rejected', 'expired'

  @Column({ name: "joined_date", nullable: true, type: "timestamp" })
  joinedDate!: Date | null;

  @Column({ name: "expiry_date", nullable: true, type: "timestamp" })
  expiryDate!: Date | null;

  @Column({ name: "qr_code_url", nullable: true, type: "text" })
  qrCodeUrl!: string | null;

  @OneToOne(() => MemberProfile, (profile) => profile.member, { cascade: true, eager: true })
  profile!: MemberProfile;

  @OneToMany(() => MembershipPayment, (payment) => payment.member)
  payments!: MembershipPayment[];

  @OneToMany(() => MembershipCard, (card) => card.member)
  cards!: MembershipCard[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
