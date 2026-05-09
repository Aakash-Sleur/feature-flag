// src/templates/email/welcome.template.ts

import { baseEmailTemplate } from './base.template.js';

export interface WelcomeEmailData {
  name: string;
  email: string;
  dashboardUrl?: string;
}

export const welcomeEmailTemplate = (data: WelcomeEmailData): string => {
  const { name, email, dashboardUrl } = data;

  const content = `
    <p>Hi ${name},</p>
    <p>Welcome to Assignment App. Your account has been created.</p>
    <p>Email: ${email}</p>
  `;

  return baseEmailTemplate({
    title: 'Welcome',
    preheader: 'Your account is ready',
    content,
    ...(dashboardUrl ? { buttonText: 'Go to Dashboard', buttonUrl: dashboardUrl } : {}),
    footerText: 'Assignment App',
  });
};

export const welcomeEmailSubject = (name: string): string => {
  return `Welcome, ${name}`;
};