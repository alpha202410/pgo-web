'use client';

import { useQuery } from '@tanstack/react-query';
import { TransactionTable } from './transaction-table';
import { transactionsListQueryOptions } from '@/features/transactions/queries/transactions';

export default function TransactionsList() {
    const { data, isLoading, isFetching } = useQuery(transactionsListQueryOptions());

    // Extract transactions from paginated response
    const transactions = data?.data ?? [];

    return (
        <div className="@container/main flex flex-1 flex-col gap-2 py-2">
            <TransactionTable data={transactions} isLoading={isLoading || isFetching} />
        </div>
    );
}
