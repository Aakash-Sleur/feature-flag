// src/templates/email/password-reset.template.ts

import { baseEmailTemplate } from './base.template.js';

export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}

export const passwordResetTemplate = (data: PasswordResetEmailData): string => {
  const { name, resetUrl, expiresIn = '1 hour' } = data;

  const content = `
    <p>Hi ${name},</p>
    <p>Reset your password using the link below.</p>
    <p>This link expires in ${expiresIn}.</p>
  `;

  return baseEmailTemplate({
    title: 'Reset Password',
    preheader: 'Password reset link',
    content,
    buttonText: 'Reset Password',
    buttonUrl: resetUrl,
    footerText: 'If you did not request this, ignore this email',
  });
};

export const passwordResetSubject = (): string => {
  return 'Reset your password';
};