import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface DownloadItem {
  id: number;
  title: string;
  description: string;
  image: string;
  downloadedAt: string;
  size: string;
  version: string;
  status: 'Disponivel' | 'Atualizacao';
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
export class DownloadsComponent {
  searchTerm = '';

  recentDownloads: DownloadItem[] = [
    {
      id: 1,
      title: 'Kit After Effects',
      description: 'Pacote com templates, presets e elementos para acelerar edições.',
      image: 'assets/images/packs/kit_after_effects.webp',
      downloadedAt: 'Hoje, 09:42',
      size: '12.4 GB',
      version: 'v4.2',
      status: 'Disponivel'
    },
    {
      id: 2,
      title: 'Pack IA',
      description: 'Coleção com assets modernos para criativos e conteúdos virais.',
      image: 'assets/images/packs/IA.webp',
      downloadedAt: 'Ontem, 21:15',
      size: '8.9 GB',
      version: 'v2.8',
      status: 'Atualizacao'
    },
    {
      id: 3,
      title: 'Emojis',
      description: 'Biblioteca leve para enriquecer cortes rápidos, shorts e reels.',
      image: 'assets/images/packs/emojis.webp',
      downloadedAt: '14 Mar, 18:03',
      size: '1.1 GB',
      version: 'v1.6',
      status: 'Disponivel'
    },
    {
      id: 4,
      title: 'Baixar Reels',
      description: 'Materiais essenciais para creators que precisam de agilidade.',
      image: 'assets/images/packs/baixar_reels.webp',
      downloadedAt: '12 Mar, 13:27',
      size: '5.2 GB',
      version: 'v3.1',
      status: 'Disponivel'
    }
  ];

  recommendedDownloads: DownloadItem[] = [
    {
      id: 5,
      title: 'Canva Pack',
      description: 'Artes prontas, templates e elementos para redes sociais.',
      image: 'assets/images/packs/canva.webp',
      downloadedAt: 'Sugestão',
      size: '3.7 GB',
      version: 'v2.0',
      status: 'Disponivel'
    },
    {
      id: 6,
      title: 'Premiere Pack',
      description: 'Transições, LUTs e presets para edição profissional.',
      image: 'assets/images/packs/premiere.webp',
      downloadedAt: 'Sugestão',
      size: '14.8 GB',
      version: 'v5.0',
      status: 'Atualizacao'
    }
  ];

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

  get filteredRecentDownloads(): DownloadItem[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return this.recentDownloads;

    return this.recentDownloads.filter((item) =>
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.status.toLowerCase().includes(term)
    );
  }
}
