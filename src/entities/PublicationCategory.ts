import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Publication } from "./Publication";

@Entity("publication_categories")
export class PublicationCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true, type: "text" })
  description!: string;

  @OneToMany(() => Publication, (pub) => pub.category)
  publications!: Publication[];
}
