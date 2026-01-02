import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsEmail, IsNotEmpty } from 'class-validator';

export class AddTraineeAndInviteTraineeDto {
    @ApiProperty({ description: 'The ID of the training' })
    @IsNotEmpty()
    trainingId: number;

    @ApiProperty({ description: 'Array of email addresses' })
    @IsArray()
    @ArrayNotEmpty()
    @IsEmail({}, { each: true })
    traineeEmails: string[];
}
