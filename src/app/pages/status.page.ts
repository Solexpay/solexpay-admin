import { Component, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { LucideDynamicIcon, LucideCompass as Compass } from "@lucide/angular";

/** "Page not found" and "No access" screens, picked by the route's data.kind. */
@Component({
  selector: "app-status-page",
  imports: [RouterLink, LucideDynamicIcon],
  template: `
    <section class="ui-panel">
      <div class="ui-panel-body px-4 py-14 text-center">
        @if (forbidden) {
          <img
            src="/art/locked.webp"
            alt=""
            width="96"
            height="96"
            class="mx-auto mb-2 h-24 w-24 object-contain"
          />
        } @else {
          <svg
            [lucideIcon]="CompassIcon"
            [size]="36"
            class="mx-auto mb-3 text-ui-faint"
          ></svg>
        }
        <h1 class="text-xl font-semibold text-ui-ink">
          {{
            forbidden ? "You don't have access to this page" : "Page not found"
          }}
        </h1>
        <p class="mx-auto mt-1 max-w-md text-sm text-ui-muted">
          {{
            forbidden
              ? "Your admin role can't open this section. Ask a super admin if you need it."
              : "The link may be old or mistyped."
          }}
        </p>
        <a routerLink="/dashboard" class="ui-btn ui-btn-primary mt-5">
          Back to dashboard
        </a>
      </div>
    </section>
  `,
})
export class StatusPageComponent {
  readonly CompassIcon = Compass;
  readonly forbidden =
    inject(ActivatedRoute).snapshot.data["kind"] === "forbidden";
}
