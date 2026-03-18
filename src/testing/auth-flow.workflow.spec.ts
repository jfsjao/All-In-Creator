import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthComponent } from '../app/pages/auth/auth.component';
import { AuthService } from '../app/core/services/auth.service';

describe('Auth Flow Workflow', () => {
  let fixture: ComponentFixture<AuthComponent>;
  let component: AuthComponent;

  const authServiceMock = {
    login: jasmine.createSpy('login').and.resolveTo(true),
    register: jasmine.createSpy('register').and.resolveTo(true),
    loginWithGoogle: jasmine.createSpy('loginWithGoogle').and.resolveTo(true)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    authServiceMock.login.calls.reset();
    authServiceMock.register.calls.reset();
    authServiceMock.loginWithGoogle.calls.reset();
  });

  it('starts in login mode and can switch to register mode', () => {
    expect(component.isLoginMode).toBeTrue();

    component.onSwitchMode();
    fixture.detectChanges();

    expect(component.isLoginMode).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Criar conta');
  });

  it('does not submit invalid login form', async () => {
    component.loginForm.setValue({
      email: '',
      password: ''
    });

    await component.onLogin();

    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(component.loginForm.touched).toBeTrue();
  });

  it('submits valid login credentials', async () => {
    component.loginForm.setValue({
      email: 'joao@example.com',
      password: '123456'
    });

    await component.onLogin();

    expect(authServiceMock.login).toHaveBeenCalledWith('joao@example.com', '123456');
  });

  it('submits valid registration data', async () => {
    component.onSwitchMode();
    fixture.detectChanges();

    component.registerForm.setValue({
      name: 'Joao Felipe',
      email: 'joao@example.com',
      password: '123456',
      confirmPassword: '123456'
    });

    await component.onRegister();

    expect(authServiceMock.register).toHaveBeenCalledWith('joao@example.com', '123456', 'Joao Felipe');
  });

  it('triggers google login', async () => {
    await component.onGoogleLogin();

    expect(authServiceMock.loginWithGoogle).toHaveBeenCalled();
  });
});
