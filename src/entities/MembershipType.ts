import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Member } from "./Member";

@Entity("membership_types")
export class MembershipType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string; // e.g., 'Life Member', 'Annual Member', 'Student Member'

  @Column({ nullable: true, type: "text" })
  description!: string;

  @Column({ name: "duration_months" })
  durationMonths!: number;

  @Column({ name: "fee_amount", type: "decimal", precision: 10, scale: 2 })
  feeAmount!: number;

  @Column({ default: "INR" })
  currency!: string;

  @OneToMany(() => Member, (member) => member.membershipType)
  members!: Member[];
}
