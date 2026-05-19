import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/api.service';
import { UserLibraryPack, UserLibraryService, UserPlanSlug } from '@core/services/user-library.service';

interface ClientAreaSlide {
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
  planSlug: 'basic' | 'pro' | 'premium';
  link: string;
}

@Component({
  selector: 'app-client-area',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-area.component.html',
  styleUrls: ['./client-area.component.scss']
})
export class ClientAreaComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastr = inject(ToastrService);
  private userLibraryService = inject(UserLibraryService);
  private readonly POPULAR_SCROLL_AMOUNT = 960;

  userName = 'Cliente';
  userPlan: UserPlanSlug = 'gratuito';
  isLoadingPacks = true;
  packsError = false;

  currentSlide = 0;
  private slideInterval?: ReturnType<typeof setInterval>;

  slides: ClientAreaSlide[] = [
    {
      image: 'assets/images/carrosel_cliente/novidades.webp',
      alt: 'Novidades da plataforma',
      tag: 'Novidades',
      title: 'Fique por dentro das últimas atualizações da plataforma',
      description: 'Acompanhe novos materiais, destaques da semana e melhorias liberadas para os clientes.',
      buttonText: 'Ver novidades',
      buttonLink: '/library'
    },
    {
      image: 'assets/images/carrosel_cliente/pack.webp',
      alt: 'Packs liberados na conta',
      tag: 'Seus packs',
      title: 'Acesse rápido os packs liberados no seu plano',
      description: 'Entre nos seus materiais favoritos e encontre com facilidade o que já está disponível para a sua conta.',
      buttonText: 'Abrir biblioteca',
      buttonLink: '/library'
    },
    {
      image: 'assets/images/carrosel_cliente/slides_packs.webp',
      alt: 'Packs em destaque',
      tag: 'Destaques',
      title: 'Descubra os conteúdos que mais chamam atenção na plataforma',
      description: 'Veja os packs em evidência e explore os materiais que ajudam a elevar o nível das suas entregas.',
      buttonText: 'Explorar conteúdos',
      buttonLink: '/library'
    }
  ];

  myPacks: UserLibraryPack[] = [];
  news: NewsItem[] = [];
  popularPacks: PopularPack[] = [];
  upgradeSuggestions: UpgradePlan[] = [];
  selectedPopularPack: PopularPack | null = null;

  ngOnInit(): void {
    this.applyUserSnapshot(this.authService.currentUser());
    void this.handlePaymentReturn();
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  private async loadUserData(): Promise<void> {
    await this.authService.waitForAuthInit();
    this.applyUserSnapshot(this.authService.currentUser());
  }

  private async handlePaymentReturn(): Promise<void> {
    await this.loadUserData();

    const paymentId = this.route.snapshot.queryParamMap.get('payment_id');
    const paymentStatus =
      this.route.snapshot.queryParamMap.get('status') ??
      this.route.snapshot.queryParamMap.get('collection_status');

    if (!paymentId || paymentStatus !== 'approved' || !this.authService.isAuthenticated()) {
      await this.loadDashboardData();
      return;
    }

    try {
      await firstValueFrom(this.apiService.syncMercadoPagoReturn(paymentId));
      await this.authService.refreshCurrentUser();
      this.applyUserSnapshot(this.authService.currentUser());
      this.toastr.success('Pagamento confirmado e plano liberado.', 'Tudo certo');
    } catch (error: any) {
      const message =
        error?.error?.message || 'Nao foi possivel sincronizar o pagamento agora.';
      this.toastr.warning(message, 'Pagamento');
    } finally {
      await this.loadDashboardData();
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }
  }

  private applyUserSnapshot(
    user: { displayName?: string | null; email?: string | null; plano?: UserPlanSlug | null } | null
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
          planSlug: 'basic',
          link: '/checkout'
        },
        {
          id: 2,
          label: 'Suba de nível',
          name: 'Plano Pro',
          description: 'Tenha acesso a uma curadoria mais robusta de packs e uma biblioteca mais profissional.',
          features: [
            'Mais packs liberados',
            'Mais variedade de conteúdos',
            'Melhor estrutura para escalar com consistência'
          ],
          planSlug: 'pro',
          link: '/checkout'
        }
      ];
    }

    if (plan === 'basic') {
      return [
        {
          id: 3,
          label: 'Próximo nível',
          name: 'Plano Pro',
          description: 'Libere mais packs, materiais extras e uma biblioteca mais profissional para acelerar seu conteúdo.',
          features: [
            'Mais packs liberados',
            'Mais variedade de templates',
            'Atualizações recorrentes'
          ],
          planSlug: 'pro',
          link: '/checkout'
        },
        {
          id: 4,
          label: 'Acesso máximo',
          name: 'Plano Premium',
          description: 'A opção mais completa para quem quer acesso total aos conteúdos e materiais mais avançados.',
          features: [
            'Tudo do Pro',
            'Conteudos premium exclusivos',
            'Biblioteca mais completa'
          ],
          planSlug: 'premium',
          link: '/checkout'
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
      planSlug: 'premium',
      link: '/checkout'
    }
  ];
  }
}
