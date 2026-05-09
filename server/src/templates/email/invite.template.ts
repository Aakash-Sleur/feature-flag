// src/templates/email/invite.template.ts

import { baseEmailTemplate } from './base.template.js';

export interface InviteEmailData {
  inviteeName: string;
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
  role?: string;
  expiresIn?: string;
}

export const inviteEmailTemplate = (data: InviteEmailData): string => {
  const { 
    inviteeName, 
    inviterName, 
    organizationName, 
    inviteUrl, 
    role = 'Member',
    expiresIn = '7 days' 
  } = data;

  const content = `
    <p>Hi ${inviteeName},</p>
    <p>${inviterName} invited you to join ${organizationName}.</p>
    <p>Role: ${role}</p>
    <p>This invitation expires in ${expiresIn}.</p>
  `;

  return baseEmailTemplate({
    title: `Invitation to ${organizationName}`,
    preheader: `Join ${organizationName}`,
    content,
    buttonText: 'Accept Invitation',
    buttonUrl: inviteUrl,
    footerText: `Invited by ${inviterName}`,
  });
};

export const inviteEmailSubject = (organizationName: string, inviterName: string): string => {
  return `${inviterName} invited you to ${organizationName}`;
};