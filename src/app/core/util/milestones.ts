import { Engagement } from '../data/models';
import { addDays, daysBetween, parseDate } from './dates';

export type MilestoneState = 'Completed' | 'In Progress' | 'Planning';

export interface Milestone {
  name: string;
  start: Date;
  end: Date;
  state: MilestoneState;
}

const PHASES: Record<Engagement['serviceLine'], string[]> = {
  Audit: ['Planning', 'Fieldwork', 'Internal Review', 'Client Review', 'Completion'],
  Tax: ['Planning', 'Data Gathering', 'Preparation', 'Review', 'Filing'],
  Consulting: ['Planning', 'Discovery', 'Analysis', 'Recommendations', 'Delivery'],
};

/**
 * Splits the engagement's date range into five phases and marks each one
 * completed, in progress, or planned based on today's date.
 */
export function buildMilestones(e: Engagement, today = new Date()): Milestone[] {
  const start = parseDate(e.startDate);
  const totalDays = Math.max(daysBetween(start, parseDate(e.dueDate)), 4);
  const names = PHASES[e.serviceLine];
  const size = totalDays / names.length;

  return names.map((name, i) => {
    const phaseStart = addDays(start, Math.round(i * size));
    const phaseEnd = addDays(start, Math.round((i + 1) * size) - (i === names.length - 1 ? 0 : 1));
    let state: MilestoneState = 'Planning';
    if (e.status === 'Completed' || daysBetween(phaseEnd, today) > 0) state = 'Completed';
    else if (daysBetween(phaseStart, today) >= 0) state = 'In Progress';
    return { name, start: phaseStart, end: phaseEnd, state };
  });
}
