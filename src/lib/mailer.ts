import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Konfiguracja z ENV (bezpiecznie, nie w kodzie)
const config = {
  host: import.meta.env.SMTP_HOST || process.env.SMTP_HOST,
  port: parseInt(import.meta.env.SMTP_PORT || process.env.SMTP_PORT || '587'),
  secure: false, // TLS na porcie 587
  auth: {
    user: import.meta.env.SMTP_USER || process.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASS || process.env.SMTP_PASS,
  },
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    if (!config.host || !config.auth.user || !config.auth.pass) {
      throw new Error('SMTP configuration missing. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.');
    }
    transporter = nodemailer.createTransport(config);
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"ADR Pomorze" <${config.auth.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });
    console.log(`📧 Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return false;
  }
}

// Test połączenia SMTP
export async function testConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ SMTP connection verified');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
}
