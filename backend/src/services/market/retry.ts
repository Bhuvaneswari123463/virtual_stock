import { logger } from '../../utilities/logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
}

export class ProviderTimeoutError extends Error {
  constructor(message = 'Market data provider request timed out') {
    super(message);
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderRateLimitError extends Error {
  constructor(message = 'Market data provider rate limit exceeded') {
    super(message);
    this.name = 'ProviderRateLimitError';
  }
}

export class ProviderMalformedResponseError extends Error {
  constructor(message = 'Market data provider returned malformed response') {
    super(message);
    this.name = 'ProviderMalformedResponseError';
  }
}

/**
 * Executes a provider call with bounded exponential retries and request timeout
 */
export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const initialDelay = options.initialDelayMs ?? 200;
  const maxDelay = options.maxDelayMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 5000;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      if (err.name === 'AbortError') {
        lastError = new ProviderTimeoutError(`Provider request timed out after ${timeoutMs}ms`);
      }

      // Do not retry non-retryable errors
      if (err instanceof ProviderMalformedResponseError) {
        throw err;
      }

      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const backoff = Math.min(maxDelay, initialDelay * Math.pow(2, attempt));
        const jitter = Math.random() * 0.3 * backoff;
        const delay = backoff + jitter;

        logger.warn(
          `Market data provider call failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms...`,
          { error: err.message }
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
