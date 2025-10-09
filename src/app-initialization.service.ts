import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user/user.service';

@Injectable()
export class AppInitializationService {
  private readonly logger = new Logger(AppInitializationService.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async initialize(): Promise<void> {
    await this.ensureDefaultUserExists();
  }

  private async ensureDefaultUserExists(): Promise<void> {
    try {
      const defaultEmail = this.configService.get<string>('DEFAULT_USER_EMAIL');
      const defaultPassword = this.configService.get<string>(
        'DEFAULT_USER_PASSWORD',
      );

      if (!defaultEmail || !defaultPassword) {
        this.logger.warn(
          'DEFAULT_USER_EMAIL ou DEFAULT_USER_PASSWORD não configurados. Pulando criação do usuário padrão.',
        );
        return;
      }

      const existingUser = await this.userService.findByEmail(defaultEmail);

      if (existingUser) {
        this.logger.log(`Usuário padrão já existe: ${defaultEmail}`);
        return;
      }

      await this.userService.createDefaultUser({
        email: defaultEmail,
        password: defaultPassword,
        name: 'Admin User',
      });

      this.logger.log(`✅ Usuário padrão criado com sucesso: ${defaultEmail}`);
    } catch (error) {
      this.logger.error('Erro ao criar usuário padrão:', error.message);
      throw error;
    }
  }
}
