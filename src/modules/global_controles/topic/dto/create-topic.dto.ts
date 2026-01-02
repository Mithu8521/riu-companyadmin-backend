import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTopicDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    topicTitle: string;
  
    @ApiProperty()
    @IsNumber()
    frameworkId: number;

    @ApiProperty({ default: false,required: false})
    @IsBoolean()
    @IsOptional()
    kpiCreated: boolean;

    @ApiProperty({ default: false,required: false})
    @IsBoolean()
    @IsOptional()
    questionCreated: boolean;

    @ApiProperty({required: false})
    @IsNumber()
    @IsOptional()
    createdBy: number;

    @ApiProperty({required: false})
    @IsNumber()
    @IsOptional()
    updatedBy: number;

    @ApiProperty({required: false})
    @IsNumber()
    @IsOptional()
    companyId: number;

    @ApiProperty({ default: true,required: false})
    @IsBoolean()
    @IsOptional()
    isDeletable: boolean;    
}
