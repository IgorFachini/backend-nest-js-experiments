import { Dialect } from 'sequelize';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';

export const sequelizeFactory = (
  config: ConfigService,
): SequelizeModuleOptions => {
  const dbName = config.get<string>('DB_NAME', 'nest');
  const username = config.get<string>('DB_USER', 'root');
  const password = config.get<string>('DB_PASS', 'password');
  const host = config.get<string>('DB_HOST', 'localhost');
  const port = config.get<number | string>('DB_PORT', 3306) as number;
  const minPool = config.get<number | string>('DB_MIN_POOL_SIZE', 1) as number;
  const maxPool = config.get<number | string>('DB_MAX_POOL_SIZE', 10) as number;

  return {
    database: dbName,
    username,
    password,
    host,
    port: typeof port === 'string' ? parseInt(port, 10) : port,
    dialect: 'mysql' as Dialect,
    pool: {
      min:
        typeof minPool === 'string' ? parseInt(String(minPool), 10) : minPool,
      max:
        typeof maxPool === 'string' ? parseInt(String(maxPool), 10) : maxPool,
    },
    logging: (msg) => console.log('[Sequelize]', msg),
    autoLoadModels: true,
    synchronize: true,
    models: [User],
  };
};
