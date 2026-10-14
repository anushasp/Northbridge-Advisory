import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth-service';
import { Login } from './login';

describe('Login', () => {
  const login = vi.fn();

  async function setup() {
    login.mockReset();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const type = (selector: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      await fixture.whenStable();
    };
    return { fixture, el, type, submit };
  }

  it('shows required errors and does not call the API when empty', async () => {
    const { el, submit } = await setup();
    await submit();
    expect(el.textContent).toContain('Email is required.');
    expect(el.textContent).toContain('Password is required.');
    expect(login).not.toHaveBeenCalled();
  });

  it('validates the email format', async () => {
    const { el, type, submit } = await setup();
    type('#email', 'not-an-email');
    await submit();
    expect(el.textContent).toContain('Enter a valid email address.');
  });

  it('signs in and navigates to the dashboard', async () => {
    const { type, submit } = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    login.mockReturnValue(of({ token: 't', user: {} }));

    type('#email', 'test@northbridge.com');
    type('#password', 'password123');
    await submit();

    expect(login).toHaveBeenCalledWith('test@northbridge.com', 'password123', true);
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows an alert for invalid credentials', async () => {
    const { el, type, submit } = await setup();
    login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    type('#email', 'test@northbridge.com');
    type('#password', 'wrongpass1');
    await submit();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Invalid email or password');
  });
});
