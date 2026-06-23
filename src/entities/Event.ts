import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true, type: "text" })
  description!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "start_date" })
  startDate!: Date;

  @Column({ name: "end_date" })
  endDate!: Date;

  @Column({ name: "registration_deadline", nullable: true, type: "timestamp" })
  registrationDeadline!: Date | null;

  @Column({ name: "event_type", default: "Conference" })
  eventType!: string; // 'Conference', 'Workshop', 'Seminar', 'Webinar', 'Announcement'

  @Column({ name: "banner_url", nullable: true, type: "text" })
  bannerUrl!: string | null;

  @Column({ name: "schedule_details", type: "json", nullable: true })
  scheduleDetails!: any;

  @Column({ name: "venue_details", nullable: true })
  venueDetails!: string;

  @Column({ name: "registration_link", nullable: true, type: "text" })
  registrationLink!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
