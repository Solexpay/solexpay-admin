import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map } from "rxjs";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Remember the deep link so login can come back to it.
  const returnUrl = state?.url && state.url !== "/dashboard" ? state.url : "";
  const toLogin = () =>
    router.parseUrl(
      returnUrl
        ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
        : "/login",
    );

  return auth
    .ensureInitialized()
    .pipe(map((isAuth) => (isAuth ? true : toLogin())));
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return auth.hasRole("ADMIN") ? true : router.parseUrl("/login");
  }

  return auth.ensureInitialized().pipe(
    map((isAuth) => {
      if (isAuth && auth.hasRole("ADMIN")) {
        return true;
      }
      return router.parseUrl("/login");
    }),
  );
};
