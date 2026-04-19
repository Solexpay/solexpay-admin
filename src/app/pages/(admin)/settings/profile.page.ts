import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-xl sm:text-2xl font-bold text-on-surface">Profile Settings</h1>
      
      <div class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)]">
        <h2 class="text-base sm:text-lg font-bold text-on-surface mb-4">Account Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-on-surface-variant mb-1">First Name</label>
            <input type="text" value="Admin" class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all">
          </div>
          <div>
            <label class="block text-sm text-on-surface-variant mb-1">Last Name</label>
            <input type="text" value="User" class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all">
          </div>
          <div>
            <label class="block text-sm text-on-surface-variant mb-1">Email</label>
            <input type="email" value="admin@solexpay.com" class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all">
          </div>
          <div>
            <label class="block text-sm text-on-surface-variant mb-1">Phone</label>
            <input type="tel" value="+2348012345678" class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all">
          </div>
        </div>
        <button class="mt-6 w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm transition-all hover:brightness-110">
          Save Changes
        </button>
      </div>

      <div class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)]">
        <h2 class="text-base sm:text-lg font-bold text-on-surface mb-4">Security</h2>
        <div class="flex flex-col sm:flex-row gap-3">
          <button class="w-full sm:w-auto px-6 py-2.5 bg-surface-container text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors">
            Change Password
          </button>
          <button class="w-full sm:w-auto px-6 py-2.5 bg-surface-container text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfilePageComponent {}
