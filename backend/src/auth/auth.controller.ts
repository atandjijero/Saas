import { Controller, Request, Post, UseGuards, Body, UnauthorizedException } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 201, description: 'Logged in' })
  @ApiBody({ type: LoginDto })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 registrations per hour
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.role, body.tenantId);
  }

  @Post('verify-2fa')
  @ApiOperation({ summary: 'Verify 2FA token' })
  async verify2FA(@Body() body: Verify2FADto) {
    return this.authService.verify2FA(body.userId, body.token);
  }

  @Post('setup-2fa')
  @ApiOperation({ summary: 'Setup 2FA for user' })
  async setup2FA(@Body() body: { userId: string }) {
    return this.authService.setup2FA(body.userId);
  }

  @Post('enable-2fa')
  @ApiOperation({ summary: 'Enable 2FA after verification' })
  async enable2FA(@Body() body: { userId: string; token: string }) {
    return this.authService.enable2FA(body.userId, body.token);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 attempts per hour
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }
}