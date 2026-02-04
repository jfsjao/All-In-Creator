import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have brand "N1"', () => {
    const brand = fixture.nativeElement.querySelector('.navbar-brand');
    expect(brand?.textContent).toContain('N1');
  });

  it('should have auth button "Acessar"', () => {
    const btn = fixture.nativeElement.querySelector('.auth-btn');
    expect(btn?.textContent).toContain('Acessar');
  });
});
