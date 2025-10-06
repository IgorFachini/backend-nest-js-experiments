import { CreateUserDto } from '../../src/user/user.dto';

export function createUserDto(
  overrides?: Partial<CreateUserDto>,
): CreateUserDto {
  return {
    email: overrides?.email ?? 'factory@example.com',
    password: overrides?.password ?? 'password',
    name: overrides?.name ?? 'Factory User',
  } as CreateUserDto;
}
