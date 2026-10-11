/**
 * Authoritative financial formatters for VirtualTrade
 * Stored amounts are in integer paise (₹1 = 100 paise)
 */

interface FormatINROptions {
  showPaise?: boolean;
  compact?: boolean;
  showSign?: boolean;
}

/**
 * Format money stored in integer paise to INR string (e.g. ₹10,00,000.00)
 */
export function formatINR(amountInPaise: number | bigint, options: FormatINROptions = {}): string {
  const { showPaise = true, compact = false, showSign = false } = options;
  const numPaise = Number(amountInPaise);
  const rupees = numPaise / 100;

  if (compact && Math.abs(rupees) >= 10000000) {
    // Crores (Cr)
    const cr = rupees / 10000000;
    const sign = showSign && rupees > 0 ? '+' : '';
    return `${sign}₹${cr.toFixed(2)} Cr`;
  }

  if (compact && Math.abs(rupees) >= 100000) {
    // Lakhs (L)
    const lk = rupees / 100000;
    const sign = showSign && rupees > 0 ? '+' : '';
    return `${sign}₹${lk.toFixed(2)} L`;
  }

  const sign = showSign && rupees > 0 ? '+' : '';
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showPaise ? 2 : 0,
    maximumFractionDigits: showPaise ? 2 : 0,
  }).format(Math.abs(rupees));

  if (rupees < 0) {
    return `-${formatted}`;
  }

  return `${sign}${formatted}`;
}

/**
 * Format percentages with explicit '+' or '-' sign
 */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format numeric values with standard Indian numbering commas
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format timestamps into human-readable Indian Standard Time or date format
 */
export function formatTimestamp(
  dateInput: string | number | Date,
  format: 'time' | 'date' | 'datetime' | 'relative' = 'datetime'
): string {
  const date = new Date(dateInput);

  if (isNaN(date.getTime())) return '—';

  if (format === 'time') {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  if (format === 'date') {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (format === 'datetime') {
    return `${date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    })} ${date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;
  }

  return date.toISOString();
}
