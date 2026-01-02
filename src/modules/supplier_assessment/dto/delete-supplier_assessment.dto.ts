import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class DeleteSupplierAssessmentDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    assessmentId: number;
}
