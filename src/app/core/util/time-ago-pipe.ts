import { Pipe, PipeTransform } from '@angular/core';

/** "25 min ago", "3 hours ago", "2 days ago". Pure, so it only re-runs when the input changes. */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date, now: Date = new Date()): string {
    const minutes = Math.floor((now.getTime() - new Date(value).getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
}
