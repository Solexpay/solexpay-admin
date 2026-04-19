import { Component, inject, signal, computed, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { injectQuery, keepPreviousData } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { StatusChipComponent } from '../../components/ui/status-chip.component';

interface Transaction {
  id: string;
  type: 'WALLET_FUNDING' | 'LOAN_DISBURSEMENT' | 'NIP_TRANSFER' | 'LOAN_REPAYMENT' | 'BILL_PAYMENT' | 'P2P_TRANSFER';
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  senderName: string;
  recipientName: string;
  description: string;
  createdAt: string;
  reference: string;
}

const MOCK_TRANSACTIONS: Transaction[] = isDevMode() ? [
  { id: 'TXN-001', type: 'WALLET_FUNDING', amount: 50000, status: 'SUCCESS', senderName: 'GTBank', recipientName: 'John Doe', description: 'Wallet funding via bank transfer', createdAt: new Date(Date.now() - 3600000).toISOString(), reference: 'WAL-20240418001' },
  { id: 'TXN-002', type: 'LOAN_DISBURSEMENT', amount: 150000, status: 'SUCCESS', senderName: 'SolexPay', recipientName: 'Jane Smith', description: 'Loan disbursement - Education', createdAt: new Date(Date.now() - 7200000).toISOString(), reference: 'LOAN-20240418002' },
  { id: 'TXN-003', type: 'NIP_TRANSFER', amount: 25000, status: 'PENDING', senderName: 'Mike Johnson', recipientName: 'UBA Account', description: 'Interbank transfer', createdAt: new Date(Date.now() - 10800000).toISOString(), reference: 'NIP-20240418003' },
  { id: 'TXN-004', type: 'LOAN_REPAYMENT', amount: 12500, status: 'SUCCESS', senderName: 'Sarah Williams', recipientName: 'SolexPay', description: 'Monthly loan repayment', createdAt: new Date(Date.now() - 86400000).toISOString(), reference: 'REP-20240417004' },
  { id: 'TXN-005', type: 'BILL_PAYMENT', amount: 5000, status: 'FAILED', senderName: 'Tom Brown', recipientName: 'PHCN', description: 'Electricity bill payment', createdAt: new Date(Date.now() - 172800000).toISOString(), reference: 'BILL-20240416005' },
] : [];

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusChipComponent],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-on-surface">Transaction Ledger</h1>
          <p class="text-sm text-on-surface-variant mt-1">View and search all system transactions</p>
        </div>
        <button class="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm transition-all hover:brightness-110 flex items-center justify-center gap-2 sm:w-auto w-full">
          <span class="material-symbols-outlined text-sm">download</span>
          Export
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-surface-container-lowest rounded-xl p-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 shadow-[0_2px_12px_rgba(25,28,29,0.06)]">
        <div class="flex-1 min-w-[200px] relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            class="w-full bg-surface-container-highest rounded-xl py-2.5 pl-10 pr-4
                   transition-all duration-200 text-sm font-medium outline-none
                   focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            placeholder="Search by reference, user, or description...">
        </div>

        <select [(ngModel)]="typeFilter" class="bg-surface-container-highest rounded-xl py-2.5 px-4 text-sm font-medium outline-none cursor-pointer w-full sm:w-auto">
          <option value="">All Types</option>
          <option value="WALLET_FUNDING">Wallet Funding</option>
          <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
          <option value="NIP_TRANSFER">Bank Transfer</option>
          <option value="LOAN_REPAYMENT">Loan Repayment</option>
          <option value="BILL_PAYMENT">Bill Payment</option>
        </select>

        <select [(ngModel)]="statusFilter" class="bg-surface-container-highest rounded-xl py-2.5 px-4 text-sm font-medium outline-none cursor-pointer w-full sm:w-auto">
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>

        <input
          type="date"
          [ngModel]="dateFrom()"
          (ngModelChange)="dateFrom.set($event)"
          class="bg-surface-container-highest rounded-xl py-2.5 px-4 text-sm font-medium outline-none w-full sm:w-auto">
      </div>

      <!-- Volume Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)]">
          <p class="text-xs text-on-surface-variant uppercase">Total Volume (24h)</p>
          <p class="text-xl font-bold text-on-surface mt-1">
            <span class="text-lg opacity-50">₦</span>{{ volume24h() | number:'1.0-0':'en-NG' }}
          </p>
        </div>
        <div class="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)]">
          <p class="text-xs text-on-surface-variant uppercase">Successful Transactions</p>
          <p class="text-xl font-bold text-on-surface mt-1">{{ successCount() }}</p>
        </div>
        <div class="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)]">
          <p class="text-xs text-on-surface-variant uppercase">Failed Transactions</p>
          <p class="text-xl font-bold text-error mt-1">{{ failedCount() }}</p>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-surface-container-lowest rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px]">
            <thead>
              <tr class="bg-surface-container text-left">
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Reference</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Type</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">From/To</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Amount</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (n of [1,2,3,4,5]; track n; let i = $index) {
                  <tr class="border-t border-surface-container">
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-32 bg-surface-container-high rounded-full animate-skeleton-pulse"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-28 bg-surface-container-high rounded-full animate-skeleton-pulse" [style.animation-delay]="100 + 'ms'"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-36 bg-surface-container-high rounded-full animate-skeleton-pulse" [style.animation-delay]="200 + 'ms'"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-20 bg-surface-container-high rounded-full animate-skeleton-pulse" [style.animation-delay]="300 + 'ms'"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-16 bg-surface-container-high rounded-full animate-skeleton-pulse" [style.animation-delay]="400 + 'ms'"></div></td>
                    <td class="px-4 sm:px-6 py-4"><div class="h-4 w-24 bg-surface-container-high rounded-full animate-skeleton-pulse" [style.animation-delay]="500 + 'ms'"></div></td>
                  </tr>
                }
              } @else {
                @for (tx of filteredTransactions(); track tx.id; let i = $index) {
                  <tr class="border-t border-surface-container hover:bg-surface-container-low transition-colors duration-150 animate-stagger-in opacity-0"
                      [style.animation-delay]="i * 40 + 'ms'"
                      [style.animation-fill-mode]="'forwards'">
                    <td class="px-4 sm:px-6 py-4">
                      <p class="text-sm font-mono text-on-surface truncate max-w-[120px]">{{ tx.reference }}</p>
                      <p class="text-xs text-on-surface-variant truncate max-w-[150px]">{{ tx.description }}</p>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm shrink-0" [class]="getTypeColor(tx.type)">
                          {{ getTypeIcon(tx.type) }}
                        </span>
                        <span class="text-sm text-on-surface">{{ formatType(tx.type) }}</span>
                      </div>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <p class="text-sm text-on-surface truncate max-w-[120px]">{{ tx.senderName }}</p>
                      <p class="text-xs text-on-surface-variant truncate max-w-[120px]">→ {{ tx.recipientName }}</p>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <p class="text-sm font-bold text-on-surface whitespace-nowrap">
                        <span class="text-on-surface-variant">₦</span>{{ tx.amount | number:'1.0-0':'en-NG' }}
                      </p>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <app-status-chip [status]="tx.status"></app-status-chip>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <p class="text-sm text-on-surface whitespace-nowrap">{{ tx.createdAt | date:'short' }}</p>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        @if (!loading() && filteredTransactions().length === 0) {
          <div class="text-center py-12">
            <span class="material-symbols-outlined text-4xl text-surface-variant">receipt_long_off</span>
            <p class="text-sm text-on-surface-variant mt-2">No transactions found</p>
          </div>
        }
      </div>
    </div>
  `
})
export class TransactionsPageComponent {
  private adminService = inject(AdminService);

  // Date range triggers server refetch; other filters are client-side
  dateFrom = signal('');

  searchQuery = '';
  typeFilter = '';
  statusFilter = '';

  transactionsQuery = injectQuery(() => ({
    queryKey: ['transactions', { from: this.dateFrom() }],
    queryFn: () => lastValueFrom(
      this.adminService.getTransactions(0, 100, this.dateFrom() || undefined)
    ),
    placeholderData: keepPreviousData,
  }));

  loading = computed(() => this.transactionsQuery.isPending());

  transactions = computed<Transaction[]>(() => {
    const response = this.transactionsQuery.data();
    if (response?.data?.content) return response.data.content;
    if (response?.data && Array.isArray(response.data)) return response.data;
    return MOCK_TRANSACTIONS;
  });

  filteredTransactions = computed(() => {
    let result = this.transactions();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(t =>
        t.reference.toLowerCase().includes(query) ||
        t.senderName.toLowerCase().includes(query) ||
        t.recipientName.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    if (this.typeFilter) result = result.filter(t => t.type === this.typeFilter);
    if (this.statusFilter) result = result.filter(t => t.status === this.statusFilter);

    return result;
  });

  volume24h = computed(() =>
    this.transactions()
      .filter(t => t.status === 'SUCCESS' && new Date(t.createdAt) > new Date(Date.now() - 86400000))
      .reduce((sum, t) => sum + t.amount, 0)
  );

  successCount = computed(() =>
    this.transactions().filter(t => t.status === 'SUCCESS' && new Date(t.createdAt) > new Date(Date.now() - 86400000)).length
  );

  failedCount = computed(() =>
    this.transactions().filter(t => t.status === 'FAILED' && new Date(t.createdAt) > new Date(Date.now() - 86400000)).length
  );

  formatType(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'WALLET_FUNDING': 'add_circle',
      'LOAN_DISBURSEMENT': 'payments',
      'NIP_TRANSFER': 'send_money',
      'LOAN_REPAYMENT': 'account_balance',
      'BILL_PAYMENT': 'receipt',
      'P2P_TRANSFER': 'swap_horiz',
    };
    return icons[type] || 'payment';
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'WALLET_FUNDING': 'text-tertiary',
      'LOAN_DISBURSEMENT': 'text-primary',
      'NIP_TRANSFER': 'text-secondary',
      'LOAN_REPAYMENT': 'text-primary',
      'BILL_PAYMENT': 'text-on-surface-variant',
      'P2P_TRANSFER': 'text-secondary',
    };
    return colors[type] || 'text-on-surface-variant';
  }
}
