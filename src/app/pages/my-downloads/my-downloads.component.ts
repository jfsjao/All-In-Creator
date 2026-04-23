import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/api.service';
import { AuthService } from '@core/services/auth.service';
import { mapPackWithImage } from '@core/pack-image-map';

interface DownloadItem {
  id: number;
  title: string;
  description: string;
  image: string;
  downloadedAt: string;
  size: string;
  version: string;
  status: 'available' | 'update';
  statusLabel: string;
}

interface QuickAction {
  label: string;
  detail: string;
  action: string;
  link: string;
}

@Component({
  selector: 'app-my-downloads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-downloads.component.html',
  styleUrl: './my-downloads.component.scss',
})
export class MyDownloadsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  searchTerm = '';
  isLoading = false;
  hasError = false;
  totalDownloads = 0;
  totalUpdates = 0;
  private searchTimeout?: number;

  recentDownloads: DownloadItem[] = [];
  recommendedDownloads: DownloadItem[] = [];

  quickActions: QuickAction[] = [
    {
      label: 'Abrir biblioteca',
      detail: 'Veja todos os packs liberados na sua conta.',
      action: 'Ir para packs',
      link: '/library'
    },
    {
      label: 'Atualizar downloads',
      detail: 'Confira novas versões dos arquivos que você já baixou.',
      action: 'Ver novidades',
      link: '/plans'
    }
  ];

  async ngOnInit(): Promise<void> {
    await this.carregarResumo();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      window.clearTimeout(this.searchTimeout);
    }
  }

  async carregarResumo(): Promise<void> {
    await this.authService.waitForAuthInit();
    const usuarioId = this.authService.currentUser()?.backendUserId;

    if (!usuarioId) {
      this.resetDownloadsState();
      this.hasError = true;
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    try {
      const response = await firstValueFrom(
        this.apiService.getDownloadsResumo(usuarioId, this.searchTerm)
      );
      this.totalDownloads = response.total_downloads;
      this.totalUpdates = response.total_atualizacoes;
      this.recentDownloads = response.downloads_recentes.map((item) => this.mapDownloadItem(item));
      this.recommendedDownloads = response.sugestoes.map((item) =>
        this.mapDownloadItem(item, 'Sugestão')
      );
    } catch {
      this.resetDownloadsState();
      this.hasError = true;
    } finally {
      this.isLoading = false;
    }
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    if (this.searchTimeout) {
      window.clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = window.setTimeout(() => {
      this.carregarResumo();
    }, 350);
  }

  private mapDownloadItem(
    item: {
      id: number;
      slug: string;
      nome: string;
      descricao: string;
      capa_url: string | null;
      tamanho_gb: string | null;
      versao_atual: string | null;
      versao_baixada: string | null;
      baixado_em: string;
      possui_atualizacao: boolean;
    },
    fallbackDate?: string,
  ): DownloadItem {
    const packWithImage = mapPackWithImage({ slug: item.slug, nome: item.nome });
    const isUpdate = item.possui_atualizacao;

    return {
      id: item.id,
      title: item.nome,
      description: item.descricao,
      image: item.capa_url || packWithImage.image,
      downloadedAt: fallbackDate ?? this.formatDate(item.baixado_em),
      size: item.tamanho_gb ? `${item.tamanho_gb} GB` : '--',
      version: item.versao_atual ? `v${item.versao_atual}` : '--',
      status: isUpdate ? 'update' : 'available',
      statusLabel: isUpdate ? 'Atualização' : 'Disponível'
    };
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '--';

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get filteredRecentDownloads(): DownloadItem[] {
    return this.recentDownloads;
  }

  private resetDownloadsState(): void {
    this.totalDownloads = 0;
    this.totalUpdates = 0;
    this.recentDownloads = [];
    this.recommendedDownloads = [];
  }
}
