import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

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
      buttonLink: '/services'
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

  // Configuração do carrossel de logos
  partnerLogos: Logo[] = [
    { image: 'assets/images/logos/playtruco.png', alt: 'Play Truco' },
    { image: 'assets/images/logos/estilovivo.png', alt: 'Estilo Vivo' },
    { image: 'assets/images/logos/mid.png', alt: 'MID Conveniencia' },
    { image: 'assets/images/logos/pedraoferramentas.png', alt: 'Pedro Ferramentas' },
    { image: 'assets/images/logos/viptech.png', alt: 'Vip Tech' },
    { image: 'assets/images/logos/fazznatural.png', alt: 'Azz Natural' },
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
    }
  }

  ngOnDestroy(): void {
    this.clearIntervals();
  }

  // Inicializa ambos carrosséis
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

  // Controle do carrossel de logos
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