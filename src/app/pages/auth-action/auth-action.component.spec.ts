import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@core/services/auth.service';
import { AuthActionComponent } from './auth-action.component';

describe('AuthActionComponent', () => {
  let fixture: ComponentFixture<AuthActionComponent>;
  let component: AuthActionComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  function configureRoute(queryParams: Record<string, string | null>) {
    return {
      snapshot: {
        queryParamMap: convertToParamMap(queryParams)
      }
    };
  }

  async function createComponent(queryParams: Record<string, string | null>) {
    await TestBed.configureTestingModule({
      imports: [AuthActionComponent],
      providers: [
        { provide: ActivatedRoute, useValue: configureRoute(queryParams) },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'validateVerifyEmailCode',
      'applyVerifyEmailCode',
      'setEmailVerifiedNotice',
      'validateResetPasswordCode',
      'confirmPasswordResetAction',
      'setPasswordResetCompletedNotice'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);
  });

  it('marks the page invalid when the action link is incomplete', async () => {
    await createComponent({ mode: null, oobCode: null });

    expect(component.isValidLink).toBeFalse();
    expect(component.description).toContain('inválido');
  });

  it('verifies email and redirects to login on success', async () => {
    authServiceSpy.validateVerifyEmailCode.and.resolveTo();
    authServiceSpy.applyVerifyEmailCode.and.resolveTo();

    await createComponent({ mode: 'verifyEmail', oobCode: 'code-123' });

    expect(authServiceSpy.validateVerifyEmailCode).toHaveBeenCalledWith('code-123');
    expect(authServiceSpy.applyVerifyEmailCode).toHaveBeenCalledWith('code-123');
    expect(authServiceSpy.setEmailVerifiedNotice).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth']);
    expect(component.feedbackType).toBe('success');
  });

  it('validates reset password code on init', async () => {
    authServiceSpy.validateResetPasswordCode.and.resolveTo();

    await createComponent({ mode: 'resetPassword', oobCode: 'reset-123' });

    expect(authServiceSpy.validateResetPasswordCode).toHaveBeenCalledWith('reset-123');
    expect(component.isValidLink).toBeTrue();
  });

  it('submits a new password and redirects to login', async () => {
    authServiceSpy.validateResetPasswordCode.and.resolveTo();
    authServiceSpy.confirmPasswordResetAction.and.resolveTo();

    await createComponent({ mode: 'resetPassword', oobCode: 'reset-123' });

    component.form.setValue({
      password: 'Senha@123',
      confirmPassword: 'Senha@123'
    });

    await component.onSubmit();

    expect(authServiceSpy.confirmPasswordResetAction).toHaveBeenCalledWith('reset-123', 'Senha@123');
    expect(authServiceSpy.setPasswordResetCompletedNotice).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth']);
  });
});
