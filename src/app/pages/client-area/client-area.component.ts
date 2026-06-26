import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@core/services/auth.service';
import { ApiService, SiteContentResponseItem } from '@core/api.service';
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

  private async checkPendingPaymentFromSession(): Promise<void> {
    const sessionPaymentIdStr = sessionStorage.getItem('pending_payment_id');
    if (!sessionPaymentIdStr || !this.authService.isAuthenticated()) {
      return;
    }

    const sessionPaymentId = Number(sessionPaymentIdStr);
    if (isNaN(sessionPaymentId) || sessionPaymentId <= 0) {
      sessionStorage.removeItem('pending_payment_id');
      return;
    }

    try {
      const status = await firstValueFrom(this.apiService.getPaymentStatus(sessionPaymentId));
      
      if (status.payment.status === 'aprovado') {
        sessionStorage.removeItem('pending_payment_id');
        await this.authService.refreshCurrentUser();
        this.applyUserSnapshot(this.authService.currentUser());
        this.toastr.success(`Seu plano ${status.plan.nome} foi ativado com sucesso!`, 'Pagamento Aprovado');
      } else if (status.payment.status === 'falhou' || status.payment.status === 'rejeitado' || status.payment.status === 'cancelado') {
        sessionStorage.removeItem('pending_payment_id');
        this.toastr.error('A transação de pagamento não foi concluída.', 'Pagamento');
      }
    } catch (error) {
      console.error('[SESSION SYNC ERROR] Falha ao verificar pagamento na sessao:', error);
    }
  }

  private async handlePaymentReturn(): Promise<void> {
    await this.loadUserData();

    const paymentId =
      this.route.snapshot.queryParamMap.get('payment_id') ??
      this.route.snapshot.queryParamMap.get('collection_id');
    const paymentStatus =
      this.route.snapshot.queryParamMap.get('status') ??
      this.route.snapshot.queryParamMap.get('collection_status');
    const externalReference = this.route.snapshot.queryParamMap.get('external_reference');

    if (!paymentId || paymentStatus !== 'approved' || !this.authService.isAuthenticated()) {
      await this.checkPendingPaymentFromSession();
      await this.loadDashboardData();
      return;
    }

    try {
      await firstValueFrom(this.apiService.syncMercadoPagoReturn(paymentId, externalReference));
      sessionStorage.removeItem('pending_payment_id');
      await this.authService.refreshCurrentUser();
      this.applyUserSnapshot(this.authService.currentUser());
      this.toastr.success('Pagamento confirmado e plano liberado.', 'Tudo certo');
    } catch (error: any) {
      const message =
        error?.error?.message || 'Não foi possível sincronizar o pagamento agora.';
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
    await this.loadClientAreaContent();
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
    if (this.slides.length === 0) {
      return;
    }

    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    if (this.slides.length === 0) {
      return;
    }

    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    if (index < 0 || index >= this.slides.length) {
      return;
    }

    this.currentSlide = index;
  }

  openPopularPackDetails(pack: PopularPack): void {
    this.selectedPopularPack = pack;
  }

  closePopularPackDetails(): void {
    this.selectedPopularPack = null;
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }

  scrollPopularRow(direction: number): void {
    const row = document.getElementById('popular-packs-row');

    if (!row) return;

    row.scrollBy({
      left: this.POPULAR_SCROLL_AMOUNT * direction,
      behavior: 'smooth'
    });
  }

  private async loadClientAreaContent(): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.getClientAreaContent());
      const hasExplicitContent =
        response.has_configured_content === true || response.slides.length > 0 || response.news.length > 0;

      if (hasExplicitContent) {
        this.slides = response.slides.map((item) => this.mapSlideContent(item));
        this.currentSlide = this.slides.length
          ? Math.min(this.currentSlide, this.slides.length - 1)
          : 0;
        this.news = response.news.map((item, index) => this.mapNewsContent(item, index));
        return;
      }

      this.news = this.getNewsItems();
    } catch (error) {
      console.error('Erro ao carregar conteudos da area do cliente:', error);
      this.news = this.getNewsItems();
    }
  }

  private mapSlideContent(item: SiteContentResponseItem): ClientAreaSlide {
    return {
      image: this.getContentString(item, 'image', 'assets/images/carrosel_cliente/novidades.webp'),
      alt: this.getContentString(item, 'alt', item.titulo),
      tag: this.getContentString(item, 'tag', 'Destaque'),
      title: item.titulo,
      description: item.subtitulo ?? '',
      buttonText: this.getContentString(item, 'buttonText', 'Abrir'),
      buttonLink: this.getContentString(item, 'buttonLink', '/library')
    };
  }

  private mapNewsContent(item: SiteContentResponseItem, index: number): NewsItem {
    return {
      id: item.id ?? index + 1,
      tag: this.getContentString(item, 'tag', 'Novidade'),
      title: item.titulo,
      description: item.subtitulo ?? '',
      date: this.getContentString(item, 'date', '')
    };
  }

  private getContentString(
    item: SiteContentResponseItem,
    key: string,
    fallback: string
  ): string {
    const value = item.conteudo?.[key];

    return typeof value === 'string' && value.trim() ? value : fallback;
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
