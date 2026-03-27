import type { AIResponse } from '../../src/types/index.js';

/**
 * Mock AI API response helpers for testing
 */

/**
 * Creates a mock OpenAI API response
 */
export function createMockOpenAIResponse(
  content: string = 'Mocked OpenAI response',
  model: string = 'gpt-4'
): any {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: Date.now(),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    }),
  };
}

/**
 * Creates a mock Claude API response
 */
export function createMockClaudeResponse(
  content: string = 'Mocked Claude response',
  model: string = 'claude-3-5-sonnet-20241022'
): any {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
      model,
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    }),
  };
}

/**
 * Creates a mock error response
 */
export function createMockErrorResponse(
  status: number = 500,
  statusText: string = 'Internal Server Error',
  errorMessage: string = 'An error occurred'
): any {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({
      error: {
        message: errorMessage,
        type: 'api_error',
        code: status,
      },
    }),
  };
}

/**
 * Creates a mock 401 Unauthorized response
 */
export function createMockUnauthorizedResponse(provider: 'openai' | 'claude' = 'openai'): any {
  return createMockErrorResponse(
    401,
    'Unauthorized',
    provider === 'openai' ? 'Invalid API key' : 'Invalid authentication credentials'
  );
}

/**
 * Creates a mock 429 Rate Limit response
 */
export function createMockRateLimitResponse(): any {
  return createMockErrorResponse(429, 'Too Many Requests', 'Rate limit exceeded');
}

/**
 * Creates a mock network error
 */
export function createMockNetworkError(message: string = 'Network request failed'): Error {
  const error = new Error(message);
  error.name = 'NetworkError';
  return error;
}

/**
 * Creates a mock timeout error
 */
export function createMockTimeoutError(): Error {
  const error = new Error('Request timeout');
  error.name = 'TimeoutError';
  return error;
}

/**
 * Mock fetch function that returns OpenAI responses
 */
export function createMockOpenAIFetch(
  responseContent?: string,
  shouldFail: boolean = false
): typeof fetch {
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (shouldFail) {
      return createMockErrorResponse() as any;
    }
    return createMockOpenAIResponse(responseContent) as any;
  };
}

/**
 * Mock fetch function that returns Claude responses
 */
export function createMockClaudeFetch(
  responseContent?: string,
  shouldFail: boolean = false
): typeof fetch {
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (shouldFail) {
      return createMockErrorResponse() as any;
    }
    return createMockClaudeResponse(responseContent) as any;
  };
}

/**
 * Mock fetch function that routes to appropriate provider
 */
export function createMockAIFetch(
  openaiContent?: string,
  claudeContent?: string,
  shouldFail: boolean = false
): typeof fetch {
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlString = typeof url === 'string' ? url : url.toString();

    if (shouldFail) {
      return createMockErrorResponse() as any;
    }

    if (urlString.includes('openai.com')) {
      return createMockOpenAIResponse(openaiContent) as any;
    } else if (urlString.includes('anthropic.com')) {
      return createMockClaudeResponse(claudeContent) as any;
    }

    return createMockErrorResponse(404, 'Not Found', 'Unknown API endpoint') as any;
  };
}

/**
 * Creates a mock AIResponse object
 */
export function createMockAIResponse(
  content: string = 'Mocked AI response',
  model: string = 'gpt-4',
  provider: 'openai' | 'claude' = 'openai'
): AIResponse {
  return {
    content,
    model,
    usage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    },
  };
}

/**
 * Mock fetch that simulates network delay
 */
export function createMockDelayedFetch(
  delayMs: number = 100,
  response?: any
): typeof fetch {
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return (response || createMockOpenAIResponse()) as any;
  };
}

/**
 * Mock fetch that fails after a certain number of calls
 */
export function createMockFailAfterNFetch(
  n: number,
  successResponse?: any,
  errorResponse?: any
): typeof fetch {
  let callCount = 0;
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    callCount++;
    if (callCount > n) {
      return (errorResponse || createMockErrorResponse()) as any;
    }
    return (successResponse || createMockOpenAIResponse()) as any;
  };
}

/**
 * Mock fetch that tracks calls
 */
export interface MockFetchTracker {
  fetch: typeof fetch;
  calls: Array<{ url: string; init?: RequestInit }>;
  reset: () => void;
}

export function createMockTrackedFetch(response?: any): MockFetchTracker {
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  const fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlString = typeof url === 'string' ? url : url.toString();
    calls.push({ url: urlString, init });
    return (response || createMockOpenAIResponse()) as any;
  };

  return {
    fetch,
    calls,
    reset: () => {
      calls.length = 0;
    },
  };
}

/**
 * Validates that a request was made with correct headers
 */
export function validateOpenAIRequest(init?: RequestInit, apiKey?: string): boolean {
  if (!init || !init.headers) return false;
  const headers = init.headers as Record<string, string>;
  return (
    headers['Content-Type'] === 'application/json' &&
    (apiKey ? headers['Authorization'] === `Bearer ${apiKey}` : true)
  );
}

/**
 * Validates that a Claude request was made with correct headers
 */
export function validateClaudeRequest(init?: RequestInit, apiKey?: string): boolean {
  if (!init || !init.headers) return false;
  const headers = init.headers as Record<string, string>;
  return (
    headers['Content-Type'] === 'application/json' &&
    headers['anthropic-version'] === '2023-06-01' &&
    (apiKey ? headers['x-api-key'] === apiKey : true)
  );
}

/**
 * Extracts the prompt from a request body
 */
export function extractPromptFromRequest(init?: RequestInit): string | null {
  if (!init || !init.body) return null;
  try {
    const body = JSON.parse(init.body as string);
    if (body.messages && Array.isArray(body.messages)) {
      return body.messages[0]?.content || null;
    }
    return null;
  } catch {
    return null;
  }
}
