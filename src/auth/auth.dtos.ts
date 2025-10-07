import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJI...' })
  access_token: string;

  @ApiProperty({ example: 'Bearer' })
  token_type: string;

  @ApiProperty({
    description: 'Access token expiration in seconds',
    example: 900,
  })
  expires_in: number;

  @ApiProperty({ description: 'Opaque refresh token string' })
  refresh_token: string;

  @ApiProperty({
    description: 'Refresh token expiration in seconds',
    example: 604800,
  })
  refresh_expires_in: number;

  @ApiProperty({ description: 'User object without sensitive fields' })
  user: any;
}

export class RefreshRequestDto {
  @ApiProperty()
  refreshToken: string;
}

export class RefreshResponseDto extends LoginResponseDto {}
