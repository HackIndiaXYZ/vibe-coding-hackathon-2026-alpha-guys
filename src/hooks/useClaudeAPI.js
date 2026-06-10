import { useState, useCallback } from 'react';
import { sendClaudeMessage } from '../utils/claudeApi';

/**
 * Custom hook for AI interactions.
 * sendClaudeMessage now never throws — it falls back to the offline
 * mock engine when the API key is absent or the network fails.
 * The error state is only set for truly unexpected JS errors.
 */
export function useClaudeAPI() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const sendMessage = useCallback(async (
    messages,
    systemPrompt = '',
    maxTokens = 1500
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sendClaudeMessage(messages, systemPrompt, maxTokens);
      return response;
    } catch (err) {
      // This path is only hit for unexpected JS errors, not missing API keys
      const message = err.message || 'Something went wrong. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { sendMessage, loading, error, clearError };
}
