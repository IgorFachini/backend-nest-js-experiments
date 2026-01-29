import { Controller, Post, Body, Inject, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { LoginResponseDto } from '../auth/auth.dtos';
import { CreateUserDto } from './user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    type: LoginResponseDto,
    description: 'User created',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    // Auto-login: generate tokens
    const userObj = user['dataValues'] || user;
    const userSafe = { ...userObj };
    if ('password' in userSafe) delete userSafe.password;

    return this.authService.buildAuthResponse(user.id, user.email, userSafe);
  }
}
