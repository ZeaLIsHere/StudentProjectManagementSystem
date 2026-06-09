import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useAuth from '../hooks/useAuth.js';
import api from '../api/axiosInstance.js';
import syncManager from '../utils/syncManager.js';
import offlineStorage from '../utils/offlineStorage.js';
import { ROLES, KANBAN_COLUMNS, PRIORITY_COLORS, APPROVAL_LABELS, APPROVAL_COLORS, TASK_STATUS_LABELS, ROLE_LABELS } from '../utils/constants.js';
import { IconArrowLeft, IconPlus, IconClipboard, IconUpload, IconCheck, IconRefresh, IconMessageSquare, IconFileText, IconDownload, IconClock, IconX } from '../components/common/Icons.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { formatRelative } from '../utils/formatDate.js';
import toast from 'react-hot-toast';

const toId = (ref) => (ref?._id ?? ref)?.toString?.() ?? '';

function SortableCard({ task, onClick, dragDisabled, isMyTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    disabled: dragDisabled,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(dragDisabled ? {} : { ...attributes, ...listeners })}
      onClick={() => onClick(task)}
      className={`bg-white border rounded-lg p-3.5 hover:shadow-sm transition-all duration-150 ${isMyTask ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200/80'} ${dragDisabled ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">{task.title}</h4>
        <span className="w-2 h-2 rounded-full shrink-0 mt-1.5 ml-2" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
      </div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {isMyTask && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">Ditugaskan ke Anda</span>
        )}
        {task.approvalStatus && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: APPROVAL_COLORS[task.approvalStatus] + '20', color: APPROVAL_COLORS[task.approvalStatus] }}>
            {APPROVAL_LABELS[task.approvalStatus]}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        {task.assignee && <p className="text-xs text-slate-400 font-medium">{task.assignee.fullName}</p>}
        <div className="flex items-center gap-2">
          {task.attachments?.length > 0 && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><IconFileText size={12} />{task.attachments.length}</span>}
          {task.comments?.length > 0 && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><IconMessageSquare size={12} />{task.comments.length}</span>}
          {task.points > 0 && <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">{task.points} pts</span>}
        </div>
      </div>
    </div>
  );
}

function Column({ column, tasks, onTaskClick, dragDisabled, currentUserId }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const taskIds = tasks.map((t) => t._id);

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-50/80 rounded-xl p-3 min-w-[280px] flex-1 border transition-colors ${isOver ? 'border-blue-300 bg-blue-50/50' : 'border-slate-100'}`}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{column.title}</h3>
        <span className="text-[11px] text-slate-400 font-semibold ml-auto bg-white px-1.5 py-0.5 rounded">{tasks.length}</span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {tasks.map((task) => (
            <SortableCard
              key={task._id}
              task={task}
              onClick={onTaskClick}
              dragDisabled={dragDisabled}
              isMyTask={toId(task.assignee) === currentUserId}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

const emptyForm = { title: '', description: '', assignee: '', priority: 'medium', points: 0, dueDate: '' };

export default function KanbanPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [comment, setComment] = useState('');
  const [revisionComment, setRevisionComment] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const fileInputRef = useRef(null);

  const getFileUrl = (filePath) => `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${filePath}`;

  const isImageFile = (fileName) => /\.(jpe?g|png|gif|webp)$/i.test(fileName || '');

  const isPendingReview = (task) => task?.status === 'review' && task?.approvalStatus === 'pending';

  const canUploadFile = (task) =>
    isAssignee(task) && !isPendingReview(task) && task?.status !== 'done';

  const canSubmitForReview = (task) =>
    isAssignee(task) &&
    !isPendingReview(task) &&
    task?.status !== 'done' &&
    (task?.attachments?.length || 0) > 0;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const currentUserId = toId(user);
  const isKetua = toId(project?.claimedBy) === currentUserId;
  const isOwner = toId(project?.owner) === currentUserId;
  const isAssistant = project?.assistants?.some((a) => toId(a) === currentUserId);
  const isMember = project?.members?.some((m) => toId(m) === currentUserId);
  const isAdmin = user?.role === ROLES.ADMIN;
  const isAnggota = user?.role === ROLES.MAHASISWA_ANGGOTA;
  const canCreateTask = isKetua || isAdmin;
  const canEditTask = isKetua || isAdmin;
  const canDeleteTask = isKetua || isOwner || isAdmin;
  const canDrag = isMember || isOwner || isAssistant || isKetua || isAdmin;
  const canDragToDone = isKetua || isAdmin;

  const isAssignee = (task) => toId(task?.assignee) === currentUserId;

  const assignableMembers = project?.members?.filter(
    (m) => m.role === ROLES.MAHASISWA_ANGGOTA || m.role === ROLES.MAHASISWA_KETUA
  ) ?? [];

  const myAssignedTasks = tasks.filter((t) => isAssignee(t));

  const cacheData = async (proj, taskList) => {
    await offlineStorage.put('projects', { ...proj, _id: projectId });
    for (const task of taskList) {
      await offlineStorage.put('tasks', { ...task, project: projectId });
    }
  };

  const fetchData = useCallback(async () => {
    try {
      if (navigator.onLine) {
        const [projRes, taskRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/tasks`),
        ]);
        const proj = projRes.data.data.project;
        const taskList = taskRes.data.data.tasks;
        setProject(proj);
        setTasks(taskList);
        await cacheData(proj, taskList);
      } else {
        throw new Error('offline');
      }
    } catch {
      const cachedProject = await offlineStorage.get('projects', projectId);
      const allTasks = await offlineStorage.getAll('tasks');
      const cachedTasks = allTasks.filter((t) => t.project === projectId);
      if (cachedProject) {
        setProject(cachedProject);
        setTasks(cachedTasks);
        toast('Mode offline: menampilkan data tersimpan', { icon: '📡' });
      } else {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

  const findColumn = (taskId) => tasks.find((t) => t._id === taskId)?.status;

  const kanbanUpdate = async (updates, previousTasks) => {
    try {
      if (navigator.onLine) {
        await api.put('/kanban/bulk-update', { updates });
      } else {
        await syncManager.queueAction('put', '/kanban/bulk-update', { updates });
        toast.success('Disimpan offline, akan disinkronkan saat online');
      }
    } catch {
      setTasks(previousTasks);
      toast.error('Gagal memperbarui task');
    }
  };

  const handleDragStart = (event) => {
    if (!canDrag) return;
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !canDrag) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    const overTask = tasks.find((t) => t._id === over.id);
    let newStatus = overTask?.status;
    if (!newStatus) {
      const col = KANBAN_COLUMNS.find((c) => c.id === over.id);
      newStatus = col?.id;
    }
    if (!newStatus || (newStatus === activeTask.status && active.id === over.id)) return;

    if (newStatus === 'review') {
      toast.error('Gunakan tombol Submit Task untuk mengirim ke kolom Review');
      return;
    }

    if (newStatus === 'done' && !canDragToDone) {
      toast.error('Hanya ketua kelompok yang dapat memindahkan task ke Done');
      return;
    }

    const columnTasks = getTasksByStatus(newStatus).filter((t) => t._id !== active.id);
    let newPosition = columnTasks.length;
    if (overTask && overTask.status === newStatus) {
      const overIndex = columnTasks.findIndex((t) => t._id === over.id);
      newPosition = overIndex >= 0 ? overIndex : columnTasks.length;
    }

    const previousTasks = tasks;
    const updatedTasks = tasks.map((t) =>
      t._id === active.id ? { ...t, status: newStatus, position: newPosition } : t
    );
    setTasks(updatedTasks);

    await kanbanUpdate([{ taskId: active.id, status: newStatus, position: newPosition }], previousTasks);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.assignee) {
      toast.error('Pilih anggota penerima task');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/tasks`, form);
      toast.success('Task berhasil dibuat');
      setShowTaskModal(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat task');
    } finally { setSubmitting(false); }
  };

  const openEditMode = (task) => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      assignee: toId(task.assignee) || '',
      priority: task.priority,
      points: task.points || 0,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setIsEditing(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!editForm.assignee) {
      toast.error('Pilih anggota penerima task');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.put(`/tasks/${selectedTask._id}`, editForm);
      setSelectedTask(res.data.data.task);
      setIsEditing(false);
      fetchData();
      toast.success('Task berhasil diperbarui');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui task');
    } finally { setSubmitting(false); }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await api.delete(`/tasks/${selectedTask._id}`);
      toast.success('Task berhasil dihapus');
      setSelectedTask(null);
      setShowDeleteConfirm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus task');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTask) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await api.post(`/tasks/${selectedTask._id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedTask(res.data.data.task);
      fetchData();
      toast.success('File berhasil diunggah. Klik Submit Task untuk mengirim ke review.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!selectedTask) return;
    try {
      const res = await api.delete(`/tasks/${selectedTask._id}/attachments/${attachmentId}`);
      setSelectedTask(res.data.data.task);
      fetchData();
      toast.success('File berhasil dihapus');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus file');
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedTask) return;
    setSubmittingTask(true);
    try {
      const res = await api.post(`/tasks/${selectedTask._id}/submit`);
      setSelectedTask(res.data.data.task);
      fetchData();
      toast.success('Task berhasil disubmit untuk review');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal submit task');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleReview = async (action) => {
    if (action === 'revision' && !revisionComment.trim()) {
      toast.error('Komentar revisi wajib diisi');
      return;
    }
    try {
      const res = await api.put(`/tasks/${selectedTask._id}/review`, {
        action,
        comment: revisionComment,
      });
      setSelectedTask(res.data.data.task);
      fetchData();
      setRevisionComment('');
      setIsRevising(false);
      toast.success(action === 'approve' ? 'Task disetujui' : 'Revisi diminta');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mereview task');
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/tasks/${selectedTask._id}/comments`, { content: comment });
      setSelectedTask(res.data.data.task);
      setComment('');
      toast.success('Komentar ditambahkan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambah komentar');
    }
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setRevisionComment('');
    setIsRevising(false);
    setIsEditing(false);
  };

  if (loading) return <LoadingSpinner />;

  const activeTask = tasks.find((t) => t._id === activeId);
  const canReview = isKetua && selectedTask && !isAssignee(selectedTask) && isPendingReview(selectedTask);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate(`/projects/${projectId}`)} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            <IconArrowLeft size={16} /><span>Kembali</span>
          </button>
          <div className="flex items-center gap-2.5 mt-2">
            <IconClipboard size={22} className="text-slate-400" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{project?.title}</h1>
          </div>
        </div>
        {canCreateTask && (
          <button onClick={() => setShowTaskModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-sm">
            <IconPlus size={16} />
            Task Baru
          </button>
        )}
      </div>

      {(isAnggota || isKetua) && (
        <div className="mb-4 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
          {isAnggota && (
            <span>Anda memiliki <strong>{myAssignedTasks.length}</strong> task ditugaskan. Klik task bertanda &quot;Ditugaskan ke Anda&quot; untuk upload progres.</span>
          )}
          {isKetua && !isAnggota && (
            <span>Assign task ke anggota agar mereka dapat mengunggah file progres. Task menunggu review: <strong>{tasks.filter((t) => t.status === 'review' && t.approvalStatus === 'pending').length}</strong></span>
          )}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => (
            <Column key={col.id} column={col} tasks={getTasksByStatus(col.id)} onTaskClick={setSelectedTask} dragDisabled={!canDrag} currentUserId={currentUserId} />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="bg-white border-2 border-slate-300 rounded-lg p-3.5 shadow-lg w-[280px]">
              <h4 className="text-sm font-medium text-slate-800">{activeTask.title}</h4>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Buat Task Baru">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Judul Task</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 resize-none transition-shadow" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Prioritas</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm text-slate-800 bg-white">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Poin</label>
              <input type="number" min={0} value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm text-slate-800 transition-shadow" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assign ke Anggota *</label>
            {assignableMembers.length > 0 ? (
              <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm text-slate-800 bg-white">
                <option value="">Pilih anggota penerima task</option>
                {assignableMembers.map((m) => (
                  <option key={toId(m)} value={toId(m)}>{m.fullName} ({ROLE_LABELS[m.role]}{m.nim ? ` · ${m.nim}` : ''})</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">Tambahkan anggota ke proyek terlebih dahulu sebelum membuat task.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm text-slate-800 transition-shadow" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm">{submitting ? 'Membuat...' : 'Buat Task'}</button>
        </form>
      </Modal>

      <Modal isOpen={!!selectedTask} onClose={closeTaskModal} title={isEditing ? 'Edit Task' : 'Detail Task'} maxWidth="max-w-2xl">
        {selectedTask && isEditing ? (
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Judul Task</label>
              <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm text-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm text-slate-800 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Prioritas</label>
                <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm bg-white">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Poin</label>
                <input type="number" min={0} value={editForm.points} onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) || 0 })} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm" />
              </div>
            </div>
            {canEditTask && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assign ke Anggota *</label>
                <select value={editForm.assignee} onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm bg-white">
                  <option value="">Pilih anggota penerima task</option>
                  {assignableMembers.map((m) => (
                    <option key={toId(m)} value={toId(m)}>{m.fullName} ({ROLE_LABELS[m.role]})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</label>
              <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer">{submitting ? 'Menyimpan...' : 'Simpan'}</button>
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 cursor-pointer">Batal</button>
            </div>
          </form>
        ) : selectedTask && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Judul</p>
                <p className="font-semibold text-slate-900">{selectedTask.title}</p>
              </div>
              {(canEditTask || canDeleteTask) && (
                <div className="flex gap-2 shrink-0">
                  {canEditTask && (
                    <button onClick={() => openEditMode(selectedTask)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer">Edit</button>
                  )}
                  {canDeleteTask && (
                    <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer">Hapus</button>
                  )}
                </div>
              )}
            </div>
            {selectedTask.description && (
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Deskripsi</p>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedTask.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Status</p>
                <p className="text-sm font-semibold text-slate-800">{TASK_STATUS_LABELS[selectedTask.status] || selectedTask.status}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Prioritas</p>
                <p className="text-sm font-semibold" style={{ color: PRIORITY_COLORS[selectedTask.priority] }}>{selectedTask.priority}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Ditugaskan ke</p>
                <p className="text-sm font-semibold text-slate-800">{selectedTask.assignee?.fullName || '-'}</p>
              </div>
              {selectedTask.dueDate && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Due Date</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTask.dueDate.split('T')[0]}</p>
                </div>
              )}
              {selectedTask.approvalStatus && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Approval</p>
                  <p className="text-sm font-semibold" style={{ color: APPROVAL_COLORS[selectedTask.approvalStatus] }}>{APPROVAL_LABELS[selectedTask.approvalStatus]}</p>
                </div>
              )}
            </div>

            {selectedTask.approvalStatus === 'revision' && selectedTask.revisionComment && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-[11px] text-red-600 uppercase tracking-wider font-medium mb-1">Komentar Revisi</p>
                <p className="text-sm text-red-700">{selectedTask.revisionComment}</p>
                {selectedTask.reviewedBy && <p className="text-[11px] text-red-400 mt-1">oleh {selectedTask.reviewedBy.fullName}</p>}
              </div>
            )}

            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                File Progress ({selectedTask.attachments?.length || 0})
              </p>
              {selectedTask.attachments?.length > 0 ? (
                <div className="space-y-2">
                  {selectedTask.attachments.map((att) => (
                    <div key={att._id || att.filePath} className="p-2.5 bg-white rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <IconFileText size={16} className="text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{att.fileName}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{att.uploadedBy?.fullName}</span>
                              <span>·</span>
                              <span>{(att.fileSize / 1024).toFixed(1)} KB</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><IconClock size={10} />{formatRelative(att.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a href={getFileUrl(att.filePath)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
                            Preview
                          </a>
                          <a href={getFileUrl(att.filePath)} download={att.fileName} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                            <IconDownload size={14} />
                          </a>
                          {canUploadFile(selectedTask) && att._id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att._id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Hapus file"
                            >
                              <IconX size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {isImageFile(att.fileName) && (
                        <a href={getFileUrl(att.filePath)} target="_blank" rel="noopener noreferrer" className="block mt-2">
                          <img src={getFileUrl(att.filePath)} alt={att.fileName} className="max-h-32 rounded border border-slate-200 object-contain" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Belum ada file yang diunggah</p>
              )}

              {canUploadFile(selectedTask) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <IconUpload size={14} />
                    {uploading ? 'Mengunggah...' : 'Upload File'}
                  </button>
                  {canSubmitForReview(selectedTask) && (
                    <button
                      type="button"
                      onClick={handleSubmitTask}
                      disabled={submittingTask}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <IconCheck size={14} />
                      {submittingTask ? 'Mengirim...' : 'Submit Task'}
                    </button>
                  )}
                </div>
              )}

              {isPendingReview(selectedTask) && isAssignee(selectedTask) && (
                <p className="mt-2 text-xs text-amber-600 font-medium">Task sedang menunggu review ketua kelompok.</p>
              )}

              {isPendingReview(selectedTask) && !isAssignee(selectedTask) && (isKetua || isOwner || isAssistant) && (
                <p className="mt-2 text-xs text-amber-600 font-medium">Task ini menunggu review Anda.</p>
              )}

              {!isAssignee(selectedTask) && !canUploadFile(selectedTask) && selectedTask.assignee && (
                <p className="mt-2 text-xs text-slate-500">Progres diunggah oleh {selectedTask.assignee.fullName}.</p>
              )}
            </div>

            {canReview && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-3">Review Task</p>
                {!isRevising ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleReview('approve')} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer">
                      <IconCheck size={14} />
                      Approve
                    </button>
                    <button onClick={() => setIsRevising(true)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer">
                      <IconRefresh size={14} />
                      Request Revision
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea value={revisionComment} onChange={(e) => setRevisionComment(e.target.value)} rows={2} placeholder="Komentar alasan revisi..." className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none text-sm text-slate-800 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => handleReview('revision')} className="flex-grow inline-flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer">
                        Kirim Revisi
                      </button>
                      <button onClick={() => { setIsRevising(false); setRevisionComment(''); }} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-3">Komentar ({selectedTask.comments?.length || 0})</p>
              {selectedTask.comments?.length > 0 && (
                <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                  {selectedTask.comments.map((c, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center shrink-0 ring-1 ring-slate-200/60">
                        <span className="text-[10px] font-semibold text-slate-500">{c.author?.fullName?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-700">{c.author?.fullName}</p>
                          <p className="text-[10px] text-slate-400">{formatRelative(c.createdAt)}</p>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tulis komentar..." onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg outline-none text-sm text-slate-800" />
                <button onClick={handleAddComment} disabled={!comment.trim()} className="px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer">Kirim</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTask}
        title="Hapus Task"
        message={`Apakah Anda yakin ingin menghapus task "${selectedTask?.title}"?`}
      />
    </div>
  );
}
