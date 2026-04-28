import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, type PackResponse, type PacksDestaqueResponse } from '@core/api.service';
import { mapPacksWithImage } from '@core/pack-image-map';

interface Slide {
  id: string;
  videoSrc: string;
  ariaLabel: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

interface HighlightCard {
  image: string;
  alt: string;
  title: string;
}

interface PackFeature {
  title: string;
  description: string;
}

interface PopularPacksCacheEntry {
  savedAt: number;
  response: PacksDestaqueResponse;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('autoVideo') autoVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('carouselVideo') carouselVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('logosSection') logosSection?: ElementRef<HTMLElement>;

  private readonly apiService = inject(ApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly popularPacksCacheKey = 'home-popular-packs-v1';
  private readonly popularPacksCacheTtlMs = 15 * 60 * 1000;

  slides: Slide[] = [
    {
      id: 'creator-growth',
      videoSrc: 'assets/images/carrosel/banner1.mp4',
      ariaLabel: 'Banner em video sobre criacao de conteudo',
      title: 'Descubra conteúdos que aceleram sua criação',
      description: 'Entre nos banners e navegue direto para as áreas mais importantes da plataforma.',
      buttonText: 'Explorar agora',
      buttonLink: '/plans'
    },
    {
      id: 'viral-pack',
      videoSrc: 'assets/images/carrosel/banner2.mp4',
      ariaLabel: 'Banner em video sobre packs de edicao e design',
      title: 'Conteúdos completos para edição e design',
      description: 'Packs variados para ajudar na edição de vídeos, fotos e criativos com mais impacto.',
      buttonText: 'Ver packs',
      buttonLink: '/plans'
    },
    {
      id: 'about-all-in',
      videoSrc: 'assets/images/carrosel/banner3.mp4',
      ariaLabel: 'Banner em video sobre a All In',
      title: 'Conheça a All In de perto',
      description: 'Veja como a empresa funciona e o que entregamos para creators, designers e editores.',
      buttonText: 'Sobre nós',
      buttonLink: '/about'
    }
  ];

  joaoGuilhermeImage = 'assets/images/depoimentos/joaoguilherme.png';
  gustavoMangaImage = 'assets/images/depoimentos/gustavomanga.png';
  matheusPassosImage = 'assets/images/depoimentos/matheuspassos.png';
  giovaneMicossiImage = 'assets/images/depoimentos/giovanemicossi.png';
  packsupremoImage = 'assets/images/empresa/pack_supremo.webp';
  popularPackCards: HighlightCard[] = [];
  isLoadingPopularPacks = true;
  popularPacksError = false;

  packFeatures: PackFeature[] = [
    { title: 'Criação e Edição de Vídeo', description: 'Tudo que você precisa para criar conteúdos dinâmicos e com alto potencial de viralização.' },
    { title: 'Design Gráfico e Artes', description: 'Tudo que você precisa para criar artes de alto nível e destacar seu conteúdo visual.' },
    { title: 'Inteligência Artificial e Automação', description: 'Tudo que você precisa para produzir mais rápido, com menos esforço e mais eficiência.' },
    { title: 'Recursos Prontos e Templates', description: 'Tudo que você precisa para ganhar tempo e criar com rapidez e qualidade.' },
    { title: 'Marketing e Crescimento Digital', description: 'Tudo que você precisa para crescer, atrair público e gerar resultados com seu conteúdo.' },
    { title: 'Ferramentas e Produtividade', description: 'Tudo que você precisa para trabalhar de forma mais organizada e produtiva.' }
  ];

  currentSlide = 0;
  isVideoMuted = true;
  isVideoPlaying = false;
  shouldAnimateActiveSlide = false;
  isLogosMarqueeRunning = false;

  private videoObserver!: IntersectionObserver;
  private logosObserver?: IntersectionObserver;
  private carouselTimeout: number | null = null;
  private carouselVideoSyncFrame: number | null = null;
  private readonly CAROUSEL_DELAY = 11000;

  ngOnInit(): void {
    const restoredFromCache = this.restorePopularPacksFromCache();

    if (!restoredFromCache) {
      this.isLoadingPopularPacks = true;
    }

    this.loadPopularPacks();

    if (this.isBrowser) {
      this.updateCarouselMediaMode();
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.initCarousel();
    this.initVideoObserver();
    this.initLogosObserver();
    this.syncVideoState();
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.videoObserver?.disconnect();
    this.logosObserver?.disconnect();
  }

  nextSlide(): void {
    this.setCurrentSlide((this.currentSlide + 1) % this.slides.length);
  }

  prevSlide(): void {
    this.setCurrentSlide((this.currentSlide - 1 + this.slides.length) % this.slides.length);
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.setCurrentSlide(index);
    }
  }

  get activeSlide(): Slide {
    return this.slides[this.currentSlide];
  }

  get nextSlideIndex(): number {
    return (this.currentSlide + 1) % this.slides.length;
  }

  get nextSlideData(): Slide {
    return this.slides[this.nextSlideIndex];
  }

  onCarouselVideoLoadedMetadata(): void {
    this.scheduleNextSlide();
    this.playActiveCarouselVideo();
  }

  onCarouselVideoEnded(): void {
    this.clearCarouselTimeout();
    this.nextSlide();
  }

  onVideoPlay(): void {
    this.isVideoPlaying = true;
  }

  onVideoPause(): void {
    this.isVideoPlaying = false;
  }

  onVideoVolumeChange(): void {
    if (!this.autoVideo) return;
    this.isVideoMuted = this.autoVideo.nativeElement.muted;
  }

  private initCarousel(): void {
    this.queueCarouselVideoSync();
    this.scheduleNextSlide();
  }

  private initVideoObserver(): void {
    if (!this.autoVideo) return;

    this.videoObserver = new IntersectionObserver(([entry]) => {
      const video = this.autoVideo.nativeElement;

      if (entry.intersectionRatio >= 0.45) {
        video.play().then(() => {
          this.isVideoPlaying = true;
        }).catch(() => {});
      } else if (entry.intersectionRatio <= 0.2) {
        video.pause();
        this.isVideoPlaying = false;
      }
    }, {
      threshold: [0.2, 0.45, 0.75]
    });

    this.videoObserver.observe(this.autoVideo.nativeElement);
  }

  private initLogosObserver(): void {
    if (!this.logosSection) return;

    this.logosObserver = new IntersectionObserver(([entry]) => {
      this.isLogosMarqueeRunning = entry.intersectionRatio >= 0.2;
    }, {
      threshold: [0, 0.2, 0.6]
    });

    this.logosObserver.observe(this.logosSection.nativeElement);
  }

  private clearTimers(): void {
    this.clearCarouselTimeout();

    if (this.carouselVideoSyncFrame !== null) {
      cancelAnimationFrame(this.carouselVideoSyncFrame);
      this.carouselVideoSyncFrame = null;
    }
  }

  private clearCarouselTimeout(): void {
    if (this.carouselTimeout !== null) {
      clearTimeout(this.carouselTimeout);
      this.carouselTimeout = null;
    }
  }

  private setCurrentSlide(index: number): void {
    if (!this.isBrowser) {
      this.currentSlide = index;
      return;
    }

    this.currentSlide = index;
    // Use microtask to ensure layout is not thrashed
    Promise.resolve().then(() => {
      this.queueCarouselVideoSync();
      this.scheduleNextSlide();
    });
  }

  private syncVideoState(): void {
    if (!this.autoVideo) return;

    const video = this.autoVideo.nativeElement;
    this.isVideoMuted = video.muted;
    this.isVideoPlaying = !video.paused;
  }

  private loadPopularPacks(): void {
    this.apiService.getPacksDestaque(10).subscribe({
      next: (response: PacksDestaqueResponse) => {
        this.applyPopularPacks(response);
        this.cachePopularPacks(response);
        this.popularPacksError = false;
        this.isLoadingPopularPacks = false;
      },
      error: (error: unknown) => {
        if (!this.popularPackCards.length) {
          this.popularPacksError = true;
          this.popularPackCards = [];
        }

        this.isLoadingPopularPacks = false;
        console.error('Erro ao carregar packs populares na home:', error);
      }
    });
  }

  private applyPopularPacks(response: PacksDestaqueResponse): void {
    const packs: PackResponse[] = response.packs;

    this.popularPackCards = mapPacksWithImage(packs).map((pack) => ({
      image: pack.image,
      alt: pack.nome,
      title: pack.nome
    }));
  }

  private restorePopularPacksFromCache(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    try {
      const cachedValue = window.localStorage.getItem(this.popularPacksCacheKey);

      if (!cachedValue) {
        return false;
      }

      const cachedEntry = JSON.parse(cachedValue) as PopularPacksCacheEntry;
      const isFresh = Date.now() - cachedEntry.savedAt < this.popularPacksCacheTtlMs;

      if (!isFresh || !Array.isArray(cachedEntry.response?.packs)) {
        window.localStorage.removeItem(this.popularPacksCacheKey);
        return false;
      }

      this.applyPopularPacks(cachedEntry.response);
      this.popularPacksError = false;
      this.isLoadingPopularPacks = false;
      return true;
    } catch {
      window.localStorage.removeItem(this.popularPacksCacheKey);
      return false;
    }
  }

  private cachePopularPacks(response: PacksDestaqueResponse): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      const payload: PopularPacksCacheEntry = {
        savedAt: Date.now(),
        response
      };

      window.localStorage.setItem(this.popularPacksCacheKey, JSON.stringify(payload));
    } catch {
      // Ignore storage failures and keep live response in memory.
    }
  }

