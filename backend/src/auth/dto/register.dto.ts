import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'admin' })
  password: string;

  @ApiProperty({ example: 'DIRECTEUR' })
  role: string;

  @ApiProperty({ required: false, example: null })
  tenantId?: string;
}
