'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ai-radar-search-history';
const MAX_HISTORY = 5;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Add a search term to history
  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;

    setHistory((prev) => {
      // Remove if already exists
      const filtered = prev.filter((item) => item !== term);
      // Add to beginning
      const newHistory = [term, ...filtered].slice(0, MAX_HISTORY);
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  // Remove a search term from history
  const removeFromHistory = useCallback((term: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item !== term);
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
