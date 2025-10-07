import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../../src/user/user.entity';
import { UserService } from '../../src/user/user.service';
import { Sequelize } from 'sequelize-typescript';

describe('User integration (sqlite in-memory)', () => {
  let userService: UserService;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          models: [User],
          synchronize: true,
          logging: false,
        }),
        SequelizeModule.forFeature([User]),
      ],
      providers: [UserService],
    }).compile();

    userService = module.get<UserService>(UserService);
    sequelize = module.get<Sequelize>(Sequelize);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('creates and finds a user', async () => {
    const dto = {
      email: 'int@example.com',
      password: 'password',
      name: 'Int User',
    };
    const created = await userService.create(dto as any);
    expect(created).toBeDefined();
    const found = await userService.findByEmail(dto.email);
    expect(found).toBeDefined();
    expect(found.email).toBe(dto.email);
  });

  it('throws ConflictException when creating duplicate email', async () => {
    const dto = {
      email: 'dup-int@example.com',
      password: 'password',
      name: 'Dup Int',
    };
    await userService.create(dto as any);
    await expect(userService.create(dto as any)).rejects.toMatchObject({
      status: 409,
      message: 'Email already registered',
    });
  });
});
