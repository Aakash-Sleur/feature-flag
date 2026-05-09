// src/utils/test-email.ts

import { sendInviteEmail } from './email.helper.js';
import logger from './logger.js';

/**
 * Test invite email functionality
 */
export const testInviteEmail = async (testEmail: string): Promise<boolean> => {
  try {
    const testData = {
      inviteeName: 'Test User',
      inviterName: 'System Administrator',
      organizationName: 'Test Organization',
      inviteUrl: 'http://localhost:3000/invite/test-token-123',
      role: 'Team Member',
      expiresIn: '7 days',
    };

    const result = await sendInviteEmail(testEmail, testData);
    
    if (result) {
      logger.info('Test invite email sent successfully', { testEmail });
      console.log('✅ Test invite email sent successfully to:', testEmail);
    } else {
      logger.error('Test invite email failed', { testEmail });
      console.log('❌ Test invite email failed to send to:', testEmail);
    }
    
    return result;
  } catch (error) {
    logger.error('Test invite email error:', error);
    console.log('❌ Test invite email error:', error);
    return false;
  }
};

// If this file is run directly, test with a provided email
if (import.meta.url === `file://${process.argv[1]}`) {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.log('Usage: tsx src/utils/test-email.ts <test-email@example.com>');
    process.exit(1);
  }
  
  testInviteEmail(testEmail).then((success) => {
    process.exit(success ? 0 : 1);
  });
}