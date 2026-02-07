
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { UserLayoutComponent } from './layouts/user-layout/user-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    // Frontoffice Routes
    {
        path: '',
        component: UserLayoutComponent,
        children: [
            {
                path: '',
                loadComponent: () => import('./features/frontoffice/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'offers',
                loadComponent: () => import('./features/frontoffice/job-offers/job-offers.component').then(m => m.JobOffersComponent)
            },
            {
                path: 'offers/:id',
                loadComponent: () => import('./features/frontoffice/job-offer-details/job-offer-details.component').then(m => m.JobOfferDetailsComponent)
            },
            {
                path: 'apply',
                loadComponent: () => import('./features/frontoffice/apply/apply.component').then(m => m.ApplyComponent)
            },
            {
                path: 'profile-builder',
                loadComponent: () => import('./features/frontoffice/profile-builder/profile-builder.component').then(m => m.ProfileBuilderComponent)
            },
            {
                path: 'interview/:id',
                loadComponent: () => import('./features/frontoffice/interview-room/interview-room.component').then(m => m.InterviewRoomComponent)
            }
        ]
    },

    // Backoffice Routes
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/backoffice/dashboard/dashboard.component').then(m => m.DashboardComponent),
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'DIRECTOR', 'HEAD_DEPT', 'CUP'] }
            },
            {
                path: 'job-offers',
                loadComponent: () => import('./features/backoffice/job-offers-admin/job-offers-admin.component').then(m => m.JobOffersAdminComponent),
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'DIRECTOR', 'HEAD_DEPT'] }
            },
            {
                path: 'candidates',
                loadComponent: () => import('./features/backoffice/candidates/candidates.component').then(m => m.CandidatesComponent),
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'DIRECTOR', 'HEAD_DEPT'] }
            },
            {
                path: 'interviews',
                loadComponent: () => import('./features/backoffice/interviews/interviews.component').then(m => m.InterviewsComponent),
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'DIRECTOR', 'HEAD_DEPT'] }
            },
            {
                path: 'users',
                loadComponent: () => import('./features/backoffice/users/users.component').then(m => m.UsersComponent),
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'DIRECTOR'] }
            }
        ]
    },

    // Wildcard
    { path: '**', redirectTo: '' }
];
