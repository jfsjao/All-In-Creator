import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PlansComponent } from './plans.component';
import { ApiService } from '@core/api.service';
import { AuthService } from '@core/services/auth.service';

describe('PlansComponent', () => {
  let component: PlansComponent;
  let fixture: ComponentFixture<PlansComponent>;
  const apiServiceMock = {
    getPacksDestaque: jasmine.createSpy('getPacksDestaque').and.returnValue(of({
      total: 0,
      packs: []
    }))
  };
  const authServiceMock = {
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    setPendingCheckout: jasmine.createSpy('setPendingCheckout'),
    register: jasmine.createSpy('register').and.resolveTo(true),
    login: jasmine.createSpy('login').and.resolveTo(true),
    loginWithGoogle: jasmine.createSpy('loginWithGoogle').and.resolveTo(true),
    rememberTermsAcceptanceForSignup: jasmine.createSpy('rememberTermsAcceptanceForSignup'),
    clearError: jasmine.createSpy('clearError'),
    clearNotice: jasmine.createSpy('clearNotice'),
    authNotice: jasmine.createSpy('authNotice').and.returnValue(null),
    authError: jasmine.createSpy('authError').and.returnValue(null)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlansComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
