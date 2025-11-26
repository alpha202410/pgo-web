import { HydrateClient, prefetchUsersList } from '@/features/users/queries/server';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import UsersList from '@/features/users/components/users-list';
import { TablePageSkeleton } from '@/components/ui/table-skeleton';
import { USERS_TABLE_COLUMNS } from '@/components/ui/table-skeleton-presets';

export default async function Page() {
  await prefetchUsersList();

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<div className="px-4 lg:px-6 py-4 text-muted-foreground">Failed to load users</div>}>
        <Suspense fallback={<div className="@container/main flex flex-1 flex-col gap-2 py-2"><TablePageSkeleton rows={10} columns={USERS_TABLE_COLUMNS} filterButtons={2} /></div>}>
          <UsersList />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}

