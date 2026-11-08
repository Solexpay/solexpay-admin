"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { KeyRound, UserCog, UserPlus, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { type Column, DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import {
  createAdmin,
  disableAdmin,
  getAdmins,
  resetAdminTOTP,
} from "@/lib/api/admin";
import { useAdminSession } from "@/lib/auth/session";
import { trackAction } from "@/lib/telemetry";
import type { AdminUser, CreateAdminResult } from "@/lib/types";
import { confirm } from "@/lib/ui/confirm";
import { toast } from "@/lib/ui/toast";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(254),
  role: z.enum(["SUPPORT", "OPS", "COMPLIANCE", "SUPER_ADMIN"]),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine(
      (value) => !value || /^(\+234|0)[789][01]\d{8}$/.test(value),
      "Enter a valid Nigerian phone number",
    ),
});
type Draft = z.infer<typeof schema>;
const initial: Draft = {
  firstName: "",
  lastName: "",
  email: "",
  role: "SUPPORT",
  phone: "",
};
function AdminsContent() {
  const session = useAdminSession();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<CreateAdminResult | null>(null);
  const client = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ["admin", "admins"],
    queryFn: ({ pageParam }) => getAdmins({ limit: 20, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.hasMore ? (page.nextCursor ?? undefined) : undefined,
    enabled: session.canAccess("admins"),
  });
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  const invalidate = () =>
    client.invalidateQueries({ queryKey: ["admin", "admins"] });
  const create = useMutation({
    mutationFn: createAdmin,
    onSuccess: (value) => {
      setOpen(false);
      setDraft(initial);
      setCreated(value);
      void invalidate();
    },
    onError: () => toast.error("Failed to create administrator"),
  });
  const disable = useMutation({
    mutationFn: disableAdmin,
    onSuccess: () => {
      toast.success("Administrator disabled");
      void invalidate();
    },
    onError: () => toast.error("Failed to disable administrator"),
  });
  const resetTotp = useMutation({
    mutationFn: resetAdminTOTP,
    onSuccess: () =>
      toast.success(
        "Administrator TOTP reset. They will re-enroll on next login.",
      ),
    onError: () => toast.error("Failed to reset TOTP"),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    create.mutate({ ...parsed.data, phone: parsed.data.phone || undefined });
  };
  const disableItem = async (admin: AdminUser) => {
    if (
      await confirm({
        title: `Disable ${admin.firstName}?`,
        message: "They will no longer be able to sign in.",
        typeToConfirm: "DISABLE",
        tone: "danger",
        confirmLabel: "Disable",
      })
    )
      disable.mutate(admin.id);
  };
  const reset = async (admin: AdminUser) => {
    if (
      await confirm({
        title: `Reset two-factor for ${admin.firstName}?`,
        message:
          "They'll set up their authenticator app again at their next sign-in.",
        confirmLabel: "Reset",
        tone: "danger",
      })
    )
      resetTotp.mutate(admin.id);
  };
  const cols: Column<AdminUser>[] = [
    {
      id: "admin",
      header: "Administrator",
      mobile: "primary",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <BubbleAvatar seed={item.firstName} size={32} />
          <span>
            <span className="block font-medium">
              {item.firstName} {item.lastName}
              {item.id === session.admin?.id && (
                <span className="ui-badge ui-badge-info ml-1">You</span>
              )}
            </span>
            <span className="block text-xs text-ui-muted">{item.email}</span>
          </span>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      mobile: "secondary",
      cell: (item) => (
        <span className="ui-badge ui-badge-neutral">{item.role}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      mobile: "secondary",
      cell: (item) => <StatusChip status={item.status} />,
    },
    {
      id: "lastLogin",
      header: "Last Login",
      mobile: "hidden",
      cell: (item) =>
        item.lastLoginAt
          ? new Intl.DateTimeFormat("en-NG", {
              dateStyle: "short",
              timeStyle: "short",
              timeZone: "Africa/Lagos",
            }).format(new Date(item.lastLoginAt))
          : "Never",
    },
    {
      id: "created",
      header: "Created",
      mobile: "hidden",
      cell: (item) =>
        new Intl.DateTimeFormat("en-NG", {
          dateStyle: "medium",
          timeZone: "Africa/Lagos",
        }).format(new Date(item.createdAt)),
    },
  ];
  if (!session.canAccess("admins"))
    return (
      <section className="ui-panel">
        <div className="ui-panel-body px-4 py-10 text-center">
          <UserCog size={40} className="mx-auto mb-2 text-ui-faint" />
          <h2 className="text-xl font-semibold text-ui-ink">
            Access Restricted
          </h2>
          <p className="mt-1 text-sm text-ui-muted">
            This section requires the SUPER_ADMIN role. Your account does not
            have sufficient permissions.
          </p>
        </div>
      </section>
    );
  return (
    <>
      <PageHeader
        title="Administrators"
        icon={UserCog}
        subtitle="Manage back-office admin accounts, roles, security credentials, and TOTP"
      >
        <button
          type="button"
          className="ui-btn ui-btn-primary w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          <UserPlus size={15} />
          Create Admin
        </button>
      </PageHeader>
      <section className="ui-panel">
        <div className="ui-panel-head">
          <h2 className="ui-panel-title">All administrators</h2>
          <span className="ui-meta">{rows.length} accounts</span>
        </div>
        {query.isError && (
          <p className="ui-alert ui-alert-danger m-4">
            Couldn't load administrators.{" "}
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
            rowActions={(item) => (
              <div className="flex gap-1">
                <button
                  type="button"
                  className="ui-btn ui-btn-sm"
                  disabled={resetTotp.isPending}
                  onClick={() => void reset(item)}
                >
                  Reset TOTP
                </button>
                {item.status === "ACTIVE" && item.id !== session.admin?.id && (
                  <button
                    type="button"
                    className="ui-btn ui-btn-danger ui-btn-sm"
                    disabled={disable.isPending}
                    onClick={() => void disableItem(item)}
                  >
                    Disable
                  </button>
                )}
              </div>
            )}
            emptyState={<div className="ui-empty">No administrators found</div>}
          />
        </div>
      </section>
      <Modal open={open} onClose={() => setOpen(false)} className="sm:max-w-lg">
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">Create New Administrator</h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="ui-modal-body space-y-3">
            {(["firstName", "lastName", "email"] as const).map((key) => (
              <label key={key} className="ui-label">
                {key === "firstName"
                  ? "First Name"
                  : key === "lastName"
                    ? "Last Name"
                    : "Email Address"}
                <input
                  className="ui-input mt-1"
                  value={draft[key]}
                  aria-describedby={
                    errors[key] ? `admin-${key}-error` : undefined
                  }
                  onChange={(event) =>
                    setDraft((old) => ({ ...old, [key]: event.target.value }))
                  }
                />
                {errors[key] && (
                  <span
                    id={`admin-${key}-error`}
                    className="text-xs text-ui-danger"
                  >
                    {errors[key]}
                  </span>
                )}
              </label>
            ))}
            <label className="ui-label">
              Role
              <select
                className="ui-input mt-1"
                value={draft.role}
                onChange={(event) =>
                  setDraft((old) => ({
                    ...old,
                    role: event.target.value as Draft["role"],
                  }))
                }
              >
                {["SUPPORT", "OPS", "COMPLIANCE", "SUPER_ADMIN"].map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
            <label className="ui-label">
              Phone (Optional)
              <input
                className="ui-input mt-1"
                type="tel"
                value={draft.phone}
                aria-describedby={
                  errors.phone ? "admin-phone-error" : undefined
                }
                onChange={(event) =>
                  setDraft((old) => ({ ...old, phone: event.target.value }))
                }
              />
              {errors.phone && (
                <span id="admin-phone-error" className="text-xs text-ui-danger">
                  {errors.phone}
                </span>
              )}
            </label>
          </div>
          <div className="ui-modal-foot flex-col sm:flex-row">
            <button
              type="button"
              className="ui-btn w-full sm:w-auto"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ui-btn ui-btn-primary w-full sm:w-auto"
              disabled={create.isPending}
            >
              Create Admin
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(created)}
        onClose={() => setCreated(null)}
        className="sm:max-w-lg"
      >
        <div className="ui-modal-head">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-ui-accent" />
            <h2 className="ui-modal-title">One-Time Temporary Password</h2>
          </div>
        </div>
        {created && (
          <div className="ui-modal-body space-y-4">
            <div className="ui-alert ui-alert-warning">
              <p>
                <strong>CRITICAL:</strong> Save this temporary password now. It
                will only be displayed ONCE and cannot be recovered later!
              </p>
            </div>
            <div className="rounded-xl border border-ui-line bg-ui-sunken p-4">
              <p className="mb-1 text-xs font-medium text-ui-muted">
                Temporary Password
              </p>
              <button
                type="button"
                className="select-all break-all font-mono text-base font-semibold text-ui-ink"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      created.temporaryPassword,
                    );
                    toast.success("Password copied to clipboard");
                    trackAction("admin_temp_password_copy", {
                      id: created.admin.id,
                    });
                  } catch {
                    toast.error("Failed to copy password");
                  }
                }}
              >
                {created.temporaryPassword}
              </button>
            </div>
            <div className="space-y-1 text-xs text-ui-muted">
              <p>
                Account: <strong>{created.admin.email}</strong>
              </p>
              <p>
                Role: <strong>{created.admin.role}</strong>
              </p>
              <p>
                The administrator will be required to enroll in TOTP two-factor
                authentication upon first login.
              </p>
            </div>
          </div>
        )}
        <div className="ui-modal-foot">
          <button
            type="button"
            className="ui-btn ui-btn-primary w-full sm:w-auto"
            onClick={() => setCreated(null)}
          >
            I have saved this password
          </button>
        </div>
      </Modal>
    </>
  );
}
export default function AdminsPage() {
  return <AdminsContent />;
}
