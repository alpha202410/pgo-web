import { HydrateClient, prefetchDisbursementsList } from '@/features/disbursements/queries/server';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import DisbursementsList from '@/features/disbursements/components/disbursements-list';
import { TablePageSkeleton } from '@/components/ui/table-skeleton';
import { DISBURSEMENTS_TABLE_COLUMNS } from '@/components/ui/table-skeleton-presets';

export default async function Page() {
  await prefetchDisbursementsList();

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<div className="px-4 lg:px-6 py-4 text-muted-foreground">Failed to load disbursements</div>}>
        <Suspense fallback={<div className="@container/main flex flex-1 flex-col gap-2 py-2"><TablePageSkeleton rows={10} columns={DISBURSEMENTS_TABLE_COLUMNS} filterButtons={3} /></div>}>
          <DisbursementsList />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}

