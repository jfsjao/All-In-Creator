import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { TERMS_ACCEPTANCE_LABEL } from '@core/legal-terms';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoginMode = true;
  isForgotMode = false;
  isLoading = false;
  readonly termsAcceptanceLabel = TERMS_ACCEPTANCE_LABEL;

  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotForm: FormGroup;

  
  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          this.passwordStrengthValidator
        ]
      ],
      confirmPassword: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    }, { 
      validators: this.passwordMatchValidator
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async ngOnInit(): Promise<void> {
    this.authService.clearError?.();
    await this.authService.waitForAuthInit();

    if (this.authService.isAuthenticated()) {
      await this.router.navigate(['/client-area']);
      return;
    }

    const mode = this.route.snapshot.queryParamMap.get('mode');
    const plan = this.route.snapshot.queryParamMap.get('plan');
    const redirect = this.route.snapshot.queryParamMap.get('redirect');

    if (mode === 'register') {
      this.isLoginMode = false;
    }

    if (plan === 'basic' || plan === 'pro' || plan === 'premium') {
      this.authService.setPendingCheckout(plan, redirect ?? undefined);
    }
  }

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
    this.isForgotMode = false;
    this.authService.clearNotice?.();
    this.authService.clearError?.();
  }

  onOpenForgotPassword(event: Event) {
    event.preventDefault();
    const loginEmail = this.loginForm.get('email')?.value;
    if (loginEmail) {
      this.forgotForm.patchValue({ email: loginEmail });
    }
    this.isForgotMode = true;
    this.authService.clearNotice?.();
    this.authService.clearError?.();
  }

  onBackToLogin() {
    this.isForgotMode = false;
    this.isLoginMode = true;
    this.authService.clearNotice?.();
    this.authService.clearError?.();
  }

  onBackFromCard() {
    if (this.isForgotMode) {
      this.onBackToLogin();
      return;
    }

    if (!this.isLoginMode) {
      this.onSwitchMode();
    }
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const { email, password } = this.loginForm.value;
      await this.authService.login(email, password);
    } finally {
      this.isLoading = false;
    }
  }

  async onRegister() {
    if (this.registerForm.invalid && !this.canSubmitRegisterWithWarning()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const { name, email, password } = this.registerForm.value;
      this.authService.rememberTermsAcceptanceForSignup();
      const ok = await this.authService.register(email, password, name);

      if (ok) {
        this.isLoginMode = true;
        this.isForgotMode = false;
        this.loginForm.patchValue({ email, password: '' });
        this.registerForm.patchValue({ password: '', confirmPassword: '', termsAccepted: false });
        this.registerForm.reset();
      }
    } finally {
      this.isLoading = false;
    }
  }

  private canSubmitRegisterWithWarning(): boolean {
    const form = this.registerForm;
    const password = this.registerPassword;
    const hasStrengthError = !!password?.errors?.['passwordStrength'];
    const hasPasswordMismatch = !!form.errors?.['passwordMismatch'];

    if (!hasStrengthError || hasPasswordMismatch) {
      return false;
    }

    const controls = Object.keys(form.controls);
    for (const key of controls) {
      const control = form.get(key);
      if (!control) continue;
      if (key === 'password' && hasStrengthError) continue;
      if (control.invalid) return false;
    }

    return true;
  }

  async onGoogleLogin() {
    if (!this.isLoginMode && !this.registerTermsAccepted?.value) {
      this.registerTermsAccepted?.markAsTouched();
      return;
    }

    if (!this.isLoginMode) {
      this.authService.rememberTermsAcceptanceForSignup();
    }

    this.isLoading = true;

    try {
      await this.authService.loginWithGoogle();
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmitForgotPassword() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const email = this.forgotForm.get('email')?.value;

    this.isLoading = true;

    try {
      await this.authService.resetPassword(email);
      this.isForgotMode = false;
      this.isLoginMode = true;
      this.loginForm.patchValue({ email });
    } finally {
      this.isLoading = false;
    }
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  passwordStrengthValidator(control: { value: string }) {
    const value = control.value || '';

    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);

    return hasUppercase && hasNumber && hasSymbol ? null : {
      passwordStrength: {
        hasUppercase,
        hasNumber,
        hasSymbol
      }
    };
  }

  get loginEmail() { return this.loginForm.get('email'); }
  get loginPassword() { return this.loginForm.get('password'); }
  get registerName() { return this.registerForm.get('name'); }
  get registerEmail() { return this.registerForm.get('email'); }
  get registerPassword() { return this.registerForm.get('password'); }
  get registerConfirmPassword() { return this.registerForm.get('confirmPassword'); }
  get registerTermsAccepted() { return this.registerForm.get('termsAccepted'); }
  get forgotEmail() { return this.forgotForm.get('email'); }

  get registerPasswordErrors() {
    return this.registerPassword?.errors?.['passwordStrength'] || null;
  }

  get authNotice() {
    return typeof this.authService.authNotice === 'function' ? this.authService.authNotice() : null;
  }

  get authError() {
    return typeof this.authService.authError === 'function' ? this.authService.authError() : null;
  }
}
