import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from '../app/pages/dashboard/dashboard.component';
import { DownloadsComponent } from '../app/pages/downloads/downloads.component';
import { AccountComponent } from '../app/pages/account/account.component';
import { PacksComponent } from '../app/pages/packs/packs.component';
import { AuthService } from '../app/core/services/auth.service';

describe('Post Login Workflow', () => {
  const authServiceMock = {
    currentUser: jasmine.createSpy('currentUser').and.returnValue({
      uid: 'user-1',
      email: 'joao@example.com',
      displayName: 'João Felipe',
      photoURL: null,
      plano: 'basic'
    }),
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
    waitForAuthInit: jasmine.createSpy('waitForAuthInit').and.resolveTo()
  };

  function configure(component: unknown) {
    return TestBed.configureTestingModule({
      imports: [component as never],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();
  }

  it('renders dashboard data for authenticated users', async () => {
    await configure(DashboardComponent);

    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.userName).toBe('João Felipe');
    expect(component.myPacks.length).toBeGreaterThan(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Bem-vindo de volta');
  });

  it('filters downloads by the search term', async () => {
    await configure(DownloadsComponent);

    const fixture = TestBed.createComponent(DownloadsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.searchTerm = 'Pack IA';

    expect(component.filteredRecentDownloads.length).toBe(1);
    expect(component.filteredRecentDownloads[0].title).toContain('IA');
  });

  it('prefills account data with the authenticated user info', async () => {
    await configure(AccountComponent);

    const fixture = TestBed.createComponent(AccountComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.profileForm.name).toBe('João Felipe');
    expect(component.profileForm.email).toBe('joao@example.com');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('João Felipe');
  });

  it('filters packs using the search box logic', async () => {
    await configure(PacksComponent);

    const fixture = TestBed.createComponent(PacksComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.searchTerm = 'emoji';

    expect(component.filterPacks(component.myPacks).length).toBe(1);
    expect(component.filterPacks(component.myPacks)[0].title).toBe('Emojis');
  });
});
