import { createTRPCRouter, protectedProcedure } from "../init";
import { API_CONFIG, API_ENDPOINTS } from "@/lib/config/api";
import { z } from "zod";
import { SessionPayload } from "@/lib/definitions";
import { TRPCError } from "@trpc/server";

export const transactionsRouter = createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }: { ctx: { auth: SessionPayload } }) => {
        const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.transactions.list}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ctx.auth.token}`,
            },
        });

        if (!response.ok) {
            let errorMessage = 'Failed to fetch transactions';
            let errorCode: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' = 'INTERNAL_SERVER_ERROR';

            // Try to extract error message from response
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }

            // Map HTTP status codes to tRPC error codes
            if (response.status === 401) {
                errorCode = 'UNAUTHORIZED';
            } else if (response.status === 403) {
                errorCode = 'FORBIDDEN';
            } else if (response.status === 404) {
                errorCode = 'NOT_FOUND';
            }

            throw new TRPCError({
                code: errorCode,
                message: `${errorMessage} (Status: ${response.status})`
            });
        }

        const data = await response.json();
        return data.data;
    }),
    getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }: { ctx: { auth: SessionPayload }, input: { id: string } }) => {
        const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.transactions.getById.replace('{id}', input.id)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ctx.auth.token}`,
            },
        });

        if (!response.ok) {
            let errorMessage = 'Failed to fetch transaction';
            let errorCode: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' = 'INTERNAL_SERVER_ERROR';

            // Try to extract error message from response
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }

            // Map HTTP status codes to tRPC error codes
            if (response.status === 401) {
                errorCode = 'UNAUTHORIZED';
            } else if (response.status === 403) {
                errorCode = 'FORBIDDEN';
            } else if (response.status === 404) {
                errorCode = 'NOT_FOUND';
            }

            throw new TRPCError({
                code: errorCode,
                message: `${errorMessage} (Status: ${response.status})`
            });
        }

        const data = await response.json();
        return data.data;
    }),
});