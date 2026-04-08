import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { ApiService } from '@core/api.service';
import { mapPacksWithImage } from '@core/pack-image-map';
import { finalize } from 'rxjs';

interface StoreHighlight {
  image: string;
  alt: string;
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})
export class StoreComponent implements OnInit {
  private apiService = inject(ApiService);

  packCategories = [
    {
      number: '1',
      title: 'Plugins',
      description: 'Scripts, presets, plugins e recursos para agilizar seu fluxo e facilitar sua edição.'
    },
    {
      number: '2',
      title: 'Vídeos',
      description: 'Arquivos em MP4, MOV e outros formatos prontos para editar e reutilizar no seu conteúdo.'
    },
    {
      number: '3',
      title: 'Imagens',
      description: 'Arquivos em PNG, JPG e outros formatos úteis para composições, thumbnails e posts.'
    },
    {
      number: '4',
      title: 'Links',
      description: 'Ferramentas online para auxílio na criação de artes de alto nível e em destaque no seu conteúdo visual.'
    },
    {
      number: '5',
      title: 'Outros',
      description: 'Arquivos complementares, referências e materiais extras que ampliam ainda mais o pack.'
    }
  ];

  partnerLogos: StoreHighlight[] = [];
  repeatedPartnerLogos: StoreHighlight[] = [];
  isLoadingPopularPacks = true;
  popularPacksError = false;

  premiumFeatures = [
    'Biblioteca de Elementos',
    'Pack de Emojis',
    'Coleção de Ícones Profissionais',
    'Efeitos e Trilhas Sonoras',
    'Kit Inicial de Edição de Vídeo',
    'Pack Adobe Premiere',
    'Pack Adobe Photoshop',
    'Softwares Essenciais do Criador',
    'Pack de Transições Dinâmicas',
    'Banco de Vídeos Virais',
    'Pack CorelDraw',
    'Sistema Completo de Inteligência Artificial',
    'Biblioteca de Backgrounds',
    'Templates Canva',
    'Pack de Personagens Editáveis',
    'Pack de Efeitos VFX',
    'Pack Adobe Illustrator',
    'Pack Adobe Lightroom',
    'Pack After Effects',
    'Ferramenta Profissional de Download de Reels',
    'Banco Exclusivo de Vídeos Profissionais',
    'Modelos Profissionais de Gestão em Excel',
    'Biblioteca de Conteúdos PLR',
    'Suite de Ferramentas Online Profissionais',
    'Kit Completo de Marketing Digital'
  ];

  goldFeatures = [
    'Biblioteca de Elementos',
    'Pack de Emojis',
    'Coleção de Ícones Profissionais',
    'Efeitos e Trilhas Sonoras',
    'Kit Inicial de Edição de Vídeo',
    'Pack Adobe Premiere',
    'Pack Adobe Photoshop',
    'Softwares Essenciais do Criador',
    'Pack de Transições Dinâmicas',
    'Banco de Vídeos Virais',
    'Pack CorelDraw',
    'Sistema Completo de Inteligência Artificial',
    'Biblioteca de Backgrounds',
    'Templates Canva',
    'Pack de Personagens Editáveis',
    'Pack de Efeitos VFX'
  ];

  basicFeatures = [
    'Biblioteca de Elementos',
    'Pack de Emojis',
    'Coleção de Ícones Profissionais',
    'Efeitos e Trilhas Sonoras',
    'Kit Inicial de Edição de Vídeo',
    'Pack Adobe Premiere',
    'Pack Adobe Photoshop',
    'Softwares Essenciais do Criador',
    'Pack de Transições Dinâmicas',
    'Banco de Vídeos Virais'
  ];

  ngOnInit(): void {
    this.loadPopularPacks();
  }

  private loadPopularPacks(): void {
    this.apiService.getPacksDestaque(10).pipe(
      finalize(() => {
        this.isLoadingPopularPacks = false;
      })
    ).subscribe({
      next: ({ packs }) => {
        this.popularPacksError = false;

        this.partnerLogos = mapPacksWithImage(packs).map((pack) => ({
          image: pack.image,
          alt: pack.nome
        }));
        this.repeatedPartnerLogos = [...this.partnerLogos, ...this.partnerLogos];
      },
      error: (error) => {
        this.popularPacksError = true;
        this.partnerLogos = [];
        this.repeatedPartnerLogos = [];
        console.error('Erro ao carregar packs populares na store:', error);
      }
    });
  }
}
