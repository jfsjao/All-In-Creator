import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  ActionCodeSettings,
  GoogleAuthProvider,
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
  verifyPasswordResetCode
} from 'firebase/auth';
import { auth } from '../../../../firebase-config';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../api.service';
import { environment } from '../../../environments/environment';

export interface UserData {
  backendUserId?: number | null;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plano?: 'gratuito' | 'basic' | 'gold' | 'premium' | null;
  authProvider?: 'firebase' | 'backend';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private apiService = inject(ApiService);

  currentUser = signal<UserData | null>(null);
  isLoading = signal<boolean>(true);
  authInitialized = signal<boolean>(false);
  authNotice = signal<string | null>(null);
  authError = signal<string | null>(null);
  private pendingVerificationKey = 'pending_verification_email';

  private debugAuth(step: string, details?: Record<string, unknown>): void {
    console.info(`[AuthDebug] ${step}`, {
      timestamp: new Date().toISOString(),
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'server',
      ...details
    });
  }

  constructor() {
    const cachedNotice = sessionStorage.getItem('auth_notice');
    if (cachedNotice) {
      this.authNotice.set(cachedNotice);
    }

    this.initAuthListener();
  }

  /**
   * Listener do Firebase Auth
   */
  private initAuthListener(): void {
    auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        if (!user.emailVerified) {
          await signOut(auth);
          this.setNotice('Faltou verificar o e-mail. Para continuar, verifique o e-mail e faça login.');
          this.clearBackendSession();
          this.currentUser.set(null);
          this.isLoading.set(false);
          this.authInitialized.set(true);
          return;
        }

        this.currentUser.set({
          backendUserId: null,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          plano: null,
          authProvider: 'firebase'
        });

        await this.syncBackendUser(user);
      } else {
        this.clearBackendSession();
        this.currentUser.set(null);
      }

