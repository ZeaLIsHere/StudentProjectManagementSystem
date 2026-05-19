import { useContext } from 'react';
import { OfflineContext } from '../../context/OfflineContext.jsx';

export default function OfflineBanner() {
  const { isOnline } = useContext(OfflineContext);

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white text-center text-sm py-2 px-4 font-medium">
      Anda sedang offline. Perubahan akan disinkronkan otomatis saat terhubung kembali.
    </div>
  );
}
