import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface PackItem {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  badge: string;
  locked?: boolean;
}

@Component({
  selector: 'app-packs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './packs.component.html',
  styleUrls: ['./packs.component.scss']
})
export class PacksComponent {
  searchTerm = '';

  myPacks: PackItem[] = [
    {
      id: 1,
      title: 'Baixar Reels',
      description: 'Materiais essenciais para começar com mais qualidade.',
      image: 'assets/images/packs/baixar_reels.webp',
      category: 'Liberados',
      badge: 'Liberado'
    },
    {
      id: 2,
      title: 'Kit After Effects',
      description: 'Modelos prontos para vídeos curtos e reels.',
      image: 'assets/images/packs/kit_after_effects.webp',
      category: 'Liberados',
      badge: 'Novo'
    },
    {
      id: 3,
      title: 'Emojis',
      description: 'Ajustes rápidos para elevar o visual do conteúdo.',
      image: 'assets/images/packs/emojis.webp',
      category: 'Liberados',
      badge: 'Popular'
    }
  ];

  popularPacks: PackItem[] = [
    {
      id: 4,
      title: 'Illustrator Pack',
      description: 'O pacote mais completo da plataforma.',
      image: 'assets/images/packs/illustrator_Pack.webp',
      category: 'Populares',
      badge: 'Top 1'
    },
    {
      id: 5,
      title: 'Pack IA',
      description: 'Conteúdos visuais focados em retenção.',
      image: 'assets/images/packs/IA.webp',
      category: 'Populares',
      badge: 'Em alta'
    },
    {
      id: 6,
      title: 'Photoshop Pack',
      description: 'Biblioteca avançada para creators mais exigentes.',
      image: 'assets/images/packs/photoshop_pack.webp',
      category: 'Populares',
      badge: 'Premium',
      locked: true
    }
  ];

  newPacks: PackItem[] = [
    {
      id: 7,
      title: 'Pack Stories Pro',
      description: 'Templates modernos para stories e anúncios.',
      image: 'assets/images/empresa/nico-marketing.jpg',
      category: 'Novidades',
      badge: 'Novo'
    },
    {
      id: 8,
      title: 'Motion Fast Pack',
      description: 'Elementos e composições com mais impacto visual.',
      image: 'assets/images/empresa/nico-coringa.jpg',
      category: 'Novidades',
      badge: 'Atualizado'
    }
  ];

  premiumSuggestions: PackItem[] = [
    {
      id: 9,
      title: 'Elite Premium Pack',
      description: 'Acesso aos materiais mais completos da plataforma.',
      image: 'assets/images/depoimentos/gustavojose.png',
      category: 'Premium',
      badge: 'Upgrade',
      locked: true
    },
    {
      id: 10,
      title: 'Full Creator Library',
      description: 'Biblioteca premium com conteúdos exclusivos.',
      image: 'assets/images/empresa/nico-marketing.jpg',
      category: 'Premium',
      badge: 'Exclusivo',
      locked: true
    }
  ];

  filterPacks(packs: PackItem[]): PackItem[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return packs;

    return packs.filter(pack =>
      pack.title.toLowerCase().includes(term) ||
      pack.description.toLowerCase().includes(term) ||
      pack.badge.toLowerCase().includes(term)
    );
  }
}