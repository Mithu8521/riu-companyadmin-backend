import { LocationEntity } from "@modules/setting/source/entities/source.entity";
import { CompanyEntity } from "@modules/setting/user/entities/user.entity";
import { ReportingApprovalStatus } from "@utils/enums/Status";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";

@Entity('riu_reporting_due_date_override')
export class ReportingDueDateOverrideEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @ManyToOne(() => CompanyEntity)
    @JoinColumn({ name: 'user_id' })
    user: CompanyEntity;

    @Column()
    financialYearId: number;

    @Column()
    questionId: number;

    @Column()
    sourceId: number;

    @ManyToOne(() => LocationEntity)
    @JoinColumn({ name: 'source_id' })
    source: LocationEntity;

    @Column()
    fromDate: string;

    @Column()
    toDate: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    requestDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    dueDateTime: Date | null;

    @Column({ nullable: true })
    approverId: number | null;

    @ManyToOne(() => CompanyEntity, { nullable: true })
    @JoinColumn({ name: 'approver_id' })
    approver: CompanyEntity | null;

    @Column({ type: 'timestamp', nullable: true })
    approvalDate: Date | null;

    @Column({
        type: 'enum',
        enum: ReportingApprovalStatus,
        default: ReportingApprovalStatus.PENDING,
    })
    status: ReportingApprovalStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    constructor(partial?: Partial<ReportingDueDateOverrideEntity>) {
        if (partial) {
            Object.assign(this, partial);
        }
    }
}