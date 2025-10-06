import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  const mockUserService = { create: jest.fn().mockResolvedValue({ id: 1 }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register calls userService.create', async () => {
    const dto = { email: 'x@x.com', password: 'pass', name: 'X' } as any;
    const result = await controller.register(dto);
    expect(mockUserService.create).toHaveBeenCalledWith(dto);
    expect(result).toHaveProperty('id');
  });
});
