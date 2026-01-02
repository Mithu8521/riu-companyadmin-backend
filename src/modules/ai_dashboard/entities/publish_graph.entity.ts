import { GraphCategoryTypeEnum } from '@app/utils/enums/Status';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('riu_publish_graph')
export class PublishGraphEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'graph_id', type: 'bigint' })
  graphId: number;

  @Column({
    type: 'enum',
    enum: GraphCategoryTypeEnum,
    name: 'category',
  })
  category: GraphCategoryTypeEnum;

  @Column({ type: 'text' })
  query: string;

  @Column({ type: 'text' })
  script: string;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  constructor(
    userId: number,
    graphId: number,
    category: GraphCategoryTypeEnum,
    query: string,
    script: string,
    status: number = 1,
  ) {
    this.userId = userId;
    this.graphId = graphId;
    this.category = category;
    this.query = query;
    this.script = script;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
