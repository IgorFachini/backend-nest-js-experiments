import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import {
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/sequelize';
import { RefreshToken } from './refresh-token.entity';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

describe('AuthService.getMe', () => {
  let service: AuthService;
  const userServiceMock = {
    findById: jest.fn().mockName('findById'),
    findByEmail: jest.fn().mockName('findByEmail'),
  };
  const jwtMock = {
    sign: jest.fn().mockImplementation((_p, opts?: any) => {
      // include exp sim for traceability
      return 'signed.jwt.token.' + (opts?.expiresIn ?? '');
    }),
  };
  const configMock = {
    get: jest.fn((key: string, def?: any) => {
      const map: Record<string, any> = {
        JWT_SECRET: 'unit-secret',
        ACCESS_TOKEN_TTL: '15m',
        REFRESH_TOKEN_TTL: '7d',
      };
      return map[key] ?? def;
    }),
  };
  const refreshTokenModelMock = {
    create: jest.fn().mockImplementation(async (data) => ({ id: 1, ...data })),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: false })],
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
        {
          provide: getModelToken(RefreshToken),
          useValue: refreshTokenModelMock,
        },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getMe', () => {
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

  describe('login & refresh flow', () => {
    const plainUser = {
      id: 10,
      email: 'user@example.com',
      password: 'hashed',
      name: 'User',
    };

    beforeEach(() => {
      userServiceMock.findByEmail.mockResolvedValue(plainUser);
      userServiceMock.findById.mockResolvedValue({
        get: () => ({ ...plainUser }),
      });
      refreshTokenModelMock.create.mockClear();
      refreshTokenModelMock.findOne.mockReset();
    });

    it('login returns OAuth-style token response', async () => {
      const res = await service.login({
        email: plainUser.email,
        password: 'any',
      } as any);
      expect(res).toHaveProperty('access_token');
      expect(res).toHaveProperty('refresh_token');
      expect(res).toHaveProperty('expires_in');
      expect(res).toHaveProperty('refresh_expires_in');
      expect(res).toHaveProperty('token_type', 'Bearer');
      expect(res.user.email).toBe(plainUser.email);
      expect(res.refresh_expires_in).toBeGreaterThan(res.expires_in);
      expect(refreshTokenModelMock.create).toHaveBeenCalledTimes(1);
    });

    it('login throws Unauthorized with invalid user', async () => {
      userServiceMock.findByEmail.mockResolvedValueOnce(null);
      await expect(
        service.login({ email: 'x@x.com', password: 'nope' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('refresh returns new rotated tokens', async () => {
      // First: perform login
      const loginRes = await service.login({
        email: plainUser.email,
        password: 'pw',
      } as any);
      const oldRefresh = loginRes.refresh_token;
      const hash = createHash('sha256').update(oldRefresh).digest('hex');
      // Mock findOne to return active token entity
      const tokenEntity = {
        userId: plainUser.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: null,
        isActive: () => true,
        save: jest.fn().mockResolvedValue(undefined),
      };
      refreshTokenModelMock.findOne.mockResolvedValueOnce(tokenEntity);
      const refreshed = await service.refresh(oldRefresh);
      expect(refreshed.refresh_token).not.toEqual(oldRefresh);
      expect(tokenEntity.save).toHaveBeenCalled();
      expect(refreshed).toHaveProperty('access_token');
      expect(refreshed).toHaveProperty('token_type', 'Bearer');
    });

    it('refresh with invalid token rejects', async () => {
      refreshTokenModelMock.findOne.mockResolvedValueOnce(null);
      await expect(service.refresh('invalidtoken')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('refresh with expired token rejects', async () => {
      const fake = 'abc123';
      const hash = createHash('sha256').update(fake).digest('hex');
      const tokenEntity = {
        userId: plainUser.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: null,
        isActive: () => false,
        save: jest.fn(),
      };
      refreshTokenModelMock.findOne.mockResolvedValueOnce(tokenEntity);
      await expect(service.refresh(fake)).rejects.toThrow(ForbiddenException);
    });
  });

  it('throws NotFoundException when missing', async () => {
    userServiceMock.findById.mockResolvedValue(null);
    await expect(service.getMe(99)).rejects.toThrow(NotFoundException);
  });
});
