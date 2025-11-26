import 'server-only';
import * as React from 'react';
import { cache } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/query-client';

/**
 * Get a stable query client for the current server request
 * Uses React's cache() to ensure the same client is used throughout the request
 */
export const getQueryClient = cache(() => makeQueryClient());

/**
 * HydrateClient component for server-side hydration
 * Wraps children with HydrationBoundary using the dehydrated query client state
 */
export function HydrateClient(props: { children: React.ReactNode }) {
    const queryClient = getQueryClient();
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {props.children}
        </HydrationBoundary>
    );
}

