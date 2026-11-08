import { Component, inject, computed, signal } from "@angular/core";
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
  LucideBanknote as Banknote,
  LucideChevronDown as ChevronDown,
  LucideGraduationCap as GraduationCap,
  LucideHandCoins as HandCoins,
  LucideLoaderCircle as LoaderCircle,
  LucidePlus as Plus,
  LucideSchool as SchoolLucide,
  LucideSearch as Search,
  LucideX as X,
  LucideKeyRound as KeyRound,
  LucideCircleAlert as CircleAlert,
  LucideCopy as Copy,
} from "@lucide/angular";
import {
  AdminService,
  School,
  RegenerateSchoolTokenResult,
} from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { MetricCardComponent } from "../../components/ui/metric-card.component";
import { PageHeaderComponent } from "../../components/ui/page-header.component";
import { schoolLogo } from "../../core/school-logos";
import { ConfirmService } from "../../services/confirm.service";
import { ModalDirective } from "../../directives/modal.directive";
import { CopyToClipboardDirective } from "../../directives/copy-to-clipboard.directive";

@Component({
  selector: "app-schools",
  imports: [
    CommonModule,
    FormsModule,
    LucideDynamicIcon,
    StatusChipComponent,
    MetricCardComponent,
    PageHeaderComponent,
    ModalDirective,
    CopyToClipboardDirective,
  ],
  template: `
    <app-page-header
      title="Schools Directory"
      [icon]="SchoolIcon"
      subtitle="Manage partner schools and API access"
    >
      <button
        type="button"
        class="ui-btn ui-btn-primary"
        (click)="openAddSchool()"
      >
        <svg [lucideIcon]="PlusIcon" [size]="15"></svg>
        Add School
      </button>
    </app-page-header>

    <div class="space-y-4">
      <!-- Stats -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Overview</h2>
        </div>
        <div class="grid grid-cols-2 gap-1.5 md:grid-cols-4">
          <app-metric-card
            label="Total Schools"
            [icon]="SchoolIcon"
            [value]="schools().length"
          />
          <app-metric-card
            label="Active Students"
            [icon]="GraduationCapIcon"
            [value]="totalStudents()"
          />
          <app-metric-card
            label="Active Loans"
            [icon]="HandCoinsIcon"
            [value]="totalActiveLoans()"
          />
          <app-metric-card
            label="Total Disbursed"
            [icon]="BanknoteIcon"
            prefix="₦"
            [value]="totalDisbursed()"
          />
        </div>
      </section>

      <!-- Schools -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Schools</h2>
          <div
            class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
          >
            <div class="ui-search sm:w-64">
              <svg [lucideIcon]="SearchIcon" [size]="15"></svg>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                class="ui-input"
                placeholder="Search schools..."
              />
            </div>

            <select
              [ngModel]="stateFilter()"
              (ngModelChange)="stateFilter.set($event)"
              class="ui-input sm:w-auto"
            >
              <option value="">All States</option>
              @for (state of states(); track state) {
                <option [value]="state">{{ state }}</option>
              }
            </select>

            <select
              [ngModel]="statusFilter()"
              (ngModelChange)="onStatusChange($event)"
              class="ui-input sm:w-auto"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        @if (schoolsQuery.isPending()) {
          <!-- Skeletons while loading -->
          <div class="grid grid-cols-1 gap-1.5 md:grid-cols-2 lg:grid-cols-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="ui-card">
                <div class="mb-4 flex items-center gap-3">
                  <div class="ui-skel h-10 w-10 rounded-lg"></div>
                  <div class="flex-1 space-y-2">
                    <div class="ui-skel h-4 w-32"></div>
                    <div class="ui-skel h-3 w-20"></div>
                  </div>
                </div>
                <div class="mb-4 space-y-3">
                  <div class="ui-skel h-4 w-full"></div>
                  <div class="ui-skel h-4 w-full"></div>
                  <div class="ui-skel h-4 w-full"></div>
                </div>
                <div class="ui-skel mb-4 h-12 w-full rounded-lg"></div>
                <div class="flex gap-2">
                  <div class="ui-skel h-9 flex-1 rounded-lg"></div>
                  <div class="ui-skel h-9 w-24 rounded-lg"></div>
                </div>
              </div>
            }
          </div>
        } @else if (schoolsQuery.isError()) {
          <div class="ui-panel-body">
            <div class="ui-empty">
              <svg
                [lucideIcon]="CircleAlertIcon"
                [size]="28"
                class="text-ui-danger"
              ></svg>
              <p>Couldn't load schools.</p>
              <button
                type="button"
                class="ui-btn ui-btn-sm"
                (click)="schoolsQuery.refetch()"
              >
                Try again
              </button>
            </div>
          </div>
        } @else {
          <!-- Schools Grid -->
          <div class="grid grid-cols-1 gap-1.5 md:grid-cols-2 lg:grid-cols-3">
            @for (school of filteredSchools(); track school.id) {
              <div class="ui-card flex min-w-0 flex-col">
                <div class="mb-3 flex items-start justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    @if (logoFor(school); as logo) {
                      <img
                        [src]="logo"
                        [alt]="school.name + ' logo'"
                        class="h-10 w-10 shrink-0 rounded-lg border border-ui-line bg-white object-contain p-1"
                        (error)="markLogoFailed(school.id)"
                      />
                    } @else {
                      <span class="ui-avatar h-10 w-10 rounded-lg">{{
                        initials(school.name)
                      }}</span>
                    }
                    <div class="min-w-0">
                      <h3
                        class="truncate text-sm font-semibold text-ui-ink"
                        [title]="school.name"
                      >
                        {{ school.name }}
                      </h3>
                      <p class="text-xs text-ui-muted">
                        {{ school.state }}
                      </p>
                    </div>
                  </div>
                  <app-status-chip [status]="school.status" />
                </div>

                <div class="mb-3 divide-y divide-ui-line">
                  <div class="flex items-center justify-between py-2">
                    <span class="text-[13px] text-ui-muted">Students</span>
                    <span
                      class="text-sm font-medium tabular-nums text-ui-ink"
                      >{{
                        school.studentCount | number: "1.0-0" : "en-NG"
                      }}</span
                    >
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-[13px] text-ui-muted">Active Loans</span>
                    <span
                      class="text-sm font-medium tabular-nums text-ui-ink"
                      >{{ school.activeLoans }}</span
                    >
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-[13px] text-ui-muted"
                      >Total Disbursed</span
                    >
                    <span class="text-sm font-medium tabular-nums text-ui-ink"
                      >₦{{
                        school.totalDisbursed | number: "1.0-0" : "en-NG"
                      }}</span
                    >
                  </div>
                </div>

                <!-- API Token -->
                <div class="mb-4 rounded-lg bg-ui-sunken px-3 py-2.5">
                  <p class="mb-1 text-xs text-ui-muted">API Token</p>
                  <div class="flex items-center gap-2">
                    <code
                      class="flex-1 truncate font-mono text-xs text-ui-ink"
                      >{{ maskToken(school.apiToken) }}</code
                    >
                  </div>
                </div>

                <!-- Actions -->
                <div class="mt-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="ui-btn flex-1"
                    (click)="viewSchool(school)"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    class="ui-btn"
                    (click)="resetLogin(school)"
                    [disabled]="
                      resetLoginMutation.isPending() &&
                      resetLoginMutation.variables() === school.id
                    "
                  >
                    <svg [lucideIcon]="KeyRoundIcon" [size]="15"></svg
                    >{{
                      resetLoginMutation.isPending() &&
                      resetLoginMutation.variables() === school.id
                        ? "Resetting…"
                        : "Reset login"
                    }}
                  </button>
                  <button
                    type="button"
                    class="ui-btn"
                    [class.ui-btn-danger]="school.status === 'ACTIVE'"
                    [class.ui-btn-primary]="school.status !== 'ACTIVE'"
                    [disabled]="
                      toggleStatusMutation.isPending() &&
                      toggleStatusMutation.variables()?.id === school.id
                    "
                    (click)="toggleStatus(school)"
                  >
                    {{
                      toggleStatusMutation.isPending() &&
                      toggleStatusMutation.variables()?.id === school.id
                        ? "Updating…"
                        : school.status === "ACTIVE"
                          ? "Deactivate"
                          : "Activate"
                    }}
                  </button>
                </div>
              </div>
            }

            @if (filteredSchools().length === 0) {
              <div class="ui-panel-body md:col-span-2 lg:col-span-3">
                <div class="ui-empty">
                  <svg
                    [lucideIcon]="SchoolIcon"
                    [size]="28"
                    class="text-ui-faint"
                  ></svg>
                  <p>No schools found</p>
                  @if (searchQuery() || stateFilter() || statusFilter()) {
                    <button
                      type="button"
                      class="ui-btn ui-btn-sm"
                      (click)="clearFilters()"
                    >
                      Clear filters
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          @if (hasMore()) {
            <div class="flex justify-center px-3 pb-1.5 pt-3">
              <button
                type="button"
                class="ui-btn"
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
            </div>
          }
        }
      </section>
    </div>

    <!-- Add School Modal -->
    @if (showAddSchool()) {
      <div class="ui-overlay">
        <div class="ui-backdrop" aria-hidden="true"></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="closeAddSchool()"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">Add New School</h2>
            <button
              type="button"
              class="ui-icon-btn"
              (click)="closeAddSchool()"
              aria-label="Close"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>
          <form (ngSubmit)="addSchool()" class="flex min-h-0 flex-1 flex-col">
            <div class="ui-modal-body space-y-3">
              <label class="ui-label" for="school-name"
                >School name <span class="text-ui-danger">*</span></label
              >
              <input
                id="school-name"
                type="text"
                [ngModel]="newSchool().name"
                (ngModelChange)="updateNewSchool('name', $event)"
                name="name"
                placeholder="School Name"
                class="ui-input"
                data-autofocus
                required
              />
              <label class="ui-label" for="school-email"
                >Email <span class="text-ui-danger">*</span></label
              >
              <input
                id="school-email"
                type="email"
                [ngModel]="newSchool().email"
                (ngModelChange)="updateNewSchool('email', $event)"
                name="email"
                placeholder="Email Address"
                class="ui-input"
                required
              />
              @if (newSchool().email && !emailValid()) {
                <p class="text-xs text-ui-danger">Enter a valid email</p>
              }
              <label class="ui-label" for="school-phone">Phone</label>
              <input
                id="school-phone"
                type="tel"
                [ngModel]="newSchool().phone"
                (ngModelChange)="updateNewSchool('phone', $event)"
                name="phone"
                placeholder="Phone Number"
                class="ui-input"
              />
              <label class="ui-label" for="school-state">State</label>
              <input
                id="school-state"
                type="text"
                [ngModel]="newSchool().state"
                (ngModelChange)="updateNewSchool('state', $event)"
                name="state"
                placeholder="State"
                class="ui-input"
              />
              <label class="ui-label" for="school-address">Address</label>
              <textarea
                id="school-address"
                [ngModel]="newSchool().address"
                (ngModelChange)="updateNewSchool('address', $event)"
                name="address"
                placeholder="Address"
                rows="3"
                class="ui-input resize-none"
              ></textarea>
            </div>
            <div class="ui-modal-foot">
              <button type="button" class="ui-btn" (click)="closeAddSchool()">
                Cancel
              </button>
              <button
                type="submit"
                class="ui-btn ui-btn-primary"
                [disabled]="
                  addSchoolMutation.isPending() ||
                  !emailValid() ||
                  !newSchool().name.trim()
                "
              >
                {{ addSchoolMutation.isPending() ? "Adding…" : "Add School" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (selectedSchool(); as school) {
      <div class="ui-overlay">
        <div
          class="ui-backdrop"
          aria-hidden="true"
          (click)="selectedSchool.set(null)"
        ></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="selectedSchool.set(null)"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">School details</h2>
            <button
              type="button"
              class="ui-icon-btn"
              aria-label="Close"
              (click)="selectedSchool.set(null)"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>
          <div class="ui-modal-body">
            <dl class="ui-dl">
              <div>
                <dt class="ui-dt">Name</dt>
                <dd class="ui-dd">{{ school.name }}</dd>
              </div>
              <div>
                <dt class="ui-dt">Email</dt>
                <dd class="ui-dd" [copyToClipboard]="school.email">
                  {{ school.email }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Phone</dt>
                <dd class="ui-dd">{{ school.phone || "—" }}</dd>
              </div>
              <div>
                <dt class="ui-dt">State</dt>
                <dd class="ui-dd">{{ school.state || "—" }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="ui-dt">Address</dt>
                <dd class="ui-dd">{{ school.address || "—" }}</dd>
              </div>
              <div>
                <dt class="ui-dt">Status</dt>
                <dd class="ui-dd">
                  <app-status-chip [status]="school.status" />
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Created</dt>
                <dd class="ui-dd">
                  {{ school.createdAt | date: "mediumDate" }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Students</dt>
                <dd class="ui-dd">{{ school.studentCount ?? 0 }}</dd>
              </div>
              <div>
                <dt class="ui-dt">Active loans</dt>
                <dd class="ui-dd">{{ school.activeLoans ?? 0 }}</dd>
              </div>
              <div>
                <dt class="ui-dt">Total disbursed</dt>
                <dd class="ui-dd">
                  ₦{{ school.totalDisbursed ?? 0 | number: "1.0-0" : "en-NG" }}
                </dd>
              </div>
            </dl>
          </div>
          <div class="ui-modal-foot">
            <button
              type="button"
              class="ui-btn"
              (click)="selectedSchool.set(null)"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }

    @if (temporaryPassword(); as result) {
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
                <span class="text-xs font-medium text-ui-muted"
                  >Temporary Password</span
                ><button
                  type="button"
                  (click)="copyPassword(result.temporary_password)"
                  class="inline-flex items-center gap-1 text-xs font-medium text-ui-accent hover:underline"
                >
                  <svg [lucideIcon]="CopyIcon" [size]="13"></svg>Copy
                </button>
              </div>
              <p
                class="select-all break-all font-mono text-base font-semibold text-ui-ink"
              >
                {{ result.temporary_password }}
              </p>
            </div>
          </div>
          <div class="ui-modal-foot">
            <button
              type="button"
              class="ui-btn ui-btn-primary"
              (click)="temporaryPassword.set(null)"
            >
              I have saved this password
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class SchoolsPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();
  private confirm = inject(ConfirmService);

  readonly SchoolIcon = SchoolLucide;
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly KeyRoundIcon = KeyRound;
  readonly CircleAlertIcon = CircleAlert;
  readonly CopyIcon = Copy;
  readonly ChevronDownIcon = ChevronDown;
  readonly LoaderIcon = LoaderCircle;
  readonly GraduationCapIcon = GraduationCap;
  readonly HandCoinsIcon = HandCoins;
  readonly BanknoteIcon = Banknote;

  searchQuery = signal("");
  stateFilter = signal("");
  statusFilter = signal("");
  showAddSchool = signal(false);
  selectedSchool = signal<School | null>(null);
  temporaryPassword = signal<RegenerateSchoolTokenResult | null>(null);
  failedLogoIds = signal<Set<string>>(new Set());

  newSchool = signal({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
  });
  emailValid = computed(() =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.newSchool().email),
  );

  schoolsQuery = injectQuery(() => ({
    queryKey: ["schools", { status: this.statusFilter() }],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getSchools({
          status: this.statusFilter() || undefined,
          limit: 20,
        }),
      ),
  }));

  resetLoginMutation = injectMutation(() => ({
    mutationFn: (schoolId: string) =>
      lastValueFrom(this.adminService.regenerateSchoolToken(schoolId)),
    onSuccess: (result) => {
      this.temporaryPassword.set(result);
      this.resetPages();
      this.queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: () => this.toast.show("error", "Failed to reset school login"),
  }));

  toggleStatusMutation = injectMutation(() => ({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "INACTIVE";
    }) => lastValueFrom(this.adminService.toggleSchoolStatus(id, status)),
    onSuccess: (_, { status }) => {
      this.toast.show("success", `School status updated to ${status}`);
      this.resetPages();
      this.queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: () => this.toast.show("error", "Failed to update school status"),
  }));

  addSchoolMutation = injectMutation(() => ({
    mutationFn: (school: Parameters<AdminService["addSchool"]>[0]) =>
      lastValueFrom(this.adminService.addSchool(school)),
    onSuccess: (data: School) => {
      this.toast.show("success", `${data.name || "School"} added successfully`);
      this.showAddSchool.set(false);
      this.newSchool.set({
        name: "",
        email: "",
        phone: "",
        address: "",
        state: "",
      });
      this.resetPages();
      this.queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: () => this.toast.show("error", "Failed to add school"),
  }));

  rawAppendedSchools = signal<School[]>([]);
  rawHasMore = signal<boolean | null>(null);
  hasMore = computed(() => {
    if (this.rawHasMore() !== null) return this.rawHasMore()!;
    return this.schoolsQuery.data()?.hasMore ?? false;
  });
  nextCursor = signal<string | null>(null);
  isLoadingMore = signal(false);

  schools = computed<School[]>(() => {
    const response = this.schoolsQuery.data();
    const initial =
      response?.items ||
      (response as unknown as { content?: School[] })?.content ||
      (Array.isArray(response) ? response : []);
    return [...initial, ...this.rawAppendedSchools()];
  });

  states = computed(() =>
    [
      ...new Set(
        this.schools()
          .map((school) => school.state)
          .filter((state): state is string => !!state),
      ),
    ].sort((a, b) => a.localeCompare(b)),
  );

  filteredSchools = computed(() => {
    let result = this.schools();

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          (s.state && s.state.toLowerCase().includes(query)),
      );
    }

    if (this.stateFilter()) {
      result = result.filter((s) => s.state === this.stateFilter());
    }

    return result;
  });

  totalStudents = computed(() =>
    this.schools().reduce((sum, s) => sum + (s.studentCount || 0), 0),
  );
  totalActiveLoans = computed(() =>
    this.schools().reduce((sum, s) => sum + (s.activeLoans || 0), 0),
  );
  totalDisbursed = computed(() =>
    this.schools().reduce((sum, s) => sum + (s.totalDisbursed || 0), 0),
  );

  maskToken(token?: string): string {
    if (!token) return "N/A";
    if (token.length <= 12) return token;
    return token.slice(0, 8) + "..." + token.slice(-4);
  }

  async resetLogin(school: School) {
    const ok = await this.confirm.ask({
      title: `Reset ${school.name}'s login?`,
      message:
        "They get a new temporary password and must set up two-factor again. Their current password stops working immediately.",
      confirmLabel: "Reset login",
      tone: "danger",
      typeToConfirm: "RESET",
    });
    if (ok) this.resetLoginMutation.mutate(school.id);
  }

  async toggleStatus(school: School) {
    const newStatus = school.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const ok = await this.confirm.ask({
      title: `${newStatus === "INACTIVE" ? "Deactivate" : "Activate"} ${school.name}?`,
      message:
        newStatus === "INACTIVE"
          ? "The school is marked inactive until you activate it again."
          : "The school can access its console again.",
      confirmLabel: newStatus === "INACTIVE" ? "Deactivate" : "Activate",
      tone: newStatus === "INACTIVE" ? "danger" : "primary",
    });
    if (!ok) return;
    this.toggleStatusMutation.mutate({ id: school.id, status: newStatus });
  }

  viewSchool(school: School) {
    this.selectedSchool.set(school);
  }

  addSchool() {
    if (!this.newSchool().name.trim() || !this.emailValid()) {
      this.toast.show("error", "Please fill in required fields");
      return;
    }
    this.addSchoolMutation.mutate(this.newSchool());
  }

  openAddSchool() {
    this.newSchool.set({
      name: "",
      email: "",
      phone: "",
      address: "",
      state: "",
    });
    this.showAddSchool.set(true);
  }
  closeAddSchool() {
    this.showAddSchool.set(false);
  }
  updateNewSchool(
    field: "name" | "email" | "phone" | "address" | "state",
    value: string,
  ) {
    this.newSchool.update((school) => ({ ...school, [field]: value }));
  }
  /** Uploaded logo, else a bundled crest matched by name; null shows initials. */
  logoFor(school: School) {
    return this.failedLogoIds().has(school.id) ? null : schoolLogo(school);
  }
  markLogoFailed(id: string) {
    this.failedLogoIds.update((ids) => new Set(ids).add(id));
  }
  initials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  copyPassword(password: string) {
    navigator.clipboard.writeText(password).then(
      () => this.toast.show("success", "Password copied"),
      () => this.toast.show("error", "Failed to copy password"),
    );
  }
  onStatusChange(status: string) {
    this.statusFilter.set(status);
    this.resetPages();
  }
  clearFilters() {
    this.searchQuery.set("");
    this.stateFilter.set("");
    this.statusFilter.set("");
    this.resetPages();
  }
  private resetPages() {
    this.rawAppendedSchools.set([]);
    this.rawHasMore.set(null);
    this.nextCursor.set(null);
  }

  loadMore() {
    const cursor = this.nextCursor() ?? this.schoolsQuery.data()?.nextCursor;
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.adminService
      .getSchools({
        status: this.statusFilter() || undefined,
        limit: 20,
        cursor,
      })
      .subscribe({
        next: (res) => {
          this.rawAppendedSchools.update((prev: School[]) => [
            ...prev,
            ...(res.items || []),
          ]);
          this.nextCursor.set(res.nextCursor);
          this.rawHasMore.set(res.hasMore);
          this.isLoadingMore.set(false);
        },
        error: () => {
          this.isLoadingMore.set(false);
          this.toast.show("error", "Failed to load more schools");
        },
      });
  }
}
