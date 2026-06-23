import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("social_links")
export class SocialLink {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "platform_name", unique: true })
  platformName!: string;

  @Column()
  url!: string;

  @Column({ nullable: true })
  icon!: string;
}
