"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Banknote,
  GraduationCap,
  Plus,
  RefreshCw,
  School as SchoolIcon,
  Search,
  X,
} from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { Suspense, useMemo, useState } from "react";
import { z } from "zod";
import { CopyButton } from "@/components/ui/copy-button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import {
  addSchool,
  backfillSchoolLogos,
  getSchools,
  refreshSchoolLogo,
  regenerateSchoolToken,
  setSchoolLogo,
  toggleSchoolStatus,
} from "@/lib/api/admin";
import { schoolInitials, schoolLogo } from "@/lib/school-logos";
import { trackAction } from "@/lib/telemetry";
import type { School } from "@/lib/types";
import { confirm } from "@/lib/ui/confirm";
import { toast } from "@/lib/ui/toast";

const opts = { history: "replace" as const, shallow: true };
const schoolSchema = z.object({
  name: z.string().trim().min(1, "School name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine(
      (value) => !value || /^(\+234|0)[789][01]\d{8}$/.test(value),
      "Enter a valid Nigerian phone number",
    ),
  address: z.string().trim().max(200),
  state: z.string().trim().max(80),
});
const domainSchema = z
  .string()
  .trim()
  .min(1, "Enter a website domain")
  .max(253)
  .regex(
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
    "Enter a hostname such as unilag.edu.ng",
  );

