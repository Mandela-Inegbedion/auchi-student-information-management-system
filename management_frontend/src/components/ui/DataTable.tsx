import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading = false,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>) {
  if (isLoading) return <LoadingState label="Loading table information" />;
  if (rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {columns.map((column) => (
              <th key={column.key} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 ${column.className ?? ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="transition hover:bg-slate-50/70">
              {columns.map((column) => (
                <td key={column.key} className={`px-5 py-4 text-sm text-slate-700 sm:px-6 ${column.className ?? ''}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
