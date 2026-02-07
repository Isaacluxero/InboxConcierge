import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { searchService } from '../services/auth';

export const useSmartSearch = () => {
  const [results, setResults] = useState(null);

  const mutation = useMutation({
    mutationFn: searchService.smartSearch,
    onSuccess: (data) => {
      setResults(data.data);
    }
  });

  const search = (query) => {
    if (!query || query.trim().length === 0) {
      setResults(null);
      return;
    }
    mutation.mutate(query);
  };

  const clearResults = () => {
    setResults(null);
  };

  return {
    search,
    results,
    clearResults,
    isLoading: mutation.isPending,
    error: mutation.error
  };
};
