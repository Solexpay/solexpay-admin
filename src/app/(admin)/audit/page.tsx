"use client";

import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import {
  BadgeCheck,
  Braces,
  Download,
  History,
  ShieldCheck,
  X,
} from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { Suspense, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { getAuditLogs, verifyAuditChain } from "@/lib/api/admin";
import { downloadCsv } from "@/lib/csv";
import { apiGet } from "@/lib/http";
import { trackAction, trackExport } from "@/lib/telemetry";
import type { AuditLog, AuditVerifyResult, CursorPage } from "@/lib/types";
import { toast } from "@/lib/ui/toast";

const opts = { history: "replace" as const, shallow: true };
function AuditContent() {
  const [{ actor, action, entity, actorType }, setFilters] = useQueryStates(
    {
      actor: parseAsString.withDefault(""),
      action: parseAsString.withDefault(""),
      entity: parseAsString.withDefault(""),
      actorType: parseAsString.withDefault(""),
    },
    opts,
  );
  const [fromSeq, setFromSeq] = useState("");
  const [toSeq, setToSeq] = useState("");
  const [result, setResult] = useState<AuditVerifyResult | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const params = {
    actorId: actor,
    actorType,
    action,
    entityId: entity,
    limit: 50,
  };
  const query = useInfiniteQuery({
    queryKey: ["admin", "audit", { actor, action, entity, actorType }],
    queryFn: ({ pageParam }) => getAuditLogs({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.hasMore ? (page.nextCursor ?? undefined) : undefined,
  });
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  const verify = useMutation({
    mutationFn: () =>
      verifyAuditChain(
        fromSeq ? Number(fromSeq) : undefined,
        toSeq ? Number(toSeq) : undefined,
      ),
    onSuccess: (value) => {
      setResult(value);
      if (value.ok)
        toast.success(`Chain verified: ${value.checked} records valid.`);
      else
        toast.error(`Chain broken at sequence ${value.firstBrokenChainSeq}!`);
    },
    onError: () => toast.error("Failed to verify hash chain"),
  });
  const validRange =
    (!fromSeq || (Number.isInteger(Number(fromSeq)) && Number(fromSeq) >= 1)) &&
    (!toSeq || (Number.isInteger(Number(toSeq)) && Number(toSeq) >= 1)) &&
    (!fromSeq || !toSeq || Number(fromSeq) <= Number(toSeq));
  const exportRows = async () => {
    try {
      const exported: AuditLog[] = [];
      let cursor: string | undefined;
      let hasMore = true;
      while (hasMore) {
        const page = await apiGet<CursorPage<AuditLog>>(
          "/admin/audit",
          { ...params, cursor },
          { purpose: "export" },
        );
        exported.push(...page.items);
        cursor = page.nextCursor ?? undefined;
        hasMore = page.hasMore && Boolean(cursor);
      }
      downloadCsv("audit-ledger", exported, [
        { label: "Sequence", value: (row) => row.seq },
        { label: "Timestamp", value: (row) => row.createdAt },
        { label: "Actor Type", value: (row) => row.actorType },
        { label: "Actor ID", value: (row) => row.actorId },
        { label: "Action", value: (row) => row.action },
        { label: "Entity Type", value: (row) => row.entityType },
        { label: "Entity ID", value: (row) => row.entityId },
        { label: "IP", value: (row) => row.ip },
        { label: "User Agent", value: (row) => row.userAgent },
        { label: "Created", value: (row) => row.createdAt },
      ]);
      trackExport({
        resource: "audit",
        rows: exported.length,
        filters: { actor, action, entity, actorType },
      });
    } catch {
      toast.error("Couldn't export audit ledger");
    }
  };
  const columns: Column<AuditLog>[] = [
    {
      id: "seq",
      header: "Seq",
      mobile: "secondary",
      cell: (row) => <span className="font-mono">{row.seq}</span>,
    },
    {
      id: "time",
      header: "Timestamp",
      mobile: "secondary",
      cell: (row) =>
        new Intl.DateTimeFormat("en-NG", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "Africa/Lagos",
        }).format(new Date(row.createdAt)),
    },
    {
      id: "actor",
      header: "Actor",
      mobile: "primary",
      cell: (row) => (
        <span>
          {row.actorType}
          <CopyButton
            value={row.actorId}
            className="block max-w-[140px] truncate text-left font-mono text-xs text-ui-muted hover:text-ui-accent"
            title="Copy and filter by this actor"
            onClick={() => {
              void setFilters({ actor: row.actorId });
              trackAction("audit_actor_copy", { id: row.id });
            }}
          >
            {row.actorId}
          </CopyButton>
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      mobile: "primary",
      cell: (row) => row.action,
    },
    {
      id: "entity",
      header: "Entity",
      mobile: "secondary",
      cell: (row) => (
        <span>
          {row.entityType}
          <CopyButton
            value={row.entityId}
            className="block max-w-[140px] truncate text-left font-mono text-xs text-ui-muted hover:text-ui-accent"
            title="Copy and filter by this entity"
            onClick={() => {
              void setFilters({ entity: row.entityId });
              trackAction("audit_entity_copy", { id: row.id });
            }}
          >
            {row.entityId}
          </CopyButton>
        </span>
      ),
    },
    {
      id: "client",
      header: "IP / Client",
      mobile: "hidden",
      cell: (row) => (
        <span className="font-mono text-xs">
          {row.ip}
          <span className="block max-w-40 truncate text-ui-muted">
            {row.userAgent}
          </span>
        </span>
      ),
    },
    {
      id: "hash",
      header: "Hash",
      mobile: "hidden",
      cell: (row) => (
        <CopyButton
          value={row.hash}
          className="max-w-44 truncate font-mono text-ui-accent"
          onClick={() => trackAction("audit_hash_copy", { id: row.id })}
        >
          {row.hash}
        </CopyButton>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Audit Ledger"
        icon={History}
        subtitle="Immutable cryptographic audit trail and hash chain verification"
      >
        <button
          type="button"
          className="ui-btn w-full sm:w-auto"
          onClick={() => void exportRows()}
        >
          <Download size={15} />
          Export CSV
        </button>
      </PageHeader>
      <div className="space-y-4">
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Verify Cryptographic Hash Chain</h2>
            <span className="ui-meta">Integrity check</span>
          </div>
          <div className="ui-panel-body space-y-4 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-ui-accent" />
              <p className="text-xs text-ui-muted">
                Verify cryptographic integrity of audit sequence entries. Each
                audit record contains a hash of its payload and previous entry.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="ui-label">
                From Seq
                <input
                  className="ui-input mt-1 w-full font-mono sm:w-28"
                  type="number"
                  min="1"
                  value={fromSeq}
                  onChange={(event) => setFromSeq(event.target.value)}
                />
              </label>
              <label className="ui-label">
                To Seq
                <input
                  className="ui-input mt-1 w-full font-mono sm:w-28"
                  type="number"
                  min="1"
                  value={toSeq}
                  onChange={(event) => setToSeq(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="ui-btn ui-btn-primary w-full sm:w-auto"
                disabled={!validRange || verify.isPending}
                onClick={() => verify.mutate()}
              >
                {verify.isPending ? (
                  "Verifying…"
                ) : (
                  <>
                    <BadgeCheck size={15} />
                    Verify Chain
                  </>
                )}
              </button>
            </div>
            {!validRange && (
              <p className="text-xs text-ui-danger">
                Enter a valid sequence range.
              </p>
            )}
            {result && (
              <div
                className={`ui-alert ${result.ok ? "ui-alert-info" : "ui-alert-danger"}`}
                role="status"
              >
                <div>
                  <p className="font-medium">
                    {result.ok
                      ? "Hash Chain Integrity Verified OK"
                      : "Hash Chain Broken / Tampering Detected!"}
                  </p>
                  {result.ok ? (
                    <p className="mt-0.5 text-xs">
                      Checked {result.checked} sequence record
                      {result.checked === 1 ? "" : "s"} in range. No
                      discrepancies found.
                    </p>
                  ) : (
                    <p className="mt-0.5 font-mono text-xs">
                      First broken sequence: #{result.firstBrokenChainSeq}{" "}
                      (Record ID: {result.firstBrokenAuditId})
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="ui-panel">
          <div className="ui-panel-head flex-wrap">
            <h2 className="ui-panel-title">Audit Ledger</h2>
            <button
              type="button"
              className="ui-btn ui-btn-sm md:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              Filters
              {(actor || action || entity || actorType) && (
                <span className="ml-1 h-2 w-2 rounded-full bg-ui-accent" />
              )}
            </button>
            <div className="hidden w-full grid-cols-1 gap-2 md:grid md:w-auto md:grid-cols-4">
              <input
                className="ui-input"
                aria-label="Filter action"
                placeholder="Filter by action"
                value={action}
                onChange={(event) =>
                  void setFilters({ action: event.target.value })
                }
              />
              <select
                className="ui-input"
                aria-label="Filter actor type"
                value={actorType}
                onChange={(event) =>
                  void setFilters({ actorType: event.target.value })
                }
              >
                <option value="">All Actors</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
                <option value="SYSTEM">SYSTEM</option>
              </select>
              <input
                className="ui-input"
                aria-label="Filter actor"
                placeholder="Actor ID"
                value={actor}
                onChange={(event) =>
                  void setFilters({ actor: event.target.value })
                }
              />
              <input
                className="ui-input"
                aria-label="Filter entity"
                placeholder="Entity ID"
                value={entity}
                onChange={(event) =>
                  void setFilters({ entity: event.target.value })
                }
              />
            </div>
          </div>
          {query.isError && (
            <p className="ui-alert ui-alert-danger m-4">
              Couldn't load audit records.{" "}
              <button
                type="button"
                className="ui-btn ui-btn-sm"
                onClick={() => void query.refetch()}
              >
                Try again
              </button>
            </p>
          )}
          <div className="ui-panel-body overflow-hidden">
            <DataTable
              data={rows}
              columns={columns}
              keyExtractor={(row) => row.id}
              loading={query.isPending}
              hasMore={query.hasNextPage}
              isLoadingMore={query.isFetchingNextPage}
              onLoadMore={() => void query.fetchNextPage()}
              rowActions={(row) => (
                <button
                  type="button"
                  className="ui-icon-btn"
                  title="View Payload Data"
                  aria-label="View Payload Data"
                  onClick={() => {
                    setSelected(row);
                    trackAction("audit_payload_open", { id: row.id });
                  }}
                >
                  <Braces size={16} />
                </button>
              )}
              emptyState={
                <div className="ui-empty">No audit records found.</div>
              }
            />
          </div>
        </section>
      </div>
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        className="max-h-[90dvh] overflow-y-auto md:max-w-lg"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">Filter Audit Ledger</h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="ui-modal-body space-y-3">
          <label className="ui-label">
            Action
            <input
              className="ui-input mt-1"
              value={action}
              onChange={(event) =>
                void setFilters({ action: event.target.value })
              }
            />
          </label>
          <label className="ui-label">
            Actor type
            <select
              className="ui-input mt-1"
              value={actorType}
              onChange={(event) =>
                void setFilters({ actorType: event.target.value })
              }
            >
              <option value="">All Actors</option>
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </label>
          <label className="ui-label">
            Actor ID
            <input
              className="ui-input mt-1"
              value={actor}
              onChange={(event) =>
                void setFilters({ actor: event.target.value })
              }
            />
          </label>
          <label className="ui-label">
            Entity ID
            <input
              className="ui-input mt-1"
              value={entity}
              onChange={(event) =>
                void setFilters({ entity: event.target.value })
              }
            />
          </label>
        </div>
        <div className="ui-modal-foot flex-col sm:flex-row">
          <button
            type="button"
            className="ui-btn w-full sm:w-auto"
            onClick={() => {
              void setFilters({
                actor: "",
                action: "",
                entity: "",
                actorType: "",
              });
              setFiltersOpen(false);
            }}
          >
            Clear filters
          </button>
          <button
            type="button"
            className="ui-btn ui-btn-primary w-full sm:w-auto"
            onClick={() => setFiltersOpen(false)}
          >
            Apply filters
          </button>
        </div>
      </Modal>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        className="sm:max-w-xl"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">
            Audit Record #{selected?.seq} Payload
          </h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close"
            onClick={() => setSelected(null)}
          >
            <X size={16} />
          </button>
        </div>
        {selected && (
          <div className="ui-modal-body space-y-4">
            <dl className="ui-dl">
              <div className="sm:col-span-2">
                <dt className="ui-dt">Hash</dt>
                <dd className="ui-dd break-all font-mono">
                  <CopyButton
                    value={selected.hash}
                    onClick={() =>
                      trackAction("audit_hash_copy", { id: selected.id })
                    }
                  >
                    {selected.hash}
                  </CopyButton>
                </dd>
              </div>
              <div>
                <dt className="ui-dt">Action</dt>
                <dd className="ui-dd font-mono">{selected.action}</dd>
              </div>
              <div>
                <dt className="ui-dt">Timestamp</dt>
                <dd className="ui-dd">
                  {new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                    timeZone: "Africa/Lagos",
                  }).format(new Date(selected.createdAt))}
                </dd>
              </div>
            </dl>
            <div>
              <p className="mb-1.5 text-xs font-medium text-ui-muted">
                Payload JSON
              </p>
              <pre className="max-h-60 overflow-x-auto rounded-xl border border-ui-line bg-ui-sunken p-3 font-mono text-xs text-ui-body">
                {JSON.stringify(selected.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
        <div className="ui-modal-foot">
          <button
            type="button"
            className="ui-btn w-full sm:w-auto"
            onClick={() => setSelected(null)}
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
export default function AuditPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48" />}>
      <AuditContent />
    </Suspense>
  );
}
