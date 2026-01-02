import { IsNumber, IsArray, ValidateNested, } from 'class-validator';
import { DocumentDto } from './document.dto';
import { Type } from 'class-transformer';


export class ListDocumentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents: DocumentDto[];
}
