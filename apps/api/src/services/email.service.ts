import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface PasswordResetEmailInput {
  to: string;
  resetUrl: string;
}

export interface EmailSender {
  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
}

class NoopEmailSender implements EmailSender {
  async sendPasswordResetEmail(_input: PasswordResetEmailInput): Promise<void> {
    logger.warn('SMTP is not configured; password reset email was skipped');
  }
}

class SmtpEmailSender implements EmailSender {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(input: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }) {
    this.transporter = nodemailer.createTransport({
      host: input.host,
      port: input.port,
      secure: input.port === 465,
      family: 4,
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 10000,
      auth: {
        user: input.user,
        pass: input.pass,
      },
    });
    this.from = input.from;
  }

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: 'Recupera tu contrasena de FreeLiga',
      html: `
        <p>Hemos recibido una solicitud para recuperar tu contrasena en FreeLiga.</p>
        <p>Este enlace caduca en 15 minutos y solo se puede usar una vez:</p>
        <p><a href="${input.resetUrl}">Restablecer contrasena</a></p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      `,
    });
  }
}

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || 'FreeLiga <no-reply@freesquash.local>';

export const emailSender: EmailSender = (smtpHost && smtpUser && smtpPass)
  ? new SmtpEmailSender({
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      from: mailFrom,
    })
  : new NoopEmailSender();
