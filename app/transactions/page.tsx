import { createTRPCContext } from "@/lib/trpc/init";
import { appRouter } from "@/lib/trpc/routers/_app";
import { TRPCError } from "@trpc/server";
import { clearExpiredSession } from "@/app/actions/auth.actions";

async function getTransactions() {
  const caller = appRouter.createCaller(await createTRPCContext());
  return await caller.transactions.list();
}

export default async function Page() {
  let transactions;

  try {
    transactions = await getTransactions();
  } catch (error) {
    // Handle UNAUTHORIZED errors (expired/invalid session)
    if (error instanceof TRPCError && error.code === 'UNAUTHORIZED') {
      // Use server action to clear session and redirect to login
      await clearExpiredSession();
    }
    // Re-throw other errors
    throw error;
  }

  return (
    <div>
      <h1>Transactions</h1>
      <pre>{JSON.stringify(transactions, null, 2)}</pre>
    </div>
  );
}
