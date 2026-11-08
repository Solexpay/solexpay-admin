"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Edit2,
  Gift,
  Plus,
  PowerOff,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import {
  createPromo,
  deactivatePromo,
  listPromos,
  updatePromo,
} from "@/lib/api/admin";
import { useAdminSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { trackAction } from "@/lib/telemetry";
import type { Promo } from "@/lib/types";
import { confirm } from "@/lib/ui/confirm";
import { toast } from "@/lib/ui/toast";

const queryOptions = { history: "replace" as const, shallow: true };

const VALID_ART_KEYS = [
  { value: "student_loan", label: "Student Loan Financing" },
  { value: "free_loan", label: "Zero-Fee Loan Special" },
  { value: "airtime_cashback", label: "Airtime Cashback Promo" },
  { value: "airtime_3_percent", label: "3% Airtime Rebate" },
  { value: "student_data", label: "Campus Data Bundle" },
  { value: "zero_fee_card", label: "Zero-Fee Virtual Card" },
  { value: "virtual_card_launch", label: "USD Virtual Card Launch" },
  { value: "save_smarter", label: "Smart Savings Target" },
  { value: "double_savings", label: "Double Savings Bonus" },
  { value: "refer_earn", label: "Refer & Earn Program" },
  { value: "bank_remittance", label: "Diaspora Bank Remittance" },
] as const;

const promoSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9][a-z0-9-]{1,48}$/,
        "Slug must be 2–49 lowercase alphanumeric or hyphen characters starting with alphanumeric",
      ),
    title: z
      .string()
      .trim()
      .min(3, "Title must be between 3 and 60 characters")
      .max(60, "Title must be between 3 and 60 characters"),
    body: z
      .string()
      .trim()
      .min(3, "Body must be between 3 and 200 characters")
      .max(200, "Body must be between 3 and 200 characters"),
    artKey: z.string().min(1, "Select an illustration art key"),
    ctaLabel: z
      .string()
      .trim()
      .min(2, "CTA label must be between 2 and 24 characters")
      .max(24, "CTA label must be between 2 and 24 characters"),
    ctaRoute: z
      .string()
      .trim()
      .regex(
        /^\/[a-z0-9/_-]*$/,
        "Route must start with '/' and contain only lowercase letters, numbers, hyphens, slashes, or underscores",
      ),
    priority: z.coerce.number().int().default(0),
    startsAt: z.string().trim().min(1, "Start date and time is required"),
    endsAt: z.string().trim().optional().nullable(),
    active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (!data.endsAt || data.endsAt.trim() === "") return true;
      const start = new Date(data.startsAt).getTime();
      const end = new Date(data.endsAt).getTime();
      return end > start;
    },
    {
      message: "End date must be after start date",
      path: ["endsAt"],
    },
  );

type PromoFormData = z.output<typeof promoSchema>;
type PromoFormInput = z.input<typeof promoSchema>;

const STATUS_TABS = [
  { label: "All Offers", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function isoToDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  } catch {
    return "";
  }
}

