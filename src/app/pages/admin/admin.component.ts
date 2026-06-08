import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {
  AdminEmailSegment,
  AdminEmailRecipientsPreviewResponse,
  AdminMetricsResponse,
  AdminPackPayload,
  AdminPackResponse,
  AdminPlanoResponse,
  ApiService
} from '@core/api.service';
import { resolvePackImage } from '@core/pack-image-map';

type PlanSlug = 'gratuito' | 'basic' | 'pro' | 'premium';
type AdminTab = 'packs' | 'emails' | 'metrics' | 'site';

interface EditableSlide {
  chave: string;
  titulo: string;
  subtitulo: string;
  ativo: boolean;
  ordem: number;
  image: string;
  alt: string;
  tag: string;
  buttonText: string;
  buttonLink: string;
}

interface EditableNews {
  chave: string;
  titulo: string;
  subtitulo: string;
  ativo: boolean;
  ordem: number;
  tag: string;
  date: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  readonly planOptions: Array<{ slug: PlanSlug; label: string }> = [
    { slug: 'gratuito', label: 'Gratuito' },
    { slug: 'basic', label: 'Basic' },
    { slug: 'pro', label: 'Pro' },
    { slug: 'premium', label: 'Premium' }
  ];
  readonly emailSegmentOptions: Array<{ slug: AdminEmailSegment; label: string }> = [
    { slug: 'all', label: 'Todos' },
    { slug: 'gratuito', label: 'Gratuito' },
    { slug: 'basic', label: 'Basic' },
    { slug: 'pro', label: 'Pro' },
    { slug: 'premium', label: 'Premium' }
  ];

  planos: AdminPlanoResponse[] = [];
  packs: AdminPackResponse[] = [];
  metrics: AdminMetricsResponse | null = null;
  emailRecipientsPreview: AdminEmailRecipientsPreviewResponse | null = null;
  contentSlides: EditableSlide[] = [];
  contentNews: EditableNews[] = [];
  selectedPack: AdminPackResponse | null = null;
  selectedPlans = new Set<PlanSlug>();
  activeTab: AdminTab = 'packs';
  isLoading = true;
  isSaving = false;
  isSendingEmail = false;
  isLoadingEmailRecipients = false;
  isSavingContent = false;
  errorMessage = '';

  packForm = this.fb.group({
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    nome: ['', [Validators.required, Validators.minLength(3)]],
    descricao: ['', [Validators.required, Validators.minLength(10)]],
    capa_url: [''],
    arquivo_url: [''],
    tamanho_gb: [''],
    versao: ['1.0.0'],
    principal: [false],
    ativo: [true],
    palavras_chave: ['']
  });

