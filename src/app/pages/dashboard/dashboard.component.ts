import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface DashboardSlide {
  image: string;
  alt: string;
  tag: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

interface UserPack {
  id: number;
  name: string;
  description: string;
  totalFiles: number;
  updatedAt: string;
  link: string;
  downloadUrl: string;
}

interface NewsItem {
  id: number;
  tag: string;
  title: string;
  description: string;
  date: string;
}

interface PopularPack {
  id: number;
  rank: number;
  name: string;
  description: string;
  highlight: string;
  link: string;
}

interface UpgradePlan {
  id: number;
  label: string;
  name: string;
  description: string;
  features: string[];
  link: string;
}

type UserPlan = 'basic' | 'intermediate' | 'premium';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);

  userName = 'Cliente';
  userPlan: UserPlan = 'basic';

  currentSlide = 0;
  private slideInterval?: ReturnType<typeof setInterval>;

  slides: DashboardSlide[] = [
    {
      image: 'assets/images/empresa/nico-marketing.jpg',
      alt: 'Novidades da plataforma',
      tag: 'Atualização',
      title: 'Novos conteúdos adicionados ao seu acesso',
      description: 'Acompanhe as últimas novidades da plataforma e veja quais materiais foram liberados ou atualizados.',
      buttonText: 'Ver meus packs',
      buttonLink: '/dashboard'
    },
    {
      image: 'assets/images/empresa/nico-coringa.jpg',
      alt: 'Packs em destaque',
      tag: 'Destaque',
      title: 'Os packs mais populares da semana',
      description: 'Veja o que está em alta entre os clientes e descubra novos conteúdos para elevar seu resultado.',
      buttonText: 'Explorar store',
      buttonLink: '/store'
    },
    {
      image: 'assets/images/depoimentos/gustavojose.png',
      alt: 'Upgrade de acesso',
      tag: 'Upgrade',
      title: 'Desbloqueie ainda mais conteúdos premium',
      description: 'Suba de nível para liberar packs mais completos, atualizações exclusivas e materiais avançados.',
      buttonText: 'Ver planos',
      buttonLink: '/store'
    }
  ];

  myPacks: UserPack[] = [];
  news: NewsItem[] = [];
  popularPacks: PopularPack[] = [];
  upgradeSuggestions: UpgradePlan[] = [];

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  private loadUserData(): void {
    const user = this.authService.currentUser();

    if (user?.displayName) {
      this.userName = user.displayName;
    } else if (user?.email) {
      this.userName = user.email.split('@')[0];
    }

    // Mock temporário
    // Depois você troca isso pelo plano vindo do backend/banco
    this.userPlan = 'basic';
  }

  private loadDashboardData(): void {
    this.myPacks = this.getMyPacksByPlan(this.userPlan);
    this.news = this.getNewsItems();
    this.popularPacks = this.getPopularPacks();
    this.upgradeSuggestions = this.getUpgradeSuggestions(this.userPlan);
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  private startAutoSlide(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  private stopAutoSlide(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  private getMyPacksByPlan(plan: UserPlan): UserPack[] {
    const basicPacks: UserPack[] = [
      {
        id: 1,
        name: 'Pack Básico',
        description: 'Conteúdos essenciais para começar com mais qualidade e velocidade.',
        totalFiles: 24,
        updatedAt: '15/03/2026',
        link: '/store',
        downloadUrl: 'https://onedrive.live.com/'
      },
      {
        id: 2,
        name: 'Templates Shorts',
        description: 'Modelos rápidos para vídeos curtos, reels e conteúdos com mais retenção.',
        totalFiles: 18,
        updatedAt: '12/03/2026',
        link: '/store',
        downloadUrl: 'https://onedrive.live.com/'
      }
    ];

    const intermediateExtra: UserPack[] = [
      {
        id: 3,
        name: 'Pack Intermediário',
        description: 'Mais variedade de materiais, presets e recursos para escalar sua produção.',
        totalFiles: 42,
        updatedAt: '14/03/2026',
        link: '/store',
        downloadUrl: 'https://onedrive.live.com/'
      }
    ];

    const premiumExtra: UserPack[] = [
      {
        id: 4,
        name: 'Pack Premium',
        description: 'Acesso ao pacote mais completo, com materiais avançados e conteúdos exclusivos.',
        totalFiles: 80,
        updatedAt: '15/03/2026',
        link: '/store',
        downloadUrl: 'https://onedrive.live.com/'
      }
    ];

    if (plan === 'basic') {
      return basicPacks;
    }

    if (plan === 'intermediate') {
      return [...basicPacks, ...intermediateExtra];
    }

    return [...basicPacks, ...intermediateExtra, ...premiumExtra];
  }

  private getNewsItems(): NewsItem[] {
    return [
      {
        id: 1,
        tag: 'Novo conteúdo',
        title: 'Novos templates adicionados ao acervo',
        description: 'Atualizamos a biblioteca com novos materiais para vídeos curtos e criativos mais dinâmicos.',
        date: '15/03/2026'
      },
      {
        id: 2,
        tag: 'Melhoria',
        title: 'Organização dos packs foi atualizada',
        description: 'Agora os conteúdos estão mais bem separados por tema e categoria para facilitar seu uso.',
        date: '13/03/2026'
      },
      {
        id: 3,
        tag: 'Destaque',
        title: 'Pack Supremo segue entre os mais acessados',
        description: 'O conteúdo continua entre os favoritos dos usuários por reunir materiais de alto desempenho.',
        date: '11/03/2026'
      }
    ];
  }

  private getPopularPacks(): PopularPack[] {
    return [
      {
        id: 1,
        rank: 1,
        name: 'Pack Supremo',
        description: 'Coleção completa com materiais de alta conversão e uso prático para creators.',
        highlight: 'Mais baixado da semana',
        link: '/store'
      },
      {
        id: 2,
        rank: 2,
        name: 'Presets Premium',
        description: 'Pacote com ajustes prontos para elevar a qualidade visual do conteúdo.',
        highlight: 'Em alta entre creators',
        link: '/store'
      },
      {
        id: 3,
        rank: 3,
        name: 'Templates Viralizáveis',
        description: 'Modelos focados em retenção, estética e impacto visual para vídeos e posts.',
        highlight: 'Alta procura este mês',
        link: '/store'
      }
    ];
  }

  private getUpgradeSuggestions(plan: UserPlan): UpgradePlan[] {
    if (plan === 'premium') {
      return [];
    }

    if (plan === 'basic') {
      return [
        {
          id: 1,
          label: 'Próximo nível',
          name: 'Plano Intermediário',
          description: 'Liberte mais packs, materiais extras e uma biblioteca mais robusta para acelerar seu conteúdo.',
          features: [
            'Mais packs liberados',
            'Mais variedade de templates',
            'Atualizações recorrentes'
          ],
          link: '/store'
        },
        {
          id: 2,
          label: 'Acesso máximo',
          name: 'Plano Premium',
          description: 'A opção mais completa para quem quer acesso total aos conteúdos e materiais mais avançados.',
          features: [
            'Tudo do intermediário',
            'Conteúdos premium exclusivos',
            'Biblioteca mais completa'
          ],
          link: '/store'
        }
      ];
    }

    return [
      {
        id: 3,
        label: 'Upgrade recomendado',
        name: 'Plano Premium',
        description: 'Desbloqueie o nível máximo da plataforma com acesso aos conteúdos mais completos.',
        features: [
          'Acesso total aos packs',
          'Materiais premium',
          'Mais recursos e conteúdos avançados'
        ],
        link: '/store'
      }
    ];
  }
}