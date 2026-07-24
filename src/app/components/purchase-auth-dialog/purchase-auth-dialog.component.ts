import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TERMS_ACCEPTANCE_LABEL } from '@core/legal-terms';
import { PaidPlanSlug, PLAN_CATALOG } from '@core/plan-catalog';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-purchase-auth-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './purchase-auth-dialog.component.html',
  styleUrls: ['./purchase-auth-dialog.component.scss']
})
export class PurchaseAuthDialogComponent implements OnChanges, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly document = inject(DOCUMENT);

  @Input({ required: true }) plan: PaidPlanSlug | null = null;
  @Input() redirectUrl: string | null = null;
  @Output() dismissed = new EventEmitter<void>();
  @Output() authStarted = new EventEmitter<'login' | 'register' | 'google'>();

  mode: 'login' | 'register' = 'login';
  loading = false;
  readonly termsAcceptanceLabel = TERMS_ACCEPTANCE_LABEL;

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
    confirmPassword: ['', Validators.required],
    termsAccepted: [false, Validators.requiredTrue]
  }, { validators: this.passwordMatchValidator });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['plan'] && this.plan) {
      this.mode = 'login';
      this.document.body.classList.add('purchase-dialog-open');
    }
    if (changes['plan'] && !this.plan) {
      this.document.body.classList.remove('purchase-dialog-open');
    }
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('purchase-dialog-open');
  }

  get planName(): string {
    return this.plan ? PLAN_CATALOG[this.plan].name : '';
  }

  get notice(): string | null {
    return this.authService.authNotice();
  }

  get error(): string | null {
    return this.authService.authError();
  }

  close(): void {
    this.document.body.classList.remove('purchase-dialog-open');
    this.authService.clearError();
    this.authService.clearNotice();
    this.dismissed.emit();
  }

  switchMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.authService.clearError();
    this.authService.clearNotice();
  }

  async submitLogin(): Promise<void> {
    if (this.loginForm.invalid || !this.plan) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.rememberCheckout();
    this.authStarted.emit('login');
    this.loading = true;
    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.authService.login(email ?? '', password ?? '');
    } finally {
      this.loading = false;
    }
  }

  async submitRegister(): Promise<void> {
    if (this.registerForm.invalid || !this.plan) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.rememberCheckout();
    this.authStarted.emit('register');
    this.loading = true;
    try {
      const { name, email, password } = this.registerForm.getRawValue();
      const registered = await this.authService.register(email ?? '', password ?? '', name ?? '');
      if (registered) {
        this.mode = 'login';
        this.loginForm.patchValue({ email, password: '' });
        this.registerForm.reset();
      }
    } finally {
      this.loading = false;
    }
  }

  async submitGoogle(): Promise<void> {
    if (!this.plan) return;
    if (this.mode === 'register') {
      const accepted = this.registerForm.controls['termsAccepted'];
      if (!accepted.value) {
        accepted.markAsTouched();
        return;
      }
      this.authService.rememberTermsAcceptanceForSignup();
    }
    this.rememberCheckout();
    this.authStarted.emit('google');
    this.loading = true;
    try {
      await this.authService.loginWithGoogle();
    } finally {
      this.loading = false;
    }
  }

  private rememberCheckout(): void {
    if (!this.plan) return;
    this.authService.setPendingCheckout(this.plan, this.redirectUrl ?? `/checkout?plan=${this.plan}`);
  }

  private passwordMatchValidator(group: FormGroup) {
    return group.get('password')?.value === group.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
  }

  private passwordStrengthValidator(control: { value: string }) {
    const value = control.value || '';
    return /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value)
      ? null
      : { passwordStrength: true };
  }
}
