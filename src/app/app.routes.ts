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
        loadComponent: () => import('./features/frontoffice/apply/apply.component').then(m => m.ApplyComponent),
        canActivate: [authGuard]
      },
      {
        path: 'profile-builder',
        loadComponent: () => import('./features/frontoffice/profile-builder/profile-builder.component').then(m => m.ProfileBuilderComponent),
        canActivate: [authGuard]
      },
      {
        path: 'interview',
        loadComponent: () => import('./features/frontoffice/interview-room/interview-room.component').then(m => m.InterviewRoomComponent),
        canActivate: [authGuard]
      },
      {
        path: 'applications',
        loadComponent: () => import('./features/frontoffice/my-applications/my-applications.component').then(m => m.MyApplicationsComponent),
        canActivate: [authGuard]
      },
      {
        path: 'candidateProfile',
        loadComponent: () => import('./features/frontoffice/candidate-profile/candidate-profile.component').then(m => m.CandidateProfileComponent),
        canActivate: [authGuard]
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
        data: { roles: ['admin', 'director', 'head_dept', 'cup'] } // ✅ Minuscules
      },
      {
        path: 'job-offers',
        loadComponent: () => import('./features/backoffice/job-offers-admin/job-offers-admin.component').then(m => m.JobOffersAdminComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'head_dept'] } // ✅ Minuscules
      },
      {
        path: 'candidates',
        loadComponent: () => import('./features/backoffice/candidates/candidates.component').then(m => m.CandidatesComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'head_dept'] } // ✅ Minuscules
      },
      {
        path: 'interviews',
        loadComponent: () => import('./features/backoffice/interviews/interviews.component').then(m => m.InterviewsComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'head_dept'] } // ✅ Minuscules
      },
      {
        path: 'users',
        loadComponent: () => import('./features/backoffice/users/users.component').then(m => m.UsersComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director'] } // ✅ Minuscules
      },
      {
        path: 'profilePage',
        loadComponent: () => import('./features/backoffice/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director'] } // ✅ Minuscules
      },
      {
        path: 'profileCandidats',
        loadComponent: () => import('./features/backoffice/profile-candidats/profile-candidats.component').then(m => m.ProfileCandidatsComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director'] } // ✅ Minuscules
      },
      // {
      //   path: 'lobby',
      //   loadComponent: () =>
      //     import('./features/backoffice/lobby/lobby.component').then(m => m.LobbyComponent),
      //   data: { roles: ['admin', 'director'] } // ✅ Minuscules
      // },
      {
        path: 'meeting/:roomCode',
        loadComponent: () =>
          import('./features/backoffice/meeting/meeting.component').then(m => m.MeetingComponent),
          data: { roles: ['admin', 'director'] } // ✅ Minuscules
      },
      {
        path: 'emailSendMeeting',
        loadComponent: () =>
          import('./features/backoffice/send-meeting-email/send-meeting-email.component').then(m => m.SendMeetingEmailComponent),
          data: { roles: ['admin', 'director'] } // ✅ Minuscules
      },{
        path: 'candidatsDetais/:id',
        loadComponent: () =>
          import('./features/backoffice/candidates/candidats-details/candidats-details.component').then(m => m.CandidatsDetailsComponent),
          data: { roles: ['admin', 'director'] } // ✅ Minuscules
      },{
        path: 'categorieSelection',
        loadComponent: () =>
          import('./features/backoffice/job-offers-admin/categorie-de-selection-admin/categorie-de-selection-admin.component').then(m => m.CategorieDeSelectionAdminComponent),
          data: { roles: ['admin', 'director'] } // ✅ Minuscules
      },{
        path: 'critereDeSelection',
        loadComponent: () =>
          import('./features/backoffice/job-offers-admin/critere-de-selection-admin/critere-de-selection-admin.component').then(m => m.CritereDeSelectionAdminComponent),
          data: { roles: ['admin', 'director'] } // ✅ Minuscules
      },
    ]
  },

  // Page non autorisée


  // Wildcard
  { path: '**', redirectTo: '' }
];
