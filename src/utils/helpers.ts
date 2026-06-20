/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number into clean Indian Rupees format without decimal points
 * Example: 150000 -> ₹1,50,000
 */
export const formatRupee = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Custom date formatter for construction reports
 * Example: 2026-06-20 -> "20 Jun 2026"
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Returns the current date in YYYY-MM-DD local format
 */
export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generates SMS or WhatsApp text for payment pending reminder
 */
export const generateReminderMessage = (
  customerName: string,
  siteLocation: string,
  pendingAmount: number,
  machineName: string
): string => {
  return `Hello ${customerName}, this is a friendly reminder from MachineMitra. A balance of ${formatRupee(pendingAmount)} is pending for the work completed at ${siteLocation} with machine ${machineName}. Please process the payment at your earliest convenience. Thank you!`;
};

/**
 * Triggers native share or copy for reminder
 */
export const shareReminder = async (
  phoneNumber: string,
  customerName: string,
  siteLocation: string,
  pendingAmount: number,
  machineName: string
): Promise<{ success: boolean; method: 'share' | 'whatsapp' | 'sms' | 'copied' }> => {
  const msg = generateReminderMessage(customerName, siteLocation, pendingAmount, machineName);
  
  // Try using Share API if available (especially on phones)
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'MachineMitra Payment Reminder',
        text: msg,
      });
      return { success: true, method: 'share' };
    } catch {
      // User cancelled or error, fallback to deep links
    }
  }

  // Format phone number to clean text for URL
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const isIndian = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  // Try WhatsApp Web or App link
  const waUrl = `https://wa.me/${isIndian}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
  return { success: true, method: 'whatsapp' };
};
