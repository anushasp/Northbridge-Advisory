export type ServiceLine = 'Audit' | 'Tax' | 'Consulting';

export type EngagementStatus = 'Planning' | 'In Progress' | 'Review' | 'Completed';

export interface Engagement {
  id: string;
  code: string;
  client: string;
  name: string;
  serviceLine: ServiceLine;
  managerId: string;
  partnerId: string;
  startDate: string;
  dueDate: string;
  budgetHours: number;
  actualHours: number;
  status: EngagementStatus;
  description: string;
  teamIds: string[];
  archived: boolean;
}

/** Fields the New/Edit Engagement form controls. */
export type EngagementDraft = Pick<
  Engagement,
  'client' | 'name' | 'serviceLine' | 'managerId' | 'startDate' | 'dueDate' | 'budgetHours' | 'description'
>;

export type TeamRole = 'Partner' | 'Manager' | 'Senior' | 'Staff';

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: TeamRole;
  title: string;
  email: string;
  utilization: number;
  availableHours: number;
}

export type TaskStatus = 'Planning' | 'In Progress' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  engagementId: string;
  title: string;
  assigneeId: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface EngagementDocument {
  id: string;
  engagementId: string;
  name: string;
  type: string;
  sizeKb: number;
  uploadedById: string;
  uploadedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  action: string;
  engagementId: string;
  timestamp: string;
  tone: 'default' | 'warning';
}

export interface User {
  id: string;
  email: string;
  name: string;
  initials: string;
  title: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type SortOption = 'dueDate:asc' | 'dueDate:desc' | 'client:asc' | 'name:asc';

/** Query options for the engagements list (maps to json-server params). */
export interface EngagementQuery {
  search?: string;
  status?: EngagementStatus | '';
  serviceLine?: ServiceLine | '';
  managerId?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}
