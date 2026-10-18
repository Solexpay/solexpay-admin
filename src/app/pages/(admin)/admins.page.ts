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
  AdminService,
  AdminUser,
  CreateAdminResult,
  CursorPage,
} from "../../services/admin.service";
import { AuthService } from "../../services/auth.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { RippleDirective } from "../../directives/ripple.directive";

@Component({
  selector: "app-admins",
  standalone: true,
  imports: [CommonModule, FormsModule, StatusChipComponent, RippleDirective],
  template: `
    <div class="space-y-6">
      <!-- Super Admin Access Guard Check -->
      @if (!isSuperAdmin()) {
        <div
          class="bg-error-container rounded-2xl p-8 text-center text-on-error-container"
        >
          <span class="material-symbols-outlined text-5xl mb-2">lock</span>
          <h2 class="text-xl font-bold">Access Restricted</h2>
          <p class="text-sm mt-1">
            This section requires the SUPER_ADMIN role. Your account does not
            have sufficient permissions.
          </p>
        </div>
      } @else {
        <!-- Page header -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-on-surface">
              Administrators
            </h1>
            <p class="text-sm text-on-surface-variant mt-1">
              Manage back-office admin accounts, roles, security credentials,
              and TOTP
            </p>
          </div>
          <button
            solexRipple
            (click)="showCreateModal.set(true)"
            class="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm hover:brightness-110 flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-sm">person_add</span>
            Create Admin
          </button>
        </div>

        <!-- Admins Table -->
        <div
          class="bg-surface-container-lowest rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)] overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table class="w-full min-w-[850px]">
              <thead>
                <tr class="bg-surface-container text-left">
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Administrator
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Last Login
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Created
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (n of [1, 2, 3]; track n) {
                    <tr class="border-t border-surface-container animate-pulse">
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-36 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-20 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-16 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-24 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-20 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div
                          class="h-4 w-24 bg-surface-container-high rounded ml-auto"
                        ></div>
                      </td>
                    </tr>
                  }
                } @else {
                  @for (admin of admins(); track admin.id) {
                    <tr
                      class="border-t border-surface-container hover:bg-surface-container-low transition-colors"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-sm"
                          >
                            {{ admin.firstName[0] || "A" }}
                          </div>
                          <div>
                            <p class="text-sm font-semibold text-on-surface">
                              {{ admin.firstName }} {{ admin.lastName }}
                            </p>
                            <p class="text-xs text-on-surface-variant">
                              {{ admin.email }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase"
                          [class]="
                            admin.role === 'SUPER_ADMIN'
                              ? 'bg-primary-fixed text-primary'
                              : admin.role === 'OPS'
                                ? 'bg-secondary-fixed text-secondary'
                                : admin.role === 'COMPLIANCE'
                                  ? 'bg-tertiary-fixed text-tertiary'
                                  : 'bg-surface-container-high text-on-surface'
                          "
                        >
                          {{ admin.role }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <app-status-chip
                          [status]="admin.status"
                        ></app-status-chip>
                      </td>
                      <td
                        class="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap"
                      >
                        {{
                          admin.lastLoginAt
                            ? (admin.lastLoginAt | date: "short")
                            : "Never"
                        }}
                      </td>
                      <td
                        class="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap"
                      >
                        {{ admin.createdAt | date: "mediumDate" }}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <button
                            solexRipple
                            (click)="resetTotpMutation.mutate(admin.id)"
                            [disabled]="resetTotpMutation.isPending()"
                            class="px-2.5 py-1.5 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                            title="Reset TOTP 2FA secret"
                          >
                            Reset TOTP
                          </button>
                          @if (admin.status === "ACTIVE") {
                            <button
                              solexRipple
                              (click)="disableMutation.mutate(admin.id)"
                              [disabled]="disableMutation.isPending()"
                              class="px-2.5 py-1.5 bg-error-container text-on-error-container hover:bg-error hover:text-on-error rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                              title="Disable administrator account"
                            >
                              Disable
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          @if (!loading() && admins().length === 0) {
            <div class="text-center py-12">
              <span
                class="material-symbols-outlined text-4xl text-surface-variant"
                >admin_panel_settings</span
              >
              <p class="text-sm text-on-surface-variant mt-2">
                No administrators found
              </p>
            </div>
          }

          @if (hasMore()) {
            <div
              class="flex justify-center p-4 border-t border-surface-container"
            >
              <button
                (click)="loadMore()"
                [disabled]="isLoadingMore()"
                class="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors font-medium text-sm flex items-center gap-2"
              >
                @if (isLoadingMore()) {
                  <span
                    class="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
                  ></span>
                  <span>Loading...</span>
                } @else {
                  <span>Load more</span>
                  <span class="material-symbols-outlined text-sm"
                    >expand_more</span
                  >
                }
              </button>
            </div>
          }
        </div>
      }

      <!-- Create Admin Modal -->
      @if (showCreateModal()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/30 backdrop-blur-md"
        >
          <div
            class="relative bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 class="text-lg font-bold text-on-surface mb-4">
              Create New Administrator
            </h2>

            <form (ngSubmit)="submitCreateAdmin()" class="space-y-4">
              <div>
                <label
                  for="admin-first-name"
                  class="block text-xs font-semibold text-on-surface mb-1"
                  >First Name</label
                >
                <input
                  id="admin-first-name"
                  type="text"
                  [(ngModel)]="newAdmin.firstName"
                  name="firstName"
                  required
                  class="w-full bg-surface-container-highest rounded-xl py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  for="admin-last-name"
                  class="block text-xs font-semibold text-on-surface mb-1"
                  >Last Name</label
                >
                <input
                  id="admin-last-name"
                  type="text"
                  [(ngModel)]="newAdmin.lastName"
                  name="lastName"
                  required
                  class="w-full bg-surface-container-highest rounded-xl py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  for="admin-email"
                  class="block text-xs font-semibold text-on-surface mb-1"
                  >Email Address</label
                >
                <input
                  id="admin-email"
                  type="email"
                  [(ngModel)]="newAdmin.email"
                  name="email"
                  required
                  class="w-full bg-surface-container-highest rounded-xl py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  for="admin-role"
                  class="block text-xs font-semibold text-on-surface mb-1"
                  >Role</label
                >
                <select
                  id="admin-role"
                  [(ngModel)]="newAdmin.role"
                  name="role"
                  class="w-full bg-surface-container-highest rounded-xl py-2.5 px-3 text-sm outline-none cursor-pointer"
                >
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="OPS">OPS</option>
                  <option value="COMPLIANCE">COMPLIANCE</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>

              <div>
                <label
                  for="admin-phone"
                  class="block text-xs font-semibold text-on-surface mb-1"
                  >Phone (Optional)</label
                >
                <input
                  id="admin-phone"
                  type="tel"
                  [(ngModel)]="newAdmin.phone"
                  name="phone"
                  class="w-full bg-surface-container-highest rounded-xl py-2.5 px-3 text-sm outline-none"
                />
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  (click)="showCreateModal.set(false)"
                  class="px-4 py-2 bg-surface-container text-on-surface rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  solexRipple
                  type="submit"
                  [disabled]="createMutation.isPending()"
                  class="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm disabled:opacity-50"
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
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-md"
        >
          <div
            class="relative bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-primary"
          >
            <div class="flex items-center gap-2 mb-2 text-primary font-bold">
              <span class="material-symbols-outlined">key</span>
              <h2 class="text-lg">One-Time Temporary Password</h2>
            </div>

            <p
              class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4"
            >
              <strong>CRITICAL:</strong> Save this temporary password now. It
              will only be displayed ONCE and cannot be recovered later!
            </p>

            <div class="bg-surface-container rounded-xl p-4 mb-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-on-surface-variant font-semibold"
                  >Temporary Password</span
                >
                <button
                  type="button"
                  (click)="copyPassword(createdResult()!.temporaryPassword)"
                  class="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <span class="material-symbols-outlined text-xs"
                    >content_copy</span
                  >
                  Copy
                </button>
              </div>
              <p
                class="font-mono text-base font-bold text-on-surface select-all break-all"
              >
                {{ createdResult()!.temporaryPassword }}
              </p>
            </div>

            <div class="text-xs text-on-surface-variant space-y-1 mb-6">
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

            <div class="flex justify-end">
              <button
                solexRipple
                (click)="createdResult.set(null)"
                class="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:brightness-110"
              >
                I have saved this password
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminsPageComponent {
  private adminService = inject(AdminService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  isSuperAdmin = computed(() => this.auth.getAdminRole() === "SUPER_ADMIN");

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

  showCreateModal = signal(false);
  createdResult = signal<CreateAdminResult | null>(null);

  newAdmin = {
    firstName: "",
    lastName: "",
    email: "",
    role: "SUPPORT",
    phone: "",
  };

  createMutation = injectMutation(() => ({
    mutationFn: (data: typeof this.newAdmin) =>
      lastValueFrom(this.adminService.createAdminUser(data)),
    onSuccess: (res: CreateAdminResult) => {
      this.showCreateModal.set(false);
      this.createdResult.set(res);
      this.newAdmin = {
        firstName: "",
        lastName: "",
        email: "",
        role: "SUPPORT",
        phone: "",
      };
      this.queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to disable administrator";
      this.toast.show("error", message);
    },
  }));

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

  submitCreateAdmin() {
    if (
      !this.newAdmin.firstName ||
      !this.newAdmin.lastName ||
      !this.newAdmin.email
    ) {
      this.toast.show("error", "Please fill in all required fields");
      return;
    }
    this.createMutation.mutate(this.newAdmin);
  }

  copyPassword(pass: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pass);
      this.toast.show("success", "Password copied to clipboard");
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
