import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { google } from 'googleapis';
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
    logger.warn('Email sender is not configured; password reset email was skipped');
  }
}

class GmailApiEmailSender implements EmailSender {
  private readonly gmail: ReturnType<typeof google.gmail>;
  private readonly from: string;
  private readonly senderUser: string;

  constructor(input: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    user: string;
    from: string;
  }) {
    const oauth2Client = new google.auth.OAuth2(input.clientId, input.clientSecret);
    oauth2Client.setCredentials({
      refresh_token: input.refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    this.senderUser = input.user;
    this.from = input.from;
  }

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    const mimeMessage = [
      `From: ${this.from}`,
      `To: ${input.to}`,
      'Subject: Recupera tu contrasena de FreeLiga',
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      '<p>Hemos recibido una solicitud para recuperar tu contrasena en FreeLiga.</p>',
      '<p>Este enlace caduca en 15 minutos y solo se puede usar una vez:</p>',
      `<p><a href="${input.resetUrl}">Restablecer contrasena</a></p>`,
      '<p>Si no solicitaste este cambio, ignora este mensaje.</p>',
    ].join('\r\n');

    const raw = Buffer.from(mimeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await this.gmail.users.messages.send({
      userId: this.senderUser,
      requestBody: { raw },
    });
  }
}

class SmtpEmailSender implements EmailSender {
  private readonly transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private readonly from: string;

  constructor(input: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }) {
    const transportConfig: SMTPTransport.Options = {
      host: input.host,
      port: input.port,
      secure: input.port === 465,
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 10000,
      auth: {
        user: input.user,
        pass: input.pass,
      },
    };

    this.transporter = nodemailer.createTransport<SMTPTransport.SentMessageInfo>(transportConfig);
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
const gmailClientId = process.env.GMAIL_CLIENT_ID;
const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;
const gmailUser = process.env.GMAIL_SENDER_EMAIL;
const mailFrom = process.env.MAIL_FROM || gmailUser || 'FreeLiga <no-reply@freesquash.local>';

const gmailApiConfigured = Boolean(
  gmailClientId && gmailClientSecret && gmailRefreshToken && gmailUser,
);

const smtpConfigured = Boolean(smtpHost && smtpUser && smtpPass);

export const emailSender: EmailSender = gmailApiConfigured
  ? new GmailApiEmailSender({
      clientId: gmailClientId!,
      clientSecret: gmailClientSecret!,
      refreshToken: gmailRefreshToken!,
      user: gmailUser!,
      from: mailFrom,
    })
  : smtpConfigured
    ? new SmtpEmailSender({
        host: smtpHost!,
        port: smtpPort,
        user: smtpUser!,
        pass: smtpPass!,
        from: mailFrom,
      })
    : new NoopEmailSender();
