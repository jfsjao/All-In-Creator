import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { auth } from '../../../../firebase-config';
import { ApiService } from '../api.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['syncAuth']);

    spyOn(auth, 'onAuthStateChanged').and.callFake((callback: (user: any | null) => void) => {
      callback(null);
      return () => undefined;
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('logs in with Google using Firebase popup', async () => {
    const popupSpy = spyOn<any>(service, 'signInWithGooglePopup').and.resolveTo('popup');

    const result = await service.loginWithGoogle();

    expect(result).toBeTrue();
    expect(popupSpy).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(toastrSpy.success).toHaveBeenCalled();
  });

  it('surfaces Firebase popup errors', async () => {
    spyOn<any>(service, 'signInWithGooglePopup').and.rejectWith({ code: 'auth/popup-closed-by-user' });

    const result = await service.loginWithGoogle();

    expect(result).toBeFalse();
    expect(toastrSpy.error).toHaveBeenCalled();
  });

  it('registers a user and sends email verification with auth action URL', async () => {
    const mockUser = {
      uid: 'user-1',
      email: 'joao@example.com',
      emailVerified: false
    } as any;

    spyOn<any>(service, 'createUserAccount').and.resolveTo({
      user: mockUser
    });
    spyOn<any>(service, 'updateUserProfile').and.resolveTo();
    spyOn<any>(service, 'sendVerificationEmail').and.resolveTo();
    spyOn<any>(service, 'signOutCurrentUser').and.resolveTo();
    spyOn<any>(service, 'debugAuth').and.stub();

    const result = await service.register('joao@example.com', 'Senha@123', 'João');

    expect(result).toBeTrue();
    expect((service as any).sendVerificationEmail).toHaveBeenCalled();
    expect((service as any).sendVerificationEmail.calls.mostRecent().args[1]).toEqual(
      jasmine.objectContaining({
        url: jasmine.stringMatching(/\/auth\/action$/),
        handleCodeInApp: true
      })
    );
  });

  it('resends verification and blocks login for unverified users', async () => {
    const mockUser = {
      uid: 'user-1',
      email: 'joao@example.com',
      emailVerified: false
    } as any;

    spyOn<any>(service, 'signInWithEmail').and.resolveTo({
      user: mockUser
    });
    spyOn<any>(service, 'sendVerificationEmail').and.resolveTo();
    spyOn<any>(service, 'signOutCurrentUser').and.resolveTo();
    const result = await service.login('joao@example.com', 'Senha@123');

    expect(result).toBeFalse();
    expect((service as any).sendVerificationEmail).toHaveBeenCalledWith(
      mockUser,
      jasmine.objectContaining({ url: jasmine.stringMatching(/\/auth\/action$/) })
    );
    expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/dashboard']);
  });

  it('sends password reset email with auth action URL', async () => {
    spyOn<any>(service, 'sendResetPasswordEmail').and.resolveTo();

    const result = await service.resetPassword('joao@example.com');

    expect(result).toBeTrue();
    expect((service as any).sendResetPasswordEmail).toHaveBeenCalledWith(
      'joao@example.com',
      jasmine.objectContaining({
        url: jasmine.stringMatching(/\/auth\/action$/),
        handleCodeInApp: true
      })
    );
  });
});
