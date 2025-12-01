"use client"

// {
//     "data": [
//         {
//             "id": "uuid",
//             "user_id": "uuid | null",
//             "username": "string | null",
//             "action": "string (e.g., 'USER_CREATED', 'PGO_UPDATED')",
//             "description": "string (e.g., 'User 'john.doe' created by Admin 'jane.smith'')",
//             "ip_address": "string",
//             "old_values": "json | null",
//             "new_values": "json | null",
//             "timestamp": "datetime"
//         }
//     ]
// }


import * as React from "react"
import {
    IconArrowDown,
    IconArrowUp,
    IconArrowsSort,
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconDotsVertical,
    IconLayoutColumns,
    IconLoader,
} from "@tabler/icons-react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    Header,
    useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"

import { useIsMobile } from "@/hooks/use-mobile"
import { AuditLog, AuditLogSchema } from "@/lib/definitions"
import { useLogsTableStore } from "@/lib/stores/logs-table-store"

// Re-export schema for build compatibility
export const schema = AuditLogSchema
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { TableSkeletonRows } from "@/components/ui/table-skeleton"
import { LOGS_TABLE_COLUMNS } from "@/components/ui/table-skeleton-presets"

// Helper function to format date
function formatDate(dateString: string | null): string {
    if (!dateString) return '-'
    try {
        return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
        return dateString
    }
}

// Helper function to truncate ID
function truncateId(id: string, maxLength: number = 20): string {
    if (!id || id.length <= maxLength) return id
    return `${id.substring(0, maxLength)}...`
}

// Sortable header component
function SortableHeader({
    header,
    children
}: {
    header: Header<AuditLog, unknown>
    children: React.ReactNode
}) {
    const canSort = header.column.getCanSort()

    if (!canSort) {
        return <>{children}</>
    }

    return (
        <Button
            variant="ghost"
            className="h-auto p-0 font-semibold hover:bg-transparent"
            onClick={header.column.getToggleSortingHandler()}
        >
            <div className="flex items-center gap-2">
                {children}
                <span className="ml-1">
                    {header.column.getIsSorted() === "desc" ? (
                        <IconArrowDown className="size-4" />
                    ) : header.column.getIsSorted() === "asc" ? (
                        <IconArrowUp className="size-4" />
                    ) : (
                        <IconArrowsSort className="size-4 text-muted-foreground opacity-50" />
                    )}
                </span>
            </div>
        </Button>
    )
}

const columns: ColumnDef<AuditLog>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: ({ header }) => (
            <SortableHeader header={header}>
                Audit Log ID
            </SortableHeader>
        ),
        cell: ({ row }) => {
            const auditLogId = row.original.id
            const truncatedId = truncateId(auditLogId, 20)

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="max-w-[180px]">
                                <TableCellViewer item={row.original} displayText={truncatedId} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-mono text-xs max-w-xs break-all">{auditLogId}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        },
        enableHiding: false,
        size: 180,
    },
    {
        accessorKey: "action",
        header: ({ header }) => (
            <SortableHeader header={header}>
                Action
            </SortableHeader>
        ),
        cell: ({ row }) => {
            const action = row.original.action || "-"
            return (
                <div className="max-w-[200px] min-w-[150px]">
                    <Badge variant="outline" className="px-2 py-0.5 whitespace-nowrap font-mono text-xs">
                        {action}
                    </Badge>
                </div>
            )
        },
        size: 200,
    },
    {
        accessorKey: "username",
        header: ({ header }) => (
            <SortableHeader header={header}>
                Username
            </SortableHeader>
        ),
        cell: ({ row }) => (
            <div className="max-w-[200px] min-w-[150px]">
                <div className="truncate font-medium">{row.original.username || "-"}</div>
            </div>
        ),
        size: 200,
    },
    {
        accessorKey: "description",
        header: ({ header }) => (
            <SortableHeader header={header}>
                Description
            </SortableHeader>
        ),
        cell: ({ row }) => (
            <div className="max-w-[400px] min-w-[300px]">
                <div className="truncate text-sm">{row.original.description || "-"}</div>
            </div>
        ),
        size: 400,
    },
    {
        accessorKey: "ip_address",
        header: ({ header }) => (
            <SortableHeader header={header}>
                IP Address
            </SortableHeader>
        ),
        cell: ({ row }) => (
            <div className="max-w-[150px] min-w-[120px]">
                <div className="truncate font-mono text-xs">{row.original.ip_address || "-"}</div>
            </div>
        ),
        size: 150,
    },
    {
        accessorKey: "timestamp",
        header: ({ header }) => (
            <SortableHeader header={header}>
                Timestamp
            </SortableHeader>
        ),
        sortingFn: (rowA, rowB) => {
            const dateA = rowA.original.timestamp
                ? new Date(rowA.original.timestamp).getTime()
                : 0
            const dateB = rowB.original.timestamp
                ? new Date(rowB.original.timestamp).getTime()
                : 0
            return dateA - dateB
        },
        cell: ({ row }) => {
            const timestamp = row.original.timestamp || null
            return (
                <div className="text-sm whitespace-nowrap">{formatDate(timestamp)}</div>
            )
        },
        size: 160,
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const openDetailDrawer = (table.options.meta as { openDetailDrawer?: (log: AuditLog) => void })?.openDetailDrawer
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                            size="icon"
                        >
                            <IconDotsVertical />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                            onClick={() => {
                                if (openDetailDrawer) {
                                    openDetailDrawer(row.original)
                                }
                            }}
                        >
                            View Details
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]


