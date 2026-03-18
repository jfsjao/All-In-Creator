import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';

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
export class AccountComponent {
  private authService = inject(AuthService);

  profileForm = {
    name: this.authService.currentUser()?.displayName || 'João Felipe',
    email: this.authService.currentUser()?.email || 'usuario@email.com',
    phone: '(16) 99999-9999',
    role: 'Editor / Creator'
  };

  preferences = {
    notifications: true,
    launches: true,
    darkCards: true
  };

  shortcuts: AccountShortcut[] = [
    {
      title: 'Atualizar perfil',
      description: 'Mantenha seus dados principais e forma de contato organizados.'
    },
    {
      title: 'Ajustar preferências',
      description: 'Controle avisos da plataforma, novidades e experiência da conta.'
    },
    {
      title: 'Reforçar segurança',
      description: 'Revise senha, acesso recente e proteção da sua conta.'
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

  get currentUserName(): string {
    return this.authService.currentUser()?.displayName || 'Seu perfil';
  }

  get currentUserEmail(): string {
    return this.authService.currentUser()?.email || 'usuario@email.com';
  }
}
