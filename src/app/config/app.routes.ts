import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'home', 
    pathMatch: 'full' 
  },
  { 
    path: 'home', 
    loadComponent: () => import('../pages/home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'store', 
    loadComponent: () => import('../pages/store/store.component').then(m => m.StoreComponent) 
  },
  { 
    path: 'about', 
    loadComponent: () => import('../pages/about/about.component').then(m => m.AboutComponent) 
  },
  { 
    path: 'contact', 
    loadComponent: () => import('../pages/contact/contact.component').then(m => m.ContactComponent) 
  },
  { 
    path: 'auth', 
    loadComponent: () => import('../pages/auth/auth.component').then(m => m.AuthComponent) 
  },
  {
    path: 'auth/action',
    loadComponent: () =>
      import('../pages/auth-action/auth-action.component').then(m => m.AuthActionComponent)
  },
  {
    path: 'verificar-email',
    redirectTo: 'auth/action'
  },
  {
    path: 'redefinir-senha',
    redirectTo: 'auth/action'
  },

  //privadas
  
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'packs',
    loadComponent: () =>
      import('../pages/packs/packs.component').then(m => m.PacksComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'downloads',
    loadComponent: () => 
      import('../pages/downloads/downloads.component').then(m => m.DownloadsComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'account',
    loadComponent: () =>
      import('../pages/account/account.component').then(m => m.AccountComponent), 
    canActivate: [authGuard] 
  },
  
  {
    path: '**',
    redirectTo: 'home'
  }
];
