import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './user.entity';

describe('UserService', () => {
  let service: UserService;
  const mockUserModel = {
    create: jest
      .fn()
      .mockImplementation((dto) => Promise.resolve({ id: 1, ...dto })),
    findOne: jest
      .fn()
      .mockImplementation((query) =>
        Promise.resolve(
          query.where.email === 'found@example.com'
            ? { id: 1, email: 'found@example.com', password: 'hash' }
            : null,
        ),
      ),
    findByPk: jest
      .fn()
      .mockImplementation((id) =>
        Promise.resolve({ id, email: 'found@example.com' }),
      ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should return created user', async () => {
    const dto = { email: 'a@b.com', password: 'pass', name: 'Name' };
    const user = await service.create(dto as any);
    expect(user).toHaveProperty('id');
    expect(user.email).toBe(dto.email);
  });

  it('findByEmail returns user when found', async () => {
    const user = await service.findByEmail('found@example.com');
    expect(user).toBeDefined();
    expect(user.email).toBe('found@example.com');
  });

  it('findById returns user', async () => {
    const user = await service.findById(1);
    expect(user).toBeDefined();
    expect(user.id).toBe(1);
  });
});
