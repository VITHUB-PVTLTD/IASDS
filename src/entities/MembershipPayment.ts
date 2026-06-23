import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Member } from "./Member";

@Entity("membership_payments")
export class MembershipPayment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Member, (member) => member.payments)
  @JoinColumn({ name: "member_id" })
  member!: Member;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ name: "payment_status", default: "pending" })
  paymentStatus!: string; // 'pending', 'successful', 'failed'

  @Column({ name: "payment_method", default: "online" })
  paymentMethod!: string; // 'online', 'bank_transfer'

  @Column({ name: "transaction_reference", nullable: true, type: "text" })
  transactionReference!: string | null;

  @Column({ name: "receipt_url", nullable: true, type: "text" })
  receiptUrl!: string | null;

  @CreateDateColumn({ name: "paid_at" })
  paidAt!: Date;
}
