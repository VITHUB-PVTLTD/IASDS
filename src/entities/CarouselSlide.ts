import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("carousel_slides")
export class CarouselSlide {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  imageUrl!: string;

  @Column({ type: "varchar", nullable: true })
  title!: string | null;

  @Column({ type: "varchar", nullable: true })
  subtitle!: string | null;

  @Column({ name: "button_label", type: "varchar", nullable: true })
  buttonLabel!: string | null;

  @Column({ name: "button_link", type: "varchar", nullable: true })
  buttonLink!: string | null;

  @Column({ name: "display_order", type: "int", default: 0 })
  displayOrder!: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
