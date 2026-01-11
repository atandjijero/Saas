import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'secret' })
  password: string;

  @ApiProperty({ example: 'VENDEUR' })
  role: string;
}
