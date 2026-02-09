/**
 * Email Monitoring Page
 * 
 * Admin page for viewing email system monitoring metrics and alerts.
 * 
 * Requirements: 12.5, 12.6
 */

import { Metadata } from 'next';
import { MonitoringDashboard } from '@/components/admin/email/monitoring-dashboard';

export const metadata: Metadata = {
  title: 'Email Monitoring | Admin',
  description: 'Monitor email system health and performance',
};

export default function EmailMonitoringPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <MonitoringDashboard />
    </div>
  );
}
