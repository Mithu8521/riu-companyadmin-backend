import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GetTopicDto {
    @ApiProperty()
    @IsString()
    frameworkId: string;  
}
