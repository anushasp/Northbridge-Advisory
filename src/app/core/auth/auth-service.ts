import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse, User } from '../data/models';

const STORAGE_KEY = 'engagetrack.session';

interface Session {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(this.restore());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  login(email: string, password: string, remember: boolean): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/login', { email, password }).pipe(
      tap((res) => {
        this.session.set(res);
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(STORAGE_KEY, JSON.stringify(res));
      }),
    );
  }

  /** Keeps the stored session in sync after the user edits their profile. */
  updateUser(user: User): void {
    const current = this.session();
    if (!current) return;
    const next = { ...current, user };
    this.session.set(next);
    const storage = localStorage.getItem(STORAGE_KEY) ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}
