import { TimeAgoPipe } from './time-ago-pipe';

describe('TimeAgoPipe', () => {
  const pipe = new TimeAgoPipe();
  const now = new Date('2026-10-12T10:00:00');

  it.each([
    ['2026-10-12T09:59:40', 'just now'],
    ['2026-10-12T09:35:00', '25 min ago'],
    ['2026-10-12T09:00:00', '1 hour ago'],
    ['2026-10-12T07:00:00', '3 hours ago'],
    ['2026-10-10T10:00:00', '2 days ago'],
  ])('%s → %s', (value, expected) => {
    expect(pipe.transform(value, now)).toBe(expected);
  });
});
