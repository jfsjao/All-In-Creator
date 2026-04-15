import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../app/core/api.service';
import { AuthService } from '../app/core/services/auth.service';
import { UserLibraryService } from '../app/core/services/user-library.service';
import { AccountComponent } from '../app/pages/account/account.component';
import { DashboardComponent } from '../app/pages/dashboard/dashboard.component';
import { DownloadsComponent } from '../app/pages/downloads/downloads.component';
import { PacksComponent } from '../app/pages/packs/packs.component';

describe('Post Login Workflow', () => {
  const authServiceMock = {
    currentUser: jasmine.createSpy('currentUser').and.returnValue({
      backendUserId: 7,
      uid: 'user-1',
      email: 'joao@example.com',
      displayName: 'João Felipe',
      photoURL: null,
      plano: 'basic'
    }),
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
    waitForAuthInit: jasmine.createSpy('waitForAuthInit').and.resolveTo()
  };

  const userLibraryServiceMock = {
    loadUserLibrary: jasmine.createSpy('loadUserLibrary').and.returnValue(of({
      userId: 7,
      plan: {
        slug: 'basic',
        nome: 'Plano Basic',
        status: 'ativo'
      },
      ownedPacks: [
        {
          id: 1,
          title: 'Emojis',
          description: 'Biblioteca de emojis',
          image: 'assets/images/packs/emoji.png',
          badge: 'Liberado',
          locked: false,
          link: '/packs',
          downloadUrl: null
        }
      ],
      featuredPacks: [],
      noveltyPacks: [],
      allPacks: [
        {
          id: 1,
          title: 'Emojis',
          description: 'Biblioteca de emojis',
          image: 'assets/images/packs/emoji.png',
          badge: 'Liberado',
          locked: false,
          link: '/packs',
          downloadUrl: null
        }
      ],
      upgradePacks: [],
      popularPacks: [
        {
          id: 1,
          title: 'Emojis',
          description: 'Biblioteca de emojis',
          image: 'assets/images/packs/emoji.png',
          badge: 'Liberado',
          locked: false,
          link: '/packs',
          downloadUrl: null
        }
      ]
    }))
  };

  const apiServiceMock = {
    getDownloadsResumo: jasmine.createSpy('getDownloadsResumo').and.returnValue(of({
      total_downloads: 1,
      total_atualizacoes: 0,
      downloads_recentes: [
        {
          id: 2,
          slug: 'pack-ia',
          nome: 'Pack IA',
          descricao: 'Coleção com assets modernos para criadores e conteúdos virais.',
          capa_url: null,
          tamanho_gb: '8.9',
          versao_atual: '2.8',
          versao_baixada: '2.8',
          baixado_em: '2026-04-01T18:11:00.000Z',
          possui_atualizacao: false
        }
      ],
      sugestoes: [
        {
          id: 1,
          slug: 'emojis',
          nome: 'Emojis',
          descricao: 'Biblioteca leve para enriquecer cortes rápidos, shorts e reels.',
          capa_url: null,
          tamanho_gb: '1.1',
          versao_atual: '1.6',
          versao_baixada: '1.6',
          baixado_em: '2026-04-01T18:11:00.000Z',
          possui_atualizacao: false
        }
      ]
    })),
    getMeuPerfil: jasmine.createSpy('getMeuPerfil').and.returnValue(of({
      usuario: {
        id: 7,
        nome: 'João Felipe',
        email: 'joao@example.com',
        telefone: '',
        area_atuacao: '',
        foto_url: null,
        criado_em: '2026-03-01T00:00:00.000Z',
        atualizado_em: '2026-04-01T00:00:00.000Z'
      }
    })),
    atualizarMeuPerfil: jasmine.createSpy('atualizarMeuPerfil').and.returnValue(of({
      message: 'Perfil atualizado com sucesso.',
      usuario: {
        id: 7,
        nome: 'João Felipe',
        email: 'joao@example.com',
        telefone: '',
        area_atuacao: '',
        foto_url: null,
        criado_em: '2026-03-01T00:00:00.000Z',
        atualizado_em: '2026-04-01T00:00:00.000Z'
      }
    }))
  };

  function configure(component: unknown) {
    return TestBed.configureTestingModule({
      imports: [component as never],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserLibraryService, useValue: userLibraryServiceMock },
        { provide: ApiService, useValue: apiServiceMock }
      ]
    }).compileComponents();
  }

  it('renders dashboard data for authenticated users', async () => {
    await configure(DashboardComponent);

    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await Promise.resolve();
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
    await fixture.whenStable();
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
    await fixture.whenStable();
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
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchTerm = 'emoji';

    expect(component.filterPacks(component.myPacks).length).toBe(1);
    expect(component.filterPacks(component.myPacks)[0].title).toBe('Emojis');
  });
});
