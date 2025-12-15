import { useQuery, UseQueryOptions } from '@tanstack/react-query';

/**
 * Custom hook for admin queries with no caching
 * Admin pages should always fetch fresh data to avoid stale information
 */
export function useAdminQuery<TData = unknown>(
    options: UseQueryOptions<TData>
) {
    return useQuery({
        ...options,
        staleTime: 0, // Data is immediately stale
        gcTime: 0, // Don't keep in garbage collection cache
        refetchOnMount: 'always', // Always refetch when component mounts
        refetchOnWindowFocus: true, // Refetch when window regains focus
    });
}
