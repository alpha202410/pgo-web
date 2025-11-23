import { TRPCError, initTRPC } from '@trpc/server';
import { cache } from 'react';
import { getSession } from '../auth/services/auth.service';
export const createTRPCContext = cache(async () => {
    /**
     * @see: https://trpc.io/docs/server/context
     */
    return { userId: 'user_123' };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
    /**
     * @see https://trpc.io/docs/server/data-transformers
     */
    // transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const protectedProcedure = t.procedure.use(async ({ next, ctx }) => {
    const session = await getSession();

    if (!session) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }

    return next({ ctx: { ...ctx, auth: session } });
});
export const baseProcedure = t.procedure;