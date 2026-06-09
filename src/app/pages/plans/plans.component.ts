import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { TERMS_ACCEPTANCE_LABEL } from '@core/legal-terms';

interface PlansHighlight {
  image: string;
  alt: string;
}

type PaidPlanSlug = 'basic' | 'pro' | 'premium';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, ReactiveFormsModule],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  authPromptPlan: PaidPlanSlug | null = null;
  authPromptMode: 'login' | 'register' = 'login';
  isAuthPromptLoading = false;
  readonly termsAcceptanceLabel = TERMS_ACCEPTANCE_LABEL;

  promptLoginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  promptRegisterForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
    confirmPassword: ['', Validators.required],
    termsAccepted: [false, Validators.requiredTrue]
  }, { validators: this.passwordMatchValidator });

  packCategories = [
    {
      number: '1',
      title: 'Plugins',
      description: 'Scripts, presets, plugins e recursos para agilizar seu fluxo e facilitar sua edição.'
    },
    {
      number: '2',
      title: 'Vídeos',
      description: 'Arquivos em MP4, MOV e outros formatos prontos para editar e reutilizar no seu conteúdo.'
    },
    {
      number: '3',
      title: 'Imagens',
      description: 'Arquivos em PNG, JPG e outros formatos úteis para composições, thumbnails e posts.'
    },
    {
      number: '4',
      title: 'Links',
      description: 'Ferramentas online para auxílio na criação de artes de alto nível e em destaque no seu conteúdo visual.'
    },
    {
      number: '5',
      title: 'Outros',
      description: 'Arquivos complementares, referências e materiais extras que ampliam ainda mais o pack.'
    }
  ];

  partnerLogos: PlansHighlight[] = [
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
  repeatedPartnerLogos: PlansHighlight[] = [...this.partnerLogos, ...this.partnerLogos];

  freeFeatures = [
    'Kit Streamer',
    'Kit YouTube',
    'Kit Influencer',
    'Kit Designer'
  ];

  premiumFeatures = [
    'Biblioteca de Elementos',
    'Pack de Emojis',
    'Coleção de Ícones Profissionais',
    'Efeitos e Trilhas Sonoras',
    'Kit Inicial de Edição de Vídeo',
    'Pack Adobe Premiere',
    'Pack Adobe Photoshop',
    'Softwares Essenciais do Criador',
    'Pack de Transições Dinâmicas',
    'Banco de Vídeos Virais',
    'Pack CorelDraw',
    'Sistema Completo de Inteligência Artificial',
    'Biblioteca de Backgrounds',
    'Templates Canva',
    'Pack de Personagens Editáveis',
    'Pack de Efeitos VFX',
    'Pack Adobe Illustrator',
    'Pack Adobe Lightroom',
    'Pack After Effects',
    'Ferramenta Profissional de Download de Reels',
    'Banco Exclusivo de Vídeos Profissionais',
    'Modelos Profissionais de Gestão em Excel',
    'Biblioteca de Conteúdos PLR',
    'Suite de Ferramentas Online Profissionais',
    'Kit Completo de Marketing Digital'
  ];

  proFeatures = [
    'Biblioteca de Elementos',
    'Pack de Emojis',
    'Coleção de Ícones Profissionais',
    'Efeitos e Trilhas Sonoras',
    'Kit Inicial de Edição de Vídeo',
    'Pack Adobe Premiere',
    'Pack Adobe Photoshop',
    'Softwares Essenciais do Criador',
    'Pack de Transições Dinâmicas',
    'Banco de Vídeos Virais',
    'Pack CorelDraw',
    'Sistema Completo de Inteligência Artificial',
    'Biblioteca de Backgrounds',
    'Templates Canva',
    'Pack de Personagens Editáveis',
    'Pack de Efeitos VFX'
  ];

  basicFeatures = [
    'Biblioteca de Elementos',
    'Pack de Emojis',
    'Coleção de Ícones Profissionais',
    'Efeitos e Trilhas Sonoras',
    'Kit Inicial de Edição de Vídeo',
    'Pack Adobe Premiere',
    'Pack Adobe Photoshop',
    'Softwares Essenciais do Criador',
    'Pack de Transições Dinâmicas',
    'Banco de Vídeos Virais'
  ];

  ngOnInit(): void {
    const buyPlan = this.route.snapshot.queryParamMap.get('buy');

    if (buyPlan === 'basic' || buyPlan === 'pro' || buyPlan === 'premium') {
      void this.onBuyPlan(buyPlan);
    }
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  async onBuyPlan(plan: PaidPlanSlug): Promise<void> {
    if (this.isAuthenticated()) {
      await this.router.navigate(['/checkout'], { queryParams: { plan } });
      return;
    }

    this.authPromptPlan = plan;
    this.authPromptMode = 'login';
    this.authService.setPendingCheckout(plan, `/checkout?plan=${plan}`);
  }

  closeAuthPrompt(): void {
    this.authPromptPlan = null;
    this.authPromptMode = 'login';
    this.authService.clearError?.();
    this.authService.clearNotice?.();
  }

  switchAuthPromptMode(mode: 'login' | 'register'): void {
    this.authPromptMode = mode;
    this.authService.clearError?.();
    this.authService.clearNotice?.();
  }

  async submitPromptLogin(): Promise<void> {
    if (this.promptLoginForm.invalid || !this.authPromptPlan) {
      this.promptLoginForm.markAllAsTouched();
      return;
    }

    this.authService.setPendingCheckout(this.authPromptPlan, `/checkout?plan=${this.authPromptPlan}`);
    this.authService.rememberTermsAcceptanceForSignup();
    this.isAuthPromptLoading = true;

    try {
      const { email, password } = this.promptLoginForm.value;
      await this.authService.login(email, password);
    } finally {
      this.isAuthPromptLoading = false;
    }
  }

  async submitPromptRegister(): Promise<void> {
    if (this.promptRegisterForm.invalid || !this.authPromptPlan) {
      this.promptRegisterForm.markAllAsTouched();
      return;
    }

    this.authService.setPendingCheckout(this.authPromptPlan, `/checkout?plan=${this.authPromptPlan}`);
    this.isAuthPromptLoading = true;

    try {
      const { name, email, password } = this.promptRegisterForm.value;
      const ok = await this.authService.register(email, password, name);

      if (ok) {
        this.authPromptMode = 'login';
        this.promptLoginForm.patchValue({ email, password: '' });
        this.promptRegisterForm.reset();
      }
    } finally {
      this.isAuthPromptLoading = false;
    }
  }

  async submitPromptGoogle(): Promise<void> {
    if (!this.authPromptPlan) {
      return;
    }

    if (this.authPromptMode === 'register') {
      const termsControl = this.promptRegisterForm.get('termsAccepted');

      if (!termsControl?.value) {
        termsControl?.markAsTouched();
        return;
      }

      this.authService.rememberTermsAcceptanceForSignup();
    }

    this.authService.setPendingCheckout(this.authPromptPlan, `/checkout?plan=${this.authPromptPlan}`);
    this.isAuthPromptLoading = true;

    try {
      await this.authService.loginWithGoogle();
    } finally {
      this.isAuthPromptLoading = false;
    }
  }

  get promptPlanLabel(): string {
    const labels: Record<PaidPlanSlug, string> = {
      basic: 'Basic',
      pro: 'Pro',
      premium: 'Premium'
    };

    return this.authPromptPlan ? labels[this.authPromptPlan] : '';
  }

  get promptAuthNotice(): string | null {
    return typeof this.authService.authNotice === 'function' ? this.authService.authNotice() : null;
  }

  get promptAuthError(): string | null {
    return typeof this.authService.authError === 'function' ? this.authService.authError() : null;
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  passwordStrengthValidator(control: { value: string }) {
    const value = control.value || '';
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);

    return hasUppercase && hasNumber && hasSymbol ? null : {
      passwordStrength: {
        hasUppercase,
        hasNumber,
        hasSymbol
      }
    };
  }
}
