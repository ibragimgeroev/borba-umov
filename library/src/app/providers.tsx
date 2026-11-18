import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { HashRouter } from 'react-router-dom';
import { LibraryProvider } from './LibraryContext';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LibraryProvider>
        <HashRouter>{children}</HashRouter>
      </LibraryProvider>
    </QueryClientProvider>
  );
}
