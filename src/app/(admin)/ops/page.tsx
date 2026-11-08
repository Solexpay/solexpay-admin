"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { RefreshCw, Workflow } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { type FormEvent, Suspense, useEffect, useState } from "react";
import { z } from "zod";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import {
  broadcastNotification,
  getComplianceFlags,
  getDeadOutbox,
  requeueOutbox,
  resolveComplianceFlag,
} from "@/lib/api/admin";
import { trackAction } from "@/lib/telemetry";
import type { ComplianceFlag, DeadOutbox } from "@/lib/types";
import { confirm, getLastConfirmReason } from "@/lib/ui/confirm";
import { toast } from "@/lib/ui/toast";

const tabs = ["outbox", "compliance", "broadcast"] as const;
const opts = { history: "replace" as const, shallow: true };
const broadcastSchema = z.object({
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(1000),
  target: z.enum(["ALL", "STUDENTS", "SCHOOLS"]),
});

function OpsContent() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(tabs).withDefault("outbox").withOptions(opts),
  );
  const [flagStatus, setFlagStatus] = useQueryState(
    "flagStatus",
    parseAsStringLiteral(["ALL", "OPEN", "RESOLVED"] as const)
      .withDefault("ALL")
      .withOptions(opts),
  );
  const [draft, setDraft] = useState({
    title: "",
    message: "",
    target: "ALL" as "ALL" | "STUDENTS" | "SCHOOLS",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [updated, setUpdated] = useState(Date.now());
  const [, tick] = useState(0);
  const client = useQueryClient();
  const outbox = useInfiniteQuery({
    queryKey: ["admin", "ops", "outbox"],
    queryFn: ({ pageParam }) => getDeadOutbox({ limit: 20, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.hasMore ? (page.nextCursor ?? undefined) : undefined,
    refetchInterval: 30_000,
  });
  const flags = useInfiniteQuery({
    queryKey: ["admin", "ops", "compliance", { status: flagStatus }],
    queryFn: ({ pageParam }) =>
      getComplianceFlags({
        status: flagStatus === "ALL" ? undefined : flagStatus,
        limit: 20,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.hasMore ? (page.nextCursor ?? undefined) : undefined,
    refetchInterval: 30_000,
  });
  useEffect(() => {
    const time = tab === "outbox" ? outbox.dataUpdatedAt : flags.dataUpdatedAt;
    if (time) setUpdated(time);
  }, [outbox.dataUpdatedAt, flags.dataUpdatedAt, tab]);
  useEffect(() => {
    const id = window.setInterval(() => tick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const outboxRows = outbox.data?.pages.flatMap((page) => page.items) ?? [];
  const flagRows = (
    flags.data?.pages.flatMap((page) => page.items) ?? []
  ).filter((item) => flagStatus === "ALL" || item.status === flagStatus);
  const invalidate = (key: string) =>
    client.invalidateQueries({ queryKey: ["admin", "ops", key] });
  const requeue = useMutation({
    mutationFn: requeueOutbox,
    onSuccess: () => {
      toast.success("Event successfully requeued");
      void invalidate("outbox");
    },
    onError: () => toast.error("Failed to requeue event"),
  });
  const resolve = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      resolveComplianceFlag(id, note),
    onSuccess: () => {
      toast.success("Compliance flag marked as resolved");
      void invalidate("compliance");
    },
    onError: () => toast.error("Failed to resolve flag"),
  });
  const broadcast = useMutation({
    mutationFn: (value: z.infer<typeof broadcastSchema>) =>
      broadcastNotification(
        value.title,
        value.message,
        value.target,
        crypto.randomUUID(),
      ),
    onSuccess: () => {
      toast.success("Broadcast announcement successfully queued");
      setDraft({ title: "", message: "", target: "ALL" });
    },
    onError: () => toast.error("Failed to send broadcast"),
  });
  const requeueItem = async (item: DeadOutbox) => {
    if (
      await confirm({
        title: "Requeue this event?",
        message: "The event will be delivered again.",
        confirmLabel: "Requeue",
        tone: "primary",
      })
    )
      requeue.mutate(item.id);
  };
  const resolveFlag = async (item: ComplianceFlag) => {
    const accepted = await confirm({
      title: `Resolve compliance flag ${item.kind}?`,
      message: "Add a note explaining the resolution.",
      reasonLabel: "Resolution note",
      reasonPlaceholder: "Describe the review outcome",
      confirmLabel: "Resolve",
      tone: "primary",
    });
    if (accepted) resolve.mutate({ id: item.id, note: getLastConfirmReason() });
  };
  const submitBroadcast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = broadcastSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    const audience =
      parsed.data.target === "ALL"
        ? "all users"
        : parsed.data.target.toLowerCase();
    if (
      await confirm({
        title: "Send broadcast?",
        message: `It goes to ${audience} as a notification and can't be recalled.`,
        confirmLabel: "Send broadcast",
        tone: "danger",
        typeToConfirm: parsed.data.target === "ALL" ? "SEND" : undefined,
      })
    )
      broadcast.mutate(parsed.data);
  };
  const outboxColumns: Column<DeadOutbox>[] = [
    {
      id: "topic",
      header: "Topic",
      mobile: "primary",
      cell: (item) => item.topic,
    },
    {
      id: "id",
      header: "Event ID",
      mobile: "secondary",
      cell: (item) => (
        <CopyButton
          value={item.id}
          className="font-mono text-ui-accent"
          onClick={() => trackAction("outbox_id_copy", { id: item.id })}
        >
          {item.id}
        </CopyButton>
      ),
    },
    {
      id: "attempts",
      header: "Attempts",
      mobile: "secondary",
      cell: (item) => item.attempts,
    },
    {
      id: "error",
      header: "Last Error",
      mobile: "hidden",
      cell: (item) => item.lastError ?? "—",
    },
    {
      id: "created",
      header: "Created",
      mobile: "secondary",
      cell: (item) =>
        new Intl.DateTimeFormat("en-NG", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "Africa/Lagos",
        }).format(new Date(item.createdAt)),
    },
  ];
  const flagColumns: Column<ComplianceFlag>[] = [
    {
      id: "flag",
      header: "Flag",
      mobile: "primary",
      cell: (item) => (
        <span>
          {item.kind}
          <span className="ml-2">
            <StatusChip status={item.status} />
          </span>
        </span>
      ),
    },
    {
      id: "detail",
      header: "Detail",
      mobile: "hidden",
      cell: (item) => (
        <span
          className="block max-w-sm truncate font-mono text-xs"
          title={
            typeof item.detail === "string"
              ? item.detail
              : JSON.stringify(item.detail)
          }
        >
          {item.detail == null
            ? "—"
            : typeof item.detail === "string"
              ? item.detail
              : JSON.stringify(item.detail)}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      mobile: "secondary",
      cell: (item) => (
        <span className="flex items-center gap-2">
          <BubbleAvatar seed={item.userName} size={32} />
          <span>
            {item.userName}
            <span className="block text-xs text-ui-muted">
              {item.phoneNumber}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "created",
      header: "Created",
      mobile: "secondary",
      cell: (item) =>
        new Intl.DateTimeFormat("en-NG", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "Africa/Lagos",
        }).format(new Date(item.createdAt)),
    },
  ];
  const elapsed = Math.floor((Date.now() - updated) / 1000);
  return (
    <>
      <PageHeader
        title="Operations Center"
        icon={Workflow}
        subtitle="Dead-letter outbox event requeueing and compliance alert management"
      >
        <button
          type="button"
          className="ui-btn w-full sm:w-auto"
          onClick={() => {
            if (tab === "outbox") void outbox.refetch();
            if (tab === "compliance") void flags.refetch();
          }}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </PageHeader>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="ui-tabs" role="tablist">
            {tabs.map((value) => (
              <button
                type="button"
                key={value}
                role="tab"
                aria-selected={tab === value}
                className={`ui-tab ${tab === value ? "ui-tab-active" : ""}`}
                onClick={() => void setTab(value)}
              >
                {value === "outbox"
                  ? "Dead Outbox"
                  : value === "compliance"
                    ? "Compliance Flags"
                    : "Broadcast"}
              </button>
            ))}
          </div>
          <span className="text-xs text-ui-muted">
            Updated {Math.max(0, elapsed)}s ago
          </span>
        </div>
        {tab === "outbox" && (
          <section className="ui-panel">
            <div className="ui-panel-head">
              <h2 className="ui-panel-title">Dead-letter outbox</h2>
            </div>
            {outbox.isError && (
              <p className="ui-alert ui-alert-danger m-4">
                Couldn't load dead outbox events.{" "}
                <button
                  type="button"
                  className="ui-btn ui-btn-sm"
                  onClick={() => void outbox.refetch()}
                >
                  Try again
                </button>
              </p>
            )}
            <div className="ui-panel-body overflow-hidden">
              <DataTable
                data={outboxRows}
                columns={outboxColumns}
                keyExtractor={(item) => item.id}
                loading={outbox.isPending}
                hasMore={outbox.hasNextPage}
                isLoadingMore={outbox.isFetchingNextPage}
                onLoadMore={() => void outbox.fetchNextPage()}
                rowActions={(item) => (
                  <button
                    type="button"
                    className="ui-btn ui-btn-primary ui-btn-sm"
                    disabled={requeue.isPending}
                    onClick={() => void requeueItem(item)}
                  >
                    Requeue
                  </button>
                )}
                emptyState={
                  <div className="ui-empty">No dead outbox events.</div>
                }
              />
            </div>
          </section>
        )}
        {tab === "compliance" && (
          <section className="ui-panel">
            <div className="ui-panel-head flex-wrap">
              <h2 className="ui-panel-title">Compliance &amp; AML Alerts</h2>
              <div className="ui-tabs">
                {(["ALL", "OPEN", "RESOLVED"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`ui-tab ${flagStatus === value ? "ui-tab-active" : ""}`}
                    onClick={() => void setFlagStatus(value)}
                  >
                    {value === "ALL"
                      ? "All"
                      : value[0] + value.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            {flags.isError && (
              <p className="ui-alert ui-alert-danger m-4">
                Couldn't load compliance flags.{" "}
                <button
                  type="button"
                  className="ui-btn ui-btn-sm"
                  onClick={() => void flags.refetch()}
                >
                  Try again
                </button>
              </p>
            )}
            <div className="ui-panel-body overflow-hidden">
              <DataTable
                data={flagRows}
                columns={flagColumns}
                keyExtractor={(item) => item.id}
                loading={flags.isPending}
                hasMore={flags.hasNextPage}
                isLoadingMore={flags.isFetchingNextPage}
                onLoadMore={() => void flags.fetchNextPage()}
                rowActions={(item) =>
                  item.status === "RESOLVED" ? (
                    <StatusChip status="RESOLVED" />
                  ) : (
                    <button
                      type="button"
                      className="ui-btn ui-btn-primary ui-btn-sm"
                      disabled={resolve.isPending}
                      onClick={() => void resolveFlag(item)}
                    >
                      Resolve
                    </button>
                  )
                }
                emptyState={
                  <div className="ui-empty">No compliance flags.</div>
                }
              />
            </div>
          </section>
        )}
        {tab === "broadcast" && (
          <section className="ui-panel">
            <div className="ui-panel-head">
              <h2 className="ui-panel-title">System broadcast</h2>
            </div>
            <form
              className="ui-panel-body space-y-4 p-4"
              onSubmit={submitBroadcast}
              noValidate
            >
              <label className="ui-label">
                Title{" "}
                <span className="float-right text-xs text-ui-muted">
                  {draft.title.length}/120
                </span>
                <input
                  className="ui-input mt-1"
                  maxLength={120}
                  value={draft.title}
                  aria-describedby={
                    errors.title ? "broadcast-title-error" : undefined
                  }
                  onChange={(event) =>
                    setDraft((old) => ({ ...old, title: event.target.value }))
                  }
                />
                {errors.title && (
                  <span
                    id="broadcast-title-error"
                    className="text-xs text-ui-danger"
                  >
                    {errors.title}
                  </span>
                )}
              </label>
              <label className="ui-label">
                Audience
                <select
                  className="ui-input mt-1"
                  value={draft.target}
                  onChange={(event) =>
                    setDraft((old) => ({
                      ...old,
                      target: event.target.value as typeof old.target,
                    }))
                  }
                >
                  <option value="ALL">All users</option>
                  <option value="STUDENTS">Students</option>
                  <option value="SCHOOLS">Schools</option>
                </select>
              </label>
              <label className="ui-label">
                Message{" "}
                <span className="float-right text-xs text-ui-muted">
                  {draft.message.length}/1000
                </span>
                <textarea
                  className="ui-input mt-1"
                  rows={5}
                  maxLength={1000}
                  value={draft.message}
                  aria-describedby={
                    errors.message ? "broadcast-message-error" : undefined
                  }
                  onChange={(event) =>
                    setDraft((old) => ({ ...old, message: event.target.value }))
                  }
                />
                {errors.message && (
                  <span
                    id="broadcast-message-error"
                    className="text-xs text-ui-danger"
                  >
                    {errors.message}
                  </span>
                )}
              </label>
              <button
                type="submit"
                className="ui-btn ui-btn-primary w-full sm:w-auto"
                disabled={broadcast.isPending}
              >
                Send broadcast
              </button>
            </form>
          </section>
        )}
      </div>
    </>
  );
}

export default function OpsPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48" />}>
      <OpsContent />
    </Suspense>
  );
}
