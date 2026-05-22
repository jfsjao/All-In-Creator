import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/api.service';
import { SafeToastrService } from '@core/services/safe-toastr.service';

interface AccountShortcut {
  title: string;
  description: string;
}

interface AccountActivity {
  title: string;
  detail: string;
  date: string;
  occurredAt: string;
}

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-account.component.html',
  styleUrl: './my-account.component.scss',
})
export class MyAccountComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastr = inject(SafeToastrService);

  profileForm = {
    name: '',
    email: '',
    phone: '',
    role: ''
  };

  preferences = {
    notifications: true,
    launches: true
  };

  shortcuts: AccountShortcut[] = [
    {
      title: 'Atualizar perfil',
      description: 'Mantenha seus dados principais e forma de contato organizados.'
    },
    {
      title: 'Ajustar preferências',
      description: 'Controle os avisos da plataforma e as novidades da sua conta.'
    },
    {
      title: 'Reforçar segurança',
      description: 'Revise a senha, o acesso recente e a proteção da sua conta.'
    }
  ];

  recentActivity: AccountActivity[] = [];

  isLoading = false;
  isSaving = false;
  hasLoadError = false;
  readonly emailHelperText =
    'O e-mail da conta permanece protegido por enquanto. Quando abrirmos essa alteração, ela vai passar por um fluxo mais seguro.';

  async ngOnInit(): Promise<void> {
    this.preencherComUsuarioAutenticado();
    await this.carregarPerfil();
    await this.carregarAtividades();
  }

  async carregarPerfil(): Promise<void> {
    await this.authService.waitForAuthInit();
    const usuarioId = this.authService.currentUser()?.backendUserId;

    if (!usuarioId) {
      this.hasLoadError = true;
      return;
    }

    this.isLoading = true;
    this.hasLoadError = false;

    try {
      const response = await firstValueFrom(this.apiService.getMeuPerfil(usuarioId));
      this.profileForm = {
        name: response.usuario.nome ?? '',
        email: response.usuario.email ?? '',
        phone: response.usuario.telefone ?? '',
        role: response.usuario.area_atuacao ?? ''
      };
    } catch {
      this.hasLoadError = true;
      this.preencherComUsuarioAutenticado();
      this.toastr.error('Não foi possível carregar o perfil.', 'Erro');
    } finally {
      this.isLoading = false;
    }
  }

  private preencherComUsuarioAutenticado(): void {
    const currentUser = this.authService.currentUser();

    this.profileForm = {
      name: currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: '',
      role: ''
    };
  }

  async salvarPerfil(): Promise<void> {
    const usuarioId = this.authService.currentUser()?.backendUserId;

    if (!usuarioId) {
      this.toastr.error('Usuário não identificado.', 'Erro');
      return;
    }

    this.isSaving = true;

    try {
      const response = await firstValueFrom(
        this.apiService.atualizarMeuPerfil(usuarioId, {
          nome: this.profileForm.name,
          email: this.currentUserEmail,
          telefone: this.profileForm.phone,
          area_atuacao: this.profileForm.role
        })
      );

      if (response.usuario.nome && response.usuario.nome !== this.authService.currentUser()?.displayName) {
        await this.authService.updateCurrentUserProfile({
          displayName: response.usuario.nome
        });
      }

      this.profileForm = {
        name: response.usuario.nome ?? this.profileForm.name,
        email: response.usuario.email ?? this.currentUserEmail,
        phone: response.usuario.telefone ?? this.profileForm.phone,
        role: response.usuario.area_atuacao ?? this.profileForm.role
      };

      this.hasLoadError = false;
      await this.carregarAtividades();
      this.toastr.success('Perfil atualizado com sucesso.', 'Sucesso');
    } catch (error: any) {
      this.toastr.error(error?.error?.message || 'Não foi possível salvar o perfil.', 'Erro');
    } finally {
      this.isSaving = false;
    }
  }

  async trocarSenha(): Promise<void> {
    const email = this.currentUserEmail || this.profileForm.email;

    if (!email) {
      this.toastr.error('Informe um e-mail válido para recuperar a senha.', 'Erro');
      return;
    }

    const ok = await this.authService.resetPassword(email);

    if (ok) {
      await this.carregarAtividades();
    }
  }

  get currentUserName(): string {
    return this.authService.currentUser()?.displayName || this.profileForm.name || 'Seu perfil';
  }

  get currentUserEmail(): string {
    return this.authService.currentUser()?.email || this.profileForm.email || 'usuario@email.com';
  }

  private async carregarAtividades(): Promise<void> {
    await this.authService.waitForAuthInit();
    const currentUser = this.authService.currentUser();

    if (!currentUser?.backendUserId) {
      this.recentActivity = [];
      return;
    }

    try {
      const response = await firstValueFrom(
        this.apiService.getMyActivities(6)
      );
      this.recentActivity = response.atividades.map((activity) => ({
        title: activity.titulo,
        detail: activity.detalhe,
        date: this.formatActivityDate(activity.criado_em),
        occurredAt: activity.criado_em,
      }));
    } catch {
      this.recentActivity = [];
    }
  }

  private formatActivityDate(dateString: string): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
