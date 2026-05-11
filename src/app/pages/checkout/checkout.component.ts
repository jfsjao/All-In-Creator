import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { ApiService, PaidPlanSlug } from '@core/api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

interface CheckoutPlanView {
  slug: PaidPlanSlug;
  name: string;
  price: number;
  eyebrow: string;
  description: string;
  features: string[];
}

interface CheckoutUpsellOption {
  slug: PaidPlanSlug;
  name: string;
  price: number;
  extraAmount: number;
  badge: string;
  headline: string;
  detail: string;
  features: string[];
}

interface CheckoutPlanSection {
  id: string;
  badge: string;
  title: string;
  summary: string;
  items: string[];
}

const PLAN_RANK: Record<string, number> = {
  gratuito: 0,
  basic: 1,
  pro: 2,
  premium: 3
};

const PLAN_PRICES: Record<string, number> = {
  gratuito: 0,
  basic: 29.9,
  pro: 65.9,
  premium: 97.9
};

const BASIC_PACK_ITEMS = [
  'Biblioteca de Elementos',
  'Pack de Emojis',
  'Colecao de Icones Profissionais',
  'Efeitos e Trilhas Sonoras',
  'Kit Inicial de Edicao de Video',
  'Pack Adobe Premiere',
  'Pack Adobe Photoshop',
  'Softwares Essenciais do Criador',
  'Pack de Transicoes Dinamicas',
  'Banco de Videos Virais'
];

const PRO_EXCLUSIVE_PACK_ITEMS = [
  'Pack CorelDraw',
  'Sistema Completo de Inteligencia Artificial',
  'Biblioteca de Backgrounds',
  'Templates Canva',
  'Pack de Personagens Editaveis',
  'Pack de Efeitos VFX'
];

