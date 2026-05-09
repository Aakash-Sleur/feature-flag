// src/utils/email.helper.ts

import type { SendMailOptions } from 'nodemailer';
import { getEmailTransporter, emailConfig } from '../config/email.js';
import logger from './logger.js';
import { 
  welcomeEmailTemplate, 
  welcomeEmailSubject,
  type WelcomeEmailData 
} from '../templates/email/welcome.template.js';
import { 
  passwordResetTemplate as passwordResetEmailTemplate, 
  passwordResetSubject as passwordResetEmailSubject,
  type PasswordResetEmailData 
} from '../templates/email/password-reset.template.js';
import { 
  emailVerificationTemplate, 
  emailVerificationSubject,
  type EmailVerificationData 
} from '../templates/email/email-verification.template.js';
import { 
  inviteEmailTemplate, 
  inviteEmailSubject,
  type InviteEmailData 
} from '../templates/email/invite.template.js';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
}

/**
 * Send email using configured transporter
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = getEmailTransporter();
    
    const mailOptions: SendMailOptions = {
      from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send email:', {
      error,
      to: options.to,
      subject: options.subject,
    });
    return false;
  }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (
  to: string,
  data: WelcomeEmailData
): Promise<boolean> => {
  const html = welcomeEmailTemplate(data);
  const subject = welcomeEmailSubject(data.name);
  
  return sendEmail({
    to,
    subject,
    html,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  to: string,
  data: PasswordResetEmailData
): Promise<boolean> => {
  const html = passwordResetEmailTemplate(data);
  const subject = passwordResetEmailSubject();
  
  return sendEmail({
    to,
    subject,
    html,
  });
};

/**
 * Send email verification email
 */
export const sendEmailVerification = async (
  to: string,
  data: EmailVerificationData
): Promise<boolean> => {
  const html = emailVerificationTemplate(data);
  const subject = emailVerificationSubject();
  
  return sendEmail({
    to,
    subject,
    html,
  });
};

/**
 * Send organization invite email
 */
export const sendInviteEmail = async (
  to: string,
  data: InviteEmailData
): Promise<boolean> => {
  const html = inviteEmailTemplate(data);
  const subject = inviteEmailSubject(data.organizationName, data.inviterName);
  
  return sendEmail({
    to,
    subject,
    html,
  });
};

/**
 * Send custom email with HTML content
 */
export const sendCustomEmail = async (
  to: string | string[],
  subject: string,
  html: string,
  options?: Partial<EmailOptions>
): Promise<boolean> => {
  return sendEmail({
    to,
    subject,
    html,
    ...options,
  });
};

/**
 * Send bulk emails (with rate limiting consideration)
 */
export const sendBulkEmails = async (
  emails: Array<{ to: string; subject: string; html: string }>
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await sendEmail(email);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Add delay to avoid rate limiting (adjust as needed)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  logger.info('Bulk email sending completed', { success, failed, total: emails.length });
  
  return { success, failed };
};

/**
 * Test email configuration
 */
export const testEmailConfiguration = async (testEmail: string): Promise<boolean> => {
  try {
    const result = await sendEmail({
      to: testEmail,
      subject: 'Test Email - Assignment App',
      html: `
        <h1>Email Configuration Test</h1>
        <p>If you received this email, your email configuration is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });
    
    return result;
  } catch (error) {
    logger.error('Email configuration test failed:', error);
    return false;
  }
};