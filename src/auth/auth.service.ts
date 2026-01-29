import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginUserDto } from '../user/user.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { RefreshToken } from './refresh-token.entity';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectModel(RefreshToken)
    private readonly refreshTokenModel: typeof RefreshToken,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const userObj = user['dataValues'] || user;
      const result = { ...userObj };
      delete result.password;
      return result;
    }
  }

  async login(loginDto: LoginUserDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.buildAuthResponse(user.id, user.email, user);
  }

  async getMe(userId: number) {
    const entity = await this.userService.findById(userId);
    if (!entity) throw new NotFoundException('User not found');
    const plain = (entity as any).get ? entity.get({ plain: true }) : entity;
    const safe = { ...plain };
    if ('password' in safe) {
      delete (safe as any).password;
    }
    return safe;
  }

  private getAccessTokenTtlSeconds(): number {
    const ttl = this.config.get<string>('ACCESS_TOKEN_TTL', '15m');
    const ttlStr = String(ttl);
    if (/^\d+$/.test(ttlStr)) return parseInt(ttlStr, 10);
    const match = ttlStr.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  private getRefreshTokenTtlSeconds(): number {
    const ttl = this.config.get<string>('REFRESH_TOKEN_TTL', '7d');
    const ttlStr = String(ttl);
    if (/^\d+$/.test(ttlStr)) return parseInt(ttlStr, 10);
    const match = ttlStr.match(/^(\d+)([smhd])$/);
    if (!match) return 604800;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 604800;
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueRefreshToken(userId: number) {
    const raw = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(raw);
    const expiresInSec = this.getRefreshTokenTtlSeconds();
    const expiresAt = new Date(Date.now() + expiresInSec * 1000);
    await this.refreshTokenModel.create({
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      replacedByTokenHash: null,
    });
    return { raw, expiresAt };
  }

  async buildAuthResponse(userId: number, email: string, userSafe: any) {
    const accessTtlSec = this.getAccessTokenTtlSeconds();
    const access_token = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: accessTtlSec },
    );
    const { raw: refreshToken, expiresAt: refreshExpiresAt } =
      await this.issueRefreshToken(userId);
    const refreshTtlSec = Math.floor(
      (refreshExpiresAt.getTime() - Date.now()) / 1000,
    );
    return {
      access_token,
      token_type: 'Bearer',
      expires_in: accessTtlSec,
      refresh_token: refreshToken,
      refresh_expires_in: refreshTtlSec,
      user: userSafe,
    };
  }

  async refresh(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const entity = await this.refreshTokenModel.findOne({
      where: { tokenHash: hash },
    });
    if (!entity) throw new ForbiddenException('Invalid refresh token');
    if (!entity.isActive())
      throw new ForbiddenException('Refresh token expired or revoked');
    const user = await this.userService.findById(entity.userId);
    if (!user) throw new NotFoundException('User not found');
    const userObj = (user as any).get ? user.get({ plain: true }) : user;
    if ('password' in userObj) delete userObj.password;
    entity.revokedAt = new Date();
    await entity.save();
    return this.buildAuthResponse(user.id, user.email, userObj);
  }
}
