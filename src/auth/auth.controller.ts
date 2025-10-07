import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../user/user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { UserProfileDto } from '../user/user-profile.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  RefreshRequestDto,
  LoginResponseDto,
  RefreshResponseDto,
} from './auth.dtos';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT token' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginUserDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiOkResponse({ type: UserProfileDto })
  async me(@Req() req: any) {
    const id = req.user?.id || req.user?.userId || req.user?.sub;
    return this.authService.getMe(id);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Exchange a valid refresh token for new tokens' })
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiResponse({ status: 403, description: 'Invalid or expired refresh token' })
  async refresh(@Body() body: RefreshRequestDto): Promise<RefreshResponseDto> {
    return this.authService.refresh(body.refreshToken);
  }
}
