import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideDynamicIcon,
  LucideChevronDown as ChevronDown,
  LucideCircleAlert as CircleAlert,
  LucideCopy as Copy,
  LucideKeyRound as KeyRound,
  LucideLoaderCircle as LoaderCircle,
  LucideLock as Lock,
  LucideUserCog as UserCog,
  LucideUserPlus as UserPlus,
  LucideX as X,
} from "@lucide/angular";
import {
  AdminService,
  AdminUser,
  CreateAdminResult,
  CursorPage,
} from "../../services/admin.service";
import { AuthService } from "../../services/auth.service";
import { ToastService } from "../../services/toast.service";
import { ConfirmService } from "../../services/confirm.service";
import { ModalDirective } from "../../directives/modal.directive";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { PageHeaderComponent } from "../../components/ui/page-header.component";

interface NewAdminDraft {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
}

@Component({
  selector: "app-admins",
  imports: [
    CommonModule,
    FormsModule,
    LucideDynamicIcon,
    ModalDirective,
    StatusChipComponent,
    PageHeaderComponent,
  ],
  template: `
    @if (!isSuperAdmin()) {
      <section class="ui-panel">
        <div class="ui-panel-body px-4 py-10 text-center">
          <svg
            [lucideIcon]="LockIcon"
            [size]="40"
            class="mx-auto mb-2 text-ui-faint"
          ></svg>
          <h2 class="text-xl font-semibold text-ui-ink">Access Restricted</h2>
          <p class="mt-1 text-sm text-ui-muted">
            This section requires the SUPER_ADMIN role. Your account does not
            have sufficient permissions.
          </p>
        </div>
      </section>
    } @else {
      <app-page-header
        title="Administrators"
        [icon]="UserCogIcon"
        subtitle="Manage back-office admin accounts, roles, security credentials, and TOTP"
      >
        <button
          type="button"
          class="ui-btn ui-btn-primary"
          (click)="showCreateModal.set(true)"
        >
          <svg [lucideIcon]="UserPlusIcon" [size]="15"></svg>
          Create Admin
        </button>
      </app-page-header>

      <div class="space-y-4">
        <!-- Admins Table -->
        <section class="ui-panel">
          <div class="ui-panel-head">
            <h2 class="ui-panel-title">All administrators</h2>
            <span class="ui-meta">{{ admins().length }} accounts</span>
          </div>

          <div class="ui-panel-body overflow-hidden">
            <div class="ui-table-wrap">
              <table class="ui-table md:min-w-[760px]">
                <thead>
                  <tr>
                    <th>Administrator</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th class="hidden md:table-cell">Last Login</th>
                    <th class="hidden md:table-cell">Created</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @if (loading()) {
                    @for (n of [1, 2, 3]; track n) {
                      <tr>
                        <td><div class="ui-skel h-4 w-36"></div></td>
                        <td>
                          <div class="ui-skel h-5 w-20 rounded-full"></div>
                        </td>
                        <td>
                          <div class="ui-skel h-5 w-16 rounded-full"></div>
                        </td>
                        <td class="hidden md:table-cell">
                          <div class="ui-skel h-4 w-24"></div>
                        </td>
                        <td class="hidden md:table-cell">
                          <div class="ui-skel h-4 w-20"></div>
                        </td>
                        <td>
                          <div class="ui-skel ml-auto h-4 w-24"></div>
                        </td>
                      </tr>
                    }
                  } @else if (adminsQuery.isError()) {
                    <tr>
                      <td [attr.colspan]="6">
                        <div class="ui-empty">
                          <svg
                            [lucideIcon]="CircleAlertIcon"
                            [size]="28"
                            class="text-ui-danger"
                          ></svg>
                          <p>Couldn't load administrators.</p>
                          <button
                            type="button"
                            class="ui-btn ui-btn-sm"
                            (click)="adminsQuery.refetch()"
                          >
                            Try again
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @else {
                    @for (admin of admins(); track admin.id) {
                      <tr>
                        <td>
                          <div class="flex items-center gap-2.5">
                            <span class="ui-avatar">{{
                              admin.firstName[0] || "A"
                            }}</span>
                            <div class="min-w-0">
                              <p class="truncate font-medium text-ui-ink">
                                {{ admin.firstName }} {{ admin.lastName }}
                                @if (isSelf(admin)) {
                                  <span class="ui-badge ui-badge-info"
                                    >You</span
                                  >
                                }
                              </p>
                              <p class="truncate text-xs text-ui-muted">
                                {{ admin.email }}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="ui-badge ui-badge-neutral">
                            {{ admin.role }}
                          </span>
                        </td>
                        <td>
                          <app-status-chip
                            [status]="admin.status"
                          ></app-status-chip>
                        </td>
                        <td
                          class="hidden whitespace-nowrap text-ui-muted md:table-cell"
                        >
                          {{
                            admin.lastLoginAt
                              ? (admin.lastLoginAt | date: "short")
                              : "Never"
                          }}
                        </td>
                        <td
                          class="hidden whitespace-nowrap text-ui-muted md:table-cell"
                        >
                          {{ admin.createdAt | date: "mediumDate" }}
                        </td>
                        <td>
                          <div
                            class="flex flex-wrap items-center justify-end gap-1.5"
                          >
                            <button
                              type="button"
                              (click)="resetTotp(admin)"
                              [disabled]="
                                resetTotpMutation.isPending() &&
                                resetTotpMutation.variables() === admin.id
                              "
                              class="ui-btn ui-btn-sm"
                              title="Reset TOTP 2FA secret"
                            >
                              Reset TOTP
                            </button>
                            @if (admin.status === "ACTIVE" && !isSelf(admin)) {
                              <button
                                type="button"
                                (click)="disableAdmin(admin)"
                                [disabled]="
                                  disableMutation.isPending() &&
                                  disableMutation.variables() === admin.id
                                "
                                class="ui-btn ui-btn-danger ui-btn-sm"
                                title="Disable administrator account"
                              >
                                Disable
                              </button>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                    @if (admins().length === 0) {
                      <tr>
                        <td [attr.colspan]="6">
                          <div class="ui-empty">
                            <svg
                              [lucideIcon]="UserCogIcon"
                              [size]="28"
                              class="text-ui-faint"
                            ></svg>
                            <p>No administrators found</p>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>

            <!-- Load more -->
            <div class="ui-table-foot">
              <p>Showing {{ admins().length }} administrators</p>
              @if (hasMore()) {
                <button
                  type="button"
                  class="ui-btn ui-btn-sm"
                  (click)="loadMore()"
                  [disabled]="isLoadingMore()"
                >
                  @if (isLoadingMore()) {
                    <svg
                      [lucideIcon]="LoaderIcon"
                      [size]="15"
                      class="animate-spin"
                    ></svg>
                    <span>Loading...</span>
                  } @else {
                    <span>Load more</span>
                    <svg [lucideIcon]="ChevronDownIcon" [size]="15"></svg>
                  }
                </button>
              }
            </div>
          </div>
        </section>
      </div>
    }

    <!-- Create Admin Modal -->
    @if (showCreateModal()) {
      <div class="ui-overlay">
        <div class="ui-backdrop" aria-hidden="true"></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="showCreateModal.set(false)"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">Create New Administrator</h2>
            <button
              type="button"
              class="ui-icon-btn"
              (click)="showCreateModal.set(false)"
              aria-label="Close"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>

          <form
            (ngSubmit)="submitCreateAdmin()"
            class="flex min-h-0 flex-1 flex-col"
          >
            <div class="ui-modal-body space-y-4">
              <div>
                <label for="admin-first-name" class="ui-label">
                  First Name
                  <span class="text-ui-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="admin-first-name"
                  type="text"
                  [ngModel]="newAdmin().firstName"
                  (ngModelChange)="
                    newAdmin.update((v) => ({ ...v, firstName: $event }))
                  "
                  name="firstName"
                  required
                  class="ui-input"
                  data-autofocus
                />
              </div>

              <div>
                <label for="admin-last-name" class="ui-label">
                  Last Name
                  <span class="text-ui-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="admin-last-name"
                  type="text"
                  [ngModel]="newAdmin().lastName"
                  (ngModelChange)="
                    newAdmin.update((v) => ({ ...v, lastName: $event }))
                  "
                  name="lastName"
                  required
                  class="ui-input"
                />
              </div>

              <div>
                <label for="admin-email" class="ui-label">
                  Email Address
                  <span class="text-ui-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="admin-email"
                  type="email"
                  [ngModel]="newAdmin().email"
                  (ngModelChange)="
                    newAdmin.update((v) => ({ ...v, email: $event }))
                  "
                  name="email"
                  required
                  class="ui-input"
                />
                @if (emailInvalid()) {
                  <p class="mt-1 text-xs text-ui-danger">Enter a valid email</p>
                }
              </div>

              <div>
                <label for="admin-role" class="ui-label"> Role </label>
                <select
                  id="admin-role"
                  [ngModel]="newAdmin().role"
                  (ngModelChange)="
                    newAdmin.update((v) => ({ ...v, role: $event }))
                  "
                  name="role"
                  class="ui-input cursor-pointer"
                >
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="OPS">OPS</option>
                  <option value="COMPLIANCE">COMPLIANCE</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>

              <div>
                <label for="admin-phone" class="ui-label">
                  Phone (Optional)
                </label>
                <input
                  id="admin-phone"
                  type="tel"
                  [ngModel]="newAdmin().phone"
                  (ngModelChange)="
                    newAdmin.update((v) => ({ ...v, phone: $event }))
                  "
                  name="phone"
                  class="ui-input"
                />
              </div>
            </div>

            <div class="ui-modal-foot">
              <button
                type="button"
                class="ui-btn"
                (click)="showCreateModal.set(false)"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="createMutation.isPending() || !canSubmitCreate()"
                class="ui-btn ui-btn-primary"
              >
                {{
                  createMutation.isPending() ? "Creating..." : "Create Admin"
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- One-Time Temporary Password Display Modal -->
    @if (createdResult()) {
      <div class="ui-overlay">
        <div class="ui-backdrop" aria-hidden="true"></div>
        <div class="ui-modal" role="dialog" aria-modal="true" uiModal>
          <div class="ui-modal-head">
            <div class="flex min-w-0 items-center gap-2">
              <svg
                [lucideIcon]="KeyRoundIcon"
                [size]="18"
                class="shrink-0 text-ui-accent"
              ></svg>
              <h2 class="ui-modal-title">One-Time Temporary Password</h2>
            </div>
          </div>

          <div class="ui-modal-body space-y-4">
            <div class="ui-alert ui-alert-warning">
              <p>
                <strong>CRITICAL:</strong> Save this temporary password now. It
                will only be displayed ONCE and cannot be recovered later!
              </p>
            </div>

            <div class="rounded-xl border border-ui-line bg-ui-sunken p-4">
              <div class="mb-1 flex items-center justify-between gap-3">
                <span class="text-xs font-medium text-ui-muted">
                  Temporary Password
                </span>
                <button
                  type="button"
                  (click)="copyPassword(createdResult()!.temporaryPassword)"
                  class="inline-flex items-center gap-1 text-xs font-medium text-ui-accent hover:underline"
                >
                  <svg [lucideIcon]="CopyIcon" [size]="13"></svg>
                  Copy
                </button>
              </div>
              <p
                class="select-all break-all font-mono text-base font-semibold text-ui-ink"
              >
                {{ createdResult()!.temporaryPassword }}
              </p>
            </div>

            <div class="space-y-1 text-xs text-ui-muted">
              <p>
                Account: <strong>{{ createdResult()!.admin.email }}</strong>
              </p>
              <p>
                Role: <strong>{{ createdResult()!.admin.role }}</strong>
              </p>
              <p>
                The administrator will be required to enroll in TOTP two-factor
                authentication upon first login.
              </p>
            </div>
          </div>

          <div class="ui-modal-foot">
            <button
              type="button"
              class="ui-btn ui-btn-primary"
              (click)="createdResult.set(null)"
            >
              I have saved this password
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminsPageComponent {
  private adminService = inject(AdminService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private queryClient = injectQueryClient();

  readonly UserCogIcon = UserCog;
  readonly UserPlusIcon = UserPlus;
  readonly LockIcon = Lock;
  readonly XIcon = X;
  readonly KeyRoundIcon = KeyRound;
  readonly CopyIcon = Copy;
  readonly ChevronDownIcon = ChevronDown;
  readonly LoaderIcon = LoaderCircle;
  readonly CircleAlertIcon = CircleAlert;

  private static readonly EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  isSuperAdmin = computed(() => this.auth.getAdminRole() === "SUPER_ADMIN");

  isSelf(admin: AdminUser): boolean {
    return admin.id === this.auth.getAdmin()?.id;
  }

  adminsQuery = injectQuery(() => ({
    queryKey: ["admin-users"],
    queryFn: () =>
      lastValueFrom(this.adminService.getAdminUsers({ limit: 20 })),
    enabled: () => this.isSuperAdmin(),
  }));

  loading = computed(() => this.adminsQuery.isPending());

  rawAppended = signal<AdminUser[]>([]);
  rawHasMore = signal<boolean | null>(null);
  hasMore = computed(() => {
    if (this.rawHasMore() !== null) return this.rawHasMore()!;
    return this.adminsQuery.data()?.hasMore ?? false;
  });
  nextCursor = signal<string | null>(null);
  isLoadingMore = signal(false);

  admins = computed<AdminUser[]>(() => {
    const initial = this.adminsQuery.data()?.items || [];
    return [...initial, ...this.rawAppended()];
  });

  private resetPages() {
    this.rawAppended.set([]);
    this.rawHasMore.set(null);
    this.nextCursor.set(null);
  }

  showCreateModal = signal(false);
  createdResult = signal<CreateAdminResult | null>(null);

  newAdmin = signal<NewAdminDraft>({
    firstName: "",
    lastName: "",
    email: "",
    role: "SUPPORT",
    phone: "",
  });

  emailInvalid = computed(() => {
    const email = this.newAdmin().email.trim();
    return email.length > 0 && !AdminsPageComponent.EMAIL_RE.test(email);
  });

  canSubmitCreate = computed(() => {
    const v = this.newAdmin();
    return (
      !!v.firstName.trim() &&
      !!v.lastName.trim() &&
      AdminsPageComponent.EMAIL_RE.test(v.email.trim())
    );
  });

  createMutation = injectMutation(() => ({
    mutationFn: (data: NewAdminDraft) =>
      lastValueFrom(this.adminService.createAdminUser(data)),
    onSuccess: (res: CreateAdminResult) => {
      this.showCreateModal.set(false);
      this.createdResult.set(res);
      this.newAdmin.set({
        firstName: "",
        lastName: "",
        email: "",
        role: "SUPPORT",
        phone: "",
      });
      this.queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      this.resetPages();
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to create administrator";
      this.toast.show("error", message);
    },
  }));

  disableMutation = injectMutation(() => ({
    mutationFn: (id: string) =>
      lastValueFrom(this.adminService.disableAdminUser(id)),
    onSuccess: () => {
      this.toast.show("success", "Administrator account disabled");
      this.queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      this.resetPages();
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to disable administrator";
      this.toast.show("error", message);
    },
  }));

  async disableAdmin(admin: AdminUser) {
    const ok = await this.confirm.ask({
      title: `Disable ${admin.firstName} ${admin.lastName}?`,
      message:
        "They're signed out and can't sign in again. There's no re-enable yet, so they'd need a new account.",
      confirmLabel: "Disable",
      tone: "danger",
      typeToConfirm: "DISABLE",
    });
    if (!ok) return;
    this.disableMutation.mutate(admin.id);
  }

  resetTotpMutation = injectMutation(() => ({
    mutationFn: (id: string) =>
      lastValueFrom(this.adminService.resetAdminTotp(id)),
    onSuccess: () => {
      this.toast.show(
        "success",
        "Administrator TOTP reset. They will re-enroll on next login.",
      );
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to reset TOTP";
      this.toast.show("error", message);
    },
  }));

  async resetTotp(admin: AdminUser) {
    const ok = await this.confirm.ask({
      title: `Reset two-factor for ${admin.firstName}?`,
      message:
        "They'll set up their authenticator app again at their next sign-in.",
      confirmLabel: "Reset",
      tone: "danger",
    });
    if (!ok) return;
    this.resetTotpMutation.mutate(admin.id);
  }

  submitCreateAdmin() {
    if (!this.canSubmitCreate()) {
      this.toast.show("error", "Please fill in all required fields");
      return;
    }
    this.createMutation.mutate(this.newAdmin());
  }

  async copyPassword(pass: string) {
    try {
      await navigator.clipboard.writeText(pass);
      this.toast.show("success", "Password copied to clipboard");
    } catch {
      this.toast.show("error", "Failed to copy password");
    }
  }

  loadMore() {
    const cursor = this.nextCursor() ?? this.adminsQuery.data()?.nextCursor;
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.adminService.getAdminUsers({ limit: 20, cursor }).subscribe({
      next: (res: CursorPage<AdminUser>) => {
        this.rawAppended.update((prev) => [...prev, ...(res.items || [])]);
        this.nextCursor.set(res.nextCursor);
        this.rawHasMore.set(res.hasMore);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoadingMore.set(false);
        this.toast.show("error", "Failed to load more administrators");
      },
    });
  }
}
