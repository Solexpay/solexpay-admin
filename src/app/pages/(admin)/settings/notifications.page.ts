import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-xl sm:text-2xl font-bold text-on-surface">Notification Preferences</h1>
      
      <div class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)]">
        <h2 class="text-base sm:text-lg font-bold text-on-surface mb-4">Email Notifications</h2>
        <div class="space-y-3">
          <label class="flex items-start sm:items-center justify-between gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-on-surface">New User Registrations</p>
              <p class="text-xs text-on-surface-variant">Get notified when new users sign up</p>
            </div>
            <input type="checkbox" checked class="w-5 h-5 shrink-0 rounded border-outline text-primary focus:ring-primary">
          </label>
          
          <label class="flex items-start sm:items-center justify-between gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-on-surface">Loan Applications</p>
              <p class="text-xs text-on-surface-variant">Get notified of new loan applications</p>
            </div>
            <input type="checkbox" checked class="w-5 h-5 shrink-0 rounded border-outline text-primary focus:ring-primary">
          </label>
          
          <label class="flex items-start sm:items-center justify-between gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-on-surface">KYC Submissions</p>
              <p class="text-xs text-on-surface-variant">Get notified of pending KYC verifications</p>
            </div>
            <input type="checkbox" checked class="w-5 h-5 shrink-0 rounded border-outline text-primary focus:ring-primary">
          </label>
          
          <label class="flex items-start sm:items-center justify-between gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-on-surface">System Alerts</p>
              <p class="text-xs text-on-surface-variant">Get notified of system errors and warnings</p>
            </div>
            <input type="checkbox" class="w-5 h-5 shrink-0 rounded border-outline text-primary focus:ring-primary">
          </label>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)]">
        <h2 class="text-base sm:text-lg font-bold text-on-surface mb-4">Push Notifications</h2>
        <div class="space-y-3">
          <label class="flex items-start sm:items-center justify-between gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-on-surface">Browser Notifications</p>
              <p class="text-xs text-on-surface-variant">Show browser push notifications</p>
            </div>
            <input type="checkbox" checked class="w-5 h-5 shrink-0 rounded border-outline text-primary focus:ring-primary">
          </label>
        </div>
      </div>

      <button 
        (click)="savePreferences()"
        class="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm transition-all hover:brightness-110">
        Save Preferences
      </button>
    </div>
  `
})
export class NotificationsPageComponent {
  private toast = inject(ToastService);

  savePreferences() {
    this.toast.show('success', 'Notification preferences saved');
  }
}
