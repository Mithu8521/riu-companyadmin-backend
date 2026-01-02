import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validates that at least one of the specified properties is present
 */
export function AtLeastOneOf(
  propertyNames: string[],
  validationOptions?: ValidationOptions,
): ClassDecorator {
  return function (target: Function) {
    registerDecorator({
      name: 'AtLeastOneOf',
      target: target,
      propertyName: '__atLeastOneOf__', // dummy property name
      options: validationOptions,
      constraints: propertyNames,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const object = args.object as Record<string, any>;
          return propertyNames.some(
            (field) =>
              object[field] !== undefined &&
              object[field] !== null &&
              object[field].toString().trim() !== '',
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `At least one of the following fields must be provided: ${args.constraints.join(', ')}`;
        },
      },
    });
  };
}
