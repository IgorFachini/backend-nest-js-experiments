import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';

describe('AuthService.getMe', () => {
  let service: AuthService;
  const userServiceMock = {
    findById: jest.fn().mockName('findById'),
    findByEmail: jest.fn().mockName('findByEmail'),
  };
  const jwtMock = {
    sign: jest.fn().mockReturnValue('token').mockName('sign'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.resetAllMocks());

  it('returns user without password', async () => {
    userServiceMock.findById.mockResolvedValue({
      get: () => ({ id: 1, email: 'a@b.com', password: 'hash', name: 'A' }),
    });
    const result = await service.getMe(1);
    expect(result).toMatchObject({ id: 1, email: 'a@b.com', name: 'A' });
    expect((result as any).password).toBeUndefined();
  });

  it('throws NotFoundException when missing', async () => {
    userServiceMock.findById.mockResolvedValue(null);
    await expect(service.getMe(99)).rejects.toThrow(NotFoundException);
  });
});
