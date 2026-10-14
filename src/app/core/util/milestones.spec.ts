import { Engagement } from '../data/models';
import { buildMilestones } from './milestones';

const base = {
  serviceLine: 'Audit',
  startDate: '2026-10-01',
  dueDate: '2026-10-30',
  status: 'In Progress',
} as Engagement;

describe('buildMilestones', () => {
  it('creates five phases that start and end on the engagement dates', () => {
    const phases = buildMilestones(base, new Date(2026, 9, 12));
    expect(phases.map((p) => p.name)).toEqual([
      'Planning',
      'Fieldwork',
      'Internal Review',
      'Client Review',
      'Completion',
    ]);
    expect(phases[0].start).toEqual(new Date(2026, 9, 1));
    expect(phases[4].end).toEqual(new Date(2026, 9, 30));
  });

  it('marks past phases completed and the current one in progress', () => {
    const states = buildMilestones(base, new Date(2026, 9, 12)).map((p) => p.state);
    expect(states).toEqual(['Completed', 'In Progress', 'Planning', 'Planning', 'Planning']);
  });

  it('marks everything completed when the engagement is completed', () => {
    const done = buildMilestones({ ...base, status: 'Completed' }, new Date(2026, 9, 2));
    expect(done.every((p) => p.state === 'Completed')).toBe(true);
  });
});
