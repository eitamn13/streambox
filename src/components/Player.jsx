import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getContentDetails } from '../core/StreamBoxCore.js';
import { fetchStreams } from '../core/StreamEngine.js';
import { searchMagnets, addMagnetToRd, getConfiguredDebrids } from '../core/DebridManager.js';
import { fetchSubtitles, loadSubtitleTrack, LANGUAGE_NAMES } from '../core/SubtitleEngine.js';
import { addToHistory } from '../core/History.js';
import { useSubscription } from '../contexts/SubscriptionContext.jsx';
import SubtitleOverlay from './SubtitleOverlay.jsx';
import {
  ArrowRight, Maximize, Minimize, Volume2, VolumeX, Play, Pause,
  Settings as SettingsIcon, Subtitles, Loader2, MonitorPlay,
  AlertCircle, Crown, RefreshCw
} from 'lucide-react';

let Hls = null;

function Player() {
  const { type, id, season, episode } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const { watchCheck, recordWatch, filterStreams, isPremium, planInfo } = useSubscription();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streams, setStreams] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showStreamPicker, setShowStreamPicker] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [hlsInstance, setHlsInstance] = useState(null);
  const controlsTimeout = useRef(null);

  // Auto-play flow states (internal, no UI exposed)
  const [addProgress, setAddProgress] = useState('');
  const [rdConfigured] = useState(() => getConfiguredDebrids().some(s => s.id === 'realdebrid'));
  const autoPlayAttemptedRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  // Auto-subtitle states
  const [autoSubtitles, setAutoSubtitles] = useState([]);
  const [activeSubTrack, setActiveSubTrack] = useState(null);
  const trackRef = useRef(null);

  // Build search title (with SxxExx for TV episodes)
  const searchTitle = data?.title
    ? (type === 'tv' && season && episode)
      ? `${data.title} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
      : data.title
    : '';

  // Load content details
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const details = await getContentDetails(id, type);
        if (!cancelled) setData(details);
      } catch (_err) {
        if (!cancelled) setError('טעינת פרטי התוכן נכשלה');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [type, id]);

  // Track history
  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && video.currentTime > 10) {
        addToHistory({
          id,
          type,
          title: data.title,
          poster: data.poster,
          progress: video.currentTime,
          duration: video.duration || 0,
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [data, id, type]);

  // Auto-play flow
  useEffect(() => {
    if (!data || !searchTitle) return;
    let cancelled = false;

    async function loadStreams() {
      setStreamLoading(true);
      setError(null);
      setAddProgress('בודק מנוי...');

      try {
        const check = watchCheck();
        if (!check.allowed) {
          if (!cancelled) {
            setError(check.reason);
            setStreamLoading(false);
          }
          return;
        }

        setAddProgress('מחפש בספרייה...');
        const results = await fetchStreams(id, type, data.title, data.year, data.imdbId, season || null, episode || null);
        const filtered = filterStreams(results);

        if (!cancelled) {
          setStreams(filtered);
          if (filtered.length > 0) {
            setCurrentStream(filtered[0]);
            recordWatch();
            setAddProgress('');
          } else if (rdConfigured && !autoPlayAttemptedRef.current) {
            autoPlayAttemptedRef.current = true;
            await autoSearchAndPlay();
          } else if (!rdConfigured) {
            setError('Real-Debrid לא מחובר. פנה למנהל המערכת.');
          } else {
            setError('לא נמצאו מקורות לצפייה');
          }
        }
      } catch (e) {
        console.warn('[Player] Stream load failed:', e);
        if (!cancelled) setError('טעינת התוכן נכשלה');
      } finally {
        if (!cancelled) setStreamLoading(false);
      }
    }

    async function autoSearchAndPlay() {
      setAddProgress('מחפש מקורות ברשת...');
      try {
        const magnets = await searchMagnets(searchTitle, data.year, data.imdbId, type);
        if (cancelled) return;

        if (magnets.length === 0) {
          setAddProgress('');
          setError('לא נמצאו מקורות להורדה');
          return;
        }

        const allowedQualities = isPremium
          ? ['4K', '2160p', '1080p', '720p', '480p', 'auto']
          : ['720p', '480p', 'auto'];
        let best = magnets.find(m => allowedQualities.includes(m.quality));
        let locked = false;
        if (!best) {
          // No allowed quality found — pick lowest quality available and mark locked
          const qualityOrder = { '480p': 1, '720p': 2, '1080p': 3, '4K': 4, 'auto': 2 };
          best = [...magnets].sort((a, b) => (qualityOrder[a.quality] || 2) - (qualityOrder[b.quality] || 2))[0];
          locked = !isPremium;
        }

        setAddProgress(`מוסיף ${best.quality || ''} לשרת...`);
        const debridStreams = await addMagnetToRd(best.magnet, searchTitle, (msg) => {
          setAddProgress(msg);
        });

        if (cancelled) return;

        if (debridStreams.length > 0) {
          const filtered = filterStreams(debridStreams);
          if (locked && filtered.length > 0 && !filtered[0].locked) {
            filtered[0] = { ...filtered[0], locked: true };
          }
          setStreams(prev => [...prev, ...filtered]);
          if (filtered.length > 0) {
            setCurrentStream(filtered[0]);
            recordWatch();
          } else {
            setError('לא נמצאו קבצים להורדה');
          }
        } else {
          setError('לא נמצאו קבצים להורדה');
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[Player] Auto-play failed:', e);
          setError(e.message || 'ההפעלה האוטומטית נכשלה');
        }
      } finally {
        if (!cancelled) setAddProgress('');
      }
    }

    loadStreams();
    return () => { cancelled = true; };
  }, [data, id, type, searchTitle, rdConfigured, watchCheck, filterStreams, recordWatch, isPremium, retryCount]);

  // Auto-fetch subtitles
  useEffect(() => {
    if (!data?.title) return;
    let cancelled = false;

    async function loadSubs() {
      try {
        const results = await fetchSubtitles({
          imdb_id: data.imdbId,
          query: searchTitle || data.title,
          lang: 'heb,eng',
        });
        if (cancelled) return;

        const hebrew = results.find(s => s.lang === 'heb' || s.lang === 'he');
        const english = results.find(s => s.lang === 'eng' || s.lang === 'en');
        const best = hebrew || english;

        setAutoSubtitles(results);

        if (best && videoRef.current) {
          await applySubtitleTrack(best);
        }
      } catch (e) {
        console.warn('Auto subtitle load failed:', e);
      }
    }

    loadSubs();
    return () => { cancelled = true; };
  }, [data, searchTitle]);

  const applySubtitleTrack = async (sub) => {
    if (!videoRef.current) return;
    if (trackRef.current) {
      videoRef.current.removeChild(trackRef.current);
      trackRef.current = null;
    }
    if (!sub) {
      setActiveSubTrack(null);
      return;
    }
    const blobUrl = await loadSubtitleTrack(sub.url, 0);
    if (!blobUrl) return;
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = sub.label;
    track.srclang = sub.lang;
    track.src = blobUrl;
    track.default = true;
    videoRef.current.appendChild(track);
    trackRef.current = track;
    setActiveSubTrack(sub);
  };

  useEffect(() => {
    return () => {
      if (trackRef.current && videoRef.current) {
        videoRef.current.removeChild(trackRef.current);
        trackRef.current = null;
      }
    };
  }, []);

  // Setup HLS or native playback
  useEffect(() => {
    if (!currentStream?.url || !videoRef.current) return;

    const video = videoRef.current;
    const url = currentStream.url;
    const isHls = url.includes('.m3u8') || url.includes('type=m3u');

    let hls = null;

    const setup = async () => {
      try {
        if (isHls && !video.canPlayType('application/vnd.apple.mpegurl')) {
          if (!Hls) {
            const mod = await import('hls.js');
            Hls = mod.default;
          }
          if (Hls.isSupported()) {
            hls = new Hls({ maxBufferLength: 60, maxMaxBufferLength: 120 });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) setError('שגיאת ניגון');
            });
            setHlsInstance(hls);
          } else {
            setError('הדפדפן אינו תומך בניגון זה');
          }
        } else {
          video.src = url;
          video.play().catch(() => {});
        }
      } catch (_err) {
        setError('שגיאת טעינת סטרים');
      }
    };

    setup();

    return () => {
      if (hls) {
        hls.destroy();
        setHlsInstance(null);
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [currentStream]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setProgress(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setError('שגיאת ניגון');

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('progress', onProgress);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);
    };
  }, [videoRef.current]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    setShowControls(true);
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [playing, resetControlsTimeout]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const seek = (ratio) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    video.currentTime = ratio * duration;
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
    resetControlsTimeout();
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const h = Math.floor(t / 3600);
    if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const selectStream = (stream) => {
    setCurrentStream(stream);
    setShowStreamPicker(false);
    setError(null);
  };

  const handleRetry = () => {
    autoPlayAttemptedRef.current = false;
    setRetryCount(c => c + 1);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sb-red animate-spin" />
      </div>
    );
  }

  const isDirectStream = currentStream && (currentStream.type === 'direct' || currentStream.url?.match(/\.(mp4|webm|m3u8|mkv)($|\?)/i));
  const hasStreams = streams.length > 0;
  const isBusy = streamLoading || addProgress;

  return (
    <div ref={containerRef} className={`bg-black flex flex-col ${fullscreen ? 'fixed inset-0 z-[100]' : 'min-h-screen'}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-black/80 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white hover:text-sb-red transition-colors">
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">חזרה</span>
        </button>
        <h1 className="text-white font-semibold truncate max-w-[50vw] sm:max-w-md text-sm sm:text-base">
          {data?.title}{type === 'tv' && season && episode ? ` S${season}E${episode}` : ''}
        </h1>
        <div className="w-16" />
      </div>

      {/* Video Area */}
      <div
        className="flex-1 relative bg-black flex items-center justify-center"
        onMouseMove={resetControlsTimeout}
        onClick={() => { togglePlay(); resetControlsTimeout(); }}
      >
        {isDirectStream ? (
          <video
            ref={videoRef}
            className="w-full h-full max-h-[70vh] object-contain"
            playsInline
            controls={false}
            muted={muted}
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          />
        ) : (
          <div className="text-center p-8 max-w-lg">
            <MonitorPlay className="w-16 h-16 text-sb-gray mx-auto mb-4" />
            <h2 className="text-xl text-white mb-2">{data?.title}</h2>
            {type === 'tv' && season && episode && (
              <p className="text-sb-gray mb-4">עונה {season} פרק {episode}</p>
            )}

            {!isPremium && (
              <div className="bg-sb-purple/10 border border-sb-purple/20 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-center gap-2 text-sb-purple text-sm">
                  <Crown className="w-4 h-4" />
                  <span>מנוי חינם - {planInfo?.limits?.maxMoviesDaily || 3} סרטים ביום, עד {planInfo?.limits?.maxQuality || '720p'}</span>
                </div>
              </div>
            )}

            {isBusy && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="w-8 h-8 text-sb-red animate-spin" />
                <p className="text-sb-gray text-sm">{addProgress || 'טוען...'}</p>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-sb-red animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}

            {!isBusy && !hasStreams && !error && (
              <p className="text-sb-gray">מכין את התוכן...</p>
            )}
          </div>
        )}

        {/* Center Play Button */}
        {showControls && !playing && isDirectStream && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-20 h-20 rounded-full bg-sb-red/90 hover:bg-sb-red flex items-center justify-center pointer-events-auto transition-colors"
            >
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </button>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60" onClick={(e) => e.stopPropagation()}>
            <div className="bg-sb-card rounded-xl p-6 text-center max-w-sm mx-4">
              <AlertCircle className="w-8 h-8 text-sb-red mx-auto mb-2" />
              <p className="text-sb-red font-medium mb-2">{error}</p>
              {!isPremium && error.includes('מכסת') && (
                <button
                  onClick={() => navigate('/subscription')}
                  className="mt-2 flex items-center justify-center gap-2 mx-auto bg-sb-purple hover:bg-sb-purple/80 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <Crown className="w-4 h-4" />
                  שדרג לפרימיום
                </button>
              )}
              <button
                onClick={handleRetry}
                className="mt-3 flex items-center justify-center gap-2 mx-auto text-sb-light text-sm hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
                נסה שוב
              </button>
            </div>
          </div>
        )}

        {/* Subtitle Overlay */}
        {showSubtitles && (
          <div onClick={(e) => e.stopPropagation()}>
            <SubtitleOverlay
              id={id}
              type={type}
              imdbId={data?.imdbId}
              title={searchTitle || data?.title}
              videoRef={videoRef}
              onClose={() => setShowSubtitles(false)}
              preloadedSubs={autoSubtitles}
            />
          </div>
        )}

        {/* Stream Picker */}
        {showStreamPicker && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={(e) => e.stopPropagation()}>
            <div className="bg-sb-card rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-sb-border flex items-center justify-between">
                <h2 className="text-white font-semibold">בחר מקור</h2>
                <button onClick={() => setShowStreamPicker(false)} className="text-sb-gray hover:text-white">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {streams.length === 0 && (
                  <p className="text-center text-sb-gray py-12">לא נמצאו מקורות</p>
                )}
                <div className="space-y-2">
                  {streams.map((stream, i) => (
                    <button
                      key={i}
                      onClick={() => selectStream(stream)}
                      className={`w-full text-right px-4 py-3 rounded-xl transition-colors ${
                        currentStream?.url === stream.url ? 'bg-sb-red text-white' : 'bg-sb-surface text-sb-light hover:bg-sb-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{stream.title}</p>
                        {stream.locked && (
                          <span className="text-[10px] bg-sb-purple text-white px-1.5 py-0.5 rounded font-bold shrink-0">פרימיום</span>
                        )}
                      </div>
                      <p className="text-xs opacity-70">{stream.quality} • {stream.provider}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div
        className={`bg-sb-dark border-t border-sb-border p-3 sm:p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onMouseMove={resetControlsTimeout}
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-sb-gray w-12 text-left tabular-nums">{formatTime(progress)}</span>
            <div
              className="flex-1 h-1.5 bg-sb-surface rounded-full overflow-hidden cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seek((e.clientX - rect.left) / rect.width);
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-sb-gray/30 rounded-full"
                style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
              />
              <div
                className="h-full bg-sb-red rounded-full relative"
                style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow" />
              </div>
            </div>
            <span className="text-xs text-sb-gray w-12 tabular-nums">{formatTime(duration)}</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={togglePlay} className="text-white hover:text-sb-red transition-colors">
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <div className="flex items-center gap-2 group">
                <button onClick={() => { setMuted(!muted); resetControlsTimeout(); }} className="text-white hover:text-sb-red transition-colors">
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-0 group-hover:w-20 transition-all accent-sb-red overflow-hidden"
                />
              </div>

              {hasStreams && (
                <button
                  onClick={() => { setShowStreamPicker(true); resetControlsTimeout(); }}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-sb-light hover:text-white bg-sb-surface hover:bg-sb-border px-3 py-1.5 rounded-lg transition-colors"
                >
                  <MonitorPlay className="w-3.5 h-3.5" />
                  {currentStream?.title?.slice(0, 15) || 'מקור'}
                  {currentStream?.locked && (
                    <span className="text-[10px] bg-sb-purple text-white px-1 py-0.5 rounded font-bold mr-1">פרימיום</span>
                  )}
                </button>
              )}
              {currentStream?.locked && (
                <span className="sm:hidden text-[10px] bg-sb-purple text-white px-1.5 py-0.5 rounded font-bold">
                  פרימיום
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {activeSubTrack && (
                <span className="text-xs text-sb-green hidden sm:inline">
                  {LANGUAGE_NAMES[activeSubTrack.lang] || activeSubTrack.lang}
                </span>
              )}
              <button
                onClick={() => { setShowSubtitles(!showSubtitles); resetControlsTimeout(); }}
                className={`p-2 rounded-lg transition-colors ${showSubtitles || activeSubTrack ? 'bg-sb-red text-white' : 'text-white hover:text-sb-red'}`}
              >
                <Subtitles className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setShowSettings(!showSettings); resetControlsTimeout(); }}
                className="text-white hover:text-sb-red transition-colors"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
              <button onClick={toggleFullscreen} className="text-white hover:text-sb-red transition-colors">
                {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Quality Settings */}
          {showSettings && hlsInstance && (
            <div className="mt-3 p-3 bg-sb-surface rounded-lg animate-fade-in">
              <p className="text-white text-sm mb-2">איכות</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { hlsInstance.currentLevel = -1; setShowSettings(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sb-red text-white"
                >
                  אוטומטי
                </button>
                {hlsInstance.levels?.map((lvl, i) => (
                  <button
                    key={i}
                    onClick={() => { hlsInstance.currentLevel = i; setShowSettings(false); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sb-card text-sb-light hover:bg-sb-border transition-colors"
                  >
                    {lvl.height}p
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Player;
