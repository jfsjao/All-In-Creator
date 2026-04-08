import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/api.service';
import { SafeToastrService } from '@core/services/safe-toastr.service';
import { firstValueFrom } from 'rxjs';

interface AccountShortcut {
  title: string;
  description: string;
}

interface AccountActivity {
  title: string;
  detail: string;
  date: string;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
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

  recentActivity: AccountActivity[] = [
    {
      title: 'Download concluído',
      detail: 'Kit After Effects foi baixado com sucesso.',
      date: 'Hoje, 09:42'
    },
    {
      title: 'Login recente',
      detail: 'Acesso realizado em dispositivo mobile.',
      date: 'Ontem, 21:17'
    },
    {
      title: 'Preferências salvas',
      detail: 'Recebimento de novidades foi mantido ativo.',
      date: '14 Mar, 19:10'
    }
  ];

  isLoading = false;
  isSaving = false;

  async ngOnInit(): Promise<void> {
    await this.carregarPerfil();
  }

  async carregarPerfil(): Promise<void> {
    const snapshotUser = this.authService.currentUser();
    const usuarioId = snapshotUser?.backendUserId;

    if (!usuarioId) {
      this.preencherFallback();
      return;
    }

    await this.authService.waitForAuthInit();
    this.isLoading = true;

    try {
      const response = await firstValueFrom(this.apiService.getMeuPerfil(usuarioId));
      this.profileForm = {
        name: response.usuario.nome ?? '',
        email: response.usuario.email ?? '',
        phone: response.usuario.telefone ?? '',
        role: response.usuario.area_atuacao ?? ''
      };
    } catch {
      this.preencherFallback();
      this.toastr.error('Não foi possível carregar o perfil.', 'Erro');
    } finally {
      this.isLoading = false;
    }
  }

  private preencherFallback(): void {
    this.profileForm = {
      name: this.authService.currentUser()?.displayName || 'Seu nome',
      email: this.authService.currentUser()?.email || 'usuario@email.com',
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
          email: this.profileForm.email,
          telefone: this.profileForm.phone,
          area_atuacao: this.profileForm.role
        })
      );

      this.profileForm = {
        name: response.usuario.nome ?? this.profileForm.name,
        email: response.usuario.email ?? this.profileForm.email,
        phone: response.usuario.telefone ?? this.profileForm.phone,
        role: response.usuario.area_atuacao ?? this.profileForm.role
      };

      this.toastr.success('Perfil atualizado com sucesso.', 'Sucesso');
    } catch (error: any) {
      this.toastr.error(error?.error?.message || 'Não foi possível salvar o perfil.', 'Erro');
    } finally {
      this.isSaving = false;
    }
  }

  async trocarSenha(): Promise<void> {
    const email = this.profileForm.email || this.authService.currentUser()?.email;

    if (!email) {
      this.toastr.error('Informe um e-mail válido para recuperar a senha.', 'Erro');
      return;
    }

    await this.authService.resetPassword(email);
  }

  get currentUserName(): string {
    return this.authService.currentUser()?.displayName || 'Seu perfil';
  }

  get currentUserEmail(): string {
    return this.authService.currentUser()?.email || 'usuario@email.com';
  }
}