function datetimeLocalToIso(val?: string | null): string | null {
  if (!val || val.trim() === "") return null;
  try {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

function OffersContent() {
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);

  const session = useAdminSession();
  const queryClient = useQueryClient();

  const isOpsRole =
    session.admin?.role === "OPS" || session.admin?.role === "SUPER_ADMIN";

  const { data: promos = [], isLoading } = useQuery<Promo[]>({
    queryKey: ["admin", "promos"],
    queryFn: () => listPromos(),
  });

  const form = useForm<PromoFormInput, unknown, PromoFormData>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      slug: "",
      title: "",
      body: "",
      artKey: "student_loan",
      ctaLabel: "Learn More",
      ctaRoute: "/loans",
      priority: 0,
      startsAt: isoToDatetimeLocal(new Date().toISOString()),
      endsAt: "",
      active: true,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: PromoFormData) =>
      createPromo({
        slug: data.slug,
        title: data.title,
        body: data.body,
        artKey: data.artKey,
        ctaLabel: data.ctaLabel,
        ctaRoute: data.ctaRoute,
        priority: data.priority,
        startsAt: datetimeLocalToIso(data.startsAt) || new Date().toISOString(),
        endsAt: datetimeLocalToIso(data.endsAt),
      }),
    onSuccess: (newPromo) => {
      toast.success("Offer created successfully");
      setModalMode(null);
      form.reset();
      queryClient.setQueryData<Promo[]>(["admin", "promos"], (old = []) => [
        newPromo,
        ...old,
      ]);
      void queryClient.invalidateQueries({ queryKey: ["admin", "promos"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create offer";
      toast.error(msg);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PromoFormData }) =>
      updatePromo(id, {
        title: data.title,
        body: data.body,
        artKey: data.artKey,
        ctaLabel: data.ctaLabel,
        ctaRoute: data.ctaRoute,
        priority: data.priority,
        startsAt: datetimeLocalToIso(data.startsAt) || new Date().toISOString(),
        endsAt: datetimeLocalToIso(data.endsAt),
        active: data.active,
      }),
    onSuccess: (updated) => {
      toast.success("Offer updated successfully");
      setModalMode(null);
      setEditingPromo(null);
      form.reset();
      queryClient.setQueryData<Promo[]>(["admin", "promos"], (old = []) =>
        old.map((p) => (p.id === updated.id ? updated : p)),
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "promos"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update offer";
      toast.error(msg);
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivatePromo(id),
    onSuccess: (updated) => {
      toast.success("Offer deactivated");
      queryClient.setQueryData<Promo[]>(["admin", "promos"], (old = []) =>
        old.map((p) => (p.id === updated.id ? updated : p)),
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "promos"] });
    },
    onError: () => {
      toast.error("Failed to deactivate offer");
    },
  });

  const openCreateModal = () => {
    setEditingPromo(null);
    form.reset({
      slug: "",
      title: "",
      body: "",
      artKey: "student_loan",
      ctaLabel: "Learn More",
      ctaRoute: "/loans",
      priority: 0,
      startsAt: isoToDatetimeLocal(new Date().toISOString()),
      endsAt: "",
      active: true,
    });
    setModalMode("create");
    trackAction("promo_create_modal_open");
  };

  const openEditModal = (promo: Promo) => {
    setEditingPromo(promo);
    form.reset({
      slug: promo.slug,
      title: promo.title,
      body: promo.body,
      artKey: promo.artKey,
      ctaLabel: promo.ctaLabel,
      ctaRoute: promo.ctaRoute,
      priority: promo.priority,
      startsAt: isoToDatetimeLocal(promo.startsAt),
      endsAt: isoToDatetimeLocal(promo.endsAt),
      active: promo.active,
    });
    setModalMode("edit");
    trackAction("promo_edit_modal_open", { id: promo.id });
  };

  const handleDeactivate = async (promo: Promo) => {
    if (!isOpsRole) return;
    const ok = await confirm({
      title: `Deactivate "${promo.title}"?`,
      message:
        "This offer will immediately stop appearing on mobile client home feeds and promo carousels.",
      confirmLabel: "Deactivate",
      tone: "danger",
    });
    if (ok) {
      deactivateMutation.mutate(promo.id);
    }
  };

  const onSubmit = form.handleSubmit((data) => {
    if (modalMode === "create") {
      createMutation.mutate(data);
    } else if (modalMode === "edit" && editingPromo) {
      updateMutation.mutate({ id: editingPromo.id, data });
    }
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Filtered rows
  const filteredPromos = useMemo(() => {
    if (filter === "active") return promos.filter((p) => p.active);
    if (filter === "inactive") return promos.filter((p) => !p.active);
    return promos;
  }, [promos, filter]);

  // Tallies
  const stats = useMemo(() => {
    const active = promos.filter((p) => p.active);
    const maxPriority = promos.length
      ? Math.max(...promos.map((p) => p.priority))
      : 0;
    return {
      total: promos.length,
      active: active.length,
      inactive: promos.length - active.length,
      maxPriority,
    };
  }, [promos]);

  const columns: Column<Promo>[] = [
    {
      id: "campaign",
      header: "Campaign & Art",
      mobile: "primary",
      cell: (promo) => (
        <div className="max-w-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ui-ink">{promo.title}</span>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-ui-muted truncate">
            slug: {promo.slug}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 rounded bg-ui-sunken px-1.5 py-0.5 text-[10px] font-medium text-ui-muted">
            <Sparkles size={11} className="text-ui-accent" />
            {promo.artKey}
          </span>
        </div>
      ),
    },
    {
      id: "body",
      header: "Copy Preview",
      mobile: "secondary",
      cell: (promo) => (
        <p className="max-w-sm text-xs text-ui-body line-clamp-2 leading-relaxed">
          {promo.body}
        </p>
      ),
    },
    {
      id: "action",
      header: "CTA & Route",
      mobile: "secondary",
      cell: (promo) => (
        <div className="text-xs">
          <span className="font-medium text-ui-ink">{promo.ctaLabel}</span>
          <span className="block font-mono text-[11px] text-ui-muted">
            {promo.ctaRoute}
          </span>
        </div>
      ),
    },
    {
      id: "priority",
      header: "Priority",
      mobile: "hidden",
      cell: (promo) => (
        <span className="inline-flex min-w-[28px] items-center justify-center rounded-md bg-ui-sunken px-2 py-0.5 text-xs font-semibold text-ui-ink">
          {promo.priority}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      mobile: "primary",
      cell: (promo) => (
        <StatusChip status={promo.active ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      id: "schedule",
      header: "Schedule",
      mobile: "hidden",
      cell: (promo) => (
        <div className="text-xs text-ui-muted">
          <span>{formatDate(promo.startsAt)}</span>
          <span className="block text-[11px]">
            {promo.endsAt ? `until ${formatDate(promo.endsAt)}` : "No expiry"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      mobile: "primary",
      className: "text-right",
      cell: (promo) => (
        <div className="flex items-center justify-end gap-1.5">
          {isOpsRole && (
            <>
              <button
                type="button"
                className="ui-btn ui-btn-sm"
                onClick={() => openEditModal(promo)}
                title="Edit campaign"
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              {promo.active && (
                <button
                  type="button"
                  className="ui-btn ui-btn-sm text-ui-danger hover:bg-ui-danger-soft"
                  onClick={() => void handleDeactivate(promo)}
                  disabled={deactivateMutation.isPending}
                  title="Deactivate offer"
                >
                  <PowerOff size={13} />
                  <span>Deactivate</span>
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions & Offers"
        crumb="Marketing"
        subtitle="In-app marketing banners, seasonal promotions, and card launch campaigns"
        icon={Gift}
      >
        <div className="flex items-center gap-2">
          {isOpsRole && (
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              onClick={openCreateModal}
            >
              <Plus size={15} />
              <span>Create Offer</span>
            </button>
          )}
        </div>
      </PageHeader>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`ui-card text-left transition-colors hover:border-ui-accent ${
            filter === "active" ? "border-ui-accent bg-ui-accent-soft/30" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>Active Offers</span>
            <CheckCircle2 size={14} className="text-ui-success" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {stats.active}
          </p>
          <p className="text-[11px] text-ui-muted">Live on client apps</p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("inactive")}
          className={`ui-card text-left transition-colors hover:border-ui-accent ${
            filter === "inactive" ? "border-ui-accent bg-ui-accent-soft/30" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>Inactive</span>
            <Clock size={14} className="text-ui-muted" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {stats.inactive}
          </p>
          <p className="text-[11px] text-ui-muted">Expired or stopped</p>
        </button>

        <div className="ui-card">
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>Top Priority</span>
            <Tag size={14} className="text-ui-accent" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {stats.maxPriority}
          </p>
          <p className="text-[11px] text-ui-muted">Highest display weight</p>
        </div>

        <button
          type="button"
          onClick={() => setFilter("")}
          className={`ui-card text-left transition-colors hover:border-ui-accent ${
            filter === "" ? "border-ui-accent bg-ui-accent-soft/30" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>Total Offers</span>
            <Gift size={14} />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {stats.total}
          </p>
          <p className="text-[11px] text-ui-muted">All promo banners</p>
        </button>
      </div>

      {/* Main Table Section */}
      <section className="ui-panel">
        <div className="ui-panel-head">
          <div className="flex items-center gap-3">
            <h2 className="ui-panel-title">Campaign Directory</h2>
            <span className="text-xs text-ui-muted">
              {filteredPromos.length} offer
              {filteredPromos.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="ui-tabs" role="tablist">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={filter === tab.value}
                className={`ui-tab ${filter === tab.value ? "ui-tab-active" : ""}`}
                onClick={() => setFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ui-panel-body">
          <DataTable
            data={filteredPromos}
            columns={columns}
            keyExtractor={(promo) => promo.id}
            loading={isLoading}
            emptyState={
              <EmptyState
                icon={Gift}
                title="No promotional offers"
                message={
                  filter
                    ? `No offers currently match the "${filter}" filter.`
                    : "No offers have been created yet. Click 'Create Offer' to add one."
                }
              />
            }
          />
        </div>
      </section>

      {/* Create / Edit Modal Form */}
      <Modal
        open={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === "create" ? "Create New Offer" : "Edit Offer"}
        className="max-h-[92dvh] overflow-y-auto sm:max-w-xl"
      >
        <div className="ui-modal-head border-b border-ui-line bg-ui-rail">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-ui-accent" />
            <h2 className="ui-modal-title">
              {modalMode === "create"
                ? "Create Promotional Offer"
                : "Edit Promotional Offer"}
            </h2>
          </div>
          <button
            type="button"
            className="ui-icon-btn"
            onClick={() => setModalMode(null)}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="ui-modal-body space-y-4 p-5">
          {/* Slug (Immutable when editing) */}
          <div>
            <label htmlFor="promo-slug" className="ui-label">
              Slug (Unique Identifier)
            </label>
            <input
              id="promo-slug"
              type="text"
              className="ui-input font-mono"
              placeholder="e.g. holiday-cashback-2026"
              disabled={modalMode === "edit"}
              {...form.register("slug")}
              aria-describedby={
                form.formState.errors.slug ? "slug-error" : undefined
              }
            />
            {form.formState.errors.slug && (
              <p id="slug-error" className="mt-1 text-xs text-ui-danger">
                {form.formState.errors.slug.message}
              </p>
            )}
            <p className="mt-1 text-[11px] text-ui-muted">
              Lowercase letters, digits, and hyphens (2–49 chars). Immutable
              once created.
            </p>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="promo-title" className="ui-label">
              Offer Title
            </label>
            <input
              id="promo-title"
              type="text"
              className="ui-input"
              placeholder="e.g. 0% Fee Tuition Financing"
              {...form.register("title")}
              aria-describedby={
                form.formState.errors.title ? "title-error" : undefined
              }
            />
            {form.formState.errors.title && (
              <p id="title-error" className="mt-1 text-xs text-ui-danger">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Body */}
          <div>
            <label htmlFor="promo-body" className="ui-label">
              Offer Body (Copy)
            </label>
            <textarea
              id="promo-body"
              rows={3}
              className="ui-input"
              placeholder="Provide a clear, engaging summary of the promotion for users (3–200 characters)"
              {...form.register("body")}
              aria-describedby={
                form.formState.errors.body ? "body-error" : undefined
              }
            />
            {form.formState.errors.body && (
              <p id="body-error" className="mt-1 text-xs text-ui-danger">
                {form.formState.errors.body.message}
              </p>
            )}
          </div>

          {/* Art Key */}
          <div>
            <label htmlFor="promo-artkey" className="ui-label">
              Banner Illustration Art Key
            </label>
            <select
              id="promo-artkey"
              className="ui-input"
              {...form.register("artKey")}
              aria-describedby={
                form.formState.errors.artKey ? "artkey-error" : undefined
              }
            >
              {VALID_ART_KEYS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label} ({k.value})
                </option>
              ))}
            </select>
            {form.formState.errors.artKey && (
              <p id="artkey-error" className="mt-1 text-xs text-ui-danger">
                {form.formState.errors.artKey.message}
              </p>
            )}
          </div>

          {/* CTA Label & Route */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="promo-cta-label" className="ui-label">
                CTA Button Label
              </label>
              <input
                id="promo-cta-label"
                type="text"
                className="ui-input"
                placeholder="e.g. Apply Now"
                {...form.register("ctaLabel")}
                aria-describedby={
                  form.formState.errors.ctaLabel ? "cta-label-error" : undefined
                }
              />
              {form.formState.errors.ctaLabel && (
                <p id="cta-label-error" className="mt-1 text-xs text-ui-danger">
                  {form.formState.errors.ctaLabel.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="promo-cta-route" className="ui-label">
                In-App CTA Route
              </label>
              <input
                id="promo-cta-route"
                type="text"
                className="ui-input font-mono"
                placeholder="e.g. /loans/apply"
                {...form.register("ctaRoute")}
                aria-describedby={
                  form.formState.errors.ctaRoute ? "cta-route-error" : undefined
                }
              />
              {form.formState.errors.ctaRoute && (
                <p id="cta-route-error" className="mt-1 text-xs text-ui-danger">
                  {form.formState.errors.ctaRoute.message}
                </p>
              )}
            </div>
          </div>

          {/* Priority & Active Status */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="promo-priority" className="ui-label">
                Display Priority (Weight)
              </label>
              <input
                id="promo-priority"
                type="number"
                className="ui-input"
                placeholder="0"
                {...form.register("priority")}
                aria-describedby={
                  form.formState.errors.priority ? "priority-error" : undefined
                }
              />
              <p className="mt-1 text-[11px] text-ui-muted">
                Higher number = shown first.
              </p>
              {form.formState.errors.priority && (
                <p id="priority-error" className="mt-1 text-xs text-ui-danger">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>

            {modalMode === "edit" && (
              <div className="flex flex-col justify-center">
                <span className="ui-label">Active Campaign</span>
                <label className="flex items-center gap-2 mt-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-ui-line text-ui-accent focus:ring-ui-accent"
                    {...form.register("active")}
                  />
                  <span className="font-medium text-ui-ink">
                    Live in client apps
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Start & End Dates */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="promo-starts-at" className="ui-label">
                Starts At
              </label>
              <input
                id="promo-starts-at"
                type="datetime-local"
                className="ui-input"
                {...form.register("startsAt")}
                aria-describedby={
                  form.formState.errors.startsAt ? "starts-at-error" : undefined
                }
              />
              {form.formState.errors.startsAt && (
                <p id="starts-at-error" className="mt-1 text-xs text-ui-danger">
                  {form.formState.errors.startsAt.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="promo-ends-at" className="ui-label">
                Ends At (Optional)
              </label>
              <input
                id="promo-ends-at"
                type="datetime-local"
                className="ui-input"
                {...form.register("endsAt")}
                aria-describedby={
                  form.formState.errors.endsAt ? "ends-at-error" : undefined
                }
              />
              {form.formState.errors.endsAt && (
                <p id="ends-at-error" className="mt-1 text-xs text-ui-danger">
                  {form.formState.errors.endsAt.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-ui-line pt-4">
            <button
              type="button"
              className="ui-btn"
              onClick={() => setModalMode(null)}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ui-btn ui-btn-primary"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving…"
                : modalMode === "create"
                  ? "Create Campaign"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48 rounded-xl" />}>
      <OffersContent />
    </Suspense>
  );
}
