export const ROLES = {
  ADMIN: 'admin',
  DOSEN: 'dosen',
  ASISTEN_DOSEN: 'asisten-dosen',
  MAHASISWA_KETUA: 'mahasiswa-ketua',
  MAHASISWA_ANGGOTA: 'mahasiswa-anggota',
};

export const PROJECT_STATUS = {
  OPEN: 'open',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'inProgress',
  REVIEW: 'review',
  DONE: 'done',
};

export const TASK_STATUS_LABELS = {
  todo: 'To Do',
  inProgress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7c3aed',
};

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REVISION: 'revision',
};

export const APPROVAL_LABELS = {
  pending: 'Menunggu Review',
  approved: 'Disetujui',
  revision: 'Perlu Revisi',
};

export const APPROVAL_COLORS = {
  pending: '#f59e0b',
  approved: '#22c55e',
  revision: '#ef4444',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  dosen: 'Dosen',
  'asisten-dosen': 'Asisten Dosen',
  'mahasiswa-ketua': 'Ketua Kelompok',
  'mahasiswa-anggota': 'Anggota Kelompok',
};

export const STATUS_COLORS = {
  open: '#3b82f6',
  active: '#22c55e',
  completed: '#6366f1',
  archived: '#94a3b8',
};

export const KANBAN_COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#64748b' },
  { id: 'inProgress', title: 'In Progress', color: '#3b82f6' },
  { id: 'review', title: 'Review', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#22c55e' },
];
