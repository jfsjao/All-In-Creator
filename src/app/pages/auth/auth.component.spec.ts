import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@core/services/auth.service';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { AuthComponent } from './auth.component';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  const authServiceMock = {
    clearError: jasmine.createSpy('clearError'),
    clearNotice: jasmine.createSpy('clearNotice'),
    login: jasmine.createSpy('login').and.resolveTo(true),
    register: jasmine.createSpy('register').and.resolveTo(true),
    loginWithGoogle: jasmine.createSpy('loginWithGoogle').and.resolveTo(true),
    rememberTermsAcceptanceForSignup: jasmine.createSpy('rememberTermsAcceptanceForSignup'),
    resetPassword: jasmine.createSpy('resetPassword').and.resolveTo(true),
    setPendingCheckout: jasmine.createSpy('setPendingCheckout'),
    waitForAuthInit: jasmine.createSpy('waitForAuthInit').and.resolveTo(),
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    authNotice: jasmine.createSpy('authNotice').and.returnValue(null),
    authError: jasmine.createSpy('authError').and.returnValue(null)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null
              }
            }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
