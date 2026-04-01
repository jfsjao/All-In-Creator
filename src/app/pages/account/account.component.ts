import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/api.service';
import { ToastrService } from 'ngx-toastr';
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
  private toastr = inject(ToastrService);

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
      title: 'Ajustar preferencias',
      description: 'Controle avisos da plataforma e novidades da sua conta.'
    },
    {
      title: 'Reforcar seguranca',
      description: 'Revise senha, acesso recente e protecao da sua conta.'
    }
  ];

  recentActivity: AccountActivity[] = [
    {
      title: 'Download concluido',
      detail: 'Kit After Effects foi baixado com sucesso.',
      date: 'Hoje, 09:42'
    },
    {
      title: 'Login recente',
      detail: 'Acesso realizado em dispositivo mobile.',
      date: 'Ontem, 21:17'
    },
    {
      title: 'Preferencias salvas',
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
    await this.authService.waitForAuthInit();
    const usuarioId = this.authService.currentUser()?.backendUserId;

    if (!usuarioId) {
      this.preencherFallback();
      return;
    }

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
      this.toastr.error('Nao foi possivel carregar o perfil.', 'Erro');
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
      this.toastr.error('Usuario nao identificado.', 'Erro');
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
      this.toastr.error(error?.error?.message || 'Nao foi possivel salvar o perfil.', 'Erro');
    } finally {
      this.isSaving = false;
    }
  }

  async trocarSenha(): Promise<void> {
    const email = this.profileForm.email || this.authService.currentUser()?.email;

    if (!email) {
      this.toastr.error('Informe um email valido para recuperar a senha.', 'Erro');
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
