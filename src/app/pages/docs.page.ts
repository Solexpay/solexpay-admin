import { Component, signal, AfterViewInit, OnDestroy, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { API_SECTIONS, ApiSection } from './docs.data';
import { CopyToClipboardDirective, TooltipDirective } from '../directives';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule, RouterLink, CopyToClipboardDirective, TooltipDirective],
  templateUrl: './docs.page.html'
})
export class DocsPageComponent implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  
  sections: ApiSection[] = API_SECTIONS;
  expanded = signal<Set<string>>(new Set());
  activeSectionId = signal<string>('getting-started');

  private observer: IntersectionObserver | null = null;

  schemas = [
    { name: 'ProfileDto', description: 'User profile details and contact information' },
    { name: 'WalletBalanceResponse', description: 'Current wallet state, account number and balances' },
    { name: 'KycStatusResponse', description: 'Full record of KYC verification including tier levels' },
    { name: 'KycVerifyResponse', description: 'Response from BVN/NIN submission' },
    { name: 'TransactionResponse', description: 'Individual transaction record with reference and status' },
    { name: 'LedgerEntryResponse', description: 'Double-entry ledger line for financial reconciliation' },
    { name: 'LoanApplicationResponse', description: 'Full loan application data with all lifecycle timestamps' },
    { name: 'LoanApplication', description: 'Raw loan entity used in school portal verifications' },
    { name: 'LoanSummaryDto', description: 'Summarized loan record for admin and list views' },
    { name: 'LoanRepaymentScheduleResponse', description: 'Individual installment line in a repayment schedule' },
    { name: 'InstallmentDto', description: 'Amortization schedule line item' },
    { name: 'OutstandingBalanceDto', description: 'Breakdown of outstanding principal, interest and penalties' },
    { name: 'RepaymentResponse', description: 'Receipt and allocation details for a loan repayment' },
    { name: 'SavingsAccountResponse', description: 'Current state of a savings account including accrued interest' },
    { name: 'SavingsInterestAccrualResponse', description: 'Record of daily interest accrual and compounding' },
    { name: 'BillPaymentResponse', description: 'Receipt for bill/VTU payment with provider reference' },
    { name: 'DataVariationResponse', description: 'Available data bundle option for a mobile provider' },
    { name: 'TransferReceiptResponse', description: 'Receipt for a successful P2P or NIP transfer' },
    { name: 'NipTransferResponse', description: 'Detailed status and metadata for interbank transfers' },
    { name: 'InitiateNipResponse', description: 'Result of a NIP transfer initiation' },
    { name: 'NameEnquiryResponseDto', description: 'Bank account name lookup and session ID result' },
    { name: 'FeeEstimateResponse', description: 'Breakdown of transfer fees and total deductions' },
    { name: 'BankInfo', description: 'Bank name, code and short name for NIP transfers' },
    { name: 'Notification', description: 'Full notification entity with channel and delivery status' },
    { name: 'UserSummaryDto', description: 'Summarized user record for admin search and lists' },
    { name: 'SchoolDashboardDto', description: 'KPIs and metrics for the school portal dashboard' },
    { name: 'StudentLoanSummaryDto', description: 'Student loan history summary for schools' },
    { name: 'DashboardMetricsDto', description: 'System-wide performance metrics for admin dashboard' },
    { name: 'SendOtpResponse', description: 'Confirmation of OTP dispatch with reference and expiry' }
  ];

  ngAfterViewInit() {
    this.setupScrollSpy();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupScrollSpy() {
    const options = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.activeSectionId.set(entry.target.id);
        }
      });
    }, options);

    // Observe all sections including the new Getting Started one
    const sectionElements = this.el.nativeElement.querySelectorAll('section[id]');
    sectionElements.forEach((section: HTMLElement) => {
      this.observer?.observe(section);
    });
  }

  isExpanded(id: string): boolean {
    return this.expanded().has(id);
  }

  toggle(id: string): void {
    const s = new Set(this.expanded());
    if (s.has(id)) s.delete(id);
    else s.add(id);
    this.expanded.set(s);
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    // Manually set active for better immediate feedback
    this.activeSectionId.set(sectionId);
  }

  methodBadge(method: string): string {
    const map: Record<string, string> = {
      GET:    'bg-tertiary/10 text-tertiary border-tertiary/20',
      POST:   'bg-primary/10 text-primary border-primary/20',
      PUT:    'bg-amber-100 text-amber-800 border-amber-200',
      PATCH:  'bg-amber-100 text-amber-800 border-amber-200',
      DELETE: 'bg-error/10 text-error border-error/20',
    };
    const color = map[method] ?? 'bg-surface-container text-on-surface-variant border-outline-variant';
    return `inline-flex items-center font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border uppercase ${color}`;
  }
}
