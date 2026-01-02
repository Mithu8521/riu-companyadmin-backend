import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateEmissionQuestionDto {
    @IsNotEmpty()
    @IsNumber({}, { message: 'questionId must be a number.' })
    questionId: number; // Accepts integers only by default

    @IsNotEmpty()
    @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'density must be a valid float value.' })
    density: number; // Accepts floating-point numbers like 2.4

    @IsNotEmpty()
    @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'calorificValue must be a valid float value.' })
    calorificValue: number; // Accepts floating-point numbers like 2.4

    @IsNotEmpty()
    @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'emissionFactor must be a valid float value.' })
    emissionFactor: number; // Accepts floating-point numbers like 2.4
}
