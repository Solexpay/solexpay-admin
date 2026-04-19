import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SidebarComponent } from './sidebar.component';
import { TopBarComponent } from './topbar.component';
import { ToastOutletComponent } from './toast-outlet.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopBarComponent, ToastOutletComponent],
  template: `
    <div class="flex h-screen bg-surface overflow-hidden">
      <!-- Mobile Sidebar Overlay -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 z-40 lg:hidden" (click)="sidebarOpen.set(false)">
          <div class="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm transition-opacity"></div>
        </div>
      }

      <!-- Sidebar -->
      <app-sidebar 
        (closeSidebar)="sidebarOpen.set(false)"
        [class]="sidebarOpen() ? 'translate-x-0' : '-translate-x-full'"
        class="fixed lg:static lg:translate-x-0 z-50 transition-transform duration-300">
      </app-sidebar>

      <!-- Main content area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-topbar (toggleSidebar)="sidebarOpen.set(!sidebarOpen())"></app-topbar>
        
        <!-- Page content -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-6">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Toast notifications -->
      <app-toast-outlet></app-toast-outlet>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit {
  private title = inject(Title);
  sidebarOpen = signal(false);
  
  ngOnInit() { this.title.setTitle('Solexpay Admin Portal'); }
}
