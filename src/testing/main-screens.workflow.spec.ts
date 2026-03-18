import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from '../app/app.component';
import { HomeComponent } from '../app/pages/home/home.component';
import { StoreComponent } from '../app/pages/store/store.component';
import { AboutComponent } from '../app/pages/about/about.component';
import { ContactComponent } from '../app/pages/contact/contact.component';
import { AuthService } from '../app/core/services/auth.service';
import { ClipboardService } from '../app/core/services/clipboard/clipboard.service';
import { ToastrService } from 'ngx-toastr';

describe('Main Screens Workflow', () => {
  const authServiceMock = {
    currentUser: jasmine.createSpy('currentUser').and.returnValue(null),
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    logout: jasmine.createSpy('logout').and.resolveTo(),
    waitForAuthInit: jasmine.createSpy('waitForAuthInit').and.resolveTo()
  };

  const clipboardMock = {
    copyToClipboard: jasmine.createSpy('copyToClipboard').and.resolveTo(true)
  };

  const toastrMock = {
    error: jasmine.createSpy('error'),
    success: jasmine.createSpy('success'),
    warning: jasmine.createSpy('warning'),
    info: jasmine.createSpy('info')
  };

  beforeAll(() => {
    class MockIntersectionObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }

    (window as typeof window & { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    spyOn(window.HTMLMediaElement.prototype, 'play').and.returnValue(Promise.resolve());
    spyOn(window.HTMLMediaElement.prototype, 'pause').and.stub();
  });

  function configureTestingModule(component: unknown) {
    return TestBed.configureTestingModule({
      imports: [component as never],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ClipboardService, useValue: clipboardMock },
        { provide: ToastrService, useValue: toastrMock }
      ]
    }).compileComponents();
  }

  it('renders the app shell with navbar and footer', async () => {
    await configureTestingModule(AppComponent);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-navbar')).toBeTruthy();
    expect(element.querySelector('app-footer')).toBeTruthy();
  });

  it('renders the home screen highlight sections', async () => {
    await configureTestingModule(HomeComponent);

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.hero-carousel')).toBeTruthy();
    expect(element.querySelector('.pricing-section')).toBeTruthy();
    expect(element.querySelectorAll('.pricing-card').length).toBe(3);
  });

  it('renders the store plans page with the comparison cards', async () => {
    await configureTestingModule(StoreComponent);

    const fixture = TestBed.createComponent(StoreComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.plans-hero')).toBeTruthy();
    expect(element.querySelectorAll('.plan-card').length).toBe(3);
  });

  it('renders the about page metrics and CTA', async () => {
    await configureTestingModule(AboutComponent);

    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.about-hero')).toBeTruthy();
    expect(element.querySelectorAll('.number-card').length).toBe(4);
    expect(element.querySelector('.cta-button')).toBeTruthy();
  });

  it('renders the contact page channels and form', async () => {
    await configureTestingModule(ContactComponent);

    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.contact-hero')).toBeTruthy();
    expect(element.querySelectorAll('.info-card').length).toBe(4);
    expect(element.querySelector('form.contact-form')).toBeTruthy();
  });
});
