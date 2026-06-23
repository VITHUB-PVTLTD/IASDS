import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Member } from "./Member";

@Entity("member_profiles")
export class MemberProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => Member, (member) => member.profile)
  @JoinColumn({ name: "member_id" })
  member!: Member;

  @Column({ name: "full_name" })
  fullName!: string;

  @Column({ nullable: true })
  gender!: string;

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth!: Date | string | null;

  @Column({ name: "mobile_number" })
  mobileNumber!: string;

  @Column({ nullable: true })
  qualification!: string;

  @Column({ nullable: true })
  institution!: string;

  @Column({ nullable: true })
  specialization!: string;

  @Column({ nullable: true })
  organization!: string;

  @Column({ nullable: true })
  designation!: string;

  @Column({ nullable: true })
  experience!: string;

  @Column({ nullable: true })
  country!: string;

  @Column({ nullable: true })
  state!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ name: "postal_code", nullable: true })
  postalCode!: string;

  @Column({ type: "text", nullable: true })
  address!: string;

  @Column({ name: "profile_photo_url", nullable: true, type: "text" })
  profilePhotoUrl!: string | null;

  @Column({ name: "supporting_documents_url", nullable: true, type: "text" })
  supportingDocumentsUrl!: string | null;
}
