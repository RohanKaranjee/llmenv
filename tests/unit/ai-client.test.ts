import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callOpenAI, callClaude, callAI } from '../../src/core/ai-client.js';
import { APIError } from '../../src/types/errors.js';
import type { AISettings } from '../../src/types/index.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('AI Client - OpenAI Integration', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('callOpenAI', () => {
    it('should call OpenAI API with correct parameters', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        model: 'gpt-4',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callOpenAI('Test prompt', 'test-api-key');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'Test prompt' }],
            temperature: 0.7,
          }),
        }
      );

      expect(result).toEqual({
        content: 'Test response',
        model: 'gpt-4',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      });
    });

    it('should use gpt-4 model', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await callOpenAI('Test', 'key');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('gpt-4');
    });

    it('should use temperature 0.7', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await callOpenAI('Test', 'key');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.7);
    });

    it('should parse response and extract content', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Expected content' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callOpenAI('Test', 'key');

      expect(result.content).toBe('Expected content');
    });

    it('should parse response and extract model', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4-0613',
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callOpenAI('Test', 'key');

      expect(result.model).toBe('gpt-4-0613');
    });

    it('should parse response and extract usage information', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callOpenAI('Test', 'key');

      expect(result.usage).toEqual({
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
      });
    });

    it('should throw APIError on 4xx response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      });

      await expect(callOpenAI('Test', 'invalid-key')).rejects.toThrow(APIError);
    });

    it('should throw APIError on 5xx response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(callOpenAI('Test', 'key')).rejects.toThrow(APIError);
    });

    it('should include status code in APIError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
      });

      try {
        await callOpenAI('Test', 'key');
        expect.fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).statusCode).toBe(429);
      }
    });

    it('should include provider in APIError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid request',
      });

      try {
        await callOpenAI('Test', 'key');
        expect.fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).provider).toBe('openai');
      }
    });

    it('should include descriptive error message with status text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Access denied',
      });

      try {
        await callOpenAI('Test', 'key');
        expect.fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).message).toContain('Forbidden');
        expect((error as APIError).message).toContain('Access denied');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(callOpenAI('Test', 'key')).rejects.toThrow(APIError);
    });

    it('should wrap network errors with descriptive message', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));

      try {
        await callOpenAI('Test', 'key');
        expect.fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).message).toContain('Failed to call OpenAI API');
        expect((error as APIError).message).toContain('Connection timeout');
      }
    });
  });

  describe('callClaude', () => {
    it('should call Claude API with correct parameters', async () => {
      const mockResponse = {
        content: [{ text: 'Test response' }],
        model: 'claude-3-5-sonnet-20241022',
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callClaude('Test prompt', 'test-api-key');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: [{ role: 'user', content: 'Test prompt' }],
          }),
        }
      );

      expect(result).toEqual({
        content: 'Test response',
        model: 'claude-3-5-sonnet-20241022',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      });
    });

    it('should parse response and extract content', async () => {
      const mockResponse = {
        content: [{ text: 'Claude response' }],
        model: 'claude-3-5-sonnet-20241022',
        usage: { input_tokens: 5, output_tokens: 10 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callClaude('Test', 'key');

      expect(result.content).toBe('Claude response');
    });

    it('should parse response and extract model', async () => {
      const mockResponse = {
        content: [{ text: 'Response' }],
        model: 'claude-3-5-sonnet-20241022',
        usage: { input_tokens: 5, output_tokens: 10 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callClaude('Test', 'key');

      expect(result.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should parse response and calculate total usage', async () => {
      const mockResponse = {
        content: [{ text: 'Response' }],
        model: 'claude-3-5-sonnet-20241022',
        usage: {
          input_tokens: 150,
          output_tokens: 250,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callClaude('Test', 'key');

      expect(result.usage).toEqual({
        promptTokens: 150,
        completionTokens: 250,
        totalTokens: 400,
      });
    });

    it('should throw APIError on API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      });

      await expect(callClaude('Test', 'invalid-key')).rejects.toThrow(APIError);
    });

    it('should include provider in APIError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid request',
      });

      try {
        await callClaude('Test', 'key');
        expect.fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).provider).toBe('claude');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(callClaude('Test', 'key')).rejects.toThrow(APIError);
    });
  });

  describe('callAI', () => {
    it('should route to OpenAI when provider is openai', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'OpenAI response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const settings: AISettings = {
        provider: 'openai',
        apiKey: 'openai-key',
      };

      const result = await callAI('Test prompt', settings);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.any(Object)
      );
      expect(result.content).toBe('OpenAI response');
    });

    it('should route to Claude when provider is claude', async () => {
      const mockResponse = {
        content: [{ text: 'Claude response' }],
        model: 'claude-3-5-sonnet-20241022',
        usage: { input_tokens: 5, output_tokens: 10 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const settings: AISettings = {
        provider: 'claude',
        apiKey: 'claude-key',
      };

      const result = await callAI('Test prompt', settings);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.any(Object)
      );
      expect(result.content).toBe('Claude response');
    });

    it('should throw APIError for unknown provider', async () => {
      const settings = {
        provider: 'unknown' as any,
        apiKey: 'key',
      };

      await expect(callAI('Test', settings)).rejects.toThrow(APIError);
    });

    it('should include provider name in error for unknown provider', async () => {
      const settings = {
        provider: 'gemini' as any,
        apiKey: 'key',
      };

      try {
        await callAI('Test', settings);
        expect.fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).message).toContain('gemini');
      }
    });
  });
});
