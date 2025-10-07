import {
  INestApplication,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

class JwtAuthGuardMock implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 42, email: 'test@example.com' };
    return true;
  }
}

describe('GET /auth/me (e2e)', () => {
  let app: INestApplication;
  const authServiceMock = {
    getMe: jest
      .fn()
      .mockResolvedValue({ id: 42, email: 'test@example.com', name: 'Tester' }),
    login: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    })
      .overrideGuard(JwtAuthGuardMock as any)
      .useValue(new JwtAuthGuardMock())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns authenticated profile', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({ id: 42, email: 'test@example.com' });
      });
  });
});
