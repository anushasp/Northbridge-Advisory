// Generates mock-api/db.json with deterministic sample data.
// Run `npm run seed` any time to reset the data after testing create/edit/delete.
const fs = require('fs');
const path = require('path');

// Small seeded random generator so every run produces the same data.
let state = 7;
const rand = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const pick = (list) => list[Math.floor(rand() * list.length)];
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pad = (n) => String(n).padStart(2, '0');

const team = [
  { id: 'u1', name: 'Sarah Mitchell', initials: 'SM', role: 'Manager', title: 'Engagement Manager', email: 'sarah.mitchell@northbridge.com', utilization: 84, availableHours: 160 },
  { id: 'u2', name: 'James Wilson', initials: 'JW', role: 'Manager', title: 'Tax Manager', email: 'james.wilson@northbridge.com', utilization: 76, availableHours: 160 },
  { id: 'u3', name: 'Daniel Brooks', initials: 'DB', role: 'Senior', title: 'Senior Auditor', email: 'daniel.brooks@northbridge.com', utilization: 94, availableHours: 160 },
  { id: 'u4', name: 'Emily Chen', initials: 'EC', role: 'Partner', title: 'Consulting Partner', email: 'emily.chen@northbridge.com', utilization: 62, availableHours: 120 },
  { id: 'u5', name: 'Olivia Patel', initials: 'OP', role: 'Staff', title: 'Staff Consultant', email: 'olivia.patel@northbridge.com', utilization: 76, availableHours: 160 },
  { id: 'u6', name: 'Marcus Reed', initials: 'MR', role: 'Senior', title: 'Senior Tax Associate', email: 'marcus.reed@northbridge.com', utilization: 88, availableHours: 160 },
  { id: 'u7', name: 'Priya Nair', initials: 'PN', role: 'Staff', title: 'Staff Auditor', email: 'priya.nair@northbridge.com', utilization: 58, availableHours: 160 },
  { id: 'u8', name: 'Robert Hayes', initials: 'RH', role: 'Partner', title: 'Audit Partner', email: 'robert.hayes@northbridge.com', utilization: 49, availableHours: 120 },
];

const prefix = { Audit: 'AUD', Tax: 'TAX', Consulting: 'CON' };
const partnerFor = { Audit: 'u8', Tax: 'u8', Consulting: 'u4' };
const staffFor = { Audit: ['u3', 'u7'], Tax: ['u6', 'u7'], Consulting: ['u5', 'u3'] };

// The first six match the Figma screens exactly.
const featured = [
  { client: 'Acme Corporation', name: 'FY2026 Financial Audit', serviceLine: 'Audit', managerId: 'u1', partnerId: 'u4', startDate: '2026-10-01', dueDate: '2026-10-30', budgetHours: 240, actualHours: 187.2, status: 'In Progress', code: 'AUD-2026-014', teamIds: ['u1', 'u3', 'u4', 'u5'] },
  { client: 'Beacon Industries', name: 'Q3 Tax Compliance', serviceLine: 'Tax', managerId: 'u2', startDate: '2026-09-15', dueDate: '2026-10-14', budgetHours: 200, actualHours: 90, status: 'In Progress', code: 'TAX-2026-032' },
  { client: 'Cedar Health', name: 'Operating Model Review', serviceLine: 'Consulting', managerId: 'u1', startDate: '2026-08-18', dueDate: '2026-10-16', budgetHours: 320, actualHours: 336, status: 'Review', code: 'CON-2026-009' },
  { client: 'Horizon Logistics', name: 'Internal Controls Audit', serviceLine: 'Audit', managerId: 'u2', startDate: '2026-09-01', dueDate: '2026-10-15', budgetHours: 400, actualHours: 260, status: 'Review', code: 'AUD-2026-021' },
  { client: 'Meridian Group', name: 'FY2025 Tax Provision', serviceLine: 'Tax', managerId: 'u2', startDate: '2026-08-04', dueDate: '2026-10-09', budgetHours: 180, actualHours: 180, status: 'Completed', code: 'TAX-2026-018' },
  { client: 'Summit Capital', name: 'Finance Transformation', serviceLine: 'Consulting', managerId: 'u1', startDate: '2026-10-05', dueDate: '2026-11-06', budgetHours: 500, actualHours: 100, status: 'Planning', code: 'CON-2026-016' },
];

