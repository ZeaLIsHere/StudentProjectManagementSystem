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

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REVISION: 'revision',
};

export const INVITE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
};

export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'taskAssigned',
  TASK_UPDATED: 'taskUpdated',
  TASK_SUBMITTED: 'taskSubmitted',
  TASK_APPROVED: 'taskApproved',
  TASK_REVISION: 'taskRevision',
  PROJECT_INVITE: 'projectInvite',
  PROJECT_CLAIMED: 'projectClaimed',
  ASISTEN_INVITE: 'asistenInvite',
  HIGH_PRIORITY_TASK: 'highPriorityTask',
  DEADLINE_REMINDER: 'deadlineReminder',
  MENTION: 'mention',
  DEADLINE: 'deadline',
  TASK_COMMENT: 'taskComment',
};

export const BCRYPT_SALT_ROUNDS = 12;
