import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from "typeorm";
import { Role } from "./Role";
import { Member } from "./Member";
import { MembershipApplication } from "./MembershipApplication";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: "password_hash" })
  passwordHash!: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @Column({ default: "active" })
  status!: string; // 'active', 'pending', 'suspended'

  @Column({ name: "refresh_token", nullable: true, type: "text" })
  refreshToken!: string | null;

  @OneToOne(() => Member, (member) => member.user, { cascade: true })
  member!: Member;

  @OneToMany(() => MembershipApplication, (app) => app.user)
  applications!: MembershipApplication[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
