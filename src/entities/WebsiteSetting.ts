import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("website_settings")
export class WebsiteSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  key!: string; // e.g., 'logo_url', 'homepage_banner', 'meta_title', 'about_origin'

  @Column({ type: "text" })
  value!: string; // Stores text, html, or JSON stringified settings

  @Column({ nullable: true })
  description!: string;
}
