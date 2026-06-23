import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("achievements")
export class Achievement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ nullable: true })
  date!: string; // e.g., 'June 2026'

  @Column({ name: "image_url", nullable: true, type: "text" })
  imageUrl!: string | null;

  @Column({ nullable: true })
  category!: string; // 'Milestones', 'Success Stories', 'Recognitions'

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
