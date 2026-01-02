import { GraphCategoryTypeEnum } from '@app/utils/enums/Status';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePublishGraphDto {
  @IsNumber()
  @IsNotEmpty()
  graphId: number;

  @IsEnum(GraphCategoryTypeEnum)
  @IsNotEmpty()
  category: GraphCategoryTypeEnum;

  @IsString()
  @IsNotEmpty()
  query: string;

  @IsString()
  @IsNotEmpty()
  script: string;
}
