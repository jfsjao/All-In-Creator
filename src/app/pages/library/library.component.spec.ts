import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LibraryComponent } from './library.component';
import { AuthService } from '@core/services/auth.service';
import { UserLibraryService } from '@core/services/user-library.service';
import { ApiService } from '@core/api.service';

describe('LibraryComponent', () => {
  let component: LibraryComponent;
  let fixture: ComponentFixture<LibraryComponent>;
  const authServiceMock = {
    waitForAuthInit: jasmine.createSpy('waitForAuthInit').and.resolveTo(),
    currentUser: jasmine.createSpy('currentUser').and.returnValue({
      backendUserId: 1
    })
  };
  const userLibraryServiceMock = {
    loadUserLibrary: jasmine.createSpy('loadUserLibrary').and.returnValue(of({
      userId: 1,
      plan: {
        slug: 'basic',
        nome: 'Basic',
        status: 'ativo'
      },
      ownedPacks: [],
      featuredPacks: [],
      noveltyPacks: [],
      allPacks: [],
      upgradePacks: [],
      popularPacks: []
    }))
  };
  const apiServiceMock = {
    registrarDownload: jasmine.createSpy('registrarDownload')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: UserLibraryService, useValue: userLibraryServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
