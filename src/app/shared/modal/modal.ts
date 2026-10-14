import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  model,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Wrapper around the native <dialog> element. showModal() gives us a focus
 * trap, Escape to close, inert background and the ::backdrop for free.
 * Use variant="sheet" for the right-hand side panel.
 */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  template: `
    <dialog
      #dialog
      [class.sheet]="variant() === 'sheet'"
      [attr.aria-labelledby]="titleId"
      (close)="open.set(false)"
      (click)="onBackdropClick($event)"
    >
      <header>
        <h2 [id]="titleId">{{ heading() }}</h2>
        <button type="button" class="close" (click)="open.set(false)" aria-label="Close">
          <app-icon name="x" [size]="20" />
        </button>
      </header>
      @if (open()) {
        <div class="body"><ng-content /></div>
      }
    </dialog>
  `,
  styleUrl: './modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  private static nextId = 0;

  readonly heading = input.required<string>();
  readonly variant = input<'dialog' | 'sheet'>('dialog');
  /** Two-way bindable: [(open)]="showForm". */
  readonly open = model(false);

  protected readonly titleId = `modal-title-${Modal.nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  /** Clicks on the dialog element itself (not its content) are clicks on the backdrop. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.open.set(false);
  }
}
