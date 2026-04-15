import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['waitForAuthInit', 'isAuthenticated']);
    authServiceSpy.waitForAuthInit.and.resolveTo();

    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
    routerSpy.createUrlTree.and.returnValue({ redirectedTo: '/auth' } as never);

    toastrSpy = jasmine.createSpyObj('ToastrService', ['warning']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    });
  });

  it('allows access when the user is authenticated', async () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(toastrSpy.warning).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to auth page', async () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(toastrSpy.warning).toHaveBeenCalled();
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/auth']);
    expect(result).toEqual({ redirectedTo: '/auth' } as never);
  });
});
