import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { auth } from '../firebase';
import { ApiService } from '../api.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: null
    });

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['syncAuth']);
    spyOn(console, 'info');
    spyOn(console, 'error');

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
    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: null
    });
  });

  it('logs in with Google using Firebase popup', async () => {
    const popupSpy = spyOn<any>(service, 'signInWithGooglePopup').and.resolveTo('popup');
    const syncSpy = spyOn<any>(service, 'ensureBackendUserSynced').and.resolveTo(true);
    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: {
        uid: 'google-user-1',
        emailVerified: true
      } as any
    });

    const result = await service.loginWithGoogle();

    expect(result).toBeTrue();
    expect(popupSpy).toHaveBeenCalled();
    expect(syncSpy).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/client-area']);
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

    const result = await service.register('joao@example.com', 'Senha@123', 'Joao');

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
    expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/client-area']);
  });

  it('syncs the backend user after verified Firebase login', async () => {
    const mockUser = {
      uid: 'user-verified',
      email: 'joao@example.com',
      displayName: 'Joao Felipe',
      photoURL: null,
      emailVerified: true,
      getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('firebase-token')
    } as any;

    service.currentUser.set({
      backendUserId: null,
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      photoURL: mockUser.photoURL,
      plano: null
    });

    spyOn<any>(service, 'signInWithEmail').and.resolveTo({
      user: mockUser
    });
    apiServiceSpy.syncAuth.and.returnValue(of({
      message: 'ok',
      primeiro_acesso: false,
      usuario: {
        id: '7',
        nome: 'Joao Felipe',
        email: 'joao@example.com',
        provedor_autenticacao: 'firebase',
        id_usuario_provedor: mockUser.uid,
        foto_url: null,
        criado_em: '2026-04-01T00:00:00.000Z',
        atualizado_em: '2026-04-01T00:00:00.000Z'
      },
      plano_atual: {
        id: '3',
        slug: 'pro',
        nome: 'Plano Pro'
      }
    }));

    const result = await service.login('joao@example.com', 'Senha@123');

    expect(result).toBeTrue();
    expect(apiServiceSpy.syncAuth).toHaveBeenCalled();
    expect(service.currentUser()?.backendUserId).toBe(7);
    expect(service.currentUser()?.plano).toBe('pro');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/client-area']);
  });

  it('blocks login when backend sync fails after Firebase auth', async () => {
    const mockUser = {
      uid: 'user-verified',
      email: 'joao@example.com',
      displayName: 'Joao Felipe',
      photoURL: null,
      emailVerified: true,
      getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('firebase-token')
    } as any;

    service.currentUser.set({
      backendUserId: null,
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      photoURL: mockUser.photoURL,
      plano: null
    });

    spyOn<any>(service, 'signInWithEmail').and.resolveTo({
      user: mockUser
    });
    apiServiceSpy.syncAuth.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 503,
      error: { message: 'Backend indisponivel' }
    })));

    const result = await service.login('joao@example.com', 'Senha@123');

    expect(result).toBeFalse();
    expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/client-area']);
    expect(toastrSpy.error).toHaveBeenCalled();
    expect(service.currentUser()?.backendUserId).toBeNull();
  });

  it('requires Firebase verification and backend sync to be authenticated', async () => {
    service.currentUser.set({
      backendUserId: 7,
      uid: 'user-1',
      email: 'joao@example.com',
      displayName: 'Joao',
      photoURL: null,
      plano: 'basic'
    });

    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: {
        emailVerified: true,
        getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('firebase-token')
      }
    });

    expect(service.isAuthenticated()).toBeTrue();
    expect(await service.getToken()).toBe('firebase-token');

    service.currentUser.set({
      backendUserId: null,
      uid: 'user-1',
      email: 'joao@example.com',
      displayName: 'Joao',
      photoURL: null,
      plano: 'basic'
    });

    expect(service.isAuthenticated()).toBeFalse();
  });

  it('sends password reset email with auth action URL', async () => {
    spyOn<any>(service, 'sendResetPasswordEmail').and.resolveTo();

    const result = await service.resetPassword('joao@example.com');
    const actionCodeSettings = (service as any).sendResetPasswordEmail.calls.mostRecent().args[1];

    expect(result).toBeTrue();
    expect((service as any).sendResetPasswordEmail).toHaveBeenCalled();
    expect(actionCodeSettings).toEqual(jasmine.objectContaining({
      url: jasmine.stringMatching(/\/auth\/action$/),
      handleCodeInApp: true
    }));
  });
});
