import ApiError from './ApiError.js';
import { ROLES, PROJECT_STATUS } from './constants.js';

const toId = (ref) => (ref?._id || ref)?.toString();

export function getProjectAccess(project, userId, role) {
  const isOwner = toId(project.owner) === userId;
  const isMember = project.members?.some((m) => toId(m) === userId);
  const isClaimedBy = toId(project.claimedBy) === userId;
  const isAssistant = project.assistants?.some((a) => toId(a) === userId);
  const isAdmin = role === ROLES.ADMIN;

  return { isOwner, isMember, isClaimedBy, isAssistant, isAdmin };
}

export function assertProjectAccess(project, userId, role, options = {}) {
  const access = getProjectAccess(project, userId, role);
  const hasAccess =
    access.isOwner ||
    access.isMember ||
    access.isClaimedBy ||
    access.isAssistant ||
    access.isAdmin;

  if (!hasAccess && options.allowOpenForKetua) {
    if (project.status === PROJECT_STATUS.OPEN && role === ROLES.MAHASISWA_KETUA) {
      return access;
    }
  }

  if (!hasAccess) {
    throw new ApiError(403, 'Anda tidak memiliki akses ke proyek ini');
  }

  return access;
}
