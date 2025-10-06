import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserService } from '../src/user/user.service';
import { AuthService } from '../src/auth/auth.service';

describe('API Endpoints (e2e)', () => {
  let app: INestApplication;

  const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };

  const mockUserService = {
    create: jest
      .fn()
      .mockImplementation((dto) => Promise.resolve({ id: 1, ...dto })),
    findByEmail: jest
      .fn()
      .mockImplementation((email) =>
        Promise.resolve(
          email === mockUser.email
            ? { id: 1, ...mockUser, password: '$2b$10$hash' }
            : null,
        ),
      ),
  };

  const mockAuthService = {
    login: jest.fn().mockImplementation((loginDto) => {
      if (
        loginDto.email === mockUser.email &&
        loginDto.password === 'password'
      ) {
        return Promise.resolve({
          access_token: 'fake-jwt-token',
          user: mockUser,
        });
      }
      return Promise.reject({ status: 401 });
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UserService)
      .useValue(mockUserService)
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) returns Hello World', () =>
    request(app.getHttpServer()).get('/').expect(200).expect('Hello World!'));

  it('POST /users/register creates a user', () => {
    const payload = {
      email: 'new@example.com',
      password: 'password',
      name: 'New User',
    };
    return request(app.getHttpServer())
      .post('/users/register')
      .send(payload)
      .expect(201)
      .then((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe(payload.email);
      });
  });

  it('POST /auth/login returns token on valid credentials', () => {
    const payload = { email: 'test@example.com', password: 'password' };
    return request(app.getHttpServer())
      .post('/auth/login')
      .send(payload)
      .expect(201)
      .then((res) => {
        expect(res.body).toHaveProperty('access_token');
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toBe(payload.email);
      });
  });
});
