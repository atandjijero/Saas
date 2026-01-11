import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'superadmin@example.com' })
  email: string;

  @ApiProperty({ example: 'admin' })
  password: string;
}