      this.isLoading.set(false);
      this.authInitialized.set(true);
    });
  }

  private async syncBackendUser(user: User): Promise<void> {
    try {
      const token = await user.getIdToken();
      const response = await firstValueFrom(this.apiService.syncAuth({
        nome: user.displayName,
        email: user.email,
        provedor_autenticacao: 'firebase',
        id_usuario_provedor: user.uid,
        foto_url: user.photoURL
      }, token));

      const current = this.currentUser();

      if (!current) return;

      this.currentUser.set({
        ...current,
        backendUserId: Number(response.usuario.id),
        plano: response.plano_atual?.slug ?? null
      });
    } catch (error) {
      console.error('Erro ao sincronizar usuário com o backend:', error);
    }
  }

  /**
   * Espera o Firebase terminar de restaurar a sessão
   */
  async waitForAuthInit(): Promise<void> {
    if (this.authInitialized()) return;

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (this.authInitialized()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  /**
   * Registro com email e senha
   */
  async register(email: string, password: string, name: string): Promise<boolean> {
    try {
      const actionCodeSettings = this.buildActionCodeSettings();
      this.debugAuth('register:start', {
        email,
        hasName: !!name,
        actionCodeSettings
      });

      const userCredential = await this.createUserAccount(email, password);
      this.debugAuth('register:user-created', {
        uid: userCredential.user.uid,
        emailVerified: userCredential.user.emailVerified
      });

      if (name) {
        await this.updateUserProfile(userCredential.user, { displayName: name });
        this.debugAuth('register:profile-updated', {
          uid: userCredential.user.uid,
          displayName: name
        });
      }

      await this.sendVerificationEmail(userCredential.user, actionCodeSettings);
      this.debugAuth('register:verification-email-request-finished', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        actionCodeSettings
      });

      await this.signOutCurrentUser();
      this.debugAuth('register:signout-after-verification-email', {
        uid: userCredential.user.uid
      });

      this.toastr.success('Conta criada! Verifique seu e-mail para confirmar.', 'Bem-vindo!');
      this.setNotice('Verifique o e-mail cadastrado para concluir seu acesso.');
      this.setPendingVerificationEmail(email);
      return true;
    } catch (error: any) {
      this.clearNotice();
      this.clearError();
      this.handleAuthError(error);
      return false;
    }
  }

  /**
   * Login com email e senha
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      const actionCodeSettings = this.buildActionCodeSettings();
      this.debugAuth('login:start', { email });

      const userCredential = await this.signInWithEmail(email, password);
      this.debugAuth('login:success', {
        uid: userCredential.user.uid,
        emailVerified: userCredential.user.emailVerified
      });

      if (!userCredential.user.emailVerified) {
        this.debugAuth('login:email-not-verified', {
          uid: userCredential.user.uid,
          actionCodeSettings
        });

        await this.sendVerificationEmail(userCredential.user, actionCodeSettings);
        this.debugAuth('login:verification-email-request-finished', {
          uid: userCredential.user.uid,
          email: userCredential.user.email
        });

        await this.signOutCurrentUser();
        this.clearError();
        this.setNotice('Verifique o e-mail cadastrado para concluir seu acesso.');
        this.setPendingVerificationEmail(email);
        this.toastr.warning('Confirme seu e-mail para entrar. Enviamos um novo link.', 'Verificação');
        return false;
      }

      this.clearNotice();
      this.clearError();
      this.clearPendingVerificationEmail();
      this.toastr.success('Login realizado com sucesso!', 'Bem-vindo de volta!');
      this.router.navigate(['/dashboard']);
      return true;
    } catch (error: any) {
      const pendingEmail = this.getPendingVerificationEmail();
      if (pendingEmail && pendingEmail.toLowerCase() === email.toLowerCase()) {
        this.clearError();
        this.setNotice('Verifique o e-mail cadastrado para concluir seu acesso.');
        this.toastr.warning('Confirme seu e-mail para entrar. Enviamos um novo link.', 'Verificação');
        return false;
      }

      this.clearNotice();
      this.clearError();
      this.handleAuthError(error);
      return false;
    }
  }

  /**
   * Login com Google
   */
  async loginWithGoogle(): Promise<boolean> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const mode = await this.signInWithGooglePopup(provider);

      if (mode === 'redirect') {
        this.toastr.info('Continuando login com Google...', 'Aguarde');
        return true;
      }

      this.toastr.success('Login realizado com sucesso!', 'Bem-vindo!');
      this.router.navigate(['/dashboard']);
      return true;
    } catch (error: any) {
      this.clearError();
      this.handleAuthError(error);
      return false;
    }
  }

  private async signInWithGooglePopup(provider: GoogleAuthProvider): Promise<'popup' | 'redirect'> {
    try {
      await signInWithPopup(auth, provider);
      return 'popup';
    } catch (error: any) {
      const popupErrors = [
        'auth/popup-closed-by-user',
        'auth/popup-blocked',
        'auth/cancelled-popup-request',
        'auth/operation-not-supported-in-this-environment'
      ];

      if (popupErrors.includes(error?.code)) {
        await signInWithRedirect(auth, provider);
        return 'redirect';
      }

      throw error;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }

      this.clearBackendSession();
      this.currentUser.set(null);
      this.toastr.info('Você saiu da conta.', 'Até logo!');
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.toastr.error('Erro ao sair', 'Tente novamente');
    }
  }

  /**
   * Resetar senha
   */
  async resetPassword(email: string): Promise<boolean> {
    try {
      const actionCodeSettings = this.buildActionCodeSettings();
      this.debugAuth('reset-password:start', {
        email,
        actionCodeSettings
      });

      await this.sendResetPasswordEmail(email, actionCodeSettings);
      this.debugAuth('reset-password:request-finished', {
        email,
        actionCodeSettings
      });

      this.setNotice('Verifique o email para redefinir a senha.');
      this.toastr.success('Email de recuperacao enviado!', 'Verifique sua caixa de entrada');
      return true;
    } catch (error: any) {
      this.clearError();
      this.handleAuthError(error);
      return false;
    }
  }


  /**
   * Pegar token JWT do usuário
   */
  async getToken(): Promise<string | null> {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }

    return localStorage.getItem('nicol_auth_token');
  }

  /**
   * Verificar se o usuário está logado
   */
  isAuthenticated(): boolean {
    const current = this.currentUser();
    if (!current) return false;

    if (current.authProvider === 'firebase') {
      return auth.currentUser?.emailVerified === true;
    }

    return true;
  }

  /**
   * Tratamento de erros do Firebase
   */
  private handleAuthError(error: any): void {
    console.error('Firebase/Auth error detail:', {
      code: error?.code,
      message: error?.message,
      customData: error?.customData,
      raw: error
    });

    if (error?.status || (error?.message && !error?.code)) {
      this.handleBackendError(error);
      return;
    }

    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Este e-mail já está em uso',
      'auth/invalid-email': 'E-mail inválido',
      'auth/operation-not-allowed': 'Operação não permitida',
      'auth/weak-password': 'Senha muito fraca (mínimo de 6 caracteres)',
      'auth/user-disabled': 'Usuário desabilitado',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/invalid-credential': 'Email ou senha incorretos',
      'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
      'auth/popup-closed-by-user': 'Login cancelado',
      'auth/popup-blocked': 'Popup bloqueado. Vamos continuar em outra janela.',
      'auth/unauthorized-domain': 'Domínio não autorizado no Firebase.',
      'auth/invalid-continue-uri': 'A URL de retorno configurada no Firebase é inválida.',
      'auth/missing-continue-uri': 'A URL de retorno do Firebase não foi informada.',
      'auth/unauthorized-continue-uri': 'A URL de retorno não está autorizada no Firebase.'
    };

    const message = errorMessages[error.code] || error?.message || 'Erro ao realizar operação';

    if (error.code === 'auth/user-not-found') {
      this.clearNotice();
      this.setError('E-mail não cadastrado.');
    } else if (error.code === 'auth/wrong-password') {
      this.clearNotice();
      this.setError('Senha incorreta.');
    } else if (error.code === 'auth/invalid-credential') {
      this.clearNotice();
      this.setError('Email ou senha incorretos.');
    } else if (error.code === 'auth/invalid-email') {
      this.clearNotice();
      this.setError('E-mail inválido.');
    } else {
      this.setError(message);
    }
    this.toastr.error(message, 'Erro de Autenticação');
  }

  private handleBackendError(error: any): void {
    const status = error?.status;
    const message = error?.error?.message;

    if (status && message) {
      const title = status === 403 ? 'Verificação pendente' : 'Erro de Autenticação';
      if (status === 403) {
        this.toastr.warning(message, title);
      } else {
        this.toastr.error(message, title);
      }
      return;
    }

    this.toastr.error(message || 'Erro ao realizar operação', 'Erro de Autenticação');
  }

  private setNotice(message: string): void {
    this.authNotice.set(message);
    sessionStorage.setItem('auth_notice', message);
  }

  clearNotice(): void {
    this.authNotice.set(null);
    sessionStorage.removeItem('auth_notice');
  }

  setPasswordResetCompletedNotice(): void {
    this.setNotice('Senha redefinida com sucesso. Agora voce ja pode entrar.');
  }

  setEmailVerifiedNotice(): void {
    this.setNotice('Email verificado com sucesso. Agora voce ja pode entrar.');
  }

  async validateResetPasswordCode(code: string): Promise<void> {
    await verifyPasswordResetCode(auth, code);
  }

  async confirmPasswordResetAction(code: string, newPassword: string): Promise<void> {
    await confirmPasswordReset(auth, code, newPassword);
  }

  async validateVerifyEmailCode(code: string): Promise<void> {
    await checkActionCode(auth, code);
  }

  async applyVerifyEmailCode(code: string): Promise<void> {
    await applyActionCode(auth, code);
  }

  private setPendingVerificationEmail(email: string): void {
    sessionStorage.setItem(this.pendingVerificationKey, email);
  }

  private getPendingVerificationEmail(): string | null {
    return sessionStorage.getItem(this.pendingVerificationKey);
  }

  private clearPendingVerificationEmail(): void {
    sessionStorage.removeItem(this.pendingVerificationKey);
  }

  private setError(message: string): void {
    this.authError.set(message);
  }

  clearError(): void {
    this.authError.set(null);
  }

  private setBackendSession(token: string, usuario: {
    id: string;
    nome: string | null;
    email: string;
    provedor_autenticacao: string;
    id_usuario_provedor: string | null;
    foto_url: string | null;
    criado_em: string;
    atualizado_em: string;
  }): void {
    const userData: UserData = {
      backendUserId: Number(usuario.id),
      uid: `backend-${usuario.id}`,
      email: usuario.email,
      displayName: usuario.nome,
      photoURL: usuario.foto_url,
      plano: null,
      authProvider: 'backend'
    };

    localStorage.setItem('nicol_auth_token', token);
    localStorage.setItem('nicol_auth_user', JSON.stringify(userData));
    this.currentUser.set(userData);
  }

  private getBackendSession(): UserData | null {
    const raw = localStorage.getItem('nicol_auth_user');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as UserData;
    } catch {
      return null;
    }
  }

  private clearBackendSession(): void {
    localStorage.removeItem('nicol_auth_token');
    localStorage.removeItem('nicol_auth_user');
  }

  private createUserAccount(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  private signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  private updateUserProfile(user: User, profile: { displayName?: string | null }) {
    return updateProfile(user, profile);
  }

  private sendVerificationEmail(user: User, actionCodeSettings: ActionCodeSettings) {
    return sendEmailVerification(user, actionCodeSettings);
  }

  private sendResetPasswordEmail(email: string, actionCodeSettings: ActionCodeSettings) {
    return sendPasswordResetEmail(auth, email, actionCodeSettings);
  }

  private signOutCurrentUser() {
    return signOut(auth);
  }

  private buildActionCodeSettings(): ActionCodeSettings {
    const frontendUrl = (environment.frontendUrl || '').trim().replace(/\/+$/, '');

    const settings = {
      url: `${frontendUrl}/auth/action`,
      handleCodeInApp: true
    };

    this.debugAuth('build-action-code-settings', settings);

    return settings;
  }
}
