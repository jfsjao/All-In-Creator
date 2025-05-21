import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgbConfig } from '@ng-bootstrap/ng-bootstrap';
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ 
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      })
    ),
    provideClientHydration(),
    provideToastr({
      positionClass: 'toast-bottom-center',
      preventDuplicates: true,
      progressBar: true,
      timeOut: 3000
    }),
    provideAnimations(),
    { 
      provide: NgbConfig, 
      useValue: { animation: true, destroyOnHide: true } 
    }
  ]
};