const moreClients = ['Atlas Energy', 'Bluewater Foods', 'Crescent Retail', 'Delta Aerospace', 'Evergreen Bank', 'Falcon Media', 'Granite Partners', 'Harbor Insurance', 'Ironwood Manufacturing', 'Juniper Labs', 'Keystone Pharma', 'Lakeside Hotels', 'Monarch Telecom', 'Northstar Freight', 'Oakridge Holdings', 'Pinnacle Software', 'Quarry Materials', 'Redwood Energy'];
const namesFor = {
  Audit: ['SOX Readiness Review', 'Year-End Audit', 'Revenue Recognition Audit', 'IT General Controls Audit'],
  Tax: ['Transfer Pricing Study', 'State Tax Nexus Review', 'R&D Credit Claim', 'Indirect Tax Review'],
  Consulting: ['ERP Selection', 'Cost Reduction Program', 'Cyber Risk Assessment', 'Strategy Assessment'],
};

const engagements = featured.map((e, i) => ({
  id: String(i + 1),
  partnerId: partnerFor[e.serviceLine],
  teamIds: [...new Set([e.managerId, partnerFor[e.serviceLine], ...staffFor[e.serviceLine]])],
  description: `${e.name} for ${e.client}.`,
  archived: false,
  ...e,
}));

const counters = { Audit: 30, Tax: 40, Consulting: 20 };
for (const client of moreClients) {
  const serviceLine = pick(['Audit', 'Tax', 'Consulting']);
  const status = pick(['Planning', 'In Progress', 'In Progress', 'Review', 'Completed']);
  const budgetHours = pick([120, 160, 200, 240, 300, 400]);
  const pct = { Planning: int(2, 15), 'In Progress': int(25, 92), Review: int(80, 110), Completed: int(92, 100) }[status];
  const startMonth = int(7, 9);
  const managerId = pick(['u1', 'u2']);
  const name = pick(namesFor[serviceLine]);
  counters[serviceLine] += 1;
  engagements.push({
    id: String(engagements.length + 1),
    code: `${prefix[serviceLine]}-2026-${String(counters[serviceLine]).padStart(3, '0')}`,
    client,
    name,
    serviceLine,
    managerId,
    partnerId: partnerFor[serviceLine],
    startDate: `2026-${pad(startMonth)}-${pad(int(1, 28))}`,
    dueDate: `2026-${pad(int(10, 12))}-${pad(int(1, 28))}`,
    budgetHours,
    actualHours: Math.round((budgetHours * pct) / 10) / 10,
    status,
    description: `${name} for ${client}.`,
    teamIds: [...new Set([managerId, partnerFor[serviceLine], pick(staffFor[serviceLine])])],
    archived: false,
  });
}

const taskTemplates = {
  Audit: ['Complete control walkthroughs', 'Collect bank confirmations', 'Test revenue recognition', 'Review audit workpapers', 'Approve final audit opinion'],
  Tax: ['Gather trial balance', 'Prepare tax workpapers', 'Calculate provision', 'Manager review', 'File return'],
  Consulting: ['Stakeholder interviews', 'Current state assessment', 'Draft recommendations', 'Steering committee review', 'Deliver final report'],
};

