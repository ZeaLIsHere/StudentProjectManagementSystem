import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance.js';
import { TASK_STATUS_LABELS, PRIORITY_COLORS, APPROVAL_LABELS, APPROVAL_COLORS } from '../utils/constants.js';
import { IconArrowLeft, IconEye, IconFileText, IconClock, IconDownload } from '../components/common/Icons.jsx';
import { formatDate, formatRelative } from '../utils/formatDate.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function MonitoringPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, taskRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/tasks`),
        ]);
        setProject(projRes.data.data.project);
        setTasks(taskRes.data.data.tasks);
      } catch { navigate('/projects'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [projectId]);

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  const statusGroups = {
    todo: tasks.filter(t => t.status === 'todo'),
    inProgress: tasks.filter(t => t.status === 'inProgress'),
    review: tasks.filter(t => t.status === 'review'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const allAttachments = tasks.flatMap(t => t.attachments?.map(a => ({ ...a, taskTitle: t.title, taskId: t._id })) || []).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  return (
    <div>
      <button onClick={() => navigate(`/projects/${projectId}`)} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-5 transition-colors cursor-pointer">
        <IconArrowLeft size={16} /><span>Kembali ke Proyek</span>
      </button>
      <div className="flex items-center gap-2.5 mb-6">
        <IconEye size={22} className="text-slate-400" />
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monitoring — {project.title}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(statusGroups).map(([key, ts]) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200/80 p-4">
            <p className="text-2xl font-bold text-slate-900">{ts.length}</p>
            <p className="text-xs text-slate-400 font-medium">{TASK_STATUS_LABELS[key]}</p>
          </div>
        ))}
      </div>

      {/* Members Progress */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Progres Anggota</h2>
        <div className="space-y-4">
          {project.members?.map((member) => {
            const memberTasks = tasks.filter(t => t.assignee?._id === member._id);
            const completed = memberTasks.filter(t => t.status === 'done').length;
            const total = memberTasks.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={member._id} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center ring-1 ring-slate-200/60 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-600">{member.fullName?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{member.fullName}</p>
                    <p className="text-xs text-slate-400">{completed}/{total} task</p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Semua Task</h2>
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task._id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                  <p className="text-xs text-slate-400">{task.assignee?.fullName || 'Belum ditugaskan'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {task.approvalStatus && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: APPROVAL_COLORS[task.approvalStatus] + '20', color: APPROVAL_COLORS[task.approvalStatus] }}>
                    {APPROVAL_LABELS[task.approvalStatus]}
                  </span>
                )}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{TASK_STATUS_LABELS[task.status]}</span>
                {task.attachments?.length > 0 && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><IconFileText size={12} />{task.attachments.length}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Files */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Semua File ({allAttachments.length})</h2>
        {allAttachments.length > 0 ? (
          <div className="space-y-2">
            {allAttachments.map((att, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <IconFileText size={16} className="text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{att.fileName}</p>
                    <p className="text-xs text-slate-400">{att.taskTitle} · {att.uploadedBy?.fullName} · <span className="inline-flex items-center gap-0.5"><IconClock size={10} />{formatRelative(att.uploadedAt)}</span></p>
                  </div>
                </div>
                <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${att.filePath}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                  <IconDownload size={14} />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Belum ada file yang diunggah</p>
        )}
      </div>
    </div>
  );
}