  emailForm = this.fb.group({
    segment: ['all' as AdminEmailSegment, Validators.required],
    subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(120)]],
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(140)]],
    body: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    cta_label: [''],
    cta_url: [''],
    test_email: ['']
  });

  ngOnInit(): void {
    void this.loadAdminData();
  }

  async loadAdminData(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const [planosResponse, packsResponse] = await Promise.all([
        firstValueFrom(this.apiService.getAdminPlans()),
        firstValueFrom(this.apiService.getAdminPacks())
      ]);

      this.planos = planosResponse.planos;
      this.packs = packsResponse.packs;
      void this.loadMetrics();
      void this.loadClientAreaContentEditor();
      void this.loadEmailRecipientsPreview();
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Nao foi possivel carregar o admin agora.';
    } finally {
      this.isLoading = false;
    }
  }

  editPack(pack: AdminPackResponse): void {
    this.selectedPack = pack;
    this.selectedPlans = new Set(pack.planos);
    this.packForm.patchValue({
      slug: pack.slug,
      nome: pack.nome,
      descricao: pack.descricao,
      capa_url: pack.capa_url ?? '',
      arquivo_url: pack.arquivo_url ?? '',
      tamanho_gb: pack.tamanho_gb ?? '',
      versao: pack.versao ?? '1.0.0',
      principal: pack.principal,
      ativo: pack.ativo,
      palavras_chave: pack.palavras_chave.join(', ')
    });
  }

  startNewPack(): void {
    this.activeTab = 'packs';
    this.selectedPack = null;
    this.selectedPlans = new Set<PlanSlug>(['premium']);
    this.packForm.reset({
      slug: '',
      nome: '',
      descricao: '',
      capa_url: '',
      arquivo_url: '',
      tamanho_gb: '',
      versao: '1.0.0',
      principal: false,
      ativo: true,
      palavras_chave: ''
    });
  }

  togglePlan(slug: PlanSlug): void {
    if (this.selectedPlans.has(slug)) {
      this.selectedPlans.delete(slug);
      return;
    }

    this.selectedPlans.add(slug);
  }

  hasPlan(slug: PlanSlug): boolean {
    return this.selectedPlans.has(slug);
  }

  setActiveTab(tab: AdminTab): void {
    this.activeTab = tab;
  }

  async loadMetrics(): Promise<void> {
    try {
      this.metrics = await firstValueFrom(this.apiService.getAdminMetrics());
    } catch (error) {
      console.error('Erro ao carregar metricas admin:', error);
      this.metrics = null;
    }
  }

  async loadEmailRecipientsPreview(): Promise<void> {
    this.isLoadingEmailRecipients = true;

    try {
      const segment = this.emailForm.getRawValue().segment || 'all';
      this.emailRecipientsPreview = await firstValueFrom(
        this.apiService.getAdminEmailRecipientsPreview(segment)
      );
    } catch (error) {
      console.error('Erro ao carregar destinatarios de email:', error);
      this.emailRecipientsPreview = null;
    } finally {
      this.isLoadingEmailRecipients = false;
    }
  }

  async loadClientAreaContentEditor(): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.getAdminClientAreaContent());
      this.contentSlides = response.has_configured_content
        ? response.slides.map((item, index) => this.mapSlideContentToEditable(item, index))
        : this.buildDefaultSlides();
      this.contentNews = response.has_configured_content
        ? response.news.map((item, index) => this.mapNewsContentToEditable(item, index))
        : this.buildDefaultNews();
    } catch (error) {
      console.error('Erro ao carregar conteudos admin:', error);
      this.contentSlides = this.buildDefaultSlides();
      this.contentNews = this.buildDefaultNews();
    }
  }

  clearPackImage(): void {
    this.packForm.patchValue({ capa_url: '' });
  }

  get packImagePreview(): string {
    const value = this.packForm.getRawValue();
    const capaUrl = value.capa_url?.trim();

    if (capaUrl) {
      return capaUrl;
    }

    return resolvePackImage({
      slug: value.slug || this.selectedPack?.slug,
      nome: value.nome || this.selectedPack?.nome
    });
  }

  get packImageSourceLabel(): string {
    return this.packForm.getRawValue().capa_url?.trim()
      ? 'URL salva no banco'
      : 'Imagem local do deploy';
  }

  async submitPack(): Promise<void> {
    if (this.packForm.invalid) {
      this.packForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    try {
      const payload = this.buildPackPayload();
      const response = this.selectedPack
        ? await firstValueFrom(this.apiService.updateAdminPack(this.selectedPack.id, payload))
        : await firstValueFrom(this.apiService.createAdminPack(payload));

      this.toastr.success(response.message, 'Admin');
      await this.loadAdminData();
      this.editPack(response.pack);
    } catch (error: any) {
      this.toastr.error(error?.error?.message || 'Nao foi possivel salvar o pack.', 'Admin');
    } finally {
      this.isSaving = false;
    }
  }

  async sendEmailTest(): Promise<void> {
    await this.sendEmailCampaign(true);
  }

  async sendEmailCampaignToSegment(): Promise<void> {
    await this.sendEmailCampaign(false);
  }

  addSlideContent(): void {
    const key = Date.now();
    this.contentSlides.unshift({
      chave: `client-slide-${key}`,
      titulo: 'Novo destaque',
      subtitulo: 'Descricao do destaque.',
      ativo: true,
      ordem: 0,
      image: 'assets/images/carrosel_cliente/novidades.webp',
      alt: 'Destaque da plataforma',
      tag: 'Destaque',
      buttonText: 'Abrir',
      buttonLink: '/library'
    });
    this.reorderContent();
  }

  addNewsContent(): void {
    const key = Date.now();
    this.contentNews.unshift({
      chave: `client-news-${key}`,
      titulo: 'Nova atualizacao',
      subtitulo: 'Descricao da atualizacao.',
      ativo: true,
      ordem: 0,
      tag: 'Novidade',
      date: new Date().toLocaleDateString('pt-BR')
    });
    this.reorderContent();
  }

  removeSlideContent(index: number): void {
    this.contentSlides.splice(index, 1);
    this.reorderContent();
  }

  removeNewsContent(index: number): void {
    this.contentNews.splice(index, 1);
    this.reorderContent();
  }

  restoreDefaultSlides(): void {
    const defaults = this.buildDefaultSlides();
    const defaultKeys = new Set(defaults.map((slide) => slide.chave));
    const customSlides = this.contentSlides
      .filter((slide) => !defaultKeys.has(slide.chave))
      .map((slide) => ({ ...slide, ativo: false }));

    this.contentSlides = [...defaults, ...customSlides];
    this.reorderContent();
  }

  restoreDefaultNews(): void {
    const defaults = this.buildDefaultNews();
    const defaultKeys = new Set(defaults.map((item) => item.chave));
    const customNews = this.contentNews
      .filter((item) => !defaultKeys.has(item.chave))
      .map((item) => ({ ...item, ativo: false }));

    this.contentNews = [...defaults, ...customNews];
    this.reorderContent();
  }

  deactivateAllSlides(): void {
    this.contentSlides = this.contentSlides.map((slide) => ({ ...slide, ativo: false }));
    this.reorderContent();
  }

  deactivateAllNews(): void {
    this.contentNews = this.contentNews.map((item) => ({ ...item, ativo: false }));
    this.reorderContent();
  }

  async saveClientAreaContent(): Promise<void> {
    this.isSavingContent = true;

    try {
      const response = await firstValueFrom(
        this.apiService.updateAdminClientAreaContent({
          slides: this.contentSlides.map((slide, index) => ({
            chave: slide.chave,
            tipo: 'client_area_slide',
            titulo: slide.titulo,
            subtitulo: slide.subtitulo,
            ativo: slide.ativo,
            ordem: index,
            conteudo: {
              image: slide.image,
              alt: slide.alt,
              tag: slide.tag,
              buttonText: slide.buttonText,
              buttonLink: slide.buttonLink
            }
          })),
          news: this.contentNews.map((item, index) => ({
            chave: item.chave,
            tipo: 'client_area_news',
            titulo: item.titulo,
            subtitulo: item.subtitulo,
            ativo: item.ativo,
            ordem: index,
            conteudo: {
              tag: item.tag,
              date: item.date
            }
          }))
        })
      );

      this.toastr.success(response.message, 'Conteudos');
      this.contentSlides = response.slides.map((item, index) => this.mapSlideContentToEditable(item, index));
      this.contentNews = response.news.map((item, index) => this.mapNewsContentToEditable(item, index));
    } catch (error: any) {
      this.toastr.error(error?.error?.message || 'Nao foi possivel salvar os conteudos.', 'Conteudos');
    } finally {
      this.isSavingContent = false;
    }
  }

  get totalActivePacks(): number {
    return this.packs.filter((pack) => pack.ativo).length;
  }

  get featuredPacksCount(): number {
    return this.packs.filter((pack) => pack.principal).length;
  }

  get selectedEmailSegmentLabel(): string {
    const segment = this.emailForm.getRawValue().segment;
    return this.emailSegmentOptions.find((option) => option.slug === segment)?.label ?? 'Todos';
  }

  get emailPreviewBody(): string {
    return this.emailForm.getRawValue().body || 'A mensagem aparece aqui conforme voce escreve.';
  }

  private async sendEmailCampaign(testOnly: boolean): Promise<void> {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    if (testOnly && !this.emailForm.getRawValue().test_email?.trim()) {
      this.toastr.warning('Informe um email de teste antes de enviar.', 'Emails');
      return;
    }

    this.isSendingEmail = true;

    try {
      const response = await firstValueFrom(
        this.apiService.sendAdminEmailCampaign(this.buildEmailPayload(testOnly))
      );

      this.toastr.success(`${response.message} Total enviado: ${response.sent}.`, 'Emails');
      await this.loadEmailRecipientsPreview();
    } catch (error: any) {
      this.toastr.error(error?.error?.message || 'Nao foi possivel enviar o email.', 'Emails');
    } finally {
      this.isSendingEmail = false;
    }
  }

  private buildPackPayload(): AdminPackPayload {
    const value = this.packForm.getRawValue();

    return {
      slug: value.slug?.trim().toLowerCase() || '',
      nome: value.nome?.trim() || '',
      descricao: value.descricao?.trim() || '',
      capa_url: value.capa_url?.trim() || null,
      arquivo_url: value.arquivo_url?.trim() || null,
      tamanho_gb: value.tamanho_gb || null,
      principal: value.principal === true,
      ativo: value.ativo !== false,
      versao: value.versao?.trim() || null,
      planos: Array.from(this.selectedPlans),
      palavras_chave: this.parseKeywords(value.palavras_chave || '')
    };
  }

  private buildEmailPayload(testOnly: boolean) {
    const value = this.emailForm.getRawValue();

    return {
      segment: value.segment || 'all',
      subject: value.subject?.trim() || '',
      title: value.title?.trim() || '',
      body: value.body?.trim() || '',
      cta_label: value.cta_label?.trim() || null,
      cta_url: value.cta_url?.trim() || null,
      test_email: testOnly ? value.test_email?.trim() || null : null
    };
  }

  private parseKeywords(value: string): string[] {
    return Array.from(
      new Set(
        value
          .split(',')
          .map((keyword) => keyword.trim().toLowerCase())
          .filter(Boolean)
      )
    );
  }

  private mapSlideContentToEditable(item: any, index: number): EditableSlide {
    return {
      chave: item.chave,
      titulo: item.titulo,
      subtitulo: item.subtitulo ?? '',
      ativo: item.ativo !== false,
      ordem: item.ordem ?? index,
      image: String(item.conteudo?.image ?? 'assets/images/carrosel_cliente/novidades.webp'),
      alt: String(item.conteudo?.alt ?? item.titulo),
      tag: String(item.conteudo?.tag ?? 'Destaque'),
      buttonText: String(item.conteudo?.buttonText ?? 'Abrir'),
      buttonLink: String(item.conteudo?.buttonLink ?? '/library')
    };
  }

  private mapNewsContentToEditable(item: any, index: number): EditableNews {
    return {
      chave: item.chave,
      titulo: item.titulo,
      subtitulo: item.subtitulo ?? '',
      ativo: item.ativo !== false,
      ordem: item.ordem ?? index,
      tag: String(item.conteudo?.tag ?? 'Novidade'),
      date: String(item.conteudo?.date ?? '')
    };
  }

  private buildDefaultSlides(): EditableSlide[] {
    return [
      {
        chave: 'client-slide-novidades',
        image: 'assets/images/carrosel_cliente/novidades.webp',
        alt: 'Novidades da plataforma',
        tag: 'Novidades',
        titulo: 'Fique por dentro das ultimas atualizacoes da plataforma',
        subtitulo: 'Acompanhe novos materiais, destaques da semana e melhorias liberadas para os clientes.',
        buttonText: 'Ver novidades',
        buttonLink: '/library',
        ativo: true,
        ordem: 0
      },
      {
        chave: 'client-slide-packs',
        image: 'assets/images/carrosel_cliente/pack.webp',
        alt: 'Packs liberados na conta',
        tag: 'Seus packs',
        titulo: 'Acesse rapido os packs liberados no seu plano',
        subtitulo: 'Entre nos seus materiais favoritos e encontre com facilidade o que ja esta disponivel para a sua conta.',
        buttonText: 'Abrir biblioteca',
        buttonLink: '/library',
        ativo: true,
        ordem: 1
      },
      {
        chave: 'client-slide-destaques',
        image: 'assets/images/carrosel_cliente/slides_packs.webp',
        alt: 'Packs em destaque',
        tag: 'Destaques',
        titulo: 'Descubra os conteudos que mais chamam atencao na plataforma',
        subtitulo: 'Veja os packs em evidencia e explore os materiais que ajudam a elevar o nivel das suas entregas.',
        buttonText: 'Explorar conteudos',
        buttonLink: '/library',
        ativo: true,
        ordem: 2
      }
    ];
  }

  private buildDefaultNews(): EditableNews[] {
    return [
      {
        chave: 'client-news-novos-templates',
        tag: 'Novo conteudo',
        titulo: 'Novos templates adicionados ao acervo',
        subtitulo: 'Atualizamos a biblioteca com novos materiais para videos curtos e criativos mais dinamicos.',
        date: '15/03/2026',
        ativo: true,
        ordem: 0
      },
      {
        chave: 'client-news-organizacao',
        tag: 'Melhoria',
        titulo: 'Organizacao dos packs foi atualizada',
        subtitulo: 'Agora os conteudos estao mais bem separados por tema e categoria para facilitar seu uso.',
        date: '13/03/2026',
        ativo: true,
        ordem: 1
      },
      {
        chave: 'client-news-destaque',
        tag: 'Destaque',
        titulo: 'Packs em alta seguem liderando o interesse da plataforma',
        subtitulo: 'Os conteudos mais acessados continuam sendo referencia para criadores que querem acelerar resultados.',
        date: '11/03/2026',
        ativo: true,
        ordem: 2
      }
    ];
  }

  private reorderContent(): void {
    this.contentSlides.forEach((slide, index) => slide.ordem = index);
    this.contentNews.forEach((item, index) => item.ordem = index);
  }
}
