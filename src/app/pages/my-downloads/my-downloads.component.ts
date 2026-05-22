import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/api.service';
import { AuthService } from '@core/services/auth.service';
import { mapPackWithImage } from '@core/pack-image-map';
import { UserLibraryService } from '@core/services/user-library.service';

interface DownloadItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  image: string;
  downloadedAt: string;
  size: string;
  version: string;
  status: 'available' | 'update';
  statusLabel: string;
  downloadUrl: string | null;
  detailsLink: string;
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
  private userLibraryService = inject(UserLibraryService);
  private requestSequence = 0;
  private pendingDownloadIds = new Set<number>();

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
      action: 'Ver biblioteca',
      link: '/library'
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
    const requestId = ++this.requestSequence;

    if (!usuarioId) {
      this.resetDownloadsState();
      this.hasError = true;
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    try {
      const [response, library] = await Promise.all([
        firstValueFrom(this.apiService.getDownloadsResumo(usuarioId, this.searchTerm)),
        firstValueFrom(this.userLibraryService.loadUserLibrary(usuarioId))
      ]);

      if (requestId !== this.requestSequence) {
        return;
      }

      const downloadUrlByPackId = new Map(
        library.ownedPacks.map((pack) => [pack.id, pack.downloadUrl] as const)
      );

      this.totalDownloads = response.total_downloads;
      this.totalUpdates = response.total_atualizacoes;
      this.recentDownloads = response.downloads_recentes.map((item) =>
        this.mapDownloadItem(item, downloadUrlByPackId.get(item.id) ?? null)
      );
      this.recommendedDownloads = response.sugestoes.map((item) =>
        this.mapDownloadItem(item, downloadUrlByPackId.get(item.id) ?? null, 'Sugestao')
      );
    } catch {
      if (requestId !== this.requestSequence) {
        return;
      }

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

  isDownloadPending(itemId: number): boolean {
    return this.pendingDownloadIds.has(itemId);
  }

  downloadPack(item: DownloadItem): void {
    if (!item.downloadUrl || this.pendingDownloadIds.has(item.id)) {
      return;
    }

    const downloadWindow = window.open('about:blank', '_blank');
    if (downloadWindow?.document) {
      downloadWindow.document.title = 'Preparando download';
      downloadWindow.document.body.innerHTML =
        '<div style="font-family: Arial, sans-serif; padding: 24px; color: #111;">Preparando seu download...</div>';
    }
    this.pendingDownloadIds.add(item.id);
    void this.registerAndOpenDownload(item, downloadWindow);
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
    downloadUrl: string | null,
    fallbackDate?: string,
  ): DownloadItem {
    const packWithImage = mapPackWithImage({ slug: item.slug, nome: item.nome });
    const isUpdate = item.possui_atualizacao;

    return {
      id: item.id,
      slug: item.slug,
      title: item.nome,
      description: item.descricao,
      image: item.capa_url || packWithImage.image,
      downloadedAt: fallbackDate ?? this.formatDate(item.baixado_em),
      size: item.tamanho_gb ? `${item.tamanho_gb} GB` : '--',
      version: item.versao_atual ? `v${item.versao_atual}` : '--',
      status: isUpdate ? 'update' : 'available',
      statusLabel: isUpdate ? 'Atualização' : 'Disponível',
      downloadUrl,
      detailsLink: '/library'
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

  private async registerAndOpenDownload(
    item: DownloadItem,
    downloadWindow: Window | null,
  ): Promise<void> {
    try {
      const usuarioId = this.authService.currentUser()?.backendUserId;

      if (usuarioId) {
        await firstValueFrom(this.apiService.registrarDownload(usuarioId, item.id));
      }
    } catch (error) {
      console.error('Erro ao registrar download em Meus Downloads:', error);
    } finally {
      this.pendingDownloadIds.delete(item.id);

      if (downloadWindow) {
        downloadWindow.location.href = item.downloadUrl!;
      } else {
        window.open(item.downloadUrl!, '_blank');
      }

      void this.carregarResumo();
    }
  }
}
