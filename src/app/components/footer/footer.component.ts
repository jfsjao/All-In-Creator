import { Component, inject, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClipboardService } from '../../core/services/clipboard/clipboard.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnDestroy {
  private clipboard = inject(ClipboardService);
  private toastr = inject(ToastrService);
  private notificationTimeout: any;

  links = [
    { path: '/home', title: 'Home' },
    { path: '/about', title: 'Sobre' },
    { path: '/services', title: 'Serviços' },
    { path: '/contact', title: 'Contato' }
  ];

  currentYear = new Date().getFullYear();
  showNotification = false;
  notificationMessage = '';
  copiedItemType: 'email' | 'phone' | null = null;

  async copyContact(value: string, type: 'email' | 'phone', event: MouseEvent) {
    event.preventDefault();

    // Reset da notificação antes de mostrar novamente
    this.showNotification = false;

    // Pequeno delay para garantir que o reset seja processado
    await new Promise(resolve => setTimeout(resolve, 50));

    // Limpa o timeout anterior se existir
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    try {
      const success = await this.clipboard.copyToClipboard(value);

      if (success) {
        this.copiedItemType = type;
        this.notificationMessage = type === 'email' ? 'Email copiado!' : 'Telefone copiado!';
        this.showNotification = true;

        // Configura o timeout para esconder a notificação
        this.notificationTimeout = setTimeout(() => {
          this.showNotification = false;
          this.copiedItemType = null;
        }, 2000);
      } else {
        this.toastr.error('Falha ao copiar para a área de transferência');
      }
    } catch (error) {
      this.toastr.error('Erro inesperado ao copiar');
      console.error('Copy error:', error);
    }
  }

  ngOnDestroy() {
    // Limpa o timeout quando o componente é destruído
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }
}