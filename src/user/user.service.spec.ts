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

  it('create should throw ConflictException on duplicate email', async () => {
    const email = 'dup@example.com';
    // first call returns user (mock create), after that findOne should simulate found email
    mockUserModel.findOne.mockImplementationOnce(() => Promise.resolve(null));
    await service.create({ email, password: 'pass', name: 'Dup' } as any);
    // next findOne call for same email returns a user signaling duplicate
    mockUserModel.findOne.mockImplementationOnce(() =>
      Promise.resolve({ id: 99, email, password: 'hash' }),
    );
    await expect(
      service.create({ email, password: 'pass', name: 'Dup2' } as any),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Email already registered',
    });
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
