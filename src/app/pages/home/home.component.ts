import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Slide {
  image: string;
  mobileImage?: string;
  alt: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

interface Logo {
  image: string;
  alt: string;
}

interface PackFeature {
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('autoVideo') autoVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('logosViewport') logosViewport!: ElementRef<HTMLDivElement>;

  slides: Slide[] = [
    {
      image: 'assets/images/carrosel/banner1.gif',
      mobileImage: 'assets/images/empresa/nico-marketing.jpg',
      alt: 'Imagem destaque 1',
      title: 'Descubra conteúdos que aceleram sua criação',
      description: 'Entre nos banners e navegue direto para as áreas mais importantes da plataforma.',
      buttonText: 'Explorar agora',
      buttonLink: '/store'
    },
    {
      image: 'assets/images/carrosel/banner2.gif',
      mobileImage: 'assets/images/packs/PACK_VIRAL.webp',
      alt: 'Pack Edit',
      title: 'Conteúdos completos para edição e design',
      description: 'Packs variados para ajudar na edição de vídeos, fotos e criativos com mais impacto.',
      buttonText: 'Ver packs',
      buttonLink: '/store'
    },
    {
      image: 'assets/images/carrosel/banner3.gif',
      mobileImage: 'assets/images/empresa/nico-coringa.jpg',
      alt: 'Sobre nós',
      title: 'Conheça a All In de perto',
      description: 'Veja como a empresa funciona e o que entregamos para creators, designers e editores.',
      buttonText: 'Sobre nós',
      buttonLink: '/about'
    }
  ];

  joaoGuilhermeImage = 'assets/images/depoimentos/joaoguilherme.png';
  gustavoJoseImage = 'assets/images/depoimentos/gustavojose.png';
  packsupremoImage = 'assets/images/empresa/pack_supremo.png';
  partnerLogos: Logo[] = [
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
  repeatedPartnerLogos: Logo[] = [...this.partnerLogos, ...this.partnerLogos];

  packFeatures: PackFeature[] = [
    { title: 'Criação e Edição de Vídeo', description: 'Tudo que você precisa para criar conteúdos dinâmicos e com alto potencial de viralização.' },
    { title: 'Design Gráfico e Artes', description: 'Tudo que você precisa para criar artes de alto nível e destacar seu conteúdo visual.' },
    { title: 'Inteligência Artificial e Automação', description: 'Tudo que você precisa para produzir mais rápido, com menos esforço e mais eficiência.' },
    { title: 'Recursos Prontos e Templates', description: 'Tudo que você precisa para ganhar tempo e criar com rapidez e qualidade.' },
    { title: 'Marketing e Crescimento Digital', description: 'Tudo que você precisa para crescer, atrair público e gerar resultados com seu conteúdo.' },
    { title: 'Ferramentas e Produtividade', description: 'Tudo que você precisa para trabalhar de forma mais organizada e produtiva.' },
  ];

  currentSlide = 0;
  isVideoMuted = true;
  isVideoPlaying = false;

  private videoObserver!: IntersectionObserver;
  private carouselInterval: number | null = null;
  private logosAnimationFrame: number | null = null;
  private logosPreviousTime = 0;
  private logosOffset = 0;
  private readonly CAROUSEL_DELAY = 6000;
  private readonly LOGOS_SPEED = 36;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.initCarousels();
    this.startLogosLoop();
    this.initVideoObserver();
    this.syncVideoState();
  }

  ngOnDestroy(): void {
    this.clearIntervals();

    if (this.videoObserver) {
      this.videoObserver.disconnect();
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlide = index;
    }
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

  private initCarousels(): void {
    this.startCarousel();
  }

  private initVideoObserver(): void {
    if (!this.autoVideo) return;

    this.videoObserver = new IntersectionObserver(([entry]) => {
      const video = this.autoVideo.nativeElement;

      if (entry.isIntersecting) {
        video.play().then(() => {
          this.isVideoPlaying = true;
        }).catch(() => {});
      } else {
        video.pause();
        this.isVideoPlaying = false;
      }
    });

    this.videoObserver.observe(this.autoVideo.nativeElement);
  }

  private clearIntervals(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }

    if (this.logosAnimationFrame) {
      cancelAnimationFrame(this.logosAnimationFrame);
      this.logosAnimationFrame = null;
    }
  }

  private startCarousel(): void {
    this.carouselInterval = window.setInterval(() => {
      this.nextSlide();
    }, this.CAROUSEL_DELAY);
  }

  private startLogosLoop(): void {
    if (!this.logosViewport) return;

    const viewport = this.logosViewport.nativeElement;
    const firstTrack = viewport.querySelector('.logos-container') as HTMLDivElement | null;

    if (!firstTrack) return;

    this.logosOffset = 0;
    this.logosPreviousTime = 0;
    viewport.scrollLeft = 0;

    const animate = (time: number) => {
      if (!this.logosPreviousTime) {
        this.logosPreviousTime = time;
      }

      const delta = time - this.logosPreviousTime;
      this.logosPreviousTime = time;

      const trackWidth = firstTrack.scrollWidth;

      if (trackWidth > 0) {
        this.logosOffset += (delta / 1000) * this.LOGOS_SPEED;

        if (this.logosOffset >= trackWidth) {
          this.logosOffset -= trackWidth;
        }

        viewport.scrollLeft = this.logosOffset;
      }

      this.logosAnimationFrame = window.requestAnimationFrame(animate);
    };

    this.logosAnimationFrame = window.requestAnimationFrame(animate);
  }

  private syncVideoState(): void {
    if (!this.autoVideo) return;

    const video = this.autoVideo.nativeElement;
    this.isVideoMuted = video.muted;
    this.isVideoPlaying = !video.paused;
  }
}
