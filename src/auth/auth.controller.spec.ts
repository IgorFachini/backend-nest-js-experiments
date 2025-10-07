import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController.me', () => {
  let controller: AuthController;
  const authServiceMock = { getMe: jest.fn(), login: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get(AuthController);
  });

  afterEach(() => jest.resetAllMocks());

  it('returns profile using user.id', async () => {
    authServiceMock.getMe.mockResolvedValue({ id: 10, email: 'x@y.com' });
    const req: any = { user: { id: 10 } };
    const result = await controller.me(req);
    expect(result).toMatchObject({ id: 10, email: 'x@y.com' });
    expect(authServiceMock.getMe).toHaveBeenCalledWith(10);
  });

  it('fallback to user.userId', async () => {
    authServiceMock.getMe.mockResolvedValue({ id: 11, email: 'z@y.com' });
    const req: any = { user: { userId: 11 } };
    await controller.me(req);
    expect(authServiceMock.getMe).toHaveBeenCalledWith(11);
  });
});
