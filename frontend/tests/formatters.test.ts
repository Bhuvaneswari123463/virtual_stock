import { describe, it, expect } from 'vitest';
import { formatINR, formatPercent, formatNumber, formatTimestamp } from '../src/lib/formatters';

describe('Financial Formatters (Paise Accuracy)', () => {
  it('correctly converts 100,000,000 paise to ₹10,00,000.00', () => {
    const formatted = formatINR(100000000);
    // Remove non-breaking spaces if any from Intl formatting
    expect(formatted.replace(/\u00a0/g, ' ')).toMatch(/₹\s*10,00,000\.00/);
  });

  it('correctly formats stock price in paise: 295050 paise to ₹2,950.50', () => {
    const formatted = formatINR(295050);
    expect(formatted.replace(/\u00a0/g, ' ')).toMatch(/₹\s*2,950\.50/);
  });

  it('correctly formats negative monetary values with minus sign', () => {
    const formatted = formatINR(-50000);
    expect(formatted.replace(/\u00a0/g, ' ')).toMatch(/-₹\s*500\.00/);
  });

  it('formats compact representations for Lakhs and Crores', () => {
    const lakh = formatINR(50000000, { compact: true }); // ₹5,00,000
    expect(lakh).toBe('₹5.00 L');

    const crore = formatINR(1500000000, { compact: true }); // ₹1.5 Cr
    expect(crore).toBe('₹1.50 Cr');
  });

  it('formats percentages with explicit positive sign', () => {
    expect(formatPercent(2.45)).toBe('+2.45%');
    expect(formatPercent(-1.12)).toBe('-1.12%');
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('formats standard Indian numeral grouping', () => {
    expect(formatNumber(100000)).toBe('1,00,000');
  });

  it('formats valid timestamps', () => {
    const date = new Date('2026-10-11T14:30:00Z');
    expect(formatTimestamp(date, 'date')).toBeDefined();
    expect(formatTimestamp('invalid-date')).toBe('—');
  });
});
