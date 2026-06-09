import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ClientAreaComponent } from './client-area.component';
import { AuthService } from '@core/services/auth.service';
import { UserLibraryService } from '@core/services/user-library.service';
import { ApiService } from '@core/api.service';
import { ToastrService } from 'ngx-toastr';

describe('ClientAreaComponent', () => {
  let component: ClientAreaComponent;
  let fixture: ComponentFixture<ClientAreaComponent>;
  const authServiceMock = {
    currentUser: jasmine.createSpy('currentUser').and.returnValue(null),
    waitForAuthInit: jasmine.createSpy('waitForAuthInit').and.resolveTo(),
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false)
  };
  const apiServiceMock = {
    getClientAreaContent: jasmine.createSpy('getClientAreaContent').and.returnValue(of({
      slides: [],
      news: [],
      has_configured_content: false
    })),
    syncMercadoPagoReturn: jasmine.createSpy('syncMercadoPagoReturn')
  };
  const toastrMock = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
    warning: jasmine.createSpy('warning'),
    info: jasmine.createSpy('info')
  };
  const userLibraryServiceMock = {
    loadUserLibrary: jasmine.createSpy('loadUserLibrary').and.returnValue(of({
      userId: 1,
      plan: { slug: 'gratuito', nome: 'Gratuito', status: 'ativo' },
      ownedPacks: [],
      featuredPacks: [],
      noveltyPacks: [],
      allPacks: [],
      upgradePacks: [],
      popularPacks: []
    }))
  };

  beforeEach(async () => {
    authServiceMock.currentUser.calls.reset();
    authServiceMock.currentUser.and.returnValue(null);
    authServiceMock.waitForAuthInit.calls.reset();
    authServiceMock.isAuthenticated.calls.reset();
    authServiceMock.isAuthenticated.and.returnValue(false);
    authServiceMock.isAdmin.calls.reset();
    authServiceMock.isAdmin.and.returnValue(false);
    apiServiceMock.getClientAreaContent.calls.reset();
    userLibraryServiceMock.loadUserLibrary.calls.reset();

    await TestBed.configureTestingModule({
      imports: [ClientAreaComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: UserLibraryService, useValue: userLibraryServiceMock },
        { provide: ToastrService, useValue: toastrMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
