import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserLibraryPack, UserLibraryService, UserPlanSlug } from '@core/services/user-library.service';

interface DashboardSlide {
  image: string;
  alt: string;
  tag: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

interface NewsItem {
  id: number;
  tag: string;
  title: string;
  description: string;
  date: string;
}

interface PopularPack extends UserLibraryPack {
  rank: number;
  highlight: string;
}

interface UpgradePlan {
  id: number;
  label: string;
  name: string;
  description: string;
  features: string[];
  link: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userLibraryService = inject(UserLibraryService);
  private readonly POPULAR_SCROLL_AMOUNT = 960;

  userName = 'Cliente';
  userPlan: UserPlanSlug = 'gratuito';
  isLoadingPacks = true;
  packsError = false;

  currentSlide = 0;
  private slideInterval?: ReturnType<typeof setInterval>;

  slides: DashboardSlide[] = [
    {
      image: 'assets/images/empresa/nico-marketing.jpg',
      alt: 'Novidades da plataforma',
      tag: 'Atualização',
      title: 'Novos conteúdos adicionados ao seu acesso',
      description: 'Acompanhe as últimas novidades da plataforma e veja quais materiais foram liberados ou atualizados.',
      buttonText: 'Ver novidades',
      buttonLink: '/packs'
    },
    {
      image: 'assets/images/empresa/nico-coringa.jpg',
      alt: 'Packs em destaque',
      tag: 'Destaque',
      title: 'Os packs mais populares da semana',
      description: 'Veja o que está em alta entre os clientes e descubra novos conteúdos para elevar seu resultado.',
      buttonText: 'Explorar os destaques',
      buttonLink: '/packs'
    },
    {
      image: 'assets/images/depoimentos/gustavojose.png',
      alt: 'Upgrade de acesso',
      tag: 'Upgrade do plano',
      title: 'Atualize seu plano e desbloqueie mais conteúdos',
      description: 'Veja as vantagens de cada plano e descubra como acessar uma biblioteca mais completa para acelerar seus resultados.',
      buttonText: 'Ver planos',
      buttonLink: '/store'
    }
  ];

  myPacks: UserLibraryPack[] = [];
  news: NewsItem[] = [];
  popularPacks: PopularPack[] = [];
  upgradeSuggestions: UpgradePlan[] = [];
  selectedPopularPack: PopularPack | null = null;

  ngOnInit(): void {
    this.applyUserSnapshot(this.authService.currentUser());
    void this.loadUserData();
    void this.loadDashboardData();
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  private async loadUserData(): Promise<void> {
    await this.authService.waitForAuthInit();
    this.applyUserSnapshot(this.authService.currentUser());
  }

  private applyUserSnapshot(
    user: { displayName?: string | null; email?: string | null; plano?: UserPlanSlug | null } | null,
  ): void {
    if (user?.displayName) {
      this.userName = user.displayName;
    } else if (user?.email) {
      this.userName = user.email.split('@')[0];
    }

    if (user?.plano) {
      this.userPlan = user.plano;
    }
  }

  private async loadDashboardData(): Promise<void> {
    await this.authService.waitForAuthInit();
    this.news = this.getNewsItems();
    this.upgradeSuggestions = this.getUpgradeSuggestions(this.userPlan);

    const user = this.authService.currentUser();

    if (!user?.backendUserId) {
      this.myPacks = [];
      this.popularPacks = [];
      this.packsError = true;
      this.isLoadingPacks = false;
      return;
    }

    this.userLibraryService.loadUserLibrary(user.backendUserId).subscribe({
      next: (library) => {
        this.userPlan = library.plan.slug;
        this.myPacks = library.ownedPacks;
        this.popularPacks = library.popularPacks.map((pack, index) => ({
          ...pack,
          rank: index + 1,
          highlight: index === 0 ? 'Mais acessado agora' : 'Em destaque na plataforma'
        }));
        this.upgradeSuggestions = this.getUpgradeSuggestions(library.plan.slug);
        this.packsError = false;
        this.isLoadingPacks = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados do dashboard:', error);
        this.myPacks = [];
        this.popularPacks = [];
        this.packsError = true;
        this.isLoadingPacks = false;
      }
    });
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  openPopularPackDetails(pack: PopularPack): void {
    this.selectedPopularPack = pack;
  }

  closePopularPackDetails(): void {
    this.selectedPopularPack = null;
  }

  scrollPopularRow(direction: number): void {
    const row = document.getElementById('popular-packs-row');

    if (!row) return;

    row.scrollBy({
      left: this.POPULAR_SCROLL_AMOUNT * direction,
      behavior: 'smooth'
    });
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
        title: 'Packs em alta seguem liderando o interesse da plataforma',
        description: 'Os conteúdos mais acessados continuam sendo referência para criadores que querem acelerar resultados.',
        date: '11/03/2026'
      }
    ];
  }

  private getUpgradeSuggestions(plan: UserPlanSlug): UpgradePlan[] {
    if (plan === 'premium') {
      return [];
    }

    if (plan === 'gratuito') {
      return [
        {
          id: 1,
          label: 'Comece com acesso pago',
          name: 'Plano Basic',
          description: 'Desbloqueie os primeiros packs pagos e entre na biblioteca principal da plataforma.',
          features: [
            'Acesso aos packs essenciais',
            'Biblioteca inicial liberada',
            'Upgrade rápido para começar'
          ],
          link: '/store'
        },
        {
          id: 2,
          label: 'Suba de nível',
          name: 'Plano Gold',
          description: 'Tenha acesso a mais variedade de packs e uma biblioteca bem mais completa.',
          features: [
            'Mais packs liberados',
            'Mais variedade de conteúdos',
            'Melhor custo-benefício para escalar'
          ],
          link: '/store'
        }
      ];
    }

    if (plan === 'basic') {
      return [
        {
          id: 3,
          label: 'Próximo nível',
          name: 'Plano Gold',
          description: 'Liberte mais packs, materiais extras e uma biblioteca mais robusta para acelerar seu conteúdo.',
          features: [
            'Mais packs liberados',
            'Mais variedade de templates',
            'Atualizações recorrentes'
          ],
          link: '/store'
        },
        {
          id: 4,
          label: 'Acesso máximo',
          name: 'Plano Premium',
          description: 'A opção mais completa para quem quer acesso total aos conteúdos e materiais mais avançados.',
          features: [
            'Tudo do Gold',
            'Conteúdos premium exclusivos',
            'Biblioteca mais completa'
          ],
          link: '/store'
        }
      ];
    }

    return [
      {
        id: 5,
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
