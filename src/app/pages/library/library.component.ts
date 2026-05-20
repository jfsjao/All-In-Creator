import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/api.service';
import { AuthService } from '@core/services/auth.service';
import { UserLibraryPack, UserLibraryService } from '@core/services/user-library.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private userLibraryService = inject(UserLibraryService);
  private searchTimeout?: number;
  private requestSequence = 0;
  private pendingDownloadIds = new Set<number>();

  searchTerm = '';
  private readonly ROW_SCROLL_AMOUNT = 960;

  myPacks: UserLibraryPack[] = [];
  featuredPacks: UserLibraryPack[] = [];
  noveltyPacks: UserLibraryPack[] = [];
  allPacks: UserLibraryPack[] = [];
  upgradePacks: UserLibraryPack[] = [];
  selectedPack: UserLibraryPack | null = null;
  isLoadingPacks = true;
  packsError = false;

  async ngOnInit(): Promise<void> {
    await this.authService.waitForAuthInit();
    this.loadLibrary();
  }

  get hasActiveSearch(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;

    if (this.searchTimeout) {
      window.clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = window.setTimeout(() => {
      this.loadLibrary();
    }, 300);
  }

  filterPacks(packs: UserLibraryPack[]): UserLibraryPack[] {
    return packs;
  }

  scrollRow(rowId: string, direction: number): void {
    const row = document.getElementById(rowId);

    if (!row) return;

    row.scrollBy({
      left: this.ROW_SCROLL_AMOUNT * direction,
      behavior: 'smooth'
    });
  }

  openPackDetails(pack: UserLibraryPack): void {
    this.selectedPack = pack;
  }

  closePackDetails(): void {
    this.selectedPack = null;
  }

  isDownloadPending(packId: number): boolean {
    return this.pendingDownloadIds.has(packId);
  }

  downloadPack(pack: UserLibraryPack): void {
    if (!pack.downloadUrl || this.pendingDownloadIds.has(pack.id)) {
      return;
    }

    const downloadWindow = window.open('about:blank', '_blank');
    if (downloadWindow?.document) {
      downloadWindow.document.title = 'Preparando download';
      downloadWindow.document.body.innerHTML =
        '<div style="font-family: Arial, sans-serif; padding: 24px; color: #111;">Preparando seu download...</div>';
    }
    this.pendingDownloadIds.add(pack.id);
    void this.registerAndOpenDownload(pack, downloadWindow);
  }

  private loadLibrary(): void {
    const user = this.authService.currentUser();
    const requestId = ++this.requestSequence;

    if (!user?.backendUserId) {
      this.myPacks = [];
      this.featuredPacks = [];
      this.noveltyPacks = [];
      this.allPacks = [];
      this.upgradePacks = [];
      this.packsError = true;
      this.isLoadingPacks = false;
      return;
    }

    this.isLoadingPacks = true;

    this.userLibraryService.loadUserLibrary(user.backendUserId, this.searchTerm).subscribe({
      next: (library) => {
        if (requestId !== this.requestSequence) {
          return;
        }

        this.myPacks = library.ownedPacks;
        this.featuredPacks = library.featuredPacks;
        this.noveltyPacks = library.noveltyPacks;
        this.allPacks = library.allPacks;
        this.upgradePacks = library.plan.slug === 'premium' ? [] : library.upgradePacks;
        this.packsError = false;
        this.isLoadingPacks = false;
      },
      error: (error) => {
        if (requestId !== this.requestSequence) {
          return;
        }

        console.error('Erro ao carregar biblioteca do usuário:', error);
        this.myPacks = [];
        this.featuredPacks = [];
        this.noveltyPacks = [];
        this.allPacks = [];
        this.upgradePacks = [];
        this.packsError = true;
        this.isLoadingPacks = false;
      }
    });
  }

  private async registerAndOpenDownload(
    pack: UserLibraryPack,
    downloadWindow: Window | null,
  ): Promise<void> {
    try {
      const usuarioId = this.authService.currentUser()?.backendUserId;

      if (usuarioId) {
        await firstValueFrom(this.apiService.registrarDownload(usuarioId, pack.id));
      }
    } catch (error) {
      console.error('Erro ao registrar download do pack:', error);
    } finally {
      this.pendingDownloadIds.delete(pack.id);

      if (downloadWindow) {
        downloadWindow.location.href = pack.downloadUrl!;
        return;
      }

      window.open(pack.downloadUrl!, '_blank');
    }
  }
}
