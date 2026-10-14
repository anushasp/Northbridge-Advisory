import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from '../icon/icon';
import { ToastService } from './toast-service';

@Component({
  selector: 'app-toast-outlet',
  imports: [Icon],
  template: `
    <div class="stack" role="status" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [attr.data-tone]="toast.tone">
          <app-icon [name]="toast.tone === 'error' ? 'info' : 'checkCircle'" />
          <span>{{ toast.message }}</span>
          <button type="button" (click)="toasts.dismiss(toast.id)" aria-label="Dismiss">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .stack {
      position: fixed; right: var(--space-6); bottom: var(--space-6); z-index: 1000;
      display: flex; flex-direction: column; gap: var(--space-2);
    }
    .toast {
      display: flex; align-items: center; gap: var(--space-3);
      min-width: 280px; padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-control); background: var(--color-sidebar); color: #fff;
      box-shadow: var(--shadow-popover); animation: in 200ms ease-out;
    }
    .toast[data-tone='success'] app-icon { color: #4ade80; }
    .toast[data-tone='error'] app-icon { color: #f87171; }
    .toast span { flex: 1; }
    button { border: 0; background: none; color: inherit; opacity: 0.7; cursor: pointer; display: flex; }
    @keyframes in { from { opacity: 0; transform: translateY(8px); } }
    @media (max-width: 767px) { .stack { left: var(--space-4); right: var(--space-4); bottom: var(--space-4); } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOutlet {
  protected readonly toasts = inject(ToastService);
}
