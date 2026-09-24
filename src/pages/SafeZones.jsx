import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Bell, 
  Plus, 
  MapPin, 
  Edit3, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle, 
  AlertTriangle, 
  LogIn, 
  LogOut, 
  Clock,
  Sparkles,
  Radio,
  Play,
  Navigation
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import SafeZoneMapModal from '../components/SafeZoneMapModal';
import MediaModal from '../components/MediaModal';
import { resolveMediaUrl } from '../supabase';

export default function SafeZones({ user }) {
  const [activeTab, setActiveTab] = useState('zones'); // 'zones' | 'alerts'
  const [safeZones, setSafeZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [boundaryAlerts, setBoundaryAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  // Stream Safe Zones for this guardian / child (safe_zones/{zoneId})
  useEffect(() => {
    if (!user?.uid) return;
    const zonesRef = collection(db, 'safe_zones');
    const q = query(zonesRef, where('guardianId', '==', user.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setSafeZones(docs);
        setZonesLoading(false);
      } else {
        // Try fallback where childId == user.uid or all
        const qChild = query(zonesRef, where('childId', '==', user.uid));
        onSnapshot(qChild, (subSnap) => {
          const docs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setSafeZones(docs);
          setZonesLoading(false);
        }, () => setZonesLoading(false));
      }
    }, (err) => {
      console.error("Safe zones stream error:", err);
      setZonesLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Stream Boundary Alerts (boundary_alerts/{alertId})
  useEffect(() => {
    const alertsRef = collection(db, 'boundary_alerts');
    const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(50));

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          downloadUrl: data.recordingUrl ? resolveMediaUrl(data.recordingUrl) : ''
        };
      });
      setBoundaryAlerts(docs);
      setAlertsLoading(false);
    }, (err) => {
      console.error("Boundary alerts stream error:", err);
      // Fallback without orderBy if Firestore index is missing
      const simpleQ = query(alertsRef, limit(50));
      onSnapshot(simpleQ, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBoundaryAlerts(docs);
        setAlertsLoading(false);
      }, () => setAlertsLoading(false));
    });
    return () => unsub();
  }, []);

  // Handle Create or Update Safe Zone
  const handleSaveZone = async (zoneData) => {
    try {
      if (editingZone) {
        // Update
        const zoneRef = doc(db, 'safe_zones', editingZone.id);
        await updateDoc(zoneRef, {
          zoneName: zoneData.zoneName,
          latitude: zoneData.latitude,
          longitude: zoneData.longitude,
          radius: zoneData.radius
        });
      } else {
        // Create
        await addDoc(collection(db, 'safe_zones'), {
          childId: user.uid,
          guardianId: user.uid,
          zoneName: zoneData.zoneName,
          latitude: zoneData.latitude,
          longitude: zoneData.longitude,
          radius: zoneData.radius,
          active: true,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingZone(null);
    } catch (err) {
      console.error("Save safe zone error:", err);
      alert("Failed to save safe zone: " + err.message);
    }
  };

  // Toggle active status
  const handleToggleActive = async (zoneId, currentActive) => {
    try {
      const zoneRef = doc(db, 'safe_zones', zoneId);
      await updateDoc(zoneRef, { active: !currentActive });
    } catch (err) {
      console.error("Toggle safe zone error:", err);
    }
  };

  // Delete Safe Zone
  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm("Are you sure you want to delete this safe zone boundary?")) return;
    try {
      await deleteDoc(doc(db, 'safe_zones', zoneId));
    } catch (err) {
      console.error("Delete safe zone error:", err);
    }
  };

  // Calculate Real-Time status overview per zone from latest alerts
  const latestStatusPerZone = {};
  boundaryAlerts.forEach(alert => {
    if (alert.zoneId && !latestStatusPerZone[alert.zoneId]) {
      latestStatusPerZone[alert.zoneId] = alert;
    }
  });

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts).toLocaleString();
    return String(ts);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header & Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Geofence & Safe Zone Commander
            <Sparkles className="w-5 h-5 text-[#FF5F8A]" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure automated GPS perimeter boundaries and monitor entry/exit breach logs.
          </p>
        </div>

        {/* Tab Switch Controls */}
        <div className="flex items-center p-1.5 rounded-2xl bg-[#090A18]/80 border border-white/10 shrink-0 backdrop-blur-md w-full md:w-auto">
          <button
            onClick={() => setActiveTab('zones')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'zones'
                ? 'bg-gradient-to-r from-[#FF5F8A] to-rose-500 text-white shadow-lg shadow-[#FF5F8A]/25 border border-white/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Active Zones ({safeZones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'alerts'
                ? 'bg-gradient-to-r from-[#FF5F8A] to-rose-500 text-white shadow-lg shadow-rose-500/25 border border-white/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Breach Logs ({boundaryAlerts.length})</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'zones' ? (
        <div className="space-y-6">
          
          {/* Action Bar */}
          <div className="flex justify-between items-center gap-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Geofence Perimeters
            </p>
            <button
              onClick={() => {
                setEditingZone(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#FF5F8A] via-pink-600 to-rose-500 hover:opacity-95 shadow-xl shadow-[#FF5F8A]/30 border border-white/20 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Safe Zone</span>
            </button>
          </div>

          {/* Zones Grid */}
          {zonesLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-[#FF5F8A] border-t-transparent rounded-full animate-spin" />
              <span>Fetching safe zone boundary configurations...</span>
            </div>
          ) : safeZones.length === 0 ? (
            <div className="glass-panel p-10 sm:p-14 text-center rounded-[32px] border border-white/10 space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-slate-400 mx-auto flex items-center justify-center">
                <MapPin className="w-7 h-7 text-[#FF5F8A]" />
              </div>
              <h3 className="text-lg font-extrabold text-white">No Safe Zones Configured</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Set up geofenced safety boundaries like Home, Campus, or Work to receive instant boundary alert logs.
              </p>
              <button
                onClick={() => {
                  setEditingZone(null);
                  setIsModalOpen(true);
                }}
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors active:scale-95"
              >
                <Plus className="w-4 h-4 text-[#FF5F8A]" />
                <span>Create First Geofence Zone</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {safeZones.map((zone) => (
                <div 
                  key={zone.id}
                  className="group relative overflow-hidden rounded-[28px] border border-pink-100 bg-white p-5 shadow-[0_16px_44px_rgba(151,67,99,0.10)] transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-[0_20px_50px_rgba(151,67,99,0.14)] sm:p-6"
                >
                  <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                        zone.active ? 'border-pink-100 bg-pink-50 text-pink-600' : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}>
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Safe zone</span>
                        <h4 className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-slate-900">
                          {zone.zoneName}
                        </h4>
                      </div>
                    </div>

                    {/* Active Toggle Button */}
                    <button
                      onClick={() => handleToggleActive(zone.id, zone.active)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                        zone.active
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {zone.active ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-pink-100 bg-pink-50/55 px-4 py-3.5">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Boundary radius</span>
                      <span className="mt-1 block text-sm font-extrabold text-slate-800">{Math.round(zone.radius)} meters</span>
                    </div>
                    <div className="rounded-2xl border border-pink-100 bg-pink-50/55 px-4 py-3.5">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">GPS center</span>
                      <span className="mt-1 block truncate font-mono text-xs font-medium text-slate-700">
                        {zone.latitude?.toFixed(4)}, {zone.longitude?.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-pink-100 pt-4">
                    <button
                      onClick={() => {
                        setEditingZone(zone);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-pink-100 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition-all hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700 active:scale-[0.98]"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone.id)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-xs font-bold text-rose-600 transition-all hover:border-rose-200 hover:bg-rose-50 active:scale-[0.98]"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      ) : (
        /* Boundary Breach Alerts Log Tab */
        <div className="space-y-6">
          
          {/* Telemetry Summary Card */}
          <div className="glass-panel p-6 rounded-[28px] border border-white/10 space-y-4 shadow-xl">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
              <Radio className="w-4 h-4 text-[#FF5F8A] animate-pulse" />
              Live Boundary Telemetry Summary
            </h3>
            
            {Object.keys(latestStatusPerZone).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No live telemetry boundary reports registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.values(latestStatusPerZone).map((alert) => {
                  const isInside = alert.type?.toLowerCase() === 'entered' || alert.type?.toLowerCase() === 'inside';
                  return (
                    <div 
                      key={alert.id}
                      className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
                        isInside 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {isInside ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <div className="overflow-hidden">
                        <span className="text-white block font-bold truncate">{alert.zoneName}</span>
                        <span>{isInside ? 'INSIDE SAFE BOUNDARY' : 'BOUNDARY BREACH DETECTED'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alert Stream Feed */}
          {alertsLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
              <span>Streaming boundary alert logs...</span>
            </div>
          ) : boundaryAlerts.length === 0 ? (
            <div className="glass-panel p-10 sm:p-14 text-center rounded-[32px] border border-white/10 space-y-3 shadow-2xl">
              <Bell className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Recent Boundary Alerts</h4>
              <p className="text-xs text-slate-400">
                Log events will appear automatically when safe boundaries are entered or crossed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {boundaryAlerts.map((alert) => {
                const isEntry = alert.type?.toLowerCase() === 'entered' || alert.type?.toLowerCase() === 'inside';
                const hasRecording = Boolean(alert.downloadUrl || alert.recordingUrl);

                return (
                  <div 
                    key={alert.id}
                    className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4 shadow-lg hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className={`p-3 rounded-xl shrink-0 ${
                        isEntry ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {isEntry ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                          {isEntry ? 'Entered' : 'Exited'} {alert.zoneName || 'Safe Zone Perimeter'}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {hasRecording && (
                        <button
                          onClick={() => setSelectedMedia({
                            type: `Boundary Alert Video (${alert.zoneName || 'Geofence'})`,
                            url: alert.downloadUrl || alert.recordingUrl,
                            timeText: formatTimestamp(alert.timestamp)
                          })}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-pink-600 bg-rose-400/20 hover:bg-rose-400/30 border border-rose-400/30 transition-colors flex items-center gap-1.5 active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Video</span>
                        </button>
                      )}
                      <div className="text-right font-mono text-xs hidden sm:block">
                        <span className="text-slate-500 block text-[10px] uppercase">Subject ID</span>
                        <span className="text-white font-bold text-[11px]">{alert.childId || 'Protected User'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Map Config Modal */}
      {isModalOpen && (
        <SafeZoneMapModal 
          initialData={editingZone}
          onSave={handleSaveZone}
          onClose={() => {
            setIsModalOpen(false);
            setEditingZone(null);
          }}
        />
      )}

      {/* Media Player Modal */}
      {selectedMedia && (
        <MediaModal 
          media={selectedMedia} 
          onClose={() => setSelectedMedia(null)} 
        />
      )}

    </div>
  );
}
