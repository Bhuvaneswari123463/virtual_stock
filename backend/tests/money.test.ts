import { describe, it, expect } from 'vitest';
import { Money } from '../src/utilities/money';

describe('Money Domain Abstraction (Paise / Minor Units)', () => {
  it('correctly constructs Money instances from paise and rupees', () => {
    const fromPaise = Money.fromPaise(100000000); // ₹10,00,000
    expect(fromPaise.toPaise()).toBe(100000000);
    expect(fromPaise.toRupees()).toBe(1000000);

    const fromRupees = Money.fromRupees(2985.4);
    expect(fromRupees.toPaise()).toBe(298540);
    expect(fromRupees.toRupees()).toBe(2985.4);
  });

  it('eliminates binary floating-point drift in arithmetic operations', () => {
    // In standard IEEE 754: 0.1 + 0.2 === 0.30000000000000004
    // In Money paise abstraction: 10 paise + 20 paise === 30 paise exactly
    const m1 = Money.fromRupees(0.1); // 10 paise
    const m2 = Money.fromRupees(0.2); // 20 paise
    const sum = m1.add(m2);

    expect(sum.toPaise()).toBe(30);
    expect(sum.toRupees()).toBe(0.3);

    const diff = sum.subtract(m1);
    expect(diff.toPaise()).toBe(20);
  });

  it('multiplies and divides with proper rounding', () => {
    const unitPrice = Money.fromRupees(1234.56); // 123456 paise
    const total = unitPrice.multiply(25); // 25 shares
    expect(total.toPaise()).toBe(3086400); // ₹30,864.00

    const split = total.divide(2);
    expect(split.toPaise()).toBe(1543200);
  });

  it('correctly formats currency with Indian numbering system', () => {
    const defaultCapital = Money.fromPaise(100000000); // ₹10 Lakhs
    const formatted = defaultCapital.toINR();
    expect(formatted).toContain('10,00,000');

    const smallAmount = Money.fromPaise(298540); // ₹2,985.40
    expect(smallAmount.toINR()).toContain('2,985.40');
  });

  it('supports accurate boolean comparison methods', () => {
    const a = Money.fromPaise(500);
    const b = Money.fromPaise(1000);
    const c = Money.fromPaise(500);

    expect(a.lessThan(b)).toBe(true);
    expect(b.greaterThan(a)).toBe(true);
    expect(a.equals(c)).toBe(true);
    expect(a.isPositive()).toBe(true);
    expect(Money.zero().isZero()).toBe(true);
  });
});
