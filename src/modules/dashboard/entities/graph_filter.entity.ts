import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_graph_filter')
export class GraphFilterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  graphName: string; 

  @Column()
  userId: number;

  @Column()
  filter: string; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(graphName: string, userId: number, filter: string) {
    this.graphName = graphName;
    this.userId = userId;
    this.filter = filter;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