const tasks = [];
const acmeTasks = [
  ['Complete control walkthroughs', 'u3', '2026-10-12', 'High', 'Completed'],
  ['Collect bank confirmations', 'u5', '2026-10-09', 'High', 'In Progress'],
  ['Test revenue recognition', 'u3', '2026-10-14', 'High', 'In Progress'],
  ['Review audit workpapers', 'u1', '2026-10-21', 'Medium', 'Planning'],
  ['Approve final audit opinion', 'u4', '2026-10-30', 'High', 'Planning'],
];
for (const e of engagements) {
  const rows =
    e.id === '1'
      ? acmeTasks
      : taskTemplates[e.serviceLine].map((title, i) => {
          const done = e.status === 'Completed' || (e.status !== 'Planning' && i < 2);
          return [title, pick(e.teamIds), e.dueDate, pick(['High', 'Medium', 'Low']), done ? 'Completed' : i === 2 && e.status !== 'Planning' ? 'In Progress' : 'Planning'];
        });
  for (const [title, assigneeId, dueDate, priority, status] of rows) {
    tasks.push({ id: String(tasks.length + 1), engagementId: e.id, title, assigneeId, dueDate, priority, status });
  }
}

const documents = [
  { engagementId: '1', name: 'Audit Planning Memorandum.pdf', type: 'PDF', sizeKb: 1229, uploadedById: 'u1', uploadedAt: '2026-10-05' },
  { engagementId: '1', name: 'Risk Assessment Matrix.xlsx', type: 'XLSX', sizeKb: 156, uploadedById: 'u3', uploadedAt: '2026-10-05' },
  { engagementId: '1', name: 'Engagement Letter.pdf', type: 'PDF', sizeKb: 420, uploadedById: 'u4', uploadedAt: '2026-10-01' },
];
for (const e of engagements.slice(1)) {
  documents.push({ engagementId: e.id, name: 'Engagement Letter.pdf', type: 'PDF', sizeKb: int(200, 600), uploadedById: e.partnerId, uploadedAt: e.startDate });
  if (e.status !== 'Planning') {
    documents.push({ engagementId: e.id, name: 'Working Papers.xlsx', type: 'XLSX', sizeKb: int(100, 900), uploadedById: pick(e.teamIds), uploadedAt: e.startDate });
  }
}
documents.forEach((d, i) => (d.id = String(i + 1)));

const activity = [
  { userId: 'u3', action: 'Completed control walkthroughs', engagementId: '1', timestamp: '2026-10-12T09:35:00', tone: 'default' },
  { userId: 'u1', action: 'Updated audit due date', engagementId: '1', timestamp: '2026-10-12T09:00:00', tone: 'default' },
  { userId: 'u4', action: 'Assigned Olivia Patel', engagementId: '6', timestamp: '2026-10-12T08:00:00', tone: 'default' },
  { userId: 'u1', action: 'Budget alert: 105% used', engagementId: '3', timestamp: '2026-10-12T07:00:00', tone: 'warning' },
  { userId: 'u2', action: 'Moved to Review', engagementId: '4', timestamp: '2026-10-11T16:20:00', tone: 'default' },
  { userId: 'u6', action: 'Uploaded tax workpapers', engagementId: '2', timestamp: '2026-10-11T11:05:00', tone: 'default' },
].map((a, i) => ({ id: String(i + 1), ...a }));

const users = [
  { id: 'u1', email: 'sarah.mitchell@northbridge.com', password: 'Demo1234!', name: 'Sarah Mitchell', initials: 'SM', title: 'Engagement Manager' },
];

const db = { users, team, engagements, tasks, documents, activity };
const json = JSON.stringify(db, null, 2) + '\n';

// Copy bundled into production builds, where the in-browser API serves it.
fs.writeFileSync(path.join(__dirname, '../src/app/core/mock/demo-data.json'), json);

// DEMO_ONLY=1 refreshes the bundled copy without resetting your local json-server data.
if (!process.env.DEMO_ONLY) {
  fs.writeFileSync(path.join(__dirname, 'db.json'), json);
}
console.log(`Seeded ${engagements.length} engagements, ${tasks.length} tasks, ${documents.length} documents.`);
