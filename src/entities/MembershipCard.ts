import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Member } from "./Member";

@Entity("membership_cards")
export class MembershipCard {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Member, (member) => member.cards)
  @JoinColumn({ name: "member_id" })
  member!: Member;

  @Column({ name: "card_number" })
  cardNumber!: string;

  @Column({ name: "card_pdf_url", type: "text" })
  cardPdfUrl!: string;

  @CreateDateColumn({ name: "generated_at" })
  generatedAt!: Date;
}
