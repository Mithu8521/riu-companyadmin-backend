import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class GetSectorQuestionDto {
    @ApiProperty()
    @IsString()
    frameworkTitle: string;
  
    @ApiProperty()
    @IsNumber()
    financialYearId: number;
  
    @ApiProperty({ default: false,required: false})
    @IsBoolean()
    @IsOptional()
    topicCreated: boolean;

    @ApiProperty({ default: false,required: false})
    @IsBoolean()
    @IsOptional()
    kpiCreated: boolean;

    @ApiProperty({ default: false,required: false})
    @IsBoolean()
    @IsOptional()
    questionCreated: boolean;

    @ApiProperty()
    @IsNumber()
    createdBy: number;

    @ApiProperty()
    @IsNumber()
    companyId: number;

    @ApiProperty({ default: true,required: false})
    @IsBoolean()
    @IsOptional()
    isDeletable: boolean;    
}
