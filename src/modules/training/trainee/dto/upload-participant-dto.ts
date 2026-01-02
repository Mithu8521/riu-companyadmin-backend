import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from "class-validator";

// DTO for training participants
class TrainingParticipantDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    trainingId: number;
  
    @ApiProperty({ type: [Number] })
    @IsArray()
    @IsNotEmpty()
    userId: number[];
  }
  
  // DTO for uploadParticipant request
  export class UploadParticipantDto {
    @ApiProperty({ type: [TrainingParticipantDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TrainingParticipantDto)
    trainingParticipants: TrainingParticipantDto[];
  
    @ApiProperty({ type: [String] })
    @IsArray()
    @IsNotEmpty()
    status: string[]; // Can include "REGISTERED", "COMPLETED"
  }