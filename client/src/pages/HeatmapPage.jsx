import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance.js';
import { IconArrowLeft, IconTrendingUp } from '../components/common/Icons.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const HEAT_COLORS = ['#f1f5f9', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a'];

function getHeatLevel(value, max) {
  if (value === 0) return 0;
  const ratio = value / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export default function HeatmapPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await api.get(`/heatmap/project/${projectId}`);
        setHeatmapData(res.data.data.heatmap);
      } catch {}
      finally { setLoading(false); }
    };
    fetchHeatmap();
  }, [projectId]);

  if (loading) return <LoadingSpinner />;

  const allDates = new Set();
  let maxPoints = 1;
  heatmapData.forEach((userData) => {
    Object.entries(userData.contributions).forEach(([date, pts]) => {
      allDates.add(date);
      if (pts > maxPoints) maxPoints = pts;
    });
  });
  const sortedDates = [...allDates].sort();

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-5 transition-colors cursor-pointer">
        <IconArrowLeft size={16} />
        <span>Kembali</span>
      </button>

      <div className="flex items-center gap-2.5 mb-6">
        <IconTrendingUp size={22} className="text-slate-400" />
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Heatmap Kontribusi</h1>
      </div>

      {heatmapData.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IconTrendingUp size={28} className="text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">Belum ada data kontribusi. Selesaikan beberapa task terlebih dahulu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 overflow-x-auto">
          <div className="mb-6 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span>Sedikit</span>
            {HEAT_COLORS.map((c, i) => (
              <span key={i} className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span>Banyak</span>
          </div>

          {heatmapData.map((userData) => (
            <div key={userData.user._id} className="mb-6 last:mb-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center ring-2 ring-slate-200/60">
                  <span className="text-xs font-semibold text-slate-600">{userData.user.fullName?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{userData.user.fullName}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{userData.totalPoints} poin total</p>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {sortedDates.map((date) => {
                  const pts = userData.contributions[date] || 0;
                  const level = getHeatLevel(pts, maxPoints);
                  return (
                    <div
                      key={date}
                      className="w-4 h-4 rounded-sm cursor-pointer transition-transform hover:scale-125"
                      style={{ backgroundColor: HEAT_COLORS[level] }}
                      onMouseEnter={() => setTooltip({ date, pts, user: userData.user.fullName })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {tooltip && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3.5 py-2 rounded-lg shadow-lg z-50 font-medium">
              {tooltip.user} · {tooltip.date} · {tooltip.pts} poin
            </div>
          )}
        </div>
      )}
    </div>
  );
}
