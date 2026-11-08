import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map } from "rxjs";
import { AuthService } from "../services/auth.service";

/**
 * Keeps an admin out of a section their role cannot use. Runs after
 * authGuard (on the parent route), so the session is already loaded.
 * Reads the allowed roles from the route's `data.roles`.
 */
export const roleGuard: CanActivateFn = (route) => {
  const roles = route.data["roles"] as string[] | undefined;
  if (!roles || inject(AuthService).canAccess(roles)) {
    return true;
  }
  return inject(Router).parseUrl("/forbidden");
};

/** Sends a signed-in admin straight past the login page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth
    .ensureInitialized()
    .pipe(map((isAuth) => (isAuth ? router.parseUrl("/dashboard") : true)));
};
