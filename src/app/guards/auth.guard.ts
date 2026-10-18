import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map } from "rxjs";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return auth.ensureInitialized().pipe(
    map((isAuth) => {
      if (isAuth) {
        return true;
      }
      return router.parseUrl("/login");
    }),
  );
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
