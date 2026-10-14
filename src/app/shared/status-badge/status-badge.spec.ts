import { TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  function render(status: string) {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.badge') as HTMLElement;
  }

  it('shows the status text', () => {
    expect(render('Review').textContent?.trim()).toBe('Review');
  });

  it.each([
    ['Planning', 'neutral'],
    ['In Progress', 'info'],
    ['Review', 'warning'],
    ['Completed', 'success'],
  ])('maps %s to the %s tone', (status, tone) => {
    expect(render(status).dataset['tone']).toBe(tone);
  });
});