const PREMIUM_EXCLUSIVE_PACK_ITEMS = [
  'Pack Adobe Illustrator',
  'Pack Adobe Lightroom',
  'Pack After Effects',
  'Ferramenta Profissional de Download de Reels',
  'Banco Exclusivo de Videos Profissionais',
  'Modelos Profissionais de Gestao em Excel',
  'Biblioteca de Conteudos PLR',
  'Suite de Ferramentas Online Profissionais',
  'Kit Completo de Marketing Digital'
];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private platformId = inject(PLATFORM_ID);

  isLoading = false;
  errorMessage: string | null = null;
  expandedUpsellSlug: PaidPlanSlug | null = null;
  expandedPlanSectionId: string | null = null;
  private queryParamsSubscription?: Subscription;

  readonly plans: Record<PaidPlanSlug, CheckoutPlanView> = {
    basic: {
      slug: 'basic',
      name: 'Basic',
      price: 29.9,
      eyebrow: 'Entrada paga',
      description: 'Primeira camada paga para desbloquear os packs essenciais.',
      features: ['Packs essenciais', 'Atualizacoes mensais', 'Acesso vitalicio']
    },
    pro: {
      slug: 'pro',
      name: 'Pro',
      price: 65.9,
      eyebrow: 'Mais escolhido',
      description: 'Mais packs, presets e materiais para produzir com mais ritmo.',
      features: ['Tudo do Basic', 'Biblioteca maior', 'Suporte prioritario']
    },
    premium: {
      slug: 'premium',
      name: 'Premium',
      price: 97.9,
      eyebrow: 'Completo',
      description: 'Acesso completo para usar todos os packs e extras disponiveis.',
      features: ['Tudo do Pro', 'Todos os packs', 'Conteudos premium']
    }
  };

  get selectedPlan(): CheckoutPlanView | null {
    const plan = this.route.snapshot.queryParamMap.get('plan');

    if (plan === 'basic' || plan === 'pro' || plan === 'premium') {
      return this.plans[plan];
    }

    return null;
  }

  get currentPlanSlug(): string {
    return this.authService.currentUser()?.plano ?? 'gratuito';
  }

  get currentPlanName(): string {
    const names: Record<string, string> = {
      gratuito: 'Gratuito',
      basic: 'Basic',
      pro: 'Pro',
      premium: 'Premium'
    };

    return names[this.currentPlanSlug] ?? 'Gratuito';
  }

  get currentPlanPrice(): number {
    return PLAN_PRICES[this.currentPlanSlug] ?? 0;
  }

  get chargedAmount(): number {
    const plan = this.selectedPlan;

    if (!plan) {
      return 0;
    }

    return Math.max(plan.price - this.currentPlanPrice, 0);
  }

  get isUpgrade(): boolean {
    return this.currentPlanSlug !== 'gratuito' && this.currentPlanPrice > 0;
  }

  get canCheckout(): boolean {
    const plan = this.selectedPlan;

    if (!plan) {
      return false;
    }

    return (PLAN_RANK[this.currentPlanSlug] ?? 0) < PLAN_RANK[plan.slug];
  }

  get upsellOptions(): CheckoutUpsellOption[] {
    const plan = this.selectedPlan;

    if (!plan || plan.slug === 'premium') {
      return [];
    }

    return (['pro', 'premium'] as PaidPlanSlug[])
      .filter((slug) => (PLAN_RANK[slug] ?? 0) > (PLAN_RANK[plan.slug] ?? 0))
      .map((slug) => ({
        slug,
        name: this.plans[slug].name,
        price: this.plans[slug].price,
        extraAmount: Math.max(this.plans[slug].price - plan.price, 0),
        badge: slug === 'premium' ? 'Mais completo' : 'Melhor custo-beneficio',
        headline:
          slug === 'premium'
            ? 'Libera tudo e evita um novo upgrade depois.'
            : 'Desbloqueia mais packs por uma diferenca pequena.',
        detail:
          slug === 'premium'
            ? 'Premium e para quem quer acesso total: todos os packs, conteudos avancados e extras futuros do topo da biblioteca.'
            : 'Pro e o meio-termo forte: amplia a biblioteca, libera packs mais profissionais e mantem o preco bem abaixo do Premium.',
        features: this.plans[slug].features
      }));
  }

  get selectedPlanSections(): CheckoutPlanSection[] {
    const plan = this.selectedPlan;

    if (!plan) {
      return [];
    }

    if (plan.slug === 'basic') {
      return [
        {
          id: 'basic-included',
          badge: 'O que libera agora',
          title: 'Packs incluidos no Basic',
          summary: `${BASIC_PACK_ITEMS.length} packs para comecar com base forte de criacao e edicao.`,
          items: BASIC_PACK_ITEMS
        }
      ];
    }

    if (plan.slug === 'pro') {
      return [
        {
          id: 'pro-basic-base',
          badge: 'Base incluida',
          title: 'Tudo que ja entra do Basic',
          summary: `${BASIC_PACK_ITEMS.length} packs da base que continuam liberados no Pro.`,
          items: BASIC_PACK_ITEMS
        },
        {
          id: 'pro-exclusive',
          badge: 'Upgrade do Pro',
          title: 'Packs extras que o Pro adiciona',
          summary: `Mais ${PRO_EXCLUSIVE_PACK_ITEMS.length} packs para ampliar biblioteca, design e produtividade.`,
          items: PRO_EXCLUSIVE_PACK_ITEMS
        }
      ];
    }

    return [
      {
        id: 'premium-pro-base',
        badge: 'Base incluida',
        title: 'Tudo que ja entra do Pro',
        summary: `${BASIC_PACK_ITEMS.length + PRO_EXCLUSIVE_PACK_ITEMS.length} packs da base Pro ja liberados no Premium.`,
        items: [...BASIC_PACK_ITEMS, ...PRO_EXCLUSIVE_PACK_ITEMS]
      },
      {
        id: 'premium-exclusive',
        badge: 'Topo da colecao',
        title: 'Packs extras que o Premium adiciona',
        summary: `Mais ${PREMIUM_EXCLUSIVE_PACK_ITEMS.length} packs avancados e biblioteca mais completa.`,
        items: PREMIUM_EXCLUSIVE_PACK_ITEMS
      }
    ];
  }

  toggleUpsellDetails(slug: PaidPlanSlug): void {
    this.expandedUpsellSlug = this.expandedUpsellSlug === slug ? null : slug;
  }

  togglePlanSection(sectionId: string): void {
    this.expandedPlanSectionId = this.expandedPlanSectionId === sectionId ? null : sectionId;
  }

  ngOnInit(): void {
    this.queryParamsSubscription = this.route.queryParamMap.subscribe(() => {
      this.resetCheckoutState();
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  async startCheckout(): Promise<void> {
    const plan = this.selectedPlan;

    if (!plan) {
      await this.router.navigate(['/plans']);
      return;
    }

    if (!this.canCheckout) {
      this.errorMessage = 'Seu plano atual ja e igual ou superior ao plano selecionado.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const checkout = await firstValueFrom(this.apiService.createCheckout(plan.slug));
      const checkoutUrl = checkout.sandboxCheckoutUrl || checkout.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error('CHECKOUT_URL_NOT_FOUND');
      }

      if (isPlatformBrowser(this.platformId)) {
        window.location.href = checkoutUrl;
      }
    } catch (error: any) {
      const message =
        error?.error?.message || 'Nao foi possivel iniciar o pagamento. Tente novamente.';
      this.errorMessage = message;
      this.toastr.error(message, 'Pagamento');
    } finally {
      this.isLoading = false;
    }
  }

  private resetCheckoutState(): void {
    this.errorMessage = null;
    this.expandedPlanSectionId = null;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}
