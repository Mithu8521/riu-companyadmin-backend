import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class EmailReminderDto {
    @ApiProperty({
        description: 'Array of email addresses',
        example: ['user1@example.com', 'user2@example.com']
    })
    @IsArray()
    @IsNotEmpty()
    emailAddresses: string[];

    @ApiProperty({
        description: 'Reminder message to be sent',
        example: 'Please complete the assigned questions before the deadline.'
    })
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({
        description: 'Array of question IDs',
        example: [1, 2, 3]
    })
    @IsArray()
    @IsNotEmpty()
    questionIds: number[];
}