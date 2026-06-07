import { Component, inject, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { AdminService, School } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { RippleDirective } from "../../directives/ripple.directive";

@Component({
  selector: "app-schools",
  standalone: true,
  imports: [CommonModule, FormsModule, StatusChipComponent, RippleDirective],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-on-surface">
            Schools Directory
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">
            Manage partner schools and API access
          </p>
        </div>
        <button
          solexRipple
          (click)="showAddSchool = true"
          class="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm transition-all hover:brightness-110 flex items-center justify-center gap-2 sm:w-auto w-full"
        >
          <span class="material-symbols-outlined text-sm">add</span>
          Add School
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div
          class="bg-surface-container-lowest p-3 sm:p-4 rounded-xl border-l-4 border-primary shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">Total Schools</p>
          <p class="text-xl sm:text-2xl font-bold text-on-surface mt-1">
            {{ schools().length }}
          </p>
        </div>
        <div
          class="bg-surface-container-lowest p-3 sm:p-4 rounded-xl border-l-4 border-tertiary shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">
            Active Students
          </p>
          <p class="text-xl sm:text-2xl font-bold text-on-surface mt-1">
            {{ totalStudents() | number: "1.0-0" : "en-NG" }}
          </p>
        </div>
        <div
          class="bg-surface-container-lowest p-3 sm:p-4 rounded-xl border-l-4 border-secondary shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">Active Loans</p>
          <p class="text-xl sm:text-2xl font-bold text-on-surface mt-1">
            {{ totalActiveLoans() }}
          </p>
        </div>
        <div
          class="bg-surface-container-lowest p-3 sm:p-4 rounded-xl border-l-4 border-primary shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">
            Total Disbursed
          </p>
          <p class="text-xl sm:text-2xl font-bold text-on-surface mt-1">
            <span class="text-base sm:text-lg opacity-50">₦</span
            >{{ totalDisbursed() | number: "1.0-0" : "en-NG" }}
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-surface-container-lowest rounded-xl p-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
      >
        <div class="flex-1 min-w-[200px] relative">
          <span
            class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            >search</span
          >
          <input
            type="text"
            [(ngModel)]="searchQuery"
            class="w-full bg-surface-container-highest rounded-xl py-2.5 pl-10 pr-4
                   transition-all duration-200 text-sm font-medium outline-none
                   focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            placeholder="Search schools..."
          />
        </div>

        <select
          [(ngModel)]="stateFilter"
          class="bg-surface-container-highest rounded-xl py-2.5 px-4 text-sm font-medium outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="">All States</option>
          <option value="Lagos">Lagos</option>
          <option value="Ogun">Ogun</option>
          <option value="Oyo">Oyo</option>
          <option value="Abuja">Abuja</option>
        </select>

        <select
          [(ngModel)]="statusFilter"
          class="bg-surface-container-highest rounded-xl py-2.5 px-4 text-sm font-medium outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <!-- Skeletons while loading -->
      @if (schoolsQuery.isPending()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1, 2, 3]; track i) {
            <div
              class="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_12px_rgba(25,28,29,0.06)] animate-pulse"
            >
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="w-12 h-12 rounded-xl bg-surface-container-highest"
                ></div>
                <div class="space-y-2 flex-1">
                  <div
                    class="h-4 bg-surface-container-highest rounded w-3/4"
                  ></div>
                  <div
                    class="h-3 bg-surface-container-highest rounded w-1/2"
                  ></div>
                </div>
              </div>
              <div class="space-y-3 mb-4">
                <div class="h-4 bg-surface-container-highest rounded"></div>
                <div class="h-4 bg-surface-container-highest rounded"></div>
                <div class="h-4 bg-surface-container-highest rounded"></div>
              </div>
              <div class="h-8 bg-surface-container-highest rounded mb-4"></div>
              <div class="flex gap-2">
                <div
                  class="h-8 bg-surface-container-highest rounded flex-1"
                ></div>
                <div
                  class="h-8 bg-surface-container-highest rounded w-20"
                ></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Schools Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (school of filteredSchools(); track school.id; let i = $index) {
            <div
              class="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_12px_rgba(25,28,29,0.06)] animate-stagger-in opacity-0"
              [style.animation-delay]="i * 80 + 'ms'"
              [style.animation-fill-mode]="'forwards'"
            >
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <img
                    [src]="school.logoUrl"
                    [alt]="school.name + ' logo'"
                    class="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow-sm"
                    onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent(this.alt) + '&background=random&color=fff&size=120'"
                  />
                  <div class="min-w-0">
                    <h3 class="text-sm font-bold text-on-surface truncate">
                      {{ school.name }}
                    </h3>
                    <p class="text-xs text-on-surface-variant">
                      {{ school.state }}
                    </p>
                  </div>
                </div>
                <app-status-chip [status]="school.status"></app-status-chip>
              </div>

              <div class="space-y-2 mb-4">
                <div
                  class="flex items-center justify-between py-2 border-b border-surface-container"
                >
                  <span class="text-sm text-on-surface-variant">Students</span>
                  <span class="text-sm font-semibold text-on-surface">{{
                    school.studentCount | number: "1.0-0" : "en-NG"
                  }}</span>
                </div>
                <div
                  class="flex items-center justify-between py-2 border-b border-surface-container"
                >
                  <span class="text-sm text-on-surface-variant"
                    >Active Loans</span
                  >
                  <span class="text-sm font-semibold text-on-surface">{{
                    school.activeLoans
                  }}</span>
                </div>
                <div class="flex items-center justify-between py-2">
                  <span class="text-sm text-on-surface-variant"
                    >Total Disbursed</span
                  >
                  <span class="text-sm font-semibold text-on-surface">
                    <span class="text-on-surface-variant">₦</span
                    >{{ school.totalDisbursed | number: "1.0-0" : "en-NG" }}
                  </span>
                </div>
              </div>

              <!-- API Token -->
              <div class="bg-surface-container rounded-lg p-3 mb-4">
                <p class="text-xs text-on-surface-variant mb-1">API Token</p>
                <div class="flex items-center gap-2">
                  <code
                    class="text-xs font-mono text-on-surface flex-1 truncate"
                    >{{ maskToken(school.apiToken) }}</code
                  >
                  <button
                    [disabled]="regenerateTokenMutation.isPending()"
                    (click)="regenerateToken(school)"
                    class="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50"
                    title="Regenerate Token"
                  >
                    <span
                      class="material-symbols-outlined text-sm text-on-surface-variant"
                      >refresh</span
                    >
                  </button>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  (click)="viewSchool(school)"
                  class="flex-1 py-2 bg-surface-container text-on-surface rounded-xl font-bold text-xs transition-all hover:bg-surface-container-high"
                >
                  View Details
                </button>
                <button
                  [disabled]="toggleStatusMutation.isPending()"
                  (click)="toggleStatus(school)"
                  class="px-3 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                  [class]="
                    school.status === 'ACTIVE'
                      ? 'bg-error-container text-on-error-container hover:bg-error hover:text-on-error'
                      : 'bg-tertiary text-on-tertiary hover:brightness-110'
                  "
                >
                  {{ school.status === "ACTIVE" ? "Deactivate" : "Activate" }}
                </button>
              </div>
            </div>
          }

          @if (filteredSchools().length === 0) {
            <div
              class="md:col-span-2 lg:col-span-3 text-center py-12 bg-surface-container-lowest rounded-xl w-full"
            >
              <span
                class="material-symbols-outlined text-4xl text-surface-variant"
                >school_off</span
              >
              <p class="text-sm text-on-surface-variant mt-2">
                No schools found
              </p>
            </div>
          }
        </div>
      }
    </div>

    <!-- Add School Modal -->
    @if (showAddSchool) {
      <div
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div
          class="absolute inset-0 bg-inverse-surface/30 backdrop-blur-md"
          tabindex="0"
          (click)="showAddSchool = false"
          (keydown.enter)="showAddSchool = false"
        ></div>
        <div
          class="relative bg-surface-container-lowest rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md shadow-[0_32px_64px_rgba(25,28,29,0.12)] animate-modal-scale-in max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-on-surface">Add New School</h2>
            <button
              (click)="showAddSchool = false"
              class="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <span class="material-symbols-outlined text-on-surface-variant"
                >close</span
              >
            </button>
          </div>
          <form (ngSubmit)="addSchool()" class="space-y-4">
            <input
              type="text"
              [(ngModel)]="newSchool.name"
              name="name"
              placeholder="School Name"
              class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
              required
            />
            <input
              type="email"
              [(ngModel)]="newSchool.email"
              name="email"
              placeholder="Email Address"
              class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
              required
            />
            <input
              type="tel"
              [(ngModel)]="newSchool.phone"
              name="phone"
              placeholder="Phone Number"
              class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              [(ngModel)]="newSchool.state"
              name="state"
              placeholder="State"
              class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              [(ngModel)]="newSchool.address"
              name="address"
              placeholder="Address"
              rows="3"
              class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 resize-none"
            ></textarea>
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                (click)="showAddSchool = false"
                class="flex-1 py-2.5 bg-surface-container text-on-surface rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                solexRipple
                type="submit"
                [disabled]="addSchoolMutation.isPending()"
                class="flex-1 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm disabled:opacity-50"
              >
                Add School
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class SchoolsPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  searchQuery = "";
  stateFilter = "";
  statusFilter = "";
  showAddSchool = false;

  newSchool = {
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
  };

  schoolsQuery = injectQuery(() => ({
    queryKey: ["schools"],
    queryFn: () => lastValueFrom(this.adminService.getSchools()),
  }));

  regenerateTokenMutation = injectMutation(() => ({
    mutationFn: (schoolId: string) =>
      lastValueFrom(this.adminService.regenerateSchoolToken(schoolId)),
    onSuccess: () => {
      this.toast.show("success", `API token regenerated successfully`);
      this.queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: () => this.toast.show("error", "Failed to regenerate token"),
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
      this.queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: () => this.toast.show("error", "Failed to update school status"),
  }));

  addSchoolMutation = injectMutation(() => ({
    mutationFn: (school: Parameters<AdminService["addSchool"]>[0]) =>
      lastValueFrom(this.adminService.addSchool(school)),
    onSuccess: (data: School) => {
      this.toast.show("success", `${data.name || "School"} added successfully`);
      this.showAddSchool = false;
      this.newSchool = {
        name: "",
        email: "",
        phone: "",
        address: "",
        state: "",
      };
      this.queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: () => this.toast.show("error", "Failed to add school"),
  }));

  schools = computed<School[]>(() => {
    const response = this.schoolsQuery.data();
    return response || [];
  });

  filteredSchools = computed(() => {
    let result = this.schools();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.state.toLowerCase().includes(query),
      );
    }

    if (this.stateFilter) {
      result = result.filter((s) => s.state === this.stateFilter);
    }

    if (this.statusFilter) {
      result = result.filter((s) => s.status === this.statusFilter);
    }

    return result;
  });

  totalStudents = computed(() =>
    this.schools().reduce((sum, s) => sum + s.studentCount, 0),
  );
  totalActiveLoans = computed(() =>
    this.schools().reduce((sum, s) => sum + s.activeLoans, 0),
  );
  totalDisbursed = computed(() =>
    this.schools().reduce((sum, s) => sum + s.totalDisbursed, 0),
  );

  maskToken(token: string): string {
    if (token.length <= 12) return token;
    return token.slice(0, 8) + "..." + token.slice(-4);
  }

  regenerateToken(school: School) {
    this.regenerateTokenMutation.mutate(school.id);
  }

  toggleStatus(school: School) {
    const newStatus = school.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    this.toggleStatusMutation.mutate({ id: school.id, status: newStatus });
  }

  viewSchool(school: School) {
    this.toast.show("info", `Viewing details for ${school.name}`);
  }

  addSchool() {
    if (!this.newSchool.name || !this.newSchool.email) {
      this.toast.show("error", "Please fill in required fields");
      return;
    }
    this.addSchoolMutation.mutate(this.newSchool);
  }
}