interface PaginationMeta {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
}

export function LogsTable({
    data,
    paginationMeta,
    isLoading = false,
}: {
    data: AuditLog[];
    paginationMeta: PaginationMeta;
    isLoading?: boolean;
}) {
    const {
        pagination: paginationState,
        sorting: sortingState,
        columnFilters: columnFiltersState,
        columnVisibility,
        rowSelection,
        setPagination,
        setSorting,
        setColumnFilters,
        setColumnVisibility,
        setRowSelection,
    } = useLogsTableStore()

    const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
    const isMobile = useIsMobile()

    const openDetailDrawer = React.useCallback((log: AuditLog) => {
        setSelectedLog(log)
        setIsDrawerOpen(true)
    }, [])

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting: sortingState,
            columnVisibility,
            rowSelection,
            columnFilters: columnFiltersState,
            pagination: paginationState,
        },
        meta: {
            openDetailDrawer,
        },
        getRowId: (row) => row.id,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function'
                ? updater(sortingState)
                : updater;
            setSorting(newSorting);
        },
        onColumnFiltersChange: (updater) => {
            const newFilters = typeof updater === 'function'
                ? updater(columnFiltersState)
                : updater;
            setColumnFilters(newFilters);
        },
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: (updater) => {
            const newPagination = typeof updater === 'function'
                ? updater(paginationState)
                : updater;
            setPagination(newPagination);
        },
        // Server-side pagination, sorting, and filtering configuration
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        pageCount: paginationMeta.totalPages,
        getCoreRowModel: getCoreRowModel(),
    })


    // Get unique values for filters
    const actionColumn = table.getColumn("action")

    // Get filter values for badge display
    const actionFilter = actionColumn?.getFilterValue() as string[] | undefined

    // Get unique actions from data for filter dropdown
    const uniqueActions = React.useMemo(() => {
        const actions = new Set<string>()
        data.forEach(log => {
            if (log.action) actions.add(log.action)
        })
        return Array.from(actions).sort()
    }, [data])

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex items-center justify-end gap-2 px-4 lg:px-6 shrink-0">
                {/* Action Filter */}
                {uniqueActions.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                Action
                                {actionFilter && actionFilter.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {actionFilter.length}
                                    </Badge>
                                )}
                                <IconChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuCheckboxItem
                                checked={!actionFilter || actionFilter.length === 0}
                                onCheckedChange={() => {
                                    actionColumn?.setFilterValue(undefined)
                                }}
                            >
                                All Actions
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            {uniqueActions.map((action) => (
                                <DropdownMenuCheckboxItem
                                    key={action}
                                    checked={(actionColumn?.getFilterValue() as string[] | undefined)?.includes(action) ?? false}
                                    onCheckedChange={(checked) => {
                                        const currentFilter = (actionColumn?.getFilterValue() as string[]) || []
                                        if (checked) {
                                            actionColumn?.setFilterValue([...currentFilter, action])
                                        } else {
                                            actionColumn?.setFilterValue(
                                                currentFilter.filter((v) => v !== action)
                                            )
                                        }
                                    }}
                                >
                                    {action}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Customize Columns */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <IconLayoutColumns />
                            <span className="hidden lg:inline">Customize Columns</span>
                            <span className="lg:hidden">Columns</span>
                            <IconChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        {table
                            .getAllColumns()
                            .filter(
                                (column) =>
                                    typeof column.accessorFn !== "undefined" &&
                                    column.getCanHide()
                            )
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="relative flex flex-col gap-4 px-4 lg:px-6 min-w-0">
                <div className="w-full overflow-x-auto rounded-lg border">
                    <div className="min-w-full inline-block">
                        <Table className="w-full">
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id} colSpan={header.colSpan}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody className="**:data-[slot=table-cell]:first:w-8">
                                {isLoading ? (
                                    <TableSkeletonRows rows={10} columns={LOGS_TABLE_COLUMNS} />
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <div className="flex items-center justify-between px-4 shrink-0">
                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex min-w-0">
                        {table.getSelectedRowModel().rows.length} of{" "}
                        {paginationMeta.totalElements} row(s) selected.
                    </div>
                    <div className="flex w-full items-center gap-8 lg:w-fit shrink-0">
                        <div className="hidden items-center gap-2 lg:flex">
                            <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                Rows per page
                            </Label>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    const newPageSize = Number(value);
                                    // Reset to first page when changing page size
                                    setPagination({
                                        pageIndex: 0,
                                        pageSize: newPageSize,
                                    });
                                }}
                            >
                                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                    <SelectValue
                                        placeholder={table.getState().pagination.pageSize}
                                    />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 15, 20, 30, 50].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-fit items-center justify-center text-sm font-medium">
                            Page {paginationMeta.pageNumber + 1} of{" "}
                            {paginationMeta.totalPages || 1}
                            {isLoading && <IconLoader className="ml-2 size-4 animate-spin" />}
                        </div>
                        <div className="ml-auto flex items-center gap-2 lg:ml-0">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => setPagination({ ...paginationState, pageIndex: 0 })}
                                disabled={paginationMeta.first || isLoading}
                            >
                                <span className="sr-only">Go to first page</span>
                                <IconChevronsLeft />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => setPagination({ ...paginationState, pageIndex: paginationState.pageIndex - 1 })}
                                disabled={paginationMeta.first || isLoading}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <IconChevronLeft />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => setPagination({ ...paginationState, pageIndex: paginationState.pageIndex + 1 })}
                                disabled={paginationMeta.last || isLoading}
                            >
                                <span className="sr-only">Go to next page</span>
                                <IconChevronRight />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden size-8 lg:flex"
                                size="icon"
                                onClick={() => setPagination({ ...paginationState, pageIndex: (paginationMeta.totalPages || 1) - 1 })}
                                disabled={paginationMeta.last || isLoading}
                            >
                                <span className="sr-only">Go to last page</span>
                                <IconChevronsRight />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {selectedLog && (
                <Drawer
                    open={isDrawerOpen}
                    onOpenChange={(open) => {
                        setIsDrawerOpen(open)
                        if (!open) {
                            setSelectedLog(null)
                        }
                    }}
                    direction={isMobile ? "bottom" : "right"}
                >
                    <DrawerContent>
                        <DrawerHeader className="gap-1">
                            <DrawerTitle>Audit Log Details</DrawerTitle>
                            <DrawerDescription>
                                Audit Log ID: {selectedLog.id}
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                            {/* Audit Log Information Section */}
                            <div className="flex flex-col gap-3">
                                <Label className="text-base font-semibold">Audit Log Information</Label>
                                <div className="grid gap-2 rounded-lg border p-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ID:</span>
                                        <span className="font-mono text-xs">{selectedLog.id}</span>
                                    </div>
                                    {selectedLog.user_id && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">User ID:</span>
                                            <span className="font-mono text-xs">{selectedLog.user_id}</span>
                                        </div>
                                    )}
                                    {selectedLog.username && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Username:</span>
                                            <span>{selectedLog.username}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Action:</span>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {selectedLog.action || "-"}
                                        </Badge>
                                    </div>
                                    {selectedLog.description && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Description:</span>
                                            <span className="wrap-break-word text-right max-w-[60%]">{selectedLog.description}</span>
                                        </div>
                                    )}
                                    {selectedLog.ip_address && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">IP Address:</span>
                                            <span className="font-mono text-xs">{selectedLog.ip_address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(selectedLog.old_values || selectedLog.new_values) && (
                                <>
                                    <Separator />

                                    {/* Changes Information */}
                                    <div className="flex flex-col gap-3">
                                        <Label className="text-base font-semibold">Changes</Label>
                                        <div className="grid gap-2 rounded-lg border p-3">
                                            {selectedLog.old_values && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-muted-foreground font-medium">Old Values:</span>
                                                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                                                        {JSON.stringify(selectedLog.old_values, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {selectedLog.new_values && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-muted-foreground font-medium">New Values:</span>
                                                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                                                        {JSON.stringify(selectedLog.new_values, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator />

                            {/* Timestamp */}
                            <div className="flex flex-col gap-3">
                                <Label className="text-base font-semibold">Timestamp</Label>
                                <div className="grid gap-2 rounded-lg border p-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Timestamp:</span>
                                        <span>{formatDate(selectedLog.timestamp)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DrawerFooter>
                            <DrawerClose asChild>
                                <Button variant="outline">Close</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            )}
        </div>
    )
}


function TableCellViewer({ item, displayText }: { item: AuditLog; displayText?: string }) {
    const isMobile = useIsMobile()
    const textToShow = displayText || item.id || "-"

    return (
        <Drawer direction={isMobile ? "bottom" : "right"}>
            <DrawerTrigger asChild>
                <Button variant="link" className="text-foreground w-fit px-0 text-left font-mono text-xs">
                    {textToShow}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="gap-1">
                    <DrawerTitle>Audit Log Details</DrawerTitle>
                    <DrawerDescription>
                        Audit Log ID: {item.id}
                    </DrawerDescription>
                </DrawerHeader>
                <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                    {/* Audit Log Information Section */}
                    <div className="flex flex-col gap-3">
                        <Label className="text-base font-semibold">Audit Log Information</Label>
                        <div className="grid gap-2 rounded-lg border p-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">ID:</span>
                                <span className="font-mono text-xs">{item.id}</span>
                            </div>
                            {item.user_id && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">User ID:</span>
                                    <span className="font-mono text-xs">{item.user_id}</span>
                                </div>
                            )}
                            {item.username && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Username:</span>
                                    <span>{item.username}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Action:</span>
                                <Badge variant="outline" className="font-mono text-xs">
                                    {item.action || "-"}
                                </Badge>
                            </div>
                            {item.description && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Description:</span>
                                    <span className="wrap-break-word text-right max-w-[60%]">{item.description}</span>
                                </div>
                            )}
                            {item.ip_address && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">IP Address:</span>
                                    <span className="font-mono text-xs">{item.ip_address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {(item.old_values || item.new_values) && (
                        <>
                            <Separator />

                            {/* Changes Information */}
                            <div className="flex flex-col gap-3">
                                <Label className="text-base font-semibold">Changes</Label>
                                <div className="grid gap-2 rounded-lg border p-3">
                                    {item.old_values && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-muted-foreground font-medium">Old Values:</span>
                                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                                                {JSON.stringify(item.old_values, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {item.new_values && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-muted-foreground font-medium">New Values:</span>
                                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                                                {JSON.stringify(item.new_values, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <Separator />

                    {/* Timestamp */}
                    <div className="flex flex-col gap-3">
                        <Label className="text-base font-semibold">Timestamp</Label>
                        <div className="grid gap-2 rounded-lg border p-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Timestamp:</span>
                                <span>{formatDate(item.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}