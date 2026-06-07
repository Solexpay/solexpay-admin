import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CookieConsentComponent } from "./components/ui/cookie-consent.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, CookieConsentComponent],
  template: `
    <router-outlet />
    <app-cookie-consent />
  `,
})
export class AppComponent {}
