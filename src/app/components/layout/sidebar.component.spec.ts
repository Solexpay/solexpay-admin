import "../../../test";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { RouterTestingModule } from "@angular/router/testing";
import { Router } from "@angular/router";
import { SidebarComponent } from "./sidebar.component";
import { vi } from "vitest";
import { Component } from "@angular/core";

import { provideHttpClient } from "@angular/common/http";

@Component({ standalone: true, template: "" })
class DummyComponent {}

describe("SidebarComponent", () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let router: Router;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        SidebarComponent,
        RouterTestingModule.withRoutes([
          { path: "dashboard", component: DummyComponent },
          { path: "users", component: DummyComponent },
          { path: "kyc", component: DummyComponent },
          { path: "loans", component: DummyComponent },
          { path: "transactions", component: DummyComponent },
          { path: "schools", component: DummyComponent },
        ]),
      ],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create the sidebar component", () => {
    expect(component).toBeTruthy();
  });

  it("should render correct navigation links", () => {
    const links = fixture.debugElement.queryAll(By.css("a"));
    expect(links.length).toBe(component.navItems.length);

    component.navItems.forEach((item, index) => {
      const linkEl = links[index]!.nativeElement as HTMLAnchorElement;
      expect(linkEl.textContent).toContain(item.label);
    });
  });

  it("should identify active route index correctly", async () => {
    // Navigate to dashboard
    await router.navigateByUrl("/dashboard");
    fixture.detectChanges();
    expect(component.activeIndex()).toBe(0); // '/dashboard' is first item

    // Navigate to users
    await router.navigateByUrl("/users");
    fixture.detectChanges();
    expect(component.activeIndex()).toBe(1); // '/users' is second item
  });

  it("should emit closeSidebar output when navigation link clicked", () => {
    const closeSpy = vi.spyOn(component.closeSidebar, "emit");
    const firstLink = fixture.debugElement.query(By.css("a"));
    // RouterLink reads the mouse button, so pass a real click event.
    firstLink.triggerEventHandler("click", new MouseEvent("click"));
    expect(closeSpy).toHaveBeenCalled();
  });
});
