import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity('company_profile')
export class CompanyProfile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('jsonb', { nullable: true })
  socialMedia: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };

  @Column({ type: 'varchar', length: 100, nullable: true })
  slogan: string;

  @Column({ type: 'text', nullable: true })
  logo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pageTitle: string;

  @Column('jsonb', { nullable: true })
  contact: {
    address?: string;
    email?: string;
    phone?: string;
  };

  @Column('jsonb', { nullable: true })
  audit: {
    dateModified?: Date;
  };
}
