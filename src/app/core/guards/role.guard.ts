
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const expectedRoles = route.data['roles'] as UserRole[];

    if (!authService.currentUserValue || !expectedRoles) {
        return false;
    }

    if (authService.hasRole(expectedRoles)) {
        return true;
    }

    // Redirect to unauthorized or home
    router.navigate(['/']);
    return false;
};
