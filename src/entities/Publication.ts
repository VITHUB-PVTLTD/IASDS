import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { PublicationCategory } from "./PublicationCategory";

@Entity("publications")
export class Publication {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true, type: "text" })
  description!: string;

  @Column({ name: "file_url", type: "text" })
  fileUrl!: string;

  @Column({ name: "download_count", default: 0 })
  downloadCount!: number;

  @ManyToOne(() => PublicationCategory, (cat) => cat.publications, { eager: true })
  @JoinColumn({ name: "category_id" })
  category!: PublicationCategory;

  @Column({ name: "uploaded_by", nullable: true })
  uploadedBy!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
