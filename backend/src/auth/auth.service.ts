import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log('Validating user:', email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    console.log('User found:', !!user);
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      console.log('Password match:', match);
      if (match) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    if (user.twoFactorEnabled) {
      return { requires2FA: true, userId: user.id };
    }
    const payload = { email: user.email, sub: user.id, role: user.role, tenantId: user.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async verify2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new UnauthorizedException('Invalid user');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) throw new UnauthorizedException('Invalid 2FA token');

    const payload = { email: user.email, sub: user.id, role: user.role, tenantId: user.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const secret = speakeasy.generateSecret({ name: `SaaS App (${user.email})` });
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);
    return { secret: secret.base32, qrCode };
  }

  async enable2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new UnauthorizedException('2FA not set up');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) throw new UnauthorizedException('Invalid token');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: '2FA enabled' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If an account exists, a reset email has been sent.' };

    // Generate a simple token (in production, use JWT or crypto)
    const resetToken = Math.random().toString(36).substring(2);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken },
    });

    // In production, send email with reset link: /reset-password?token=${resetToken}
    console.log(`Reset link: http://localhost:3001/reset-password?token=${resetToken}`);

    return { message: 'If an account exists, a reset email has been sent.' };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { resetToken: token } });
    if (!user) throw new UnauthorizedException('Invalid token');

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null },
    });

    return { message: 'Password reset successfully' };
  }

  async register(email: string, password: string, role: string, tenantId?: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as any,
        tenantId: role !== 'SUPERADMIN' ? tenantId : null,
      },
    });
    return user;
  }
}