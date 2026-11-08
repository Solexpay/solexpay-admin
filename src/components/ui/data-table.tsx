import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";

export type ColumnMobileVisibility = "primary" | "secondary" | "hidden";

export interface Column<T> {
  /** Stable key for this column (used as the React key). */
  id: string;
  header: ReactNode;
  cell: (item: T, index: number) => ReactNode;
  mobile?: ColumnMobileVisibility;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: readonly T[];
  columns: readonly Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  loading?: boolean;
  loadingRows?: number;
  emptyState?: ReactNode;
  onRowClick?: (item: T, index: number) => void;
  rowActions?: (item: T, index: number) => ReactNode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  totalText?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  loadingRows = 5,
  emptyState,
  onRowClick,
  rowActions,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  totalText,
  className = "",
}: DataTableProps<T>) {
  const primaryColumns = columns.filter((col) => col.mobile === "primary");
  const secondaryColumns = columns.filter(
    (col) => col.mobile === "secondary" || col.mobile === undefined,
  );

  const fallbackCountText = `Showing ${data.length} item${data.length === 1 ? "" : "s"}${
    hasMore ? " · more available" : ""
  }`;
  const countText = totalText ?? fallbackCountText;

  return (
    <div className={`w-full ${className}`.trim()}>
      {/* Desktop Table View (md+) */}
      <div className="hidden md:block">
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={col.headerClassName ?? col.className ?? ""}
                  >
                    {col.header}
                  </th>
                ))}
                {rowActions && (
                  <th className="w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                skeletonKeys(loadingRows).map((rowKey) => (
                  <tr key={rowKey}>
                    {columns.map((col) => (
                      <td key={col.id}>
                        <div className="ui-skel h-5 w-3/4 rounded-md" />
                      </td>
                    ))}
                    {rowActions && (
                      <td>
                        <div className="ui-skel h-6 w-8 rounded-md" />
                      </td>
                    )}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (rowActions ? 1 : 0)}
                    className="py-12"
                  >
                    {emptyState ?? <EmptyState />}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  const key = keyExtractor(item, index);
                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick?.(item, index)}
                      onKeyDown={
                        onRowClick
                          ? (e) => {
                              if (e.target !== e.currentTarget) return;
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onRowClick(item, index);
                              }
                            }
                          : undefined
                      }
                      tabIndex={onRowClick ? 0 : undefined}
                      className={
                        onRowClick
                          ? "cursor-pointer transition-colors hover:bg-ui-rail"
                          : undefined
                      }
                    >
                      {columns.map((col) => (
                        <td key={col.id} className={col.className ?? ""}>
                          {col.cell(item, index)}
                        </td>
                      ))}
                      {rowActions && (
                        <td
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          {rowActions(item, index)}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination / Load More Footer */}
        <div className="ui-table-foot">
          <p>{countText}</p>
          {hasMore && onLoadMore && (
            <button
              type="button"
              className="ui-btn ui-btn-sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Loading…</span>
                </>
              ) : (
                <span>Load more</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="block space-y-3 md:hidden">
        {loading && data.length === 0 ? (
          skeletonKeys(loadingRows).map((rowKey) => (
            <div
              key={rowKey}
              className="rounded-xl border border-ui-line bg-white p-4 space-y-3"
            >
              <div className="ui-skel h-6 w-1/2" />
              <div className="ui-skel h-4 w-3/4" />
              <div className="ui-skel h-4 w-2/3" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="rounded-xl border border-ui-line bg-white p-6">
            {emptyState ?? <EmptyState />}
          </div>
        ) : (
          data.map((item, index) => {
            const key = keyExtractor(item, index);
            return (
              <div
                key={key}
                className={`relative rounded-xl border border-ui-line bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${
                  onRowClick
                    ? "cursor-pointer active:scale-[0.99] transition-transform"
                    : ""
                }`}
              >
                {onRowClick && (
                  // Stretched button: the whole card opens the row, while the
                  // action buttons below sit above it (relative z-10).
                  <button
                    type="button"
                    className="absolute inset-0 rounded-xl"
                    aria-label="Open details"
                    onClick={() => onRowClick(item, index)}
                  />
                )}
                {/* Primary Fields */}
                {primaryColumns.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {primaryColumns.map((col) => (
                      <div
                        key={col.id}
                        className="text-base font-semibold leading-snug text-ui-ink"
                      >
                        {col.cell(item, index)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Secondary Fields as label / value rows */}
                <div className="space-y-2 border-t border-ui-line pt-2.5">
                  {secondaryColumns.map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-ui-muted shrink-0 font-normal">
                        {col.header}
                      </span>
                      <div className="font-medium text-ui-ink text-right min-w-0">
                        {col.cell(item, index)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile Row Actions */}
                {rowActions && (
                  <div className="relative z-10 mt-3 flex items-center justify-end gap-2 border-t border-ui-line pt-2.5">
                    {rowActions(item, index)}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Mobile Load More Footer */}
        <div className="flex flex-col items-center gap-2 pt-2 pb-1 text-center text-xs text-ui-muted">
          <p>{countText}</p>
          {hasMore && onLoadMore && (
            <button
              type="button"
              className="ui-btn w-full min-h-[44px] justify-center"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading…</span>
                </>
              ) : (
                <span>Load more</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Stable keys for placeholder skeleton rows (they have no data identity). */
function skeletonKeys(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `skeleton-${i + 1}`);
}
