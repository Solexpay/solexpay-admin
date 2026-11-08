"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowUpRight,
  Clock,
  Download,
  Filter,
  Inbox,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
  Send,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import {
  getSupportTicket,
  listSupportTickets,
  replySupportTicket,
  setSupportTicketStatus,
} from "@/lib/api/admin";
import { downloadCsv } from "@/lib/csv";
import { formatDateTime, formatRelative } from "@/lib/format";
import { apiGet } from "@/lib/http";
import { trackAction, trackExport } from "@/lib/telemetry";
import type {
  CursorPage,
  SupportTicket,
  SupportTicketDetail,
} from "@/lib/types";
import { toast } from "@/lib/ui/toast";

const queryOptions = { history: "replace" as const, shallow: true };

const STATUS_TABS = [
  { label: "All Tickets", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

function SupportContent() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [ticketId, setTicketId] = useQueryState(
    "ticket",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [replyText, setReplyText] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Tickets list query with 30s auto-refresh
  const ticketsQuery = useInfiniteQuery<CursorPage<SupportTicket>>({
    queryKey: ["admin", "support-tickets", { status }],
    queryFn: ({ pageParam }) =>
      listSupportTickets({
        status: status || undefined,
        limit: 25,
        cursor: (pageParam as string | undefined) || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    refetchInterval: 30_000,
  });

  // Track "Updated Xs ago" timer
  useEffect(() => {
    if (!ticketsQuery.dataUpdatedAt) return;
    setSecondsAgo(0);
    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - ticketsQuery.dataUpdatedAt) / 1000,
      );
      setSecondsAgo(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [ticketsQuery.dataUpdatedAt]);

  // Overall counts across tickets
  const allTicketsQuery = useQuery({
    queryKey: ["admin", "support-tickets", "counts"],
    queryFn: () => listSupportTickets({ limit: 100 }),
    refetchInterval: 30_000,
  });

  const counts = useMemo(() => {
    const items = allTicketsQuery.data?.items ?? [];
    return {
      all: items.length,
      open: items.filter((t) => t.status === "OPEN").length,
      inProgress: items.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: items.filter((t) => t.status === "RESOLVED").length,
      closed: items.filter((t) => t.status === "CLOSED").length,
    };
  }, [allTicketsQuery.data]);

  // Ticket detail query
  const detailQuery = useQuery<SupportTicketDetail>({
    queryKey: ["admin", "support-ticket", ticketId],
    queryFn: () => getSupportTicket(ticketId),
    enabled: Boolean(ticketId),
    refetchInterval: 15_000,
  });

  // Scroll to bottom of message thread when ticket details load or update
  useEffect(() => {
    if (detailQuery.data?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [detailQuery.data?.messages]);

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      replySupportTicket(id, message),
    onSuccess: (updated) => {
      setReplyText("");
      toast.success("Reply sent to customer");
      queryClient.setQueryData(["admin", "support-ticket", ticketId], updated);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "support-tickets"],
      });
    },
    onError: () => {
      toast.error("Failed to send reply");
    },
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      setSupportTicketStatus(id, newStatus),
    onSuccess: (updated) => {
      toast.success(`Ticket marked as ${updated.status}`);
      queryClient.setQueryData(["admin", "support-ticket", ticketId], updated);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "support-tickets"],
      });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const openTicket = (ticket: SupportTicket) => {
    void setTicketId(ticket.id);
    trackAction("support_ticket_open", { id: ticket.id });
  };

  const closeTicketDetail = () => {
    void setTicketId("");
    setReplyText("");
  };

  const handleSendReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed || !ticketId || replyMutation.isPending) return;
    replyMutation.mutate({ id: ticketId, message: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendReply();
    }
  };

  const exportTickets = async () => {
    try {
      const result = await apiGet<CursorPage<SupportTicket>>(
        "/admin/support/tickets",
        { status: status || undefined, limit: 100 },
        { purpose: "export" },
      );
      const rows = result.items ?? [];
      downloadCsv("support-tickets", rows, [
        { label: "Reference", value: (row) => row.reference },
        { label: "Category", value: (row) => row.category },
        { label: "Subject", value: (row) => row.subject },
        { label: "Status", value: (row) => row.status },
        {
          label: "Related Reference",
          value: (row) => row.relatedReference ?? "",
        },
        { label: "Last Message At", value: (row) => row.lastMessageAt },
        { label: "Created At", value: (row) => row.createdAt },
      ]);
      trackExport({
        resource: "support_tickets",
        rows: rows.length,
        filters: { status: status || "ALL" },
      });
      toast.success("Support tickets exported");
    } catch {
      toast.error("Failed to export tickets");
    }
  };

  const allTickets =
    ticketsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const selectedTicket = detailQuery.data;

  const columns: Column<SupportTicket>[] = [
    {
      id: "reference",
      header: "Reference",
      mobile: "primary",
      cell: (ticket) => (
        <div>
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-ui-ink">
            <span>{ticket.reference}</span>
            <CopyButton
              value={ticket.reference}
              toastMessage="Reference copied"
              onClick={() =>
                trackAction("ticket_reference_copy", { id: ticket.id })
              }
            />
          </div>
          {ticket.relatedReference && (
            <p className="mt-0.5 text-[11px] text-ui-muted truncate max-w-36">
              Ref: {ticket.relatedReference}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "subject",
      header: "Subject & Category",
      mobile: "primary",
      cell: (ticket) => (
        <div className="max-w-md">
          <p className="font-medium text-ui-ink line-clamp-1">
            {ticket.subject}
          </p>
          <span className="mt-1 inline-flex items-center rounded-md bg-ui-sunken px-2 py-0.5 text-[11px] font-medium text-ui-muted">
            {ticket.category}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      mobile: "secondary",
      cell: (ticket) => <StatusChip status={ticket.status} />,
    },
    {
      id: "updated",
      header: "Last Activity",
      mobile: "secondary",
      cell: (ticket) => (
        <div className="text-xs text-ui-muted">
          <span>{formatRelative(ticket.lastMessageAt)}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      mobile: "primary",
      className: "text-right",
      cell: (ticket) => (
        <button
          type="button"
          className="ui-btn ui-btn-sm"
          onClick={() => openTicket(ticket)}
        >
          View thread
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Inbox"
        crumb="Support"
        subtitle="Customer enquiries, dispute resolution, and ticket messages"
        icon={LifeBuoy}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Last refreshed indicator & manual refresh */}
          <div className="flex items-center gap-1 text-xs text-ui-muted mr-1">
            <Clock size={13} />
            <span>Updated {secondsAgo}s ago</span>
          </div>

          <button
            type="button"
            className="ui-btn ui-btn-sm"
            onClick={() => void ticketsQuery.refetch()}
            disabled={ticketsQuery.isFetching}
            title="Refresh inbox"
            aria-label="Refresh inbox"
          >
            <RefreshCw
              size={13}
              className={ticketsQuery.isFetching ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">
              {ticketsQuery.isFetching ? "Refreshing…" : "Refresh"}
            </span>
          </button>

          <button
            type="button"
            className="ui-btn ui-btn-sm"
            onClick={() => void exportTickets()}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </PageHeader>

      {/* Headline Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatus("OPEN")}
          className={`ui-card text-left transition-colors hover:border-ui-accent ${
            status === "OPEN" ? "border-ui-accent bg-ui-accent-soft/30" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>Open Tickets</span>
            <span className="h-2 w-2 rounded-full bg-ui-accent" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {counts.open}
          </p>
          <p className="text-[11px] text-ui-muted">Needs initial response</p>
        </button>

        <button
          type="button"
          onClick={() => setStatus("IN_PROGRESS")}
          className={`ui-card text-left transition-colors hover:border-ui-accent ${
            status === "IN_PROGRESS"
              ? "border-ui-accent bg-ui-accent-soft/30"
              : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>In Progress</span>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {counts.inProgress}
          </p>
          <p className="text-[11px] text-ui-muted">Active conversations</p>
        </button>

        <button
          type="button"
          onClick={() => setStatus("RESOLVED")}
          className={`ui-card text-left transition-colors hover:border-ui-accent ${
            status === "RESOLVED" ? "border-ui-accent bg-ui-accent-soft/30" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>Resolved</span>
            <span className="h-2 w-2 rounded-full bg-ui-success" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {counts.resolved}
          </p>
          <p className="text-[11px] text-ui-muted">Issues addressed</p>
        </button>

        <button
          type="button"
          onClick={() => setStatus("")}
          className={`ui-card text-left transition-colors hover:border-ui-accent ${
            status === "" ? "border-ui-accent bg-ui-accent-soft/30" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>All Tickets</span>
            <Inbox size={14} />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {counts.all}
          </p>
          <p className="text-[11px] text-ui-muted">Total in queue</p>
        </button>
      </div>

      {/* Main Table Panel */}
      <section className="ui-panel">
        <div className="ui-panel-head">
          <div className="flex items-center gap-3">
            <h2 className="ui-panel-title">Inbox Queue</h2>
            <span className="text-xs text-ui-muted">
              {allTickets.length} ticket{allTickets.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Desktop tabs */}
          <div className="hidden md:flex ui-tabs" role="tablist">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                className={`ui-tab ${status === tab.value ? "ui-tab-active" : ""}`}
                onClick={() => setStatus(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile Filter Button */}
          <button
            type="button"
            className="ui-btn ui-btn-sm md:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <Filter size={14} />
            <span>Status: {status || "All"}</span>
          </button>
        </div>

        <div className="ui-panel-body">
          <DataTable
            data={allTickets}
            columns={columns}
            keyExtractor={(ticket) => ticket.id}
            loading={ticketsQuery.isLoading}
            onRowClick={(ticket) => openTicket(ticket)}
            hasMore={Boolean(ticketsQuery.hasNextPage)}
            isLoadingMore={ticketsQuery.isFetchingNextPage}
            onLoadMore={() => void ticketsQuery.fetchNextPage()}
            emptyState={
              <EmptyState
                icon={LifeBuoy}
                title="No support tickets"
                message={
                  status
                    ? `There are no tickets matching status "${status}".`
                    : "No customer support requests have been logged yet."
                }
              />
            }
          />
        </div>
      </section>

      {/* Mobile Filters Bottom Sheet */}
      <Modal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filter Tickets"
        className="md:hidden"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">Filter by Status</h2>
          <button
            type="button"
            className="ui-icon-btn"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="ui-modal-body space-y-2 p-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-sm font-medium ${
                status === tab.value
                  ? "border-ui-accent bg-ui-accent-soft text-ui-accent"
                  : "border-ui-line text-ui-ink hover:bg-ui-sunken"
              }`}
              onClick={() => {
                setStatus(tab.value);
                setMobileFiltersOpen(false);
              }}
            >
              <span>{tab.label}</span>
              {status === tab.value && (
                <span className="text-xs font-semibold">Active</span>
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* Conversation Thread Drawer / Modal */}
      <Modal
        open={Boolean(ticketId)}
        onClose={closeTicketDetail}
        title={selectedTicket ? selectedTicket.subject : "Support Conversation"}
        className="flex max-h-[92dvh] flex-col overflow-hidden sm:max-w-2xl md:max-w-3xl"
      >
        <div className="ui-modal-head border-b border-ui-line bg-ui-rail">
          <div className="flex min-w-0 items-center gap-3">
            <BubbleAvatar
              seed={
                selectedTicket?.contactPhone ||
                selectedTicket?.userId ||
                "Customer"
              }
              size={36}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-ui-ink">
                  {selectedTicket?.reference ?? "Ticket"}
                </span>
                {selectedTicket && (
                  <StatusChip status={selectedTicket.status} />
                )}
              </div>
              <h2 className="truncate text-sm font-semibold text-ui-ink">
                {selectedTicket?.subject ?? "Loading conversation…"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status change actions */}
            {selectedTicket && (
              <select
                aria-label="Change ticket status"
                className="ui-input h-8 text-xs font-medium w-auto"
                value={selectedTicket.status}
                disabled={
                  statusMutation.isPending || selectedTicket.status === "CLOSED"
                }
                onChange={(e) => {
                  statusMutation.mutate({
                    id: selectedTicket.id,
                    newStatus: e.target.value,
                  });
                }}
              >
                <option value="OPEN" disabled>
                  OPEN
                </option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            )}

            <button
              type="button"
              className="ui-icon-btn"
              onClick={closeTicketDetail}
              aria-label="Close conversation drawer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Customer metadata summary banner */}
        {selectedTicket && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ui-line bg-ui-sunken/60 px-4 py-2.5 text-xs text-ui-muted">
            <div className="flex flex-wrap items-center gap-3">
              {selectedTicket.userId ? (
                <Link
                  href={`/users?user=${encodeURIComponent(selectedTicket.userId)}`}
                  className="inline-flex items-center gap-1 font-medium text-ui-accent hover:underline"
                >
                  <User size={13} />
                  <span>Customer Profile</span>
                  <ArrowUpRight size={12} />
                </Link>
              ) : (
                <span>Guest submission</span>
              )}

              {selectedTicket.contactPhone && (
                <div className="flex items-center gap-1">
                  <span>Phone: {selectedTicket.contactPhone}</span>
                  <CopyButton
                    value={selectedTicket.contactPhone}
                    toastMessage="Phone copied"
                    onClick={() =>
                      trackAction("ticket_phone_copy", {
                        id: selectedTicket.id,
                      })
                    }
                  />
                </div>
              )}

              {selectedTicket.relatedReference && (
                <div className="flex items-center gap-1">
                  <span>Related: {selectedTicket.relatedReference}</span>
                  <CopyButton
                    value={selectedTicket.relatedReference}
                    toastMessage="Related reference copied"
                  />
                </div>
              )}
            </div>

            <span>Opened {formatDateTime(selectedTicket.createdAt)}</span>
          </div>
        )}

        {/* Messages Thread */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {detailQuery.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <span className="text-sm text-ui-muted">Loading messages…</span>
            </div>
          ) : selectedTicket?.messages && selectedTicket.messages.length > 0 ? (
            selectedTicket.messages.map((msg) => {
              const isAdmin =
                msg.author.toLowerCase() === "admin" ||
                msg.author.toLowerCase() === "support";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-ui-muted">
                    <span className="font-medium text-ui-ink">
                      {isAdmin ? "SolexPay Support" : "Customer"}
                    </span>
                    <span>·</span>
                    <span>{formatDateTime(msg.createdAt)}</span>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[88%] sm:max-w-[78%] whitespace-pre-wrap break-words ${
                      isAdmin
                        ? "bg-ui-accent text-white rounded-tr-xs"
                        : "bg-ui-sunken border border-ui-line text-ui-ink rounded-tl-xs"
                    }`}
                  >
                    {msg.body}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-sm text-ui-muted">
              <MessageSquare
                size={32}
                className="mx-auto mb-2 text-ui-muted/50"
              />
              <p>No messages in this ticket thread yet.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Box Footer */}
        <div className="border-t border-ui-line bg-white p-3 sm:p-4">
          {selectedTicket?.status === "CLOSED" ? (
            <div className="rounded-lg bg-ui-sunken p-3 text-center text-xs text-ui-muted">
              This ticket is closed and cannot be modified.
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                className="ui-input min-h-[80px] resize-none"
                placeholder="Type your response to the customer... (Press Ctrl+Enter or ⌘+Enter to send)"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={replyMutation.isPending}
              />
              <div className="flex items-center justify-between text-xs text-ui-muted">
                <span className="hidden sm:inline">
                  Use Ctrl+Enter / ⌘+Enter to send instantly
                </span>
                <button
                  type="button"
                  className="ui-btn ui-btn-primary ui-btn-sm ml-auto"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || replyMutation.isPending}
                >
                  <Send size={14} />
                  <span>
                    {replyMutation.isPending ? "Sending…" : "Send reply"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48 rounded-xl" />}>
      <SupportContent />
    </Suspense>
  );
}
