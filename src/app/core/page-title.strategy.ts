import { Injectable, inject } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";

/** "Users · SolexPay Admin", from each route's `title`. */
@Injectable({ providedIn: "root" })
export class PageTitleStrategy extends TitleStrategy {
  private title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot) {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} · SolexPay Admin` : "SolexPay Admin");
  }
}
