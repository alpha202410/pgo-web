import {
    defaultShouldDehydrateQuery,
    QueryClient,
} from '@tanstack/react-query';
import { QUERY_CACHE } from '@/lib/config/constants';

export function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: QUERY_CACHE.STALE_TIME_LIST,
                gcTime: QUERY_CACHE.GC_TIME_DEFAULT,
            },
            dehydrate: {
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) ||
                    query.state.status === 'pending',
            },
        },
    });
}

