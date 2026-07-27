import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { OfferComponent } from './offer.component';
import { AuthService } from '@core/services/auth.service';

describe('OfferComponent', () => {
  let fixture: ComponentFixture<OfferComponent>;
  let component: OfferComponent;
  let router: Router;
  const authService = {
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    setPendingCheckout: jasmine.createSpy('setPendingCheckout'),
    login: jasmine.createSpy('login').and.resolveTo(true),
    register: jasmine.createSpy('register').and.resolveTo(true),
    loginWithGoogle: jasmine.createSpy('loginWithGoogle').and.resolveTo(true),
    rememberTermsAcceptanceForSignup: jasmine.createSpy('rememberTermsAcceptanceForSignup'),
    clearError: jasmine.createSpy('clearError'),
    clearNotice: jasmine.createSpy('clearNotice'),
    authNotice: jasmine.createSpy('authNotice').and.returnValue(null),
    authError: jasmine.createSpy('authError').and.returnValue(null)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ utm_campaign: 'teste' }) } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OfferComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    authService.setPendingCheckout.calls.reset();
  });

  it('renderiza uma única heading principal e prioriza CTA Basic', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('[data-cta="hero-basic"]')?.textContent).toContain('R$ 29,90');
    expect(element.querySelector('[data-cta="nav-basic"]')).toBeTruthy();
    expect(element.querySelector('[data-cta="final-basic"]')).toBeTruthy();
  });

  it('preserva plano e campanha ao abrir autenticação', async () => {
    await component.selectPlan('pro', 'pricing');
    expect(component.selectedPlan).toBe('pro');
    expect(authService.setPendingCheckout).toHaveBeenCalledWith(
      'pro',
      '/checkout?plan=pro&utm_campaign=teste'
    );
  });

  it('navega direto ao checkout quando autenticado', async () => {
    authService.isAuthenticated.and.returnValue(true);
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    await component.selectPlan('premium', 'hero');
    expect(navigate).toHaveBeenCalledWith('/checkout?plan=premium&utm_campaign=teste');
    authService.isAuthenticated.and.returnValue(false);
  });

  it('fechar popup não troca plano pendente no serviço', async () => {
    await component.selectPlan('basic', 'pricing');
    component.selectedPlan = null;
    expect(authService.setPendingCheckout).toHaveBeenCalledTimes(1);
    expect(authService.setPendingCheckout).toHaveBeenCalledWith(
      'basic',
      '/checkout?plan=basic&utm_campaign=teste'
    );
  });
});
