import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type CouncilMemberType =
  | "Executive Council"
  | "Executive Council Members"
  | "Advisory Council Members";

@Entity("executive_council_members")
export class ExecutiveCouncilMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "photo_url", nullable: true, type: "text" })
  photoUrl!: string | null;

  @Column()
  name!: string;

  @Column()
  designation!: string;

  @Column()
  institution!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ name: "phone_number", nullable: true })
  phoneNumber!: string;

  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  @Column({ default: "2026" })
  year!: string;

  @Column({
    name: "member_type",
    default: "Executive Council Members",
  })
  memberType!: CouncilMemberType;
}

