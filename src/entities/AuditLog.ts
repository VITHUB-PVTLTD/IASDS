import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", nullable: true, type: "varchar" })
  userId!: string | null;

  @Column()
  action!: string;

  @Column({ nullable: true })
  entity!: string;

  @Column({ name: "entity_id", nullable: true, type: "varchar" })
  entityId!: string | null;

  @Column({ type: "json", nullable: true })
  details!: any;

  @Column({ name: "ip_address", nullable: true, type: "varchar" })
  ipAddress!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
