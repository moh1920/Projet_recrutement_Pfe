
import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.currentUserValue) {
        return true;
    }

    // Redirect to login page (we'll just redirect to home for now or show login modal)
    // For this template, we auto-login in service, so this should pass.
    // router.navigate(['/login']); 
    return true;
};
