import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "./User";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string; // 'Super Admin', 'Admin', 'Editor', 'Member'

  @Column({ nullable: true })
  description!: string;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}
