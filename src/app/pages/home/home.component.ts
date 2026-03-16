import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ViewChild } from '@angular/core';

interface Slide {
  image: string;
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
  number: string;
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
  // Configuração do carrossel principal
  slides: Slide[] = [
    {
      image: 'assets/images/carrosel/banner1.gif',
      alt: 'Imagem destaque 1',
      title: 'Bem-vindo ao Nosso Blog',
      description: 'Descubra conteúdos exclusivos e atualizados regularmente',
      buttonText: 'Explorar',
      buttonLink: '/home'
    },
    {
      image: 'assets/images/carrosel/banner2.gif',
      alt: 'Pack Edit',
      title: 'Conteúdo de edições',
      description: 'Packs variados para ajudar na edição de vídeos e fotos',
      buttonText: 'Ver Packs',
      buttonLink: '/store'
    },
    {
      image: 'assets/images/carrosel/banner3.gif',
      alt: 'Sobre nós',
      title: 'Conheça a NicolWork',
      description: 'Saiba como nossa empresa funciona e o que fazemos',
      buttonText: 'Sobre Nós',
      buttonLink: '/about'
    }
  ];

  @ViewChild('autoVideo') autoVideo!: ElementRef<HTMLVideoElement>;

  private videoObserver!: IntersectionObserver;

  joaoGuilhermeImage = 'assets/images/depoimentos/joaoguilherme.png';
  gustavoJoseImage = 'assets/images/depoimentos/gustavojose.png';
  
  // Configuração do carrossel de logos
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

  // Configuração do pack showcase
  packFeatures: PackFeature[] = [
    { number: '44Gb', title: 'Anime (AMV)', description: 'Arquivos para edições de Anime AMV e MMV, incluindo clipes de animes, personagens em PNG, mangas etc...' },
    { number: '54Gb', title: 'Mockups', description: 'Formas surreais de deixar seus projetos muito mais apresentáveis, com vários mockups de inúmeros estilos diferentes.' },
    { number: '10Gb', title: 'Plugins e Presets', description: 'Reunimos os melhores Scripts, Plugins e Presets para usar no After Effects! Hoje é impensável editar sem eles.' },
    { number: '104Gb', title: 'Overlays', description: 'São independente em qualquer edição, ele tem o poder de transformar algo simples em extremamente profissional.' },
    { number: '105Gb', title: 'Pack para Photoshop', description: 'Sabendo da quantidade enorme de editores que usam esse programa, temos diversos arquivos .psd pra você!' },
    { number: '115Gb', title: 'Templates de After Effects', description: 'Inúmeros projetos de intros, lower thirds prontos, cenários, edições finalizadas apenas para você usar como quiser!' },
  ];

  // Variáveis para controle do carrossel
  currentSlide = 0;
  currentLogoIndex = 0;
  private carouselInterval: number | null = null;
  private logoInterval: number | null = null;
  private readonly CAROUSEL_DELAY = 6000; // 6 segundos
  private readonly LOGO_DELAY = 3000; // 3 segundos

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initCarousels();
      this.resetAnimation();
      this.initVideoObserver();
    }
  }
  private initVideoObserver(): void {
  if (!this.autoVideo) return;

  this.videoObserver = new IntersectionObserver(
    ([entry]) => {
      const video = this.autoVideo.nativeElement;

      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  );

  this.videoObserver.observe(this.autoVideo.nativeElement);
  }

  ngOnDestroy(): void {
    this.clearIntervals();

    if (this.videoObserver) {
      this.videoObserver.disconnect();
    }
  }

  private initCarousels(): void {
    this.startCarousel();
    this.startLogoCarousel();
  }

  // Limpa os intervalos
  private clearIntervals(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
    if (this.logoInterval) {
      clearInterval(this.logoInterval);
      this.logoInterval = null;
    }
  }

  // Controle do carrossel principal
  private startCarousel(): void {
    this.carouselInterval = window.setInterval(() => {
      this.nextSlide();
    }, this.CAROUSEL_DELAY);
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

  private startLogoCarousel(): void {
    this.logoInterval = window.setInterval(() => {
      this.nextLogo();
    }, this.LOGO_DELAY);
  }

  nextLogo(): void {
    this.currentLogoIndex = (this.currentLogoIndex + 1) % this.partnerLogos.length;
    this.scrollToLogo(this.currentLogoIndex);
  }

  prevLogo(): void {
    this.currentLogoIndex = (this.currentLogoIndex - 1 + this.partnerLogos.length) % this.partnerLogos.length;
    this.scrollToLogo(this.currentLogoIndex);
  }

  private scrollToLogo(index: number): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = this.el.nativeElement.querySelector('.logos-container');
    const logos = this.el.nativeElement.querySelectorAll('.logo-item');
    
    if (container && logos[index]) {
      const logo = logos[index];
      const containerWidth = container.clientWidth;
      const logoLeft = logo.offsetLeft;
      const logoWidth = logo.clientWidth;
      
      container.scrollTo({
        left: logoLeft - (containerWidth / 2) + (logoWidth / 2),
        behavior: 'smooth'
      });
    }
  }

  private resetAnimation(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = this.el.nativeElement.querySelector('.logos-container');
    if (container) {
      this.renderer.setStyle(container, 'animation', 'none');
      setTimeout(() => {
        this.renderer.setStyle(container, 'animation', '');
      }, 10);
    }
  }
}