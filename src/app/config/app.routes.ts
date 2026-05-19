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
    path: 'plans', 
    loadComponent: () => import('../pages/plans/plans.component').then(m => m.PlansComponent) 
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
    path: 'checkout',
    loadComponent: () =>
      import('../pages/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [authGuard]
  },
  {
    path: 'payment/success',
    loadComponent: () =>
      import('../pages/payment-status/payment-status.component').then(m => m.PaymentStatusComponent)
  },
  {
    path: 'payment/pending',
    loadComponent: () =>
      import('../pages/payment-status/payment-status.component').then(m => m.PaymentStatusComponent)
  },
  {
    path: 'payment/failure',
    loadComponent: () =>
      import('../pages/payment-status/payment-status.component').then(m => m.PaymentStatusComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('../pages/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('../pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },

  //privadas
  
  {
    path: 'client-area',
    loadComponent: () =>
      import('../pages/client-area/client-area.component').then(m => m.ClientAreaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'library',
    loadComponent: () =>
      import('../pages/library/library.component').then(m => m.LibraryComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'my-downloads',
    loadComponent: () => 
      import('../pages/my-downloads/my-downloads.component').then(m => m.MyDownloadsComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'my-account',
    loadComponent: () =>
      import('../pages/my-account/my-account.component').then(m => m.MyAccountComponent), 
    canActivate: [authGuard] 
  },
  
  {
    path: '**',
    redirectTo: 'home'
  }
];
