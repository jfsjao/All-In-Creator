import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UrlTree, provideRouter } from '@angular/router';
import { FooterComponent } from '../app/components/footer/footer.component';
import { NavbarComponent } from '../app/components/navbar/navbar.component';
import { ClipboardService } from '../app/core/services/clipboard/clipboard.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../app/core/services/auth.service';
import { routes } from '../app/config/app.routes';

describe('Buttons And Routes Workflow', () => {
  describe('application routes', () => {
    it('keeps public and private paths mapped correctly', () => {
      const paths = routes.map((route) => route.path);

      expect(paths).toContain('home');
      expect(paths).toContain('plans');
      expect(paths).toContain('about');
      expect(paths).toContain('contact');
      expect(paths).toContain('auth');
      expect(paths).toContain('client-area');
      expect(paths).toContain('library');
      expect(paths).toContain('my-downloads');
      expect(paths).toContain('my-account');
    });

    it('protects the post-login routes with authGuard', () => {
      const protectedPaths = ['client-area', 'library', 'my-downloads', 'my-account'];

      protectedPaths.forEach((path) => {
        const route = routes.find((item) => item.path === path);
        expect(route?.canActivate?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('navbar actions', () => {
    let fixture: ComponentFixture<NavbarComponent>;
    let component: NavbarComponent;
    const authServiceMock = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue(null),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
      logout: jasmine.createSpy('logout').and.resolveTo()
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [NavbarComponent],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: authServiceMock }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('shows the reusable brand logo and public navigation links', () => {
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelector('app-brand-logo')).toBeTruthy();
      expect(element.textContent).toContain('Planos');
      expect(element.textContent).toContain('Contato');
    });

    it('opens and closes the mobile menu state', () => {
      component.toggleMobileMenu();
      expect(component.isMenuOpen).toBeTrue();
      expect(component.isMobileMenuOpen).toBeTrue();

      component.closeMobileMenu();
      expect(component.isMenuOpen).toBeFalse();
      expect(component.isMobileMenuOpen).toBeFalse();
    });
  });

  describe('footer actions', () => {
    let fixture: ComponentFixture<FooterComponent>;
    let component: FooterComponent;
    const clipboardMock = {
      copyToClipboard: jasmine.createSpy('copyToClipboard')
    };
    const toastrMock = {
      error: jasmine.createSpy('error')
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FooterComponent],
        providers: [
          provideRouter([]),
          { provide: ClipboardService, useValue: clipboardMock },
          { provide: ToastrService, useValue: toastrMock }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(FooterComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('renders navigation and social buttons', () => {
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelector('app-brand-logo')).toBeTruthy();
      expect(element.querySelectorAll('.footer-link').length).toBeGreaterThanOrEqual(4);
      expect(element.querySelectorAll('.social-icon').length).toBe(2);
    });

    it('shows a success notification after copying a contact', fakeAsync(async () => {
      clipboardMock.copyToClipboard.and.resolveTo(true);
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as MouseEvent;

      await component.copyContact('nicolwork24@gmail.com', 'email', event);
      tick(60);

      expect(clipboardMock.copyToClipboard).toHaveBeenCalled();
      expect(component.showNotification).toBeTrue();
      expect(component.notificationMessage).toContain('Email');
    }));

    it('surfaces an error when copy fails', fakeAsync(async () => {
      clipboardMock.copyToClipboard.and.resolveTo(false);
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as MouseEvent;

      await component.copyContact('16996325175', 'phone', event);
      tick(60);

      expect(toastrMock.error).toHaveBeenCalled();
    }));
  });
});
