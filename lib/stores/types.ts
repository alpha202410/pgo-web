import { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table';

/**
 * Base table state interface for all table stores
 */
export interface TableState {
    pagination: {
        pageIndex: number;
        pageSize: number;
    };
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    columnVisibility: VisibilityState;
    rowSelection: Record<string, boolean>;
}

/**
 * Actions for table state management
 */
export interface TableActions {
    setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
    setSorting: (sorting: SortingState | ((prev: SortingState) => SortingState)) => void;
    setColumnFilters: (filters: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => void;
    setColumnVisibility: (visibility: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => void;
    setRowSelection: (selection: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
    resetTableState: () => void;
}

/**
 * Combined table store type
 */
export type TableStore = TableState & TableActions;

