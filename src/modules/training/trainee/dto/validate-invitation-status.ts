import { ApiProperty } from '@nestjs/swagger';
import { InvitationTrainingStatus, TrainingStatus } from '@utils/enums/Status';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class ValidateInvitationTrainingDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    trainingId: number;

    @ApiProperty({ enum:  InvitationTrainingStatus})
    @IsNotEmpty()
    @IsEnum(InvitationTrainingStatus)
    invitationTrainingStatus: InvitationTrainingStatus;
}