import { Routes } from '@angular/router';

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
    path: 'services', 
    loadComponent: () => import('../pages/services/services.component').then(m => m.ServicesComponent) 
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

];