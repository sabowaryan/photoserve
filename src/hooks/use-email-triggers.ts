/**
 * Email Triggers Hook
 * Client-side hook to trigger email events
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 */

import { useCallback } from 'react';

export function useEmailTriggers() {
  const triggerSignupEmails = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/email/triggers/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        console.error('Failed to trigger signup emails');
      }
    } catch (error) {
      console.error('Error triggering signup emails:', error);
    }
  }, []);
  
  const triggerFirstGalleryEmail = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/email/triggers/first-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        console.error('Failed to trigger first gallery email');
      }
    } catch (error) {
      console.error('Error triggering first gallery email:', error);
    }
  }, []);
  
  const triggerUpgradeEmail = useCallback(async (
    userId: string,
    planName: string,
    price: number
  ) => {
    try {
      const response = await fetch('/api/email/triggers/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, planName, price }),
      });
      
      if (!response.ok) {
        console.error('Failed to trigger upgrade email');
      }
    } catch (error) {
      console.error('Error triggering upgrade email:', error);
    }
  }, []);
  
  return {
    triggerSignupEmails,
    triggerFirstGalleryEmail,
    triggerUpgradeEmail,
  };
}
