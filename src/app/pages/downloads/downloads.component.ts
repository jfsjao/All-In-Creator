import { Component, inject, OnInit } from '@angular/core';
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
  status: 'Disponível' | 'Atualização';
}

interface QuickAction {
  label: string;
  detail: string;
  action: string;
  link: string;
}

@Component({
  selector: 'app-downloads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './downloads.component.html',
  styleUrl: './downloads.component.scss',
})
export class DownloadsComponent implements OnInit {
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
      link: '/packs'
    },
    {
      label: 'Atualizar downloads',
      detail: 'Confira novas versões dos arquivos que você já baixou.',
      action: 'Ver novidades',
      link: '/store'
    }
  ];

  async ngOnInit(): Promise<void> {
    await this.carregarResumo();
  }

  async carregarResumo(): Promise<void> {
    const snapshotUser = this.authService.currentUser();
    const usuarioId = snapshotUser?.backendUserId;

    if (!usuarioId) {
      this.applyFallbackDownloads();
      return;
    }

    await this.authService.waitForAuthInit();

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

    return {
      id: item.id,
      title: item.nome,
      description: item.descricao,
      image: item.capa_url || packWithImage.image,
      downloadedAt: fallbackDate ?? this.formatDate(item.baixado_em),
      size: item.tamanho_gb ? `${item.tamanho_gb} GB` : '--',
      version: item.versao_atual ? `v${item.versao_atual}` : '--',
      status: item.possui_atualizacao ? 'Atualização' : 'Disponível'
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

  private applyFallbackDownloads(): void {
    this.totalDownloads = 1;
    this.totalUpdates = 0;
    this.recentDownloads = [
      {
        id: 2,
        title: 'Pack IA',
        description: 'Coleção com assets modernos para criadores e conteúdos virais.',
        image: 'assets/images/packs/pack-ia.png',
        downloadedAt: '01/04 18:11',
        size: '8.9 GB',
        version: 'v2.8',
        status: 'Disponível'
      }
    ];
    this.recommendedDownloads = [
      {
        id: 1,
        title: 'Emojis',
        description: 'Biblioteca leve para enriquecer cortes rápidos, shorts e reels.',
        image: 'assets/images/packs/emoji.png',
        downloadedAt: 'Sugestão',
        size: '1.1 GB',
        version: 'v1.6',
        status: 'Disponível'
      }
    ];
    this.hasError = false;
    this.isLoading = false;
  }
}
