import { Component, inject, signal, computed, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
  keepPreviousData,
} from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';
import { StatusChipComponent } from '../../components/ui/status-chip.component';
import { RippleDirective } from '../../directives/ripple.directive';
import { HoverScaleDirective } from '../../directives/hover-scale.directive';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { CopyToClipboardDirective } from '../../directives/copy-to-clipboard.directive';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { MagneticDirective } from '../../directives/magnetic.directive';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  kycStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  createdAt: string;
  walletBalance: number;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusChipComponent, RippleDirective, FormsModule, HoverScaleDirective, TooltipDirective, CopyToClipboardDirective, ScrollRevealDirective, MagneticDirective],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-on-surface">Users</h1>
          <p class="text-sm text-on-surface-variant mt-1">Manage user accounts and KYC status</p>
        </div>
        <div class="flex items-center gap-3">
          <button solexRipple 
                  magnetic
                  class="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm transition-all hover:brightness-110 w-full sm:w-auto">
            <span class="flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-sm">download</span>
              Export
            </span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-surface-container-lowest rounded-xl p-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 shadow-[0_2px_12px_rgba(25,28,29,0.06)]">
        <div class="flex-1 min-w-[200px] relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearch($event)"
            class="w-full bg-surface-container-highest rounded-xl py-2.5 pl-10 pr-4
                   transition-all duration-200 text-sm font-medium outline-none
                   focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            placeholder="Search by name, email, phone...">
        </div>

        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusChange($event)"
          class="bg-surface-container-highest rounded-xl py-2.5 px-4 text-sm font-medium outline-none
                 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 cursor-pointer w-full sm:w-auto">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING">Pending</option>
        </select>

        <select
          [ngModel]="kycFilter()"
          (ngModelChange)="kycFilter.set($event)"
          class="bg-surface-container-highest rounded-xl py-2.5 px-4 text-sm font-medium outline-none
                 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 cursor-pointer w-full sm:w-auto">
          <option value="">All KYC</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="UNVERIFIED">Unverified</option>
        </select>
      </div>

      <!-- Users Table -->
      <div class="bg-surface-container-lowest rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px]">
            <thead>
              <tr class="bg-surface-container text-left">
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">User</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Contact</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">KYC</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Balance</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Joined</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (n of [1,2,3,4,5]; track n; let i = $index) {
                  <tr class="border-t border-surface-container">
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-32 bg-surface-container-high rounded-full skeleton-peak" [style.animation-delay]="150 + 'ms'"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-40 bg-surface-container-high rounded-full skeleton-peak" [style.animation-delay]="300 + 'ms'"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-16 bg-surface-container-high rounded-full skeleton-peak" [style.animation-delay]="450 + 'ms'"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-16 bg-surface-container-high rounded-full skeleton-peak" [style.animation-delay]="600 + 'ms'"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-20 bg-surface-container-high rounded-full skeleton-peak" [style.animation-delay]="750 + 'ms'"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-24 bg-surface-container-high rounded-full skeleton-peak" [style.animation-delay]="900 + 'ms'"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-8 bg-surface-container-high rounded-full ml-auto skeleton-peak" [style.animation-delay]="1050 + 'ms'"></div></td>
                  </tr>
                }
              } @else {
                @for (user of filteredUsers(); track user.id; let i = $index) {
                  <tr class="border-t border-surface-container hover:bg-surface-container-low transition-colors duration-150 animate-stagger-in opacity-0"
                      scrollReveal
                      [style.animation-delay]="i * 40 + 'ms'"
                      [style.animation-fill-mode]="'forwards'">
                    <td class="px-4 sm:px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                          <span class="text-sm font-bold text-primary">{{ user.firstName[0] }}{{ user.lastName[0] }}</span>
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-on-surface truncate">{{ user.firstName }} {{ user.lastName }}</p>
                          <p class="text-xs text-on-surface-variant cursor-pointer hover:text-primary transition-colors truncate"
                             copyToClipboard
                             tooltip="Click to copy user ID"
                             tooltipPosition="bottom">ID: {{ user.id }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <p class="text-sm text-on-surface cursor-pointer hover:text-primary transition-colors truncate max-w-[150px]"
                         copyToClipboard
                         tooltip="Click to copy email"
                         tooltipPosition="bottom">{{ user.email }}</p>
                      <p class="text-xs text-on-surface-variant cursor-pointer hover:text-primary transition-colors"
                         copyToClipboard
                         tooltip="Click to copy phone"
                         tooltipPosition="bottom">{{ user.phone }}</p>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <app-status-chip [status]="user.status"></app-status-chip>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <app-status-chip [status]="user.kycStatus"></app-status-chip>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <span class="text-sm font-semibold text-on-surface whitespace-nowrap">
                        <span class="text-on-surface-variant">₦</span>{{ user.walletBalance | number:'1.0-0':'en-NG' }}
                      </span>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <span class="text-sm text-on-surface-variant whitespace-nowrap">{{ user.createdAt | date:'mediumDate' }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          (click)="viewUser(user)"
                          class="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                          tooltip="View user details"
                          tooltipPosition="left">
                          <span class="material-symbols-outlined text-on-surface-variant text-sm">visibility</span>
                        </button>
                        @if (user.status === 'ACTIVE') {
                          <button
                            (click)="suspendMutation.mutate({ userId: user.id, userName: user.firstName + ' ' + user.lastName })"
                            [disabled]="suspendMutation.isPending()"
                            class="p-2 rounded-lg hover:bg-error-container transition-colors disabled:opacity-50"
                            tooltip="Suspend user account"
                            tooltipPosition="left">
                            <span class="material-symbols-outlined text-error text-sm">block</span>
                          </button>
                        } @else {
                          <button
                            (click)="reactivateMutation.mutate({ userId: user.id, userName: user.firstName + ' ' + user.lastName })"
                            [disabled]="reactivateMutation.isPending()"
                            class="p-2 rounded-lg hover:bg-tertiary-fixed transition-colors disabled:opacity-50"
                            tooltip="Reactivate user account"
                            tooltipPosition="left">
                            <span class="material-symbols-outlined text-tertiary text-sm">check_circle</span>
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

        @if (!loading() && filteredUsers().length === 0) {
          <div class="text-center py-12">
            <span class="material-symbols-outlined text-4xl text-surface-variant">search_off</span>
            <p class="text-sm text-on-surface-variant mt-2">No users found matching your criteria</p>
          </div>
        }
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-sm text-on-surface-variant">
          Showing {{ filteredUsers().length }} of {{ totalUsers() }} users
        </p>
        <div class="flex items-center gap-2">
          <button
            [disabled]="currentPage() === 0"
            (click)="prevPage()"
            class="px-3 py-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container disabled:opacity-50 transition-colors">
            <span class="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span class="text-sm text-on-surface px-2 whitespace-nowrap">Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
          <button
            [disabled]="currentPage() >= totalPages() - 1"
            (click)="nextPage()"
            class="px-3 py-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container disabled:opacity-50 transition-colors">
            <span class="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class UsersPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  readonly pageSize = 20;
  currentPage = signal(0);
  searchQuery = signal('');
  statusFilter = signal('');
  kycFilter = signal('');

  usersQuery = injectQuery(() => ({
    queryKey: ['users', { page: this.currentPage(), size: this.pageSize, search: this.searchQuery(), status: this.statusFilter() }],
    queryFn: () => lastValueFrom(
      this.adminService.getUsers(
        this.currentPage(),
        this.pageSize,
        this.searchQuery() || undefined,
        this.statusFilter() || undefined,
      )
    ),
    placeholderData: keepPreviousData,
  }));

  suspendMutation = injectMutation(() => ({
    mutationFn: ({ userId }: { userId: string; userName: string }) =>
      lastValueFrom(this.adminService.suspendUser(userId)),
    onSuccess: (_, { userName }) => {
      this.toast.show('success', `${userName} suspended`);
      this.queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => this.toast.show('error', 'Failed to suspend user'),
  }));

  reactivateMutation = injectMutation(() => ({
    mutationFn: ({ userId }: { userId: string; userName: string }) =>
      lastValueFrom(this.adminService.reactivateUser(userId)),
    onSuccess: (_, { userName }) => {
      this.toast.show('success', `${userName} reactivated`);
      this.queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => this.toast.show('error', 'Failed to reactivate user'),
  }));

  loading = computed(() => this.usersQuery.isPending());

  users = computed<User[]>(() => {
    const response = this.usersQuery.data();
    if (response?.data?.content) {
      return response.data.content.map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phoneNumber || 'N/A',
        status: u.status || 'ACTIVE',
        kycStatus: u.kycTier === 'TIER_2' ? 'VERIFIED' : u.kycTier === 'TIER_1' ? 'PENDING' : 'UNVERIFIED',
        createdAt: u.createdAt,
        walletBalance: 0,
      }));
    }
    if (!isDevMode()) return [];
    return [
      { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+2348012345678', status: 'ACTIVE' as const, kycStatus: 'VERIFIED' as const, createdAt: '2024-01-15', walletBalance: 125000 },
      { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '+2348098765432', status: 'ACTIVE' as const, kycStatus: 'VERIFIED' as const, createdAt: '2024-02-20', walletBalance: 89000 },
      { id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com', phone: '+2348055512345', status: 'SUSPENDED' as const, kycStatus: 'PENDING' as const, createdAt: '2024-03-10', walletBalance: 0 },
      { id: '4', firstName: 'Sarah', lastName: 'Williams', email: 'sarah@example.com', phone: '+2348077723456', status: 'ACTIVE' as const, kycStatus: 'UNVERIFIED' as const, createdAt: '2024-04-05', walletBalance: 45000 },
      { id: '5', firstName: 'Tom', lastName: 'Brown', email: 'tom@example.com', phone: '+2348033323456', status: 'PENDING' as const, kycStatus: 'PENDING' as const, createdAt: '2024-04-18', walletBalance: 0 },
    ];
  });

  filteredUsers = computed(() => {
    const kyc = this.kycFilter();
    if (!kyc) return this.users();
    return this.users().filter(u => u.kycStatus === kyc);
  });

  totalUsers = computed(() => this.usersQuery.data()?.data?.totalElements ?? this.users().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalUsers() / this.pageSize)));

  onSearch(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(0);
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value);
    this.currentPage.set(0);
  }

  prevPage() { this.currentPage.update(p => Math.max(0, p - 1)); }
  nextPage() { this.currentPage.update(p => p + 1); }

  viewUser(user: User) {
    this.toast.show('info', `Viewing user: ${user.firstName} ${user.lastName}`);
  }
}