  private updateCarouselMediaMode(): void {
    if (!this.isBrowser) {
      this.shouldAnimateActiveSlide = false;
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.shouldAnimateActiveSlide = !prefersReducedMotion;
  }

  private scheduleNextSlide(): void {
    if (!this.isBrowser) return;

    this.clearCarouselTimeout();

    const activeVideo = this.carouselVideo?.nativeElement;
    const hasValidDuration =
      !!activeVideo &&
      Number.isFinite(activeVideo.duration) &&
      activeVideo.duration > 0.5;

    // Use video duration if available, with slight buffer for transition
    const delay = hasValidDuration
      ? Math.round((activeVideo.duration - 0.3) * 1000) + 300
      : this.CAROUSEL_DELAY;

    this.carouselTimeout = window.setTimeout(() => {
      this.nextSlide();
    }, Math.max(delay, 1000)); // Minimum 1 second delay
  }

  private queueCarouselVideoSync(): void {
    if (!this.isBrowser) return;

    if (this.carouselVideoSyncFrame !== null) {
      cancelAnimationFrame(this.carouselVideoSyncFrame);
    }

    this.carouselVideoSyncFrame = requestAnimationFrame(() => {
      this.carouselVideoSyncFrame = null;
      this.syncCarouselVideo();
    });
  }

  private syncCarouselVideo(): void {
    if (!this.carouselVideo) return;

    const video = this.carouselVideo.nativeElement;

    // Batch DOM updates
    video.muted = true;
    video.loop = false;
    video.playsInline = true;

    if (!this.shouldAnimateActiveSlide) {
      if (!video.paused) {
        video.pause();
      }
      return;
    }

    // Reset video and play with optimized timing
    requestAnimationFrame(() => {
      if (video.currentTime > 0.01) {
        video.currentTime = 0;
      }
      this.playActiveCarouselVideo();
    });
  }

  private playActiveCarouselVideo(): void {
    if (!this.carouselVideo || !this.shouldAnimateActiveSlide) return;

    const video = this.carouselVideo.nativeElement;

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    if (video.currentTime > 0.1 || video.ended) {
      video.currentTime = 0;
    }

    video.play().catch(() => {
      this.scheduleNextSlide();
    });
  }
}
