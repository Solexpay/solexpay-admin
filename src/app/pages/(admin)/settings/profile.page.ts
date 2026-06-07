import { Component, inject, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { AdminService, Profile } from "../../../services/admin.service";
import { ToastService } from "../../../services/toast.service";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-xl sm:text-2xl font-bold text-on-surface">
        Profile Settings
      </h1>

      <div
        class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
      >
        <h2 class="text-base sm:text-lg font-bold text-on-surface mb-4">
          Account Information
        </h2>

        @if (profileQuery.isPending()) {
          <div class="space-y-4 animate-pulse">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="h-12 bg-surface-container-highest rounded-xl"></div>
              <div class="h-12 bg-surface-container-highest rounded-xl"></div>
              <div class="h-12 bg-surface-container-highest rounded-xl"></div>
              <div class="h-12 bg-surface-container-highest rounded-xl"></div>
            </div>
            <div
              class="h-10 bg-surface-container-highest rounded-xl w-32"
            ></div>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="firstName"
                class="block text-sm text-on-surface-variant mb-1"
                >First Name</label
              >
              <input
                id="firstName"
                type="text"
                [ngModel]="firstName()"
                (ngModelChange)="firstName.set($event)"
                class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label
                for="lastName"
                class="block text-sm text-on-surface-variant mb-1"
                >Last Name</label
              >
              <input
                id="lastName"
                type="text"
                [ngModel]="lastName()"
                (ngModelChange)="lastName.set($event)"
                class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label
                for="email"
                class="block text-sm text-on-surface-variant mb-1"
                >Email</label
              >
              <input
                id="email"
                type="email"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
                class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label
                for="phone"
                class="block text-sm text-on-surface-variant mb-1"
                >Phone</label
              >
              <input
                id="phone"
                type="tel"
                [ngModel]="phone()"
                (ngModelChange)="phone.set($event)"
                class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <button
            [disabled]="updateMutation.isPending()"
            (click)="saveChanges()"
            class="mt-6 w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50"
          >
            Save Changes
          </button>
        }
      </div>

      <div
        class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
      >
        <h2 class="text-base sm:text-lg font-bold text-on-surface mb-4">
          Security
        </h2>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            class="w-full sm:w-auto px-6 py-2.5 bg-surface-container text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors"
          >
            Change Password
          </button>
          <button
            class="w-full sm:w-auto px-6 py-2.5 bg-surface-container text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors"
          >
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProfilePageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  firstName = signal("");
  lastName = signal("");
  email = signal("");
  phone = signal("");

  profileQuery = injectQuery(() => ({
    queryKey: ["admin-profile"],
    queryFn: () => lastValueFrom(this.adminService.getProfile()),
  }));

  updateMutation = injectMutation(() => ({
    mutationFn: (profile: Partial<Profile>) =>
      lastValueFrom(this.adminService.updateProfile(profile)),
    onSuccess: () => {
      this.toast.show("success", "Profile updated successfully");
      this.queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
    },
    onError: () => this.toast.show("error", "Failed to update profile"),
  }));

  constructor() {
    effect(
      () => {
        const data = this.profileQuery.data() as Profile | undefined;
        if (data) {
          this.firstName.set(data.firstName || "");
          this.lastName.set(data.lastName || "");
          this.email.set(data.email || "");
          this.phone.set(data.phone || "");
        }
      },
      { allowSignalWrites: true },
    );
  }

  saveChanges() {
    this.updateMutation.mutate({
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email(),
      phone: this.phone(),
    });
  }
}
