import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('riu_emission_question_data')
export class EmissionSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    questionId: number;

    @Column('float') // Ensures this field can store float values
    density: number;

    @Column('float') // Ensures this field can store float values
    calorificValue: number;

    @Column('float') // Ensures this field can store float values
    emissionFactor: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    constructor(
        questionId: number,
        density: number,
        calorificValue: number,
        emissionFactor: number
    ) {
        this.questionId = questionId;
        this.density = density;
        this.calorificValue = calorificValue;
        this.emissionFactor = emissionFactor;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
