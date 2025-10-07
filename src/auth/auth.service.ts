import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginUserDto } from '../user/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const userObj = user['dataValues'] || user;
      const result = { ...userObj };
      delete result.password;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginUserDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return {
      access_token: this.jwtService.sign({ sub: user.id, email: user.email }),
      user,
    };
  }

  async getMe(userId: number) {
    const entity = await this.userService.findById(userId);
    if (!entity) throw new NotFoundException('User not found');
    const plain = (entity as any).get ? entity.get({ plain: true }) : entity;
    // Remove sensitive field without triggering unused variable lint warning
    const safe = { ...plain };
    if ('password' in safe) {
      delete (safe as any).password;
    }
    return safe;
  }
}
