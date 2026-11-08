"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BadgeCheck,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, useEffect, useState } from "react";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { approveKyc, getKycQueue, rejectKyc } from "@/lib/api/admin";
import { formatDateTime } from "@/lib/format";
import { trackAction } from "@/lib/telemetry";
import type { KycItem } from "@/lib/types";
import { confirm, getLastConfirmReason } from "@/lib/ui/confirm";
import { toast } from "@/lib/ui/toast";

const statuses = ["PENDING", "APPROVED", "REJECTED"] as const;
const queryOptions = { history: "replace" as const, shallow: true };

function KycContent() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(statuses)
      .withDefault("PENDING")
      .withOptions(queryOptions),
  );
  const [selected, setSelected] = useState<KycItem | null>(null);
  const [showNumber, setShowNumber] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [, forceUpdated] = useState(0);
  const client = useQueryClient();
  const queue = useInfiniteQuery({
    queryKey: ["admin", "kyc", { status }],
    queryFn: ({ pageParam }) =>
      getKycQueue({ status, limit: 20, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.hasMore ? (page.nextCursor ?? undefined) : undefined,
    refetchInterval: 30_000,
  });
  useEffect(() => {
    if (queue.dataUpdatedAt) setLastUpdated(queue.dataUpdatedAt);
  }, [queue.dataUpdatedAt]);
  useEffect(() => {
    const timer = window.setInterval(
      () => forceUpdated((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const rows = queue.data?.pages.flatMap((page) => page.items) ?? [];
  const pendingMutation = useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: "approve" | "reject";
      reason?: string;
    }) => (action === "approve" ? approveKyc(id) : rejectKyc(id, reason)),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "approve"
          ? "KYC verification approved"
          : "KYC verification rejected",
      );
      setSelected(null);
      void client.invalidateQueries({ queryKey: ["admin", "kyc"] });
    },
    onError: (_, variables) =>
      toast.error(`Failed to ${variables.action} KYC verification`),
  });
  const review = async (item: KycItem, action: "approve" | "reject") => {
    const accepted = await confirm(
      action === "approve"
        ? {
            title: `Approve KYC for ${item.userName}?`,
            message:
              "Their account moves up to the tier this verification unlocks.",
            confirmLabel: "Approve",
            tone: "primary",
          }
        : {
            title: `Reject KYC for ${item.userName}?`,
            message: "They see the reason and can submit a new verification.",
            confirmLabel: "Reject",
            tone: "danger",
            reasonLabel: "Reason shown to the user",
            reasonPlaceholder: "e.g. Name on ID doesn't match account name",
          },
    );
    if (accepted)
      pendingMutation.mutate({
        id: item.id,
        action,
        reason: action === "reject" ? getLastConfirmReason() : undefined,
      });
  };
  const mask = (value: string) =>
    value.length <= 4
      ? value
      : `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
  const ageHours = rows.length
    ? Math.max(
        0,
        Math.floor(
          (Date.now() -
            Math.min(
              ...rows.map((item) => new Date(item.submittedAt).getTime()),
            )) /
            3_600_000,
        ),
      )
    : 0;
  const columns: Column<KycItem>[] = [
    {
      id: "user",
      header: "User",
      mobile: "primary",
      cell: (item) => (
        <button
          type="button"
          className="flex items-center gap-2 text-left font-medium hover:text-ui-accent"
          onClick={() => {
            setShowNumber(false);
            setSelected(item);
            trackAction("kyc_detail_open", { id: item.id });
          }}
        >
          <BubbleAvatar seed={item.userName} size={32} />
          <span>
            <span className="block">{item.userName}</span>
            <span className="text-xs text-ui-muted">ID: {item.userId}</span>
          </span>
        </button>
      ),
    },
    {
      id: "type",
      header: "Verification Type",
      mobile: "secondary",
      cell: (item) => item.type,
    },
    {
      id: "document",
      header: "Document Number",
      mobile: "hidden",
      cell: (item) => (
        <div>
          <CopyButton
            value={item.documentNumber}
            className="font-mono hover:text-ui-accent"
            title="Click to copy document number"
            toastMessage="Document number copied"
            onClick={() => trackAction("kyc_document_copy", { id: item.id })}
          >
            {mask(item.documentNumber)}
          </CopyButton>
          {item.documents?.map((doc) => (
            <span key={doc} className="ui-badge ui-badge-neutral ml-1">
              <FileText size={13} />
              {doc}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "submitted",
      header: "Submitted",
      mobile: "secondary",
      cell: (item) => formatDateTime(item.submittedAt),
    },
    {
      id: "status",
      header: "Status",
      mobile: "secondary",
      cell: (item) => <StatusChip status={item.status} />,
    },
  ];
  const elapsed = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));

  return (
    <>
      <PageHeader
        title="KYC Verification Queue"
        icon={ShieldCheck}
        subtitle="Review and approve identity verifications"
      >
        <span className="ui-badge ui-badge-warning">
          {rows.length}
          {queue.hasNextPage ? "+" : ""}{" "}
          {status === "PENDING"
            ? "Pending"
            : status === "APPROVED"
              ? "Approved"
              : "Rejected"}
        </span>
        <button
          className="ui-btn"
          type="button"
          onClick={() => void queue.refetch()}
          disabled={queue.isFetching}
        >
          <RefreshCw
            size={15}
            className={queue.isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </PageHeader>
      <div className="mb-3 text-right text-xs text-ui-muted">
        Updated {elapsed}s ago
      </div>
      <div className="space-y-4">
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Overview</h2>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <MetricCard
              label="In queue"
              icon={Users}
              value={rows.length}
              suffix={queue.hasNextPage ? "+" : ""}
            />
            <MetricCard
              label="Oldest waiting"
              icon={Clock3}
              value={ageHours < 48 ? ageHours : Math.floor(ageHours / 24)}
              suffix={ageHours < 48 ? "h" : "d"}
            />
          </div>
        </section>
        <section className="ui-panel">
          <div className="ui-panel-head flex-wrap">
            <h2 className="ui-panel-title">KYC queue</h2>
            <div className="ui-tabs">
              {statuses.map((value) => (
                <button
                  type="button"
                  key={value}
                  className={`ui-tab ${status === value ? "ui-tab-active" : ""}`}
                  onClick={() => void setStatus(value)}
                >
                  {value[0] + value.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          {queue.isError && (
            <div className="ui-alert ui-alert-danger m-4">
              Couldn't load KYC verifications.
              <button
                type="button"
                className="ui-btn ui-btn-sm ml-auto"
                onClick={() => void queue.refetch()}
              >
                Try again
              </button>
            </div>
          )}
          <div className="ui-panel-body overflow-hidden">
            <DataTable
              data={rows}
              columns={columns}
              keyExtractor={(item) => item.id}
              loading={queue.isPending}
              hasMore={queue.hasNextPage}
              isLoadingMore={queue.isFetchingNextPage}
              onLoadMore={() => void queue.fetchNextPage()}
              totalText={`${rows.length} shown`}
              rowActions={(item) => (
                <span className="flex justify-end gap-1.5">
                  {item.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        className="ui-btn ui-btn-primary ui-btn-sm"
                        disabled={pendingMutation.isPending}
                        onClick={() => void review(item, "approve")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="ui-btn ui-btn-danger ui-btn-sm"
                        disabled={pendingMutation.isPending}
                        onClick={() => void review(item, "reject")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="ui-icon-btn"
                    aria-label="View detailed information"
                    onClick={() => {
                      setShowNumber(false);
                      setSelected(item);
                      trackAction("kyc_detail_open", { id: item.id });
                    }}
                  >
                    <Eye size={16} />
                  </button>
                </span>
              )}
              emptyState={
                status === "PENDING" ? (
                  <EmptyState
                    icon={BadgeCheck}
                    title="Queue clear"
                    message="No verifications are waiting for review."
                  />
                ) : (
                  <EmptyState
                    message={`No ${status.toLowerCase()} verifications`}
                  />
                )
              }
            />
          </div>
        </section>
      </div>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        className="max-h-[92dvh] overflow-y-auto md:max-w-xl"
      >
        {selected && (
          <>
            <div className="ui-modal-head">
              <h2 className="ui-modal-title">KYC details</h2>
              <button
                type="button"
                className="ui-icon-btn"
                aria-label="Close"
                onClick={() => setSelected(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ui-modal-body">
              <dl className="ui-dl">
                <div>
                  <dt className="ui-dt">User</dt>
                  <dd className="ui-dd">{selected.userName}</dd>
                </div>
                <div>
                  <dt className="ui-dt">User ID</dt>
                  <dd className="ui-dd">{selected.userId}</dd>
                </div>
                <div>
                  <dt className="ui-dt">Verification type</dt>
                  <dd className="ui-dd">{selected.type}</dd>
                </div>
                <div>
                  <dt className="ui-dt">Document number</dt>
                  <dd className="ui-dd flex items-center gap-2">
                    <span className="font-mono">
                      {showNumber
                        ? selected.documentNumber
                        : mask(selected.documentNumber)}
                    </span>
                    <button
                      type="button"
                      className="ui-btn ui-btn-sm"
                      aria-pressed={showNumber}
                      onClick={() => {
                        setShowNumber((value) => !value);
                        trackAction(
                          showNumber
                            ? "kyc_document_hide"
                            : "kyc_document_reveal",
                          { id: selected.id },
                        );
                      }}
                    >
                      {showNumber ? "Hide" : "Show"}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt className="ui-dt">Submitted</dt>
                  <dd className="ui-dd">
                    {formatDateTime(selected.submittedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="ui-dt">Status</dt>
                  <dd className="ui-dd">
                    <StatusChip status={selected.status} />
                  </dd>
                </div>
                {selected.failureReason && (
                  <div className="sm:col-span-2">
                    <dt className="ui-dt">Failure reason</dt>
                    <dd className="ui-dd">{selected.failureReason}</dd>
                  </div>
                )}
              </dl>
              {selected.documents?.length ? (
                <div className="mt-4">
                  <p className="ui-dt mb-2">Documents</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.documents.map((doc) => (
                      <span key={doc} className="ui-badge ui-badge-neutral">
                        <FileText size={14} />
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="ui-modal-foot flex-col sm:flex-row">
              {selected.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    className="ui-btn ui-btn-primary w-full sm:w-auto"
                    onClick={() => void review(selected, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn-danger w-full sm:w-auto"
                    onClick={() => void review(selected, "reject")}
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                type="button"
                className="ui-btn w-full sm:w-auto"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

export default function KycPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48" />}>
      <KycContent />
    </Suspense>
  );
}
