import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'new-email@example.com' })
  email?: string;

  @ApiProperty({ example: 'DIRECTEUR' })
  role?: string;
}