function SchoolsContent() {
  const [{ q, state, status }, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      state: parseAsString.withDefault(""),
      status: parseAsString.withDefault(""),
    },
    opts,
  );
  const [selected, setSelected] = useState<School | null>(null);
  const [logoTarget, setLogoTarget] = useState<School | null>(null);
  const [domain, setDomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
  });
  const [draftError, setDraftError] = useState("");
  const [credential, setCredential] = useState<{
    id: string;
    password: string;
  } | null>(null);
  const [failedLogos, setFailedLogos] = useState<string[]>([]);
  const client = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ["admin", "schools", { q, state, status }],
    queryFn: ({ pageParam }) =>
      getSchools({ search: q, state, status, limit: 50, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.hasMore ? (page.nextCursor ?? undefined) : undefined,
  });
  const allRows = query.data?.pages.flatMap((page) => page.items) ?? [];
  const rows = useMemo(
    () =>
      allRows.filter(
        (item) =>
          (!q ||
            item.name.toLowerCase().includes(q.toLowerCase()) ||
            item.email.toLowerCase().includes(q.toLowerCase())) &&
          (!state || item.state === state) &&
          (!status || item.status === status),
      ),
    [allRows, q, state, status],
  );
  const states = [
    ...new Set(
      allRows
        .map((item) => item.state)
        .filter((item): item is string => Boolean(item)),
    ),
  ].sort();
  const invalidate = () =>
    client.invalidateQueries({ queryKey: ["admin", "schools"] });
  const statusMutation = useMutation({
    mutationFn: (school: School) =>
      toggleSchoolStatus(
        school.id,
        school.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      ),
    onSuccess: (_, school) => {
      toast.success(
        `School status updated to ${school.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}`,
      );
      void invalidate();
    },
    onError: () => toast.error("Failed to update school status"),
  });
  const tokenMutation = useMutation({
    mutationFn: regenerateSchoolToken,
    onSuccess: (result) => {
      setCredential({
        id: result.school_id,
        password: result.temporary_password,
      });
      toast.success("Login credentials reset");
    },
    onError: () => toast.error("Failed to reset school login"),
  });
  const addMutation = useMutation({
    mutationFn: addSchool,
    onSuccess: () => {
      toast.success(`${draft.name.trim()} added successfully`);
      setCreateOpen(false);
      setDraft({ name: "", email: "", phone: "", address: "", state: "" });
      void invalidate();
    },
    onError: () => toast.error("Failed to add school"),
  });
  const logoMutation = useMutation({
    mutationFn: ({
      id,
      mode,
      domain: value,
    }: {
      id: string;
      mode: "domain" | "refresh" | "clear";
      domain?: string;
    }) =>
      mode === "domain"
        ? setSchoolLogo(id, { domain: value ?? "" })
        : mode === "refresh"
          ? refreshSchoolLogo(id, true)
          : setSchoolLogo(id, { clear: true }),
    onSuccess: () => {
      toast.success("School logo updated");
      setLogoTarget(null);
      void invalidate();
    },
    onError: () => toast.error("Failed to update school logo"),
  });
  const backfill = useMutation({
    mutationFn: backfillSchoolLogos,
    onSuccess: (result) => {
      toast.success(`Found ${result.resolved} logos`);
      void invalidate();
    },
    onError: () => toast.error("Failed to find school logos"),
  });
  const resetToken = async (school: School) => {
    if (
      await confirm({
        title: `Reset login for ${school.name}?`,
        message:
          "The previous credentials stop working. The new temporary password is shown once.",
        typeToConfirm: "RESET",
        tone: "danger",
        confirmLabel: "Reset login",
      })
    )
      tokenMutation.mutate(school.id);
  };
  const changeStatus = async (school: School) => {
    const next = school.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (
      await confirm({
        title: `${next === "ACTIVE" ? "Activate" : "Deactivate"} ${school.name}?`,
        tone: next === "ACTIVE" ? "primary" : "danger",
        confirmLabel: next === "ACTIVE" ? "Activate" : "Deactivate",
      })
    )
      statusMutation.mutate(school);
  };
  const submitSchool = () => {
    const parsed = schoolSchema.safeParse(draft);
    if (!parsed.success) {
      setDraftError(
        parsed.error.issues[0]?.message ?? "Check the required fields",
      );
      return;
    }
    setDraftError("");
    addMutation.mutate(parsed.data);
  };
  const cols: Column<School>[] = [
    {
      id: "school",
      header: "School",
      mobile: "primary",
      cell: (item) => (
        <button
          type="button"
          className="flex items-center gap-2 text-left"
          onClick={() => {
            setSelected(item);
            trackAction("school_detail_open", { id: item.id });
          }}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ui-line bg-white text-xs font-semibold">
            {schoolLogo(item) && !failedLogos.includes(item.id) ? (
              <img
                src={schoolLogo(item) ?? ""}
                alt={`${item.name} logo`}
                width={32}
                height={32}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setFailedLogos((old) => [...old, item.id])}
              />
            ) : (
              schoolInitials(item.name)
            )}
          </span>
          <span className="font-medium">{item.name}</span>
        </button>
      ),
    },
    {
      id: "state",
      header: "State",
      mobile: "secondary",
      cell: (item) => item.state ?? "—",
    },
    {
      id: "students",
      header: "Students",
      mobile: "secondary",
      cell: (item) => (item.studentCount ?? 0).toLocaleString("en-NG"),
    },
    {
      id: "loans",
      header: "Active Loans",
      mobile: "secondary",
      cell: (item) => (item.activeLoans ?? 0).toLocaleString("en-NG"),
    },
    {
      id: "disbursed",
      header: "Total Disbursed",
      mobile: "hidden",
      cell: (item) => `₦${(item.totalDisbursed ?? 0).toLocaleString("en-NG")}`,
    },
    {
      id: "token",
      header: "API Token",
      mobile: "hidden",
      cell: (item) =>
        item.apiToken ? (
          <span className="font-mono text-xs">
            {item.apiToken.length > 20
              ? `${item.apiToken.slice(0, 8)}...${item.apiToken.slice(-4)}`
              : item.apiToken}
          </span>
        ) : (
          "—"
        ),
    },
    {
      id: "status",
      header: "Status",
      mobile: "secondary",
      cell: (item) => <StatusChip status={item.status} />,
    },
    {
      id: "details",
      header: "Details",
      mobile: "hidden",
      cell: (item) => (
        <button
          type="button"
          className="ui-btn ui-btn-sm"
          onClick={() => {
            setSelected(item);
            trackAction("school_detail_open", { id: item.id });
          }}
        >
          View Details
        </button>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Schools Directory"
        icon={SchoolIcon}
        subtitle="Manage partner schools and API access"
      >
        <button
          type="button"
          className="ui-btn ui-btn-primary w-full sm:w-auto"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={15} />
          Add School
        </button>
        <button
          type="button"
          className="ui-btn w-full sm:w-auto"
          onClick={() => backfill.mutate()}
          disabled={backfill.isPending}
        >
          <RefreshCw size={15} />
          Find missing logos
        </button>
      </PageHeader>
      <div className="space-y-4">
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Overview</h2>
          </div>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
            <MetricCard
              label="Total Schools"
              icon={SchoolIcon}
              value={rows.length}
            />
            <MetricCard
              label="Active Students"
              icon={GraduationCap}
              value={rows.reduce(
                (sum, item) => sum + (item.studentCount ?? 0),
                0,
              )}
            />
            <MetricCard
              label="Active Loans"
              icon={SchoolIcon}
              value={rows.reduce(
                (sum, item) => sum + (item.activeLoans ?? 0),
                0,
              )}
            />
            <MetricCard
              label="Total Disbursed"
              icon={Banknote}
              prefix="₦"
              value={rows.reduce(
                (sum, item) => sum + (item.totalDisbursed ?? 0),
                0,
              )}
            />
          </div>
        </section>
        <section className="ui-panel">
          <div className="ui-panel-head flex-wrap">
            <h2 className="ui-panel-title">Schools</h2>
            <button
              type="button"
              className="ui-btn ui-btn-sm md:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              Filters
              {(q || state || status) && (
                <span className="ml-1 h-2 w-2 rounded-full bg-ui-accent" />
              )}
            </button>
            <div className="hidden w-full flex-col gap-2 md:flex md:w-auto md:flex-row">
              <div className="ui-search md:w-64">
                <Search size={15} />
                <input
                  className="ui-input"
                  placeholder="Search schools..."
                  value={q}
                  onChange={(event) =>
                    void setFilters({ q: event.target.value })
                  }
                />
              </div>
              <select
                className="ui-input md:w-auto"
                aria-label="Filter by state"
                value={state}
                onChange={(event) =>
                  void setFilters({ state: event.target.value })
                }
              >
                <option value="">All States</option>
                {states.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <select
                className="ui-input md:w-auto"
                aria-label="Filter by status"
                value={status}
                onChange={(event) =>
                  void setFilters({ status: event.target.value })
                }
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          {query.isError && (
            <p className="ui-alert ui-alert-danger m-4">
              Couldn't load schools.{" "}
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
              columns={cols}
              keyExtractor={(item) => item.id}
              loading={query.isPending}
              hasMore={query.hasNextPage}
              isLoadingMore={query.isFetchingNextPage}
              onLoadMore={() => void query.fetchNextPage()}
              emptyState={<p className="ui-empty">No schools found</p>}
              rowActions={(item) => (
                <div className="flex flex-wrap justify-end gap-1">
                  <button
                    type="button"
                    className="ui-btn ui-btn-sm"
                    onClick={() => {
                      setLogoTarget(item);
                      setDomain(item.websiteDomain ?? "");
                      trackAction("school_logo_open", { id: item.id });
                    }}
                  >
                    Logo…
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn-sm"
                    onClick={() => void resetToken(item)}
                  >
                    Reset login
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn-sm"
                    onClick={() => void changeStatus(item)}
                  >
                    {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </div>
              )}
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
          <h2 className="ui-modal-title">Filters</h2>
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
            Search schools
            <input
              className="ui-input mt-1"
              value={q}
              onChange={(event) => void setFilters({ q: event.target.value })}
            />
          </label>
          <label className="ui-label">
            State
            <select
              className="ui-input mt-1"
              value={state}
              onChange={(event) =>
                void setFilters({ state: event.target.value })
              }
            >
              <option value="">All States</option>
              {states.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="ui-label">
            Status
            <select
              className="ui-input mt-1"
              value={status}
              onChange={(event) =>
                void setFilters({ status: event.target.value })
              }
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
        </div>
        <div className="ui-modal-foot flex-col sm:flex-row">
          <button
            type="button"
            className="ui-btn w-full sm:w-auto"
            onClick={() => {
              void setFilters({ q: "", state: "", status: "" });
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
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        className="sm:max-w-lg"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">Add New School</h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close"
            onClick={() => setCreateOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="ui-modal-body grid grid-cols-1 gap-3">
          {(["name", "email", "phone", "address", "state"] as const).map(
            (key) => (
              <label key={key} className="ui-label">
                {key === "name"
                  ? "School name"
                  : key[0]?.toUpperCase() + key.slice(1)}
                <input
                  className="ui-input mt-1"
                  value={draft[key]}
                  aria-describedby={
                    draftError ? "school-draft-error" : undefined
                  }
                  onChange={(event) =>
                    setDraft((old) => ({ ...old, [key]: event.target.value }))
                  }
                />
              </label>
            ),
          )}
          {draftError && (
            <p
              id="school-draft-error"
              className="text-xs text-ui-danger"
              role="alert"
            >
              {draftError}
            </p>
          )}
        </div>
        <div className="ui-modal-foot flex-col sm:flex-row">
          <button
            type="button"
            className="ui-btn w-full sm:w-auto"
            onClick={() => setCreateOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ui-btn ui-btn-primary w-full sm:w-auto"
            disabled={addMutation.isPending}
            onClick={submitSchool}
          >
            Add School
          </button>
        </div>
      </Modal>
      <Modal
        open={Boolean(logoTarget)}
        onClose={() => setLogoTarget(null)}
        className="sm:max-w-md"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">School logo</h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close"
            onClick={() => setLogoTarget(null)}
          >
            <X size={16} />
          </button>
        </div>
        {logoTarget && (
          <>
            <div className="ui-modal-body space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-ui-line">
                  {schoolLogo(logoTarget) ? (
                    <img
                      src={schoolLogo(logoTarget) ?? ""}
                      alt={`${logoTarget.name} logo`}
                      width={32}
                      height={32}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    schoolInitials(logoTarget.name)
                  )}
                </div>
                <div>
                  <p className="font-medium">{logoTarget.name}</p>
                  <span className="ui-badge ui-badge-neutral">
                    {logoTarget.logoSource === "LOGODEV"
                      ? "Auto"
                      : logoTarget.logoSource === "MANUAL"
                        ? "Manual"
                        : "None"}
                  </span>
                </div>
              </div>
              <label className="ui-label">
                Website domain
                <input
                  className="ui-input mt-1"
                  placeholder="unilag.edu.ng"
                  value={domain}
                  aria-describedby={domainError ? "domain-error" : undefined}
                  onChange={(event) => {
                    setDomain(event.target.value);
                    setDomainError("");
                  }}
                />
              </label>
              {domainError && (
                <p id="domain-error" className="text-xs text-ui-danger">
                  {domainError}
                </p>
              )}
            </div>
            <div className="ui-modal-foot flex-col sm:flex-row">
              <button
                type="button"
                className="ui-btn w-full sm:w-auto"
                onClick={() => {
                  setDomainError("");
                  logoMutation.mutate({ id: logoTarget.id, mode: "refresh" });
                }}
              >
                Re-detect automatically
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-danger w-full sm:w-auto"
                onClick={async () => {
                  if (
                    await confirm({
                      title: `Remove ${logoTarget.name} logo?`,
                      tone: "danger",
                      confirmLabel: "Remove logo",
                    })
                  )
                    logoMutation.mutate({ id: logoTarget.id, mode: "clear" });
                }}
              >
                Remove logo
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-primary w-full sm:w-auto"
                disabled={logoMutation.isPending}
                onClick={() => {
                  const parsed = domainSchema.safeParse(domain);
                  if (!parsed.success) {
                    setDomainError(
                      parsed.error.issues[0]?.message ?? "Enter a valid domain",
                    );
                    return;
                  }
                  logoMutation.mutate({
                    id: logoTarget.id,
                    mode: "domain",
                    domain: parsed.data,
                  });
                }}
              >
                Save domain
              </button>
            </div>
          </>
        )}
      </Modal>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        className="sm:max-w-md"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">School details</h2>
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
          <div className="ui-modal-body">
            <dl className="ui-dl">
              {[
                ["Name", selected.name],
                ["Email", selected.email],
                ["Phone", selected.phone ?? "—"],
                ["Address", selected.address ?? "—"],
                ["State", selected.state ?? "—"],
                ["Status", selected.status],
                [
                  "Created",
                  new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                    timeZone: "Africa/Lagos",
                  }).format(new Date(selected.createdAt)),
                ],
                [
                  "Students",
                  (selected.studentCount ?? 0).toLocaleString("en-NG"),
                ],
                [
                  "Active loans",
                  (selected.activeLoans ?? 0).toLocaleString("en-NG"),
                ],
                [
                  "Total disbursed",
                  `₦${(selected.totalDisbursed ?? 0).toLocaleString("en-NG")}`,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="ui-dt">{label}</dt>
                  <dd className="ui-dd">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <div className="ui-modal-foot">
          <button
            type="button"
            className="ui-btn"
            onClick={() => setSelected(null)}
          >
            Close
          </button>
        </div>
      </Modal>
      <Modal
        open={Boolean(credential)}
        onClose={() => setCredential(null)}
        className="sm:max-w-md"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">One-time temporary password</h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close"
            onClick={() => setCredential(null)}
          >
            <X size={16} />
          </button>
        </div>
        {credential && (
          <div className="ui-modal-body space-y-3">
            <p>Copy this password now. It will not be shown again.</p>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-ui-line p-3 font-mono">
              <span>{credential.password}</span>
              <CopyButton
                value={credential.password}
                toastMessage="Temporary password copied"
                onClick={() =>
                  trackAction("school_credential_copy", { id: credential.id })
                }
                className="ui-btn ui-btn-sm"
              >
                Copy
              </CopyButton>
            </div>
          </div>
        )}
        <div className="ui-modal-foot">
          <button
            type="button"
            className="ui-btn"
            onClick={() => setCredential(null)}
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}

export default function SchoolsPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48" />}>
      <SchoolsContent />
    </Suspense>
  );
}
