import React, { useEffect, useRef, useState } from 'react';
import { 
  Radar, 
  ShieldCheck, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Mic, 
  Video, 
  Play, 
  ShieldAlert, 
  Lock,
  Phone,
  Droplet,
  FileText,
  RefreshCw,
  Copy,
  Check,
  Battery,
  Wifi,
  UserRound
} from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, limit, where } from 'firebase/firestore';
import MediaModal from '../components/MediaModal';
import { getPublicProfilePhotoUrl, resolveMediaUrl } from '../supabase';

// Leaflet Map Imports
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Glowing Radar Marker Icon for Leaflet
const createPulseIcon = () => {
  return L.divIcon({
    className: 'custom-pulse-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-8 h-8 bg-[#FF5F8A]/40 rounded-full animate-ping"></div>
        <div class="absolute w-5 h-5 bg-[#FF5F8A] rounded-full border-2 border-white shadow-lg shadow-[#FF5F8A]/80 flex items-center justify-center">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

function FocusLiveLocation({ lat, lng, enabled }) {
  const map = useMap();
  const hasFocused = useRef(false);

  useEffect(() => {
    if (!enabled || hasFocused.current) return;

    hasFocused.current = true;
    map.flyTo([lat, lng], 16, {
      animate: true,
      duration: 1.6,
    });
  }, [enabled, lat, lng, map]);

  return null;
}

const getLocationCoordinates = (location) => {
  const latitude = Number(
    location?.latitude ??
    location?.lat ??
    location?.location?.latitude ??
    location?.location?.lat
  );
  const longitude = Number(
    location?.longitude ??
    location?.lng ??
    location?.location?.longitude ??
    location?.location?.lng
  );

  return {
    latitude,
    longitude,
    isValid: Number.isFinite(latitude) && Number.isFinite(longitude),
  };
};

const getLocationTimestamp = (location) => {
  const value = location?.updatedAt ?? location?.timestamp ?? location?.time ?? location?.createdAt;
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value.seconds === 'number') return value.seconds * 1000;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function Dashboard({ user }) {
  const [userData, setUserData] = useState(null);
  const [sosEvent, setSosEvent] = useState(null);
  const [sosLoading, setSosLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [copiedGps, setCopiedGps] = useState(false);
  const [activeMediaFilter, setActiveMediaFilter] = useState('all'); // 'all' | 'audio' | 'video'
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Listen to User document (users/{userId})
  useEffect(() => {
    if (!user?.uid) return;
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data());
      } else {
        setUserData({});
      }
    }, (err) => {
      console.error("User doc snapshot error:", err);
    });
    return () => unsub();
  }, [user]);

  // Read the existing phone-location feeds without writing or changing their schema.
  useEffect(() => {
    if (!user?.uid) return;

    setLiveLocation(null);

    const locationCandidates = new Map();
    const sourcePriority = {
      userLiveLocation: 4,
      userLocationHistory: 3,
      liveLocationDocument: 1,
    };

    const publishLatestLocation = () => {
      const latest = [...locationCandidates.values()]
        .filter(({ data }) => getLocationCoordinates(data).isValid)
        .sort((a, b) => {
          const timeDifference = getLocationTimestamp(b.data) - getLocationTimestamp(a.data);
          return timeDifference || b.priority - a.priority;
        })[0];

      setLiveLocation(latest?.data ?? null);
    };

    const updateSource = (source, data) => {
      if (data) {
        locationCandidates.set(source, {
          data,
          priority: sourcePriority[source] ?? 0,
        });
      } else {
        locationCandidates.delete(source);
      }
      publishLatestLocation();
    };

    const newestLocationFrom = (snapshot) => snapshot.docs
      .map((locationDoc) => ({ id: locationDoc.id, ...locationDoc.data() }))
      .filter((location) => getLocationCoordinates(location).isValid)
      .sort((a, b) => getLocationTimestamp(b) - getLocationTimestamp(a))[0] ?? null;

    const unsubscribers = [
      onSnapshot(
        doc(db, 'liveLocations', user.uid),
        (snapshot) => updateSource('liveLocationDocument', snapshot.exists() ? snapshot.data() : null),
        (error) => console.warn('Live location document unavailable:', error)
      ),
      onSnapshot(
        doc(db, 'users', user.uid, 'live_location', 'current'),
        (snapshot) => updateSource('userLiveLocation', snapshot.exists() ? snapshot.data() : null),
        (error) => console.warn('User live-location feed unavailable:', error)
      ),
      onSnapshot(
        query(
          collection(db, 'users', user.uid, 'locationHistory'),
          orderBy('timestamp', 'desc'),
          limit(1)
        ),
        (snapshot) => updateSource('userLocationHistory', newestLocationFrom(snapshot)),
        (error) => console.warn('User location history unavailable:', error)
      ),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  // Use the GPS of the device currently signed in to the dashboard.
  useEffect(() => {
    if (!user?.uid || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setDeviceLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: position.timestamp,
        });
      },
      (error) => {
        console.warn('Device location unavailable:', error.message);
        setDeviceLocation(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user?.uid]);

  // Listen to Latest SOS Event (sosEvents/{sosId} or users/{userId}/sos_events)
  useEffect(() => {
    if (!user?.uid) return;

    // First try top-level collection `sosEvents`
    const topSosRef = collection(db, 'sosEvents');
    const topSosQuery = query(topSosRef, where('userId', '==', user.uid), limit(1));
    
    const unsubTop = onSnapshot(topSosQuery, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setSosEvent({ id: docSnap.id, ...docSnap.data() });
        setSosLoading(false);
      } else {
        // Fallback to user subcollection `users/{userId}/sos_events`
        const subSosRef = collection(db, 'users', user.uid, 'sos_events');
        const subSosQuery = query(subSosRef, orderBy('time', 'desc'), limit(1));
        
        onSnapshot(subSosQuery, (subSnap) => {
          if (!subSnap.empty) {
            const d = subSnap.docs[0];
            setSosEvent({ id: d.id, ...d.data() });
          } else {
            setSosEvent(null);
          }
          setSosLoading(false);
        }, () => setSosLoading(false));
      }
    }, (err) => {
      console.error("SOS snapshot error:", err);
      setSosLoading(false);
    });

    return () => unsubTop();
  }, [user]);

  // Listen to Recordings / Media Vault (recordings/{recordId})
  useEffect(() => {
    if (!user?.uid) return;
    const recRef = collection(db, 'recordings');
    const recQuery = query(recRef, where('userId', '==', user.uid), limit(30));

    const unsub = onSnapshot(recQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        const rawUrl = data.downloadUrl || data.storagePath || data.fileName || '';
        const resolvedUrl = resolveMediaUrl(rawUrl, user.uid);
        return { 
          id: d.id, 
          ...data,
          downloadUrl: resolvedUrl 
        };
      });
      setRecordings(docs);
      setRecordingsLoading(false);
    }, (err) => {
      console.error("Recordings snapshot error:", err);
      setRecordingsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const displayName = userData?.name || userData?.displayName || user?.displayName || 'Protected Subject';
  const phone = userData?.phone || '';
  const bloodGroup = userData?.bloodGroup || '';
  const emergencyNote = userData?.emergencyNote || '';
  const email = userData?.email || user?.email || 'No email provided';
  
  const avatarUrl = userData?.photoUrl 
    ? resolveMediaUrl(userData.photoUrl, user?.uid) 
    : (user?.uid ? getPublicProfilePhotoUrl(user.uid) : '');

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);
    
  const initials = displayName ? displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'P';

  const formatTimestamp = (ts) => {
    if (!ts) return 'Not available';
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts).toLocaleString();
    return String(ts);
  };

  // Only phone telemetry is presented as a live location. SOS/default coordinates are not live data.
  const latestPhoneLocation = [deviceLocation, liveLocation, userData?.lastKnownLocation]
    .filter((location) => getLocationCoordinates(location).isValid)
    .sort((a, b) => getLocationTimestamp(b) - getLocationTimestamp(a))[0] ?? null;
  const liveCoordinates = getLocationCoordinates(latestPhoneLocation);
  const lat = liveCoordinates.latitude;
  const lng = liveCoordinates.longitude;
  const hasValidLocation = liveCoordinates.isValid;

  const copyCoordinates = () => {
    if (hasValidLocation) {
      navigator.clipboard.writeText(`${lat}, ${lng}`);
      setCopiedGps(true);
      setTimeout(() => setCopiedGps(false), 2000);
    }
  };

  const getRecordingTime = (recording) => {
    const value = recording.createdAt || recording.recordedAt || recording.time;
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getEvidenceTitle = (recording) => {
    const source = `${recording.type || ''} ${recording.fileName || ''}`.toLowerCase();
    if (source.includes('video') || source.includes('.mp4')) {
      if (source.includes('back') || source.includes('rear')) return 'SOS Video — Rear Camera';
      if (source.includes('front')) return 'SOS Video — Front Camera';
      return 'SOS Video Recording';
    }
    if (source.includes('audio') || source.includes('.mp3') || source.includes('.m4a')) return 'SOS Audio Recording';
    return 'SOS Evidence File';
  };

  const getOriginalFilename = (recording) => {
    if (recording.fileName) return recording.fileName;
    const source = recording.storagePath || recording.downloadUrl || recording.url || '';
    if (!source) return '';
    try {
      return decodeURIComponent(source.split('?')[0].split('/').pop() || '');
    } catch {
      return source.split('?')[0].split('/').pop() || '';
    }
  };

  const getEvidenceTimeText = (recording) => {
    const recordedAt = recording.createdAt || recording.recordedAt || recording.time;
    if (recordedAt) return formatTimestamp(recordedAt);

    const source = `${recording.fileName || ''} ${recording.storagePath || ''} ${recording.downloadUrl || ''}`;
    const timeMatch = source.match(/(?:sos[_-])?(\d{2})(\d{2})(\d{2})(?:[_\-.]|$)/i);
    if (!timeMatch) return 'Time unavailable';

    const [, hours, minutes, seconds] = timeMatch;
    const hour = Number(hours);
    if (hour > 23 || Number(minutes) > 59 || Number(seconds) > 59) return 'Time unavailable';

    const fallbackTime = new Date(2000, 0, 1, hour, Number(minutes), Number(seconds));
    return `${fallbackTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })} · from filename`;
  };

  // Filter media vault recordings
  const filteredRecordings = [...recordings]
    .filter(rec => {
      if (activeMediaFilter === 'audio') {
        return (rec.type || '').toLowerCase().includes('audio') || (rec.fileName || '').toLowerCase().includes('.mp3') || (rec.fileName || '').toLowerCase().includes('.m4a');
      }
      if (activeMediaFilter === 'video') {
        return (rec.type || '').toLowerCase().includes('video') || (rec.fileName || '').toLowerCase().includes('.mp4');
      }
      return true;
    })
    .sort((a, b) => getRecordingTime(b) - getRecordingTime(a));

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Hero Sentinel Command Banner */}
      <div className="relative p-6 sm:p-8 lg:p-10 rounded-[32px] glass-panel overflow-hidden space-y-6 border border-white/10 shadow-2xl">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF5F8A]/20 via-rose-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Guardian Telemetry <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5F8A] via-pink-400 to-pink-500">Command Center</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
              Real-time emergency SOS dispatch, sub-meter GPS satellite tracking, geofence boundary monitoring, and encrypted incident evidence vault dumps.
            </p>
          </div>

          {/* Quick Telemetry Counters */}
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[470px] shrink-0">
            <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/95 p-4 shadow-[0_10px_30px_rgba(151,67,99,0.10)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Radar className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-[0.12em]">System State</span>
                <span className="mt-0.5 block text-sm font-extrabold text-emerald-600">Nominal</span>
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/95 p-4 shadow-[0_10px_30px_rgba(151,67,99,0.10)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                <Wifi className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-[0.12em]">Satellite GPS</span>
                <span className="mt-0.5 block text-sm font-extrabold text-slate-800">{hasValidLocation ? 'Connected' : 'Standby'}</span>
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/95 p-4 shadow-[0_10px_30px_rgba(151,67,99,0.10)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Lock className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-[0.12em]">Media Evidence</span>
                <span className="mt-0.5 block text-sm font-extrabold text-slate-800">{recordings.length} Vault Files</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Emergency Action Buttons */}
        <div className="relative z-10 grid grid-cols-1 gap-3 border-t border-pink-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <button 
            onClick={copyCoordinates}
            className="group flex min-h-[72px] items-center gap-3 rounded-2xl border border-pink-100 bg-white/95 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-lg active:translate-y-0"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${copiedGps ? 'bg-emerald-50 text-emerald-600' : 'bg-pink-50 text-pink-600'}`}>
              {copiedGps ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-800">{copiedGps ? 'Coordinates copied' : 'Copy GPS coordinates'}</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">Copy latitude and longitude</span>
            </span>
          </button>

          {hasValidLocation && (
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[72px] items-center gap-3 rounded-2xl border border-pink-100 bg-white/95 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-lg active:translate-y-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                <MapPin className="w-5 h-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-800">Open live location</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">View in Google Maps</span>
              </span>
              <ExternalLink className="w-4 h-4 shrink-0 text-slate-400 transition-colors group-hover:text-pink-600" />
            </a>
          )}

          {phone && (
            <a
              href={`tel:${phone}`}
              className="group flex min-h-[72px] items-center gap-3 rounded-2xl border border-pink-100 bg-white/95 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-lg active:translate-y-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Phone className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-800">Call primary phone</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">{phone}</span>
              </span>
            </a>
          )}
        </div>

      </div>

      {/* Protected User Info Card */}
      <div className="glass-panel rounded-[32px] border border-pink-100 p-5 shadow-xl sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-pink-100 bg-white/95 p-4 shadow-sm sm:gap-5 sm:p-5">
            <div className="shrink-0">
              {avatarUrl && !avatarFailed ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  onError={() => setAvatarFailed(true)}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-pink-200 shadow-md bg-pink-50 sm:h-20 sm:w-20"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-100 text-pink-600 shadow-md sm:h-20 sm:w-20">
                  <UserRound className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
                  <span className="sr-only">{initials}</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-pink-600">Protected user</span>
              <h3 className="mt-1 truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                {displayName}
              </h3>
              <div className="mt-2 flex flex-col gap-1 text-xs text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-4">
                <span className="truncate">{email}</span>
                {phone && <span className="font-medium">{phone}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-100 bg-pink-50 px-3 py-1 text-[11px] font-bold text-pink-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Telemetry protected
                </span>
                {emergencyNote && (
                  <span className="inline-flex max-w-sm items-center gap-1.5 truncate rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    {emergencyNote}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white/95 shadow-sm">
            {hasValidLocation && (
              <div className="flex min-h-[76px] items-center justify-between gap-5 px-5 py-5">
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                    <Radar className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-bold text-slate-800">Live GPS</span>
                </span>
                <span className="truncate font-mono text-sm font-medium text-slate-600">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
              </div>
            )}

            {bloodGroup && (
              <div className={`flex min-h-[76px] items-center justify-between gap-5 px-5 py-5 ${hasValidLocation ? 'border-t border-pink-100' : ''}`}>
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <Droplet className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-bold text-slate-800">Blood group</span>
                </span>
                <span className="text-base font-extrabold uppercase text-rose-600">{bloodGroup}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Real-Time Satellite Map View */}
      <div className="glass-panel p-6 rounded-[32px] border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FF5F8A]/10 border border-[#FF5F8A]/30 text-[#FF5F8A]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide">
                Live GPS Satellite Telemetry Map
              </h3>
              <p className="text-xs text-slate-400">
                Interactive real-time location satellite pin with boundary precision
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white/85 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-slate-700 shadow-[0_6px_18px_rgba(173,76,111,0.10)] backdrop-blur-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-50 text-pink-600">
              <MapPin className="h-3.5 w-3.5" />
            </span>
            <span>{hasValidLocation ? 'Phone location connected' : 'Waiting for phone'}</span>
          </div>
        </div>

        {/* Leaflet Map Embed */}
        <div className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden border border-white/10 relative shadow-inner z-0">
          {hasValidLocation ? (
            <MapContainer
              center={[lat, lng]}
              zoom={14}
              scrollWheelZoom={false}
              zoomAnimation={true}
              className="h-full w-full"
            >
              <FocusLiveLocation lat={lat} lng={lng} enabled={hasValidLocation} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[lat, lng]} icon={createPulseIcon()}>
                <Popup>
                  <div className="text-xs font-sans space-y-1 p-1">
                    <strong className="block text-[#FF5F8A] font-bold">{displayName}</strong>
                    <span>Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[lat, lng]}
                radius={350}
                pathOptions={{
                  color: '#FF5F8A',
                  fillColor: '#FF5F8A',
                  fillOpacity: 0.15,
                  weight: 2
                }}
              />
            </MapContainer>
          ) : (
            <div className="flex h-full items-center justify-center bg-white/80 px-6 text-center">
              <div>
                <MapPin className="mx-auto mb-3 h-7 w-7 text-pink-500" />
                <p className="text-sm font-bold text-slate-800">Waiting for phone location</p>
                <p className="mt-1 text-xs text-slate-500">The map will appear when live GPS telemetry is received.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: SOS Emergency Card & Encrypted Media Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Latest SOS Alert Event */}
        <div className="lg:col-span-5 h-full">
          <div className="glass-panel relative flex h-full flex-col gap-6 overflow-hidden rounded-[32px] border border-white/10 p-6 shadow-2xl sm:p-8">
            
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide">
                    Latest Emergency SOS Event
                  </h3>
                  <p className="text-xs text-slate-400">Real-time distress trigger telemetry</p>
                </div>
              </div>
            </div>

            {sosLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-[#FF5F8A] border-t-transparent rounded-full animate-spin" />
                <span>Streaming live SOS telemetry...</span>
              </div>
            ) : !sosEvent ? (
              <div className="py-12 px-6 text-center rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No Active Emergency Triggers</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  System nominal. The protected individual has not triggered any emergency signals.
                </p>
              </div>
            ) : (() => {
              const sosLat = sosEvent.latitude ?? sosEvent.lat;
              const sosLng = sosEvent.longitude ?? sosEvent.lng;
              const sosTrigger = sosEvent.trigger_type || sosEvent.triggerType || 'Manual Panic Button';
              const sosTime = sosEvent.timestamp || sosEvent.time || sosEvent.createdAt;

              return (
                <div className="flex flex-1 flex-col gap-4 text-xs">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex items-start gap-3 rounded-2xl border border-pink-100 bg-white/95 p-4 shadow-sm">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                        <Clock className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <span className="block text-xs font-extrabold text-slate-900">Timestamp</span>
                        <span className="mt-1 block text-sm font-normal leading-snug text-slate-600">{formatTimestamp(sosTime)}</span>
                      </span>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-white/95 p-4 shadow-sm">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <span className="block text-xs font-extrabold text-slate-900">Trigger mechanism</span>
                        <span className="mt-1 block text-sm font-normal capitalize leading-snug text-slate-600">{String(sosTrigger).replaceAll('_', ' ')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex min-h-[190px] flex-1 flex-col gap-4">
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-pink-100 bg-pink-50/60 px-4 py-3.5 shadow-sm">
                      <span className="flex shrink-0 items-center gap-2 text-xs font-extrabold text-slate-900">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-pink-600 shadow-sm">
                          <MapPin className="h-4 w-4" />
                        </span>
                        Coordinates
                      </span>
                      <span className="min-w-0 break-all text-right font-mono text-xs font-medium leading-relaxed text-slate-600">
                        {sosLat != null && sosLng != null
                          ? `${sosLat}, ${sosLng}`
                          : 'Coordinates telemetry missing'}
                      </span>
                    </div>

                    <div className="flex flex-col justify-center rounded-2xl border border-pink-100 bg-white/95 px-5 py-4 shadow-sm">
                      <span className="block text-xs font-extrabold text-slate-900">Address reference</span>
                      <span className="mt-1.5 block text-sm font-normal leading-relaxed text-slate-600">
                        {sosEvent.address || 'Address telemetry auto-resolving...'}
                      </span>
                    </div>
                  </div>

                  {(sosEvent.map || (sosLat != null && sosLng != null)) && (
                    <a
                      href={sosEvent.map || `https://www.google.com/maps?q=${sosLat},${sosLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group mt-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-[#FF5F8A] to-rose-500 px-4 py-4 text-xs font-bold text-white shadow-xl shadow-[#FF5F8A]/20 transition-all hover:opacity-90 active:scale-95"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Open SOS Pin in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  )}

                </div>
              );
            })()}

          </div>
        </div>

        {/* Encrypted Media Evidence Vault */}
        <div className="lg:col-span-7 h-full">
          <div className="glass-panel h-full p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-6 relative overflow-hidden shadow-2xl">
            
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-400/10 border border-rose-400/30 text-pink-500">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide">
                    Encrypted Evidence Vault
                  </h3>
                  <p className="text-xs text-slate-400">
                    SOS audio & video dumps
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="grid w-full grid-cols-3 items-center gap-1 rounded-xl border border-pink-100 bg-pink-50/70 p-1 text-[11px] font-bold whitespace-nowrap xl:w-auto xl:min-w-[230px]">
                <button
                  onClick={() => setActiveMediaFilter('all')}
                  className={`flex h-8 items-center justify-center rounded-lg px-3 transition-colors ${
                    activeMediaFilter === 'all' ? 'bg-[#FF5F8A] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({recordings.length})
                </button>
                <button
                  onClick={() => setActiveMediaFilter('audio')}
                  className={`flex h-8 items-center justify-center rounded-lg px-3 transition-colors ${
                    activeMediaFilter === 'audio' ? 'bg-[#FF5F8A] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Audio
                </button>
                <button
                  onClick={() => setActiveMediaFilter('video')}
                  className={`flex h-8 items-center justify-center rounded-lg px-3 transition-colors ${
                    activeMediaFilter === 'video' ? 'bg-[#FF5F8A] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Video
                </button>
              </div>
            </div>

            {recordingsLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                <span>Decrypting media vault streams...</span>
              </div>
            ) : filteredRecordings.length === 0 ? (
              <div className="py-12 px-6 text-center rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">Vault is Empty</h4>
                <p className="text-xs text-slate-400">
                  No incident recordings captured.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredRecordings.map((rec) => {
                  const recType = rec.type || rec.fileName || 'Incident Recording';
                  const evidenceTitle = getEvidenceTitle(rec);
                  const recUrl = rec.url || rec.downloadUrl || rec.storagePath || '';
                  const originalFilename = getOriginalFilename(rec);
                  const timeText = getEvidenceTimeText(rec);
                  const isVideo = recType.toLowerCase().includes('video') || recType.toLowerCase().includes('.mp4');

                  return (
                    <div 
                      key={rec.id}
                      className="p-4 rounded-2xl bg-[#090A18]/80 hover:bg-[#0D0E24] border border-white/10 hover:border-rose-400/40 transition-all flex items-center justify-between gap-3 shadow-lg group"
                    >
                      <div className="flex items-center gap-3.5 overflow-hidden">
                        <div className={`p-3 rounded-xl shrink-0 ${
                          isVideo ? 'bg-rose-400/20 text-pink-500 border border-rose-400/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isVideo ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate">
                            {evidenceTitle}
                          </h4>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            {timeText}
                          </p>
                          {originalFilename && (
                            <p className="mt-1 truncate font-mono text-[10px] text-slate-500" title={originalFilename}>
                              {originalFilename}
                            </p>
                          )}
                        </div>
                      </div>

                      {recUrl && (
                        <button
                          onClick={() => setSelectedMedia({ ...rec, type: evidenceTitle, url: recUrl, timeText })}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-pink-600 bg-rose-400/20 hover:bg-rose-400/30 border border-rose-400/30 transition-colors flex items-center gap-1.5 shrink-0 active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>

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
