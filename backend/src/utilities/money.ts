/**
 * Authoritative Money Abstraction for VirtualTrade
 * 
 * CORE PRINCIPLE:
 * Zero binary floating-point arithmetic is permitted for financial balances.
 * All internal monetary balances, stock prices, execution fees, and order amounts
 * are authoritatively stored and manipulated as integers in minor units (PAISE: 1 INR = 100 paise).
 */

export const PAISE_PER_RUPEE = 100;
export const STARTING_VIRTUAL_CAPITAL_PAISE = 100_000_000; // ₹10,00,000.00 (10 Lakhs INR)

export class Money {
  private readonly paise: bigint;

  private constructor(paise: number | bigint) {
    if (typeof paise === 'number') {
      if (!Number.isFinite(paise) || isNaN(paise)) {
        throw new Error('Invalid monetary number: must be finite');
      }
      this.paise = BigInt(Math.round(paise));
    } else {
      this.paise = paise;
    }
  }

  /**
   * Instantiate Money from integer paise
   */
  static fromPaise(paise: number | bigint): Money {
    return new Money(paise);
  }

  /**
   * Instantiate Money from standard decimal Rupee amount
   */
  static fromRupees(rupees: number): Money {
    if (!Number.isFinite(rupees) || isNaN(rupees)) {
      throw new Error('Invalid rupee value: must be finite');
    }
    const paise = Math.round(rupees * PAISE_PER_RUPEE);
    return new Money(paise);
  }

  /**
   * Starting allocation constant
   */
  static startingCapital(): Money {
    return new Money(STARTING_VIRTUAL_CAPITAL_PAISE);
  }

  /**
   * Zero Money constant
   */
  static zero(): Money {
    return new Money(0);
  }

  /**
   * Get value in integer paise (number)
   */
  toPaise(): number {
    return Number(this.paise);
  }

  /**
   * Get value in integer paise (bigint)
   */
  toBigInt(): bigint {
    return this.paise;
  }

  /**
   * Get value in decimal Rupees
   */
  toRupees(): number {
    return Number(this.paise) / PAISE_PER_RUPEE;
  }

  /**
   * Arithmetic: Addition
   */
  add(other: Money): Money {
    return new Money(this.paise + other.paise);
  }

  /**
   * Arithmetic: Subtraction
   */
  subtract(other: Money): Money {
    return new Money(this.paise - other.paise);
  }

  /**
   * Arithmetic: Multiplication by integer or factor
   */
  multiply(factor: number): Money {
    const multiplied = Number(this.paise) * factor;
    return new Money(Math.round(multiplied));
  }

  /**
   * Arithmetic: Division by integer or factor
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Division by zero');
    }
    const divided = Number(this.paise) / divisor;
    return new Money(Math.round(divided));
  }

  /**
   * Comparisons
   */
  isZero(): boolean {
    return this.paise === BigInt(0);
  }

  isPositive(): boolean {
    return this.paise > BigInt(0);
  }

  isNegative(): boolean {
    return this.paise < BigInt(0);
  }

  greaterThan(other: Money): boolean {
    return this.paise > other.paise;
  }

  greaterThanOrEqual(other: Money): boolean {
    return this.paise >= other.paise;
  }

  lessThan(other: Money): boolean {
    return this.paise < other.paise;
  }

  lessThanOrEqual(other: Money): boolean {
    return this.paise <= other.paise;
  }

  equals(other: Money): boolean {
    return this.paise === other.paise;
  }

  /**
   * Format money into Indian Rupee locale string
   */
  formatINR(showPaise = true): string {
    const rupees = this.toRupees();
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: showPaise ? 2 : 0,
      maximumFractionDigits: showPaise ? 2 : 0,
    }).format(rupees);
  }

  toINR(showPaise = true): string {
    return this.formatINR(showPaise);
  }
}
