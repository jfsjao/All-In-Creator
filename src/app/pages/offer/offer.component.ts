import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PurchaseAuthDialogComponent } from '../../components/purchase-auth-dialog/purchase-auth-dialog.component';
import { PLAN_CATALOG, PaidPlanSlug, formatPlanPrice } from '@core/plan-catalog';
import { AuthService } from '@core/services/auth.service';
import { environment } from '../../../environments/environment';

type CampaignEvent = 'offer_view' | 'offer_primary_cta' | 'offer_plan_select' | 'offer_auth_start' | 'offer_checkout_start';

@Component({
  selector: 'app-offer',
  standalone: true,
  imports: [CommonModule, RouterLink, PurchaseAuthDialogComponent],
  templateUrl: './offer.component.html',
  styleUrls: ['./offer.component.scss']
})
export class OfferComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  readonly catalog = PLAN_CATALOG;
  readonly formatPrice = formatPlanPrice;
  readonly paidPlans: PaidPlanSlug[] = ['premium', 'pro', 'basic'];
  readonly planPositioning: Record<PaidPlanSlug, string> = {
    premium: 'Acesso mais completo',
    pro: 'Melhor custo-benefício',
    basic: 'Bom para começar'
  };
  readonly campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
  selectedPlan: PaidPlanSlug | null = null;
  private canonical?: HTMLLinkElement;

  readonly packCovers = [
    { src: 'assets/images/packs/elementos.webp', alt: 'Capa da Biblioteca de Elementos', label: 'Elementos' },
    { src: 'assets/images/packs/premiere.webp', alt: 'Capa do Pack Adobe Premiere', label: 'Edição' },
    { src: 'assets/images/packs/canva.webp', alt: 'Capa do pack Templates Canva', label: 'Templates' },
    { src: 'assets/images/packs/VFX.webp', alt: 'Capa do Pack de Efeitos VFX', label: 'Efeitos' },
    { src: 'assets/images/packs/IA.webp', alt: 'Capa do pack de Inteligência Artificial', label: 'Ferramentas' }
  ];

  readonly tools = [
    { src: 'assets/images/logos/premier.webp', alt: 'Adobe Premiere' },
    { src: 'assets/images/logos/photoshop.webp', alt: 'Adobe Photoshop' },
    { src: 'assets/images/logos/after_effects.webp', alt: 'Adobe After Effects' },
    { src: 'assets/images/logos/canva.webp', alt: 'Canva' },
    { src: 'assets/images/logos/lightroom.webp', alt: 'Adobe Lightroom' },
    { src: 'assets/images/logos/adobe_illustrator.webp', alt: 'Adobe Illustrator' },
    { src: 'assets/images/logos/chatgpt.webp', alt: 'ChatGPT' },
    { src: 'assets/images/logos/gemini.webp', alt: 'Gemini' }
  ];

  readonly testimonials = [
    {
      quote: 'O pack premium tem tudo que preciso, ainda mais por ser vitalício. Economizo horas de trabalho com os templates prontos.',
      name: 'Gustavo Gomes', handle: '@gugomes_manga',
      image: 'assets/images/depoimentos/gustavomanga.png'
    },
    {
      quote: 'Sinceramente me poupou muito tempo, com o conteúdo que existe nos packs, tanto para criação quanto para edição.',
      name: 'Giovane Micossi', handle: '@giovanemicossi',
      image: 'assets/images/depoimentos/giovanemicossi.png'
    }
  ];

  readonly faq = [
    {
      question: 'O acesso aos planos pagos é vitalício?',
      answer: 'Sim. Basic, Pro e Premium são apresentados como compras de acesso vitalício. Cada plano libera seu próprio conjunto de packs.'
    },
    {
      question: 'O que muda entre os planos?',
      answer: 'Muda a quantidade de packs liberados. Basic reúne a base essencial, Pro adiciona design, IA e efeitos, Premium libera o conjunto mais amplo disponível.'
    },
    {
      question: 'Como recebo acesso?',
      answer: 'Escolha o plano, crie ou entre na conta, conclua o pagamento e aguarde a confirmação. O plano fica ligado à sua conta.'
    },
    {
      question: 'Preciso criar uma conta?',
      answer: 'Sim. A conta identifica seu plano e mantém seu acesso à biblioteca. Cadastro por e-mail e Google estão disponíveis.'
    },
    {
      question: 'Quais programas aparecem no acervo?',
      answer: 'Há packs identificados para Premiere, Photoshop, After Effects, Lightroom, Illustrator e Canva, além de materiais ligados a ChatGPT e Gemini. Compatibilidade pode variar conforme formato e versão.'
    },
    {
      question: 'Há atualizações e suporte?',
      answer: 'A plataforma pode ajustar, reorganizar e atualizar packs para manter a biblioteca funcional. Dúvidas sobre conta, acesso ou compra podem ser enviadas pelo canal de contato.'
    }
  ];

  ngOnInit(): void {
    this.configureMetadata();
    this.track('offer_view');
  }

  ngOnDestroy(): void {
    this.canonical?.remove();
  }

  async selectPlan(plan: PaidPlanSlug, placement: string): Promise<void> {
    this.track(placement === 'hero' ? 'offer_primary_cta' : 'offer_plan_select', { plan, placement });
    const checkoutUrl = this.checkoutUrl(plan);
    if (this.authService.isAuthenticated()) {
      this.track('offer_checkout_start', { plan, placement });
      await this.router.navigateByUrl(checkoutUrl);
      return;
    }
    this.authService.setPendingCheckout(plan, checkoutUrl);
    this.selectedPlan = plan;
  }

  onAuthStarted(method: 'login' | 'register' | 'google'): void {
    this.track('offer_auth_start', { plan: this.selectedPlan, method });
  }

  freeSignupParams(): Record<string, string> {
    return { mode: 'register', ...this.campaignParams() };
  }

  checkoutUrl(plan: PaidPlanSlug): string {
    const tree = this.router.createUrlTree(['/checkout'], {
      queryParams: { plan, ...this.campaignParams() }
    });
    return this.router.serializeUrl(tree);
  }

  campaignParams(): Record<string, string> {
    const params: Record<string, string> = {};
    for (const key of this.campaignKeys) {
      const value = this.route.snapshot.queryParamMap.get(key);
      if (value) params[key] = value;
    }
    return params;
  }

  private configureMetadata(): void {
    const pageTitle = 'Packs para criar e editar mais rápido | All In Creator';
    const description = 'Templates, elementos, presets, vídeos e ferramentas organizados em uma biblioteca para criadores, editores, designers e social media.';
    const canonicalUrl = `${environment.frontendUrl.replace(/\/$/, '')}/oferta`;
    const image = `${environment.frontendUrl.replace(/\/$/, '')}/assets/images/empresa/pack_supremo.webp`;
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.canonical = this.document.createElement('link');
    this.canonical.rel = 'canonical';
    this.canonical.href = canonicalUrl;
    this.document.head.appendChild(this.canonical);
  }

  private track(event: CampaignEvent, data: Record<string, unknown> = {}): void {
    // Hook neutro. Não envia dados; deixa eventos estáveis para integração futura.
    const EventConstructor = this.document.defaultView?.CustomEvent;
    if (EventConstructor) {
      this.document.dispatchEvent(new EventConstructor('allin:campaign', { detail: { event, ...data } }));
    }
  }
}
