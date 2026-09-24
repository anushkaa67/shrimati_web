import React, { useEffect, useState } from 'react';
import { X, Play, Download, Video, Mic, ExternalLink, ShieldCheck } from 'lucide-react';
import { storage } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { resolveMediaUrl } from '../supabase';

export default function MediaModal({ media, onClose }) {
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const rawUrl = media?.downloadUrl || media?.url || media?.storagePath;
    if (!rawUrl) {
      setError("No valid video/audio URL found in document metadata");
      setLoading(false);
      return;
    }

    try {
      const url = resolveMediaUrl(rawUrl, media.userId);
      setResolvedUrl(url);
      setLoading(false);
    } catch (err) {
      console.error("Media URL resolution error:", err);
      setError("Could not resolve public media link.");
      setLoading(false);
    }
  }, [media]);

  if (!media) return null;

  const isVideo = media.type?.toLowerCase().includes('video') || 
                  media.url?.toLowerCase().includes('.mp4') ||
                  media.fileName?.toLowerCase().includes('video');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0D0819] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-pink-200/30">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isVideo ? 'bg-rose-400/20 text-pink-500' : 'bg-amber-500/20 text-amber-400'}`}>
              {isVideo ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {media.type || media.fileName || 'Evidence Dump'}
              </h3>
              <p className="text-xs text-white/50 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Encrypted Vault Media
              </p>
              {media.fileName && (
                <p className="mt-1 max-w-[260px] truncate font-mono text-[10px] text-slate-500 sm:max-w-md" title={media.fileName}>
                  {media.fileName}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Media Player */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[260px] bg-black/40">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#FF5F8A] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-white/60">Fetching decrypted stream...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-rose-400 font-medium mb-3">{error}</p>
              <p className="text-xs text-white/40 max-w-sm">
                Raw reference: <code className="bg-black/50 px-2 py-1 rounded text-white/70">{media.url}</code>
              </p>
            </div>
          ) : isVideo ? (
            <video 
              controls 
              autoPlay 
              className="w-full max-h-[380px] rounded-2xl border border-white/10 bg-black shadow-inner"
              src={resolvedUrl}
            >
              Your browser does not support video playback.
            </video>
          ) : (
            <div className="w-full py-8 px-6 bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <Mic className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
              <audio controls autoPlay className="w-full">
                <source src={resolvedUrl} />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-t border-white/5">
          <div className="text-xs text-white/50">
            {media.timeText && (
              <span>Timestamp: <strong className="text-white/80">{media.timeText}</strong></span>
            )}
          </div>
          {resolvedUrl && (
            <a 
              href={resolvedUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Stream Source
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
