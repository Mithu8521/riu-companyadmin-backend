import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_sub_location')
export class SubLocationEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    locationId: number;

    @Column()
    subLocation: string;

    @Column({ nullable: true })
    assignedUserId: string

    @Column()
    isDeletable: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    constructor(locationId: number, subLocation: string, assignedUserId: string, isDeletable: boolean) {
        this.locationId = locationId;
        this.subLocation = subLocation;
        this.assignedUserId = assignedUserId;
        this.isDeletable = isDeletable;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
