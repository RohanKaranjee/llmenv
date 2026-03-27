import { APIError } from '../types/errors.js';
import type { AIResponse, AISettings } from '../types/index.js';

// OpenAI API response types
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Claude API response types
interface ClaudeResponse {
  content: Array<{
    text: string;
  }>;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Call OpenAI Chat Completions API with GPT-4 model.
 * 
 * Sends a prompt to OpenAI's Chat Completions API and returns the response
 * with token usage information. Uses GPT-4 model with temperature 0.7.
 * 
 * @param prompt - The prompt to send to OpenAI (will be sent as user message)
 * @param apiKey - OpenAI API key for authentication
 * @returns Promise resolving to AIResponse with content, model, and usage information
 * @throws {APIError} If the API request fails or returns an error status
 * 
 * @example
 * ```typescript
 * const response = await callOpenAI('Explain TypeScript generics', 'sk-...');
 * console.log(response.content);
 * console.log(`Used ${response.usage.totalTokens} tokens`);
 * ```
 */
export async function callOpenAI(
  prompt: string,
  apiKey: string
): Promise<AIResponse> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new APIError(
        `OpenAI API error: ${response.statusText} - ${errorBody}`,
        'openai',
        response.status
      );
    }

    const data = (await response.json()) as OpenAIResponse;

    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to call OpenAI API: ${error instanceof Error ? error.message : String(error)}`,
      'openai'
    );
  }
}

/**
 * Call Claude Messages API with Claude 3.5 Sonnet model.
 * 
 * Sends a prompt to Anthropic's Messages API and returns the response
 * with token usage information. Uses claude-3-5-sonnet-20241022 model
 * with max_tokens set to 4096.
 * 
 * @param prompt - The prompt to send to Claude (will be sent as user message)
 * @param apiKey - Anthropic API key for authentication
 * @returns Promise resolving to AIResponse with content, model, and usage information
 * @throws {APIError} If the API request fails or returns an error status
 * 
 * @example
 * ```typescript
 * const response = await callClaude('Explain TypeScript generics', 'sk-ant-...');
 * console.log(response.content);
 * console.log(`Used ${response.usage.totalTokens} tokens`);
 * ```
 */
export async function callClaude(
  prompt: string,
  apiKey: string
): Promise<AIResponse> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new APIError(
        `Claude API error: ${response.statusText} - ${errorBody}`,
        'claude',
        response.status
      );
    }

    const data = (await response.json()) as ClaudeResponse;

    return {
      content: data.content[0].text,
      model: data.model,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to call Claude API: ${error instanceof Error ? error.message : String(error)}`,
      'claude'
    );
  }
}

/**
 * Call the appropriate AI API based on provider settings.
 * 
 * Routes the request to either OpenAI or Claude based on the provider
 * specified in settings. This is the main entry point for AI API calls.
 * 
 * @param prompt - The prompt to send to the AI provider
 * @param settings - AI provider settings containing provider type ('openai' or 'claude') and API key
 * @returns Promise resolving to AIResponse with content, model, and usage information
 * @throws {APIError} If the provider is unknown or the API request fails
 * 
 * @example
 * ```typescript
 * const settings = { provider: 'openai', apiKey: 'sk-...' };
 * const response = await callAI('Explain TypeScript generics', settings);
 * console.log(response.content);
 * ```
 */
export async function callAI(
  prompt: string,
  settings: AISettings
): Promise<AIResponse> {
  if (settings.provider === 'openai') {
    return callOpenAI(prompt, settings.apiKey);
  } else if (settings.provider === 'claude') {
    return callClaude(prompt, settings.apiKey);
  } else {
    // This should never happen due to TypeScript type checking
    const provider = settings.provider as string;
    throw new APIError(
      `Unknown AI provider: ${provider}`,
      provider
    );
  }
}
