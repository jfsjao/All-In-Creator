import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

type AuthActionMode = 'verifyEmail' | 'resetPassword' | null;

@Component({
  selector: 'app-auth-action',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-action.component.html',
  styleUrls: ['./auth-action.component.scss']
})
export class AuthActionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  form: FormGroup;
  mode: AuthActionMode = null;
  code: string | null = null;
  isLoading = false;
  isValidLink = true;
  title = 'Ação da conta';
  description = 'Validando o link enviado por email...';
  feedbackType: 'info' | 'success' | 'error' = 'info';

  constructor() {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  async ngOnInit(): Promise<void> {
    this.code = this.route.snapshot.queryParamMap.get('oobCode');
    this.mode = this.parseMode(this.route.snapshot.queryParamMap.get('mode'));

    if (!this.code || !this.mode) {
      this.setInvalidState('Link inválido ou incompleto.');
      return;
    }

    if (this.mode === 'verifyEmail') {
      this.title = 'Verificação de email';
      this.description = 'Estamos confirmando seu email.';
      await this.handleVerifyEmail();
      return;
    }

    this.title = 'Redefinir senha';
    this.description = 'Defina sua nova senha para concluir o acesso.';
    await this.validateResetLink();
  }

  async onSubmit(): Promise<void> {
    if (this.mode !== 'resetPassword' || !this.code || !this.isValidLink) {
      this.setInvalidState('Link de redefinição inválido ou expirado.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const password = this.form.get('password')?.value;
      await this.authService.confirmPasswordResetAction(this.code, password);
      this.authService.setPasswordResetCompletedNotice();
      this.toastr.success('Senha redefinida com sucesso.', 'Sucesso');
      await this.router.navigate(['/auth']);
    } catch (error: any) {
      this.setInvalidState(
        error?.code === 'auth/expired-action-code'
          ? 'O link de redefinição expirou. Solicite um novo email.'
          : 'Não foi possível redefinir a senha.'
      );
      this.toastr.error(this.description, 'Erro');
    } finally {
      this.isLoading = false;
    }
  }

  async irParaLogin(): Promise<void> {
    await this.router.navigate(['/auth']);
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private parseMode(mode: string | null): AuthActionMode {
    if (mode === 'verifyEmail' || mode === 'resetPassword') {
      return mode;
    }

    return null;
  }

  private async handleVerifyEmail(): Promise<void> {
    if (!this.code) {
      this.setInvalidState('Link de verificação inválido.');
      return;
    }

    try {
      await this.authService.validateVerifyEmailCode(this.code);
      await this.authService.applyVerifyEmailCode(this.code);
      this.feedbackType = 'success';
      this.description = 'Email verificado com sucesso. Redirecionando para o login...';
      this.authService.setEmailVerifiedNotice();
      this.toastr.success('Email confirmado com sucesso.', 'Sucesso');
      await this.router.navigate(['/auth']);
    } catch (error: any) {
      this.setInvalidState(
        error?.code === 'auth/expired-action-code'
          ? 'O link de verificação expirou. Solicite um novo email.'
          : 'Não foi possível verificar o email.'
      );
      this.toastr.error(this.description, 'Erro');
    }
  }

  private async validateResetLink(): Promise<void> {
    if (!this.code) {
      this.setInvalidState('Link de redefinição inválido.');
      return;
    }

    try {
      await this.authService.validateResetPasswordCode(this.code);
    } catch (error: any) {
      this.setInvalidState(
        error?.code === 'auth/expired-action-code'
          ? 'O link de redefinição expirou. Solicite um novo email.'
          : 'Não foi possível validar o link de redefinição.'
      );
    }
  }

  private setInvalidState(message: string): void {
    this.isValidLink = false;
    this.feedbackType = 'error';
    this.description = message;
  }
}
