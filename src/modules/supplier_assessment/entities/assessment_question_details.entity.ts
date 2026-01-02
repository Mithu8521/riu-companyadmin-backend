export class SectorQuestionDetails { }
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_assessment_question_detail')
export class AssessmentQuestionDetailsEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    questionId: number;

    @Column()
    optionType: string;

    @Column()
    option: string;

    @Column()
    rules: string;

    @Column()
    createdBy: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    constructor(
        questionId: number,
        optionType: string,
        option: string,
        rules: string,
        createdBy: number,
    ) {
        this.questionId = questionId;
        this.optionType = optionType;
        this.option = option;
        this.rules = rules;
        this.createdBy = createdBy;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
