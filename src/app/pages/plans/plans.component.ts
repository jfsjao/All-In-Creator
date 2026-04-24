import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';

interface PlansHighlight {
  image: string;
  alt: string;
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent {
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

  partnerLogos: PlansHighlight[] = [
    { image: 'assets/images/logos/adobe_illustrator.webp', alt: 'Adobe Illustrator' },
    { image: 'assets/images/logos/after_effects.webp', alt: 'After Effects' },
    { image: 'assets/images/logos/lightroom.webp', alt: 'Adobe Lightroom' },
    { image: 'assets/images/logos/premier.webp', alt: 'Adobe Premiere' },
    { image: 'assets/images/logos/photoshop.webp', alt: 'Adobe Photoshop' },
    { image: 'assets/images/logos/broke.webp', alt: 'Broke' },
    { image: 'assets/images/logos/chatgpt.webp', alt: 'ChatGPT' },
    { image: 'assets/images/logos/gemini.webp', alt: 'Gemini' },
    { image: 'assets/images/logos/canva.webp', alt: 'Canva' }
  ];
  repeatedPartnerLogos: PlansHighlight[] = [...this.partnerLogos, ...this.partnerLogos];

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

  proFeatures = [
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

}
