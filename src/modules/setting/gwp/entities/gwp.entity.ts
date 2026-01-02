import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('riu_ghg_database') // Keeping the same table name to maintain existing data
export class GhgDataBaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index({ unique: true })
    financialYearId: number;

    @Column()
    databaseId: number; 

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
    ) {
        this.financialYearId = financialYearId;
        this.databaseId = databaseId;
        this.updatedBy = updatedBy;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
