import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateTopicDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    topicId: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    frameworkId: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    topicTitle: string; 
}
