import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('riu_ghg_protocol')
export class GhgProtocolEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index({ unique: true })
    financialYearId: number;

    @Column()
    databaseId: number;

    @Column({ nullable: true })
    gwpId: number;

    @Column()
    updatedBy: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    constructor(
        financialYearId: number,
        databaseId: number,
        updatedBy: number,
        gwpId?: number
    ) {
        this.financialYearId = financialYearId;
        this.databaseId = databaseId;
        this.gwpId = gwpId || null;
        this.updatedBy = updatedBy;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}