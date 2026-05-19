import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useAuth from '../hooks/useAuth.js';
import api from '../api/axiosInstance.js';
import { ROLES, KANBAN_COLUMNS, PRIORITY_COLORS, APPROVAL_LABELS, APPROVAL_COLORS } from '../utils/constants.js';
import { IconArrowLeft, IconPlus, IconClipboard, IconUpload, IconCheck, IconRefresh, IconMessageSquare, IconFileText, IconDownload, IconClock } from '../components/common/Icons.jsx';
import Modal from '../components/common/Modal.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { formatRelative } from '../utils/formatDate.js';
import toast from 'react-hot-toast';

function SortableCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onClick(task)} className="bg-white border border-slate-200/80 rounded-lg p-3.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all duration-150">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">{task.title}</h4>
        <span className="w-2 h-2 rounded-full shrink-0 mt-1.5 ml-2" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
      </div>
      {task.approvalStatus && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block mb-1.5" style={{ backgroundColor: APPROVAL_COLORS[task.approvalStatus] + '20', color: APPROVAL_COLORS[task.approvalStatus] }}>
          {APPROVAL_LABELS[task.approvalStatus]}
        </span>
      )}
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

function Column({ column, tasks, onTaskClick }) {
  const taskIds = tasks.map((t) => t._id);
  return (
    <div className="bg-slate-50/80 rounded-xl p-3 min-w-[280px] flex-1 border border-slate-100">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{column.title}</h3>
        <span className="text-[11px] text-slate-400 font-semibold ml-auto bg-white px-1.5 py-0.5 rounded">{tasks.length}</span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {tasks.map((task) => (
            <SortableCard key={task._id} task={task} onClick={onTaskClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', assignee: '', priority: 'medium', points: 0, dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [comment, setComment] = useState('');
  const [revisionComment, setRevisionComment] = useState('');
  const fileInputRef = useRef(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const canCreateTask = user?.role === ROLES.MAHASISWA_KETUA || user?.role === ROLES.ADMIN;
  const isKetua = project?.claimedBy?._id === user?._id;
  const isAssignee = (task) => task?.assignee?._id === user?._id;
  const [isRevising, setIsRevising] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
      ]);
      setProject(projRes.data.data.project);
      setTasks(taskRes.data.data.tasks);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

  const findColumn = (taskId) => {
    const task = tasks.find((t) => t._id === taskId);
    return task?.status;
  };

  const handleDragStart = (event) => { setActiveId(event.active.id); };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    let newStatus = findColumn(over.id);
    if (!newStatus) {
      const col = KANBAN_COLUMNS.find((c) => c.id === over.id);
      if (col) newStatus = col.id;
    }
    if (!newStatus) return;

    const updatedTasks = tasks.map((t) => t._id === active.id ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    try {
      await api.put('/kanban/bulk-update', {
        updates: [{ taskId: active.id, status: newStatus, position: 0 }],
      });
    } catch {
      setTasks(tasks);
      toast.error('Gagal memperbarui task');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/tasks`, form);
      toast.success('Task berhasil dibuat');
      setShowTaskModal(false);
      setForm({ title: '', description: '', assignee: '', priority: 'medium', points: 0, dueDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat task');
    } finally { setSubmitting(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTask) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/tasks/${selectedTask._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedTask(res.data.data.task);
      fetchData();
      toast.success('File berhasil diunggah');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah file');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  if (loading) return <LoadingSpinner />;

  const activeTask = tasks.find((t) => t._id === activeId);
  const canReview = isKetua && selectedTask && !isAssignee(selectedTask) && selectedTask.approvalStatus === 'pending';

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

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => (
            <Column key={col.id} column={col} tasks={getTasksByStatus(col.id)} onTaskClick={setSelectedTask} />
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

      {/* Create Task Modal */}
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
          {project?.members && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assign ke</label>
              <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm text-slate-800 bg-white">
                <option value="">Belum ditugaskan</option>
                {project.members.map((m) => <option key={m._id} value={m._id}>{m.fullName}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm text-slate-800 transition-shadow" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm">{submitting ? 'Membuat...' : 'Buat Task'}</button>
        </form>
      </Modal>

      {/* Task Detail Modal */}
      <Modal isOpen={!!selectedTask} onClose={() => { setSelectedTask(null); setRevisionComment(''); setIsRevising(false); }} title="Detail Task" maxWidth="max-w-2xl">
        {selectedTask && (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Judul</p>
              <p className="font-semibold text-slate-900">{selectedTask.title}</p>
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
                <p className="text-sm font-semibold text-slate-800">{selectedTask.status}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Prioritas</p>
                <p className="text-sm font-semibold" style={{ color: PRIORITY_COLORS[selectedTask.priority] }}>{selectedTask.priority}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Ditugaskan ke</p>
                <p className="text-sm font-semibold text-slate-800">{selectedTask.assignee?.fullName || '-'}</p>
              </div>
              {selectedTask.approvalStatus && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Approval</p>
                  <p className="text-sm font-semibold" style={{ color: APPROVAL_COLORS[selectedTask.approvalStatus] }}>{APPROVAL_LABELS[selectedTask.approvalStatus]}</p>
                </div>
              )}
            </div>

            {/* Revision comment */}
            {selectedTask.approvalStatus === 'revision' && selectedTask.revisionComment && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-[11px] text-red-600 uppercase tracking-wider font-medium mb-1">Komentar Revisi</p>
                <p className="text-sm text-red-700">{selectedTask.revisionComment}</p>
                {selectedTask.reviewedBy && <p className="text-[11px] text-red-400 mt-1">oleh {selectedTask.reviewedBy.fullName}</p>}
              </div>
            )}

            {/* Attachments */}
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-2">File ({selectedTask.attachments?.length || 0})</p>
              {selectedTask.attachments?.length > 0 ? (
                <div className="space-y-2">
                  {selectedTask.attachments.map((att, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <IconFileText size={16} className="text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{att.fileName}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{att.uploadedBy?.fullName}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><IconClock size={10} />{formatRelative(att.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${att.filePath}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                        <IconDownload size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Belum ada file</p>
              )}
              {isAssignee(selectedTask) && (
                <div className="mt-3">
                  <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                    <IconUpload size={14} />
                    Upload File
                  </button>
                </div>
              )}
            </div>

            {/* Approval Actions */}
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
                      Revisi
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

            {/* Comments */}
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
    </div>
  );
}
