import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
const nodemailer = require('nodemailer');

@Injectable()
export class AuthService {
  private transporter: any;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

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
    if (user.role === 'SUPERADMIN' || user.role === 'DIRECTEUR') {
      if (!user.twoFactorEnabled) {
        return { requiresSetup2FA: true, userId: user.id };
      } else {
        return { requires2FA: true, userId: user.id };
      }
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

    console.log('Verifying 2FA for user:', user.email);
    console.log('Stored secret:', user.twoFactorSecret);
    console.log('Token to verify:', token);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 4, // Allow 4 time steps (120 seconds) tolerance
    });

    console.log('Verification result:', verified);

    if (!verified) throw new UnauthorizedException('Invalid 2FA token');

    const payload = { email: user.email, sub: user.id, role: user.role, tenantId: user.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async setup2FA(userId: string) {
    if (!userId) throw new UnauthorizedException('User ID is required');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    let secret;
    if (user.twoFactorSecret) {
      // Use existing secret
      secret = { base32: user.twoFactorSecret, otpauth_url: `otpauth://totp/SaaS%20App?secret=${user.twoFactorSecret}&issuer=SaaS%20App` };
    } else {
      // Generate new secret
      secret = speakeasy.generateSecret({ name: `SaaS App` });
      await this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret.base32 },
      });
    }

    console.log('Using 2FA secret for user:', user.email, 'Secret:', secret.base32);

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);
    console.log('Generated QR code URL:', secret.otpauth_url);

    return { secret: secret.base32, qrCode };
  }

  async enable2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new UnauthorizedException('2FA not set up');

    console.log('Enabling 2FA for user:', user.email);
    console.log('Stored secret:', user.twoFactorSecret);
    console.log('Token to verify:', token);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) tolerance
    });

    console.log('Enable verification result:', verified);

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

    // Send reset email
    try {
      await this.sendResetLink(email, resetToken);
    } catch (error) {
      console.error('Failed to send reset email:', error);
      // In production, you might want to handle this differently
    }

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

  /**
   * Envoi lien de réinitialisation mot de passe
   */
  async sendResetLink(to: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: `"SaaS App Auth" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe - SaaS App',
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;color:#333;">
          <tr>
            <td style="background:#004080;color:#fff;padding:16px;text-align:center;font-size:20px;font-weight:bold;">
              SaaS App Auth
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="font-size:16px;">Bonjour,</p>
              <p style="font-size:15px;">Vous avez demandé à réinitialiser votre mot de passe.</p>
              <p style="margin:25px 0;text-align:center;">
                <table align="center" cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="#004080" style="border-radius:4px;">
                      <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-weight:bold;color:#fff;text-decoration:none;">
                        Réinitialiser mon mot de passe
                      </a>
                    </td>
                  </tr>
                </table>
              </p>
              <p style="font-size:14px;color:#555;text-align:center;">Ce lien est valable pendant <b>1 heure</b>.</p>
              <p style="font-size:13px;color:#777;text-align:center;margin-top:20px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
              <p style="margin-top:30px;font-size:14px;">Merci,<br/><strong>L'équipe SaaS App</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f5f5;text-align:center;padding:12px;font-size:12px;color:#888;">
              © ${new Date().getFullYear()} SaaS App. Tous droits réservés.
            </td>
          </tr>
        </table>
      `,
    });
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