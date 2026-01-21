/**
 * ai-client.ts
 * BYOK (Bring Your Own Key) AI client for OpenAI and Anthropic
 * Stores keys in localStorage only - zero backend
 */

export type AIProvider = 'openai' | 'anthropic';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  conversationHistory?: Message[];
}

export interface AIResponse {
  text: string;
  error?: string;
}

const STORAGE_KEYS = {
  OPENAI_KEY: 'yellm_openai_key',
  ANTHROPIC_KEY: 'yellm_anthropic_key',
  PROVIDER: 'yellm_provider'
};

/**
 * Save API key to localStorage
 */
export function saveAPIKey(provider: AIProvider, apiKey: string): void {
  const storageKey = provider === 'openai'
    ? STORAGE_KEYS.OPENAI_KEY
    : STORAGE_KEYS.ANTHROPIC_KEY;
  localStorage.setItem(storageKey, apiKey);
  localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
}

/**
 * Load API key from localStorage
 */
export function loadAPIKey(provider: AIProvider): string | null {
  const storageKey = provider === 'openai'
    ? STORAGE_KEYS.OPENAI_KEY
    : STORAGE_KEYS.ANTHROPIC_KEY;
  return localStorage.getItem(storageKey);
}

/**
 * Get current provider from localStorage
 */
export function getCurrentProvider(): AIProvider {
  const provider = localStorage.getItem(STORAGE_KEYS.PROVIDER);
  return (provider as AIProvider) || 'openai';
}

/**
 * Clear API keys from localStorage
 */
export function clearAPIKeys(): void {
  localStorage.removeItem(STORAGE_KEYS.OPENAI_KEY);
  localStorage.removeItem(STORAGE_KEYS.ANTHROPIC_KEY);
  localStorage.removeItem(STORAGE_KEYS.PROVIDER);
}

/**
 * Query OpenAI API
 */
async function queryOpenAI(
  apiKey: string,
  messages: Message[],
  model: string = 'gpt-4'
): Promise<AIResponse> {
  try {
    // Add system message at the beginning
    const systemMessage = {
      role: 'system' as const,
      content: 'You are YELLM, a high-energy AI that responds to users who YELL at you. Match their energy with enthusiasm and directness. Keep responses concise and impactful.'
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [systemMessage, ...messages],
        temperature: 0.9,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || 'No response generated'
    };

  } catch (error) {
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Query Anthropic API
 */
async function queryAnthropic(
  apiKey: string,
  messages: Message[],
  model: string = 'claude-3-5-sonnet-20240620'
): Promise<AIResponse> {
  try {
    const systemPrompt = 'You are YELLM, a high-energy AI that responds to users who YELL at you. Match their energy with enthusiasm and directness. Keep responses concise and impactful.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 150,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.content[0]?.text || 'No response generated'
    };

  } catch (error) {
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}


/**
 * Query AI with the configured provider
 */
export async function queryAI(config: AIConfig, transcript: string): Promise<AIResponse> {
  if (!config.apiKey) {
    return {
      text: '',
      error: 'API key is required. Please configure your API key.'
    };
  }

  if (!transcript.trim()) {
    return {
      text: '',
      error: 'No transcript provided'
    };
  }

  // Build messages array from conversation history + new transcript
  const messages: Message[] = [
    ...(config.conversationHistory || []),
    { role: 'user', content: transcript }
  ];

  if (config.provider === 'openai') {
    return queryOpenAI(config.apiKey, messages, config.model);
  } else {
    return queryAnthropic(config.apiKey, messages, config.model);
  }
}

/**
 * Validate API key format (basic check)
 */
export function validateAPIKey(provider: AIProvider, key: string): boolean {
  if (!key || key.length < 20) return false;

  if (provider === 'openai') {
    return key.startsWith('sk-');
  } else if (provider === 'anthropic') {
    return key.startsWith('sk-ant-');
  }

  return false;
}
