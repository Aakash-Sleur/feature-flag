// src/templates/email/email-verification.template.ts

import { baseEmailTemplate } from './base.template.js';

export interface EmailVerificationData {
  name: string;
  verificationUrl: string;
  expiresIn?: string;
}

export const emailVerificationTemplate = (data: EmailVerificationData): string => {
  const { name, verificationUrl, expiresIn = '24 hours' } = data;

  const content = `
    <p>Hi ${name},</p>
    <p>Verify your email to complete registration.</p>
    <p>This link expires in ${expiresIn}.</p>
  `;

  return baseEmailTemplate({
    title: 'Verify Email',
    preheader: 'Verify your email address',
    content,
    buttonText: 'Verify Email',
    buttonUrl: verificationUrl,
    footerText: 'Link expires in 24 hours',
  });
};

export const emailVerificationSubject = (): string => {
  return 'Verify your email';
};