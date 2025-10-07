import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ example: '2025-01-01T12:00:00.000Z' })
  createdAt?: Date;

  @ApiProperty({ example: '2025-01-01T12:10:00.000Z' })
  updatedAt?: Date;
}
