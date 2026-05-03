import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContentDetails } from '../core/StreamBoxCore.js';
import { fetchStreams } from '../core/StreamEngine.js';
import { fetchSubtitles, loadSubtitleTrack, LANGUAGE_NAMES } from '../core/SubtitleEngine.js';
import { addToHistory } from '../core/History.js';
import { useSubscription } from '../contexts/SubscriptionContext.jsx';
import SubtitleOverlay from './SubtitleOverlay.jsx';
import {
  ArrowRight, Maximize, Minimize, Volume2, VolumeX, Play, Pause,
  Settings as SettingsIcon, Subtitles, Loader2, MonitorPlay,
  AlertCircle, RefreshCw, Crown, RotateCcw, RotateCw, Type, Palette
} from 'lucide-react';

let Hls = null;

function Player() {
  const { type, id, season, episode } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const { watchCheck, isPremium, isTrialing } = useSubscription();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streams, setStreams] = useState([]);
  const [streamIndex, setStreamIndex] = useState(0);
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
  const [showSubStyle, setShowSubStyle] = useState(false);
  const [subStyle, setSubStyle] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb-sub-style') || '{"fontSize":"medium","color":"#ffffff","bgOpacity":"0.8"}'); }
    catch { return { fontSize: 'medium', color: '#ffffff', bgOpacity: '0.8' }; }
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [hlsInstance, setHlsInstance] = useState(null);
  const [audioWarning, setAudioWarning] = useState(null);
  const controlsTimeout = useRef(null);

  const [addProgress, setAddProgress] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const [autoSubtitles, setAutoSubtitles] = useState([]);
  const [activeSubTrack, setActiveSubTrack] = useState(null);
  const trackRef = useRef(null);

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
          id, type,
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

      const check = watchCheck();
      if (!check.allowed) {
        if (!cancelled) {
          setError(check.reason);
          setStreamLoading(false);
        }
        return;
      }

      setAddProgress('מחפש מקורות...');
      try {
        const results = await fetchStreams(id, type, data.title, data.year, data.imdbId, season || null, episode || null);
        if (cancelled) return;

        setStreams(results);
        setStreamIndex(0);
        if (results.length > 0) {
          setCurrentStream(results[0]);
          setAddProgress('');
        } else {
          setError('לא נמצאו מקורות לצפייה');
        }
      } catch (e) {
        console.warn('[Player] Stream load failed:', e);
        if (!cancelled) setError('טעינת התוכן נכשלה');
      } finally {
        if (!cancelled) setStreamLoading(false);
      }
    }

    loadStreams();
    return () => { cancelled = true; };
  }, [data, id, type, searchTitle, watchCheck, retryCount]);

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
          type,
          season: season || null,
          episode: episode || null,
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
          // Check for audio track after a short delay
          setTimeout(() => {
            const hasAudio = video.audioTracks?.length > 0 || video.webkitAudioTracks?.length > 0 || video.mozHasAudio;
            const isMkv = url.match(/\.mkv($|\?)/i);
            if (!hasAudio && !isMkv) {
              // Some browsers don't expose audioTracks; check volume
              if (video.volume > 0 && !video.muted && video.readyState >= 2) {
                // Possibly no audio — warn after a few seconds
                setTimeout(() => {
                  if (video.currentTime > 0 && !video.paused) {
                    setAudioWarning('אין שמע זמין במקור זה. נסה מקור אחר.');
                  }
                }, 3000);
              }
            }
            if (isMkv) {
              setAudioWarning('קובץ MKV זוהה — השמע עשוי לא לעבוד בדפדפן. נסה מקור אחר או פתח ב-VLC.');
            }
          }, 1000);
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
  }, [currentStream, streamIndex, streams]);

  // Sync muted/volume to video element (more reliable than JSX prop)
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
      video.volume = volume;
    }
  }, [muted, volume]);

  // Video event listeners — re-attach when stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentStream) return;

    const onTimeUpdate = () => setProgress(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onLoadedMetadata = () => setDuration(video.duration || 0);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onPlay = () => { setPlaying(true); setError(null); };
    const onPause = () => setPlaying(false);
    const onCanPlay = () => { setError(null); setAudioWarning(null); };
    const onError = () => {
      console.warn('[Player] Video error on stream', streamIndex, currentStream?.url);
      // Auto-fallback to next stream
      if (streamIndex + 1 < streams.length) {
        console.log('[Player] Auto-fallback to stream', streamIndex + 1);
        setStreamIndex(prev => prev + 1);
        setCurrentStream(streams[streamIndex + 1]);
        setError(`שגיאת ניגון במקור ${streamIndex + 1}, מנסה מקור אחר...`);
      } else {
        setError('שגיאת ניגון — אין מקורות נוספים זמינים');
      }
    };
    const onStalled = () => {
      console.warn('[Player] Video stalled on stream', streamIndex);
      if (streamIndex + 1 < streams.length) {
        setStreamIndex(prev => prev + 1);
        setCurrentStream(streams[streamIndex + 1]);
        setError(`המקור נתקע, מנסה מקור אחר...`);
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('progress', onProgress);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    video.addEventListener('stalled', onStalled);

    // Immediate check in case duration is already available
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      video.removeEventListener('stalled', onStalled);
    };
  }, [currentStream]);

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

  const skip = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration || video.duration));
    resetControlsTimeout();
  }, [duration, resetControlsTimeout]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
        case 'M':
          setMuted(m => !m);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [skip, togglePlay]);

  // Persist subtitle style
  useEffect(() => {
    localStorage.setItem('sb-sub-style', JSON.stringify(subStyle));
  }, [subStyle]);

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const h = Math.floor(t / 3600);
    if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const selectStream = (index) => {
    if (index >= 0 && index < streams.length) {
      setStreamIndex(index);
      setCurrentStream(streams[index]);
      setShowStreamPicker(false);
      setError(null);
      setAudioWarning(null);
    }
  };

  const handleRetry = () => {
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
  const isIframe = currentStream && currentStream.type === 'iframe';
  const isMagnet = currentStream && currentStream.type === 'magnet';
  const isTorrent = currentStream && currentStream.type === 'torrent';
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
        <div className="flex items-center gap-2">
          {isTrialing && (
            <span className="text-[10px] bg-sb-blue/20 text-sb-blue px-2 py-0.5 rounded-full font-bold">ניסיון</span>
          )}
          {isPremium && !isTrialing && (
            <span className="text-[10px] bg-sb-purple/20 text-sb-purple px-2 py-0.5 rounded-full font-bold">פרימיום</span>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div
        className="flex-1 relative bg-black flex items-center justify-center"
        onMouseMove={resetControlsTimeout}
        onClick={() => { togglePlay(); resetControlsTimeout(); }}
      >
        {isIframe ? (
          <iframe
            src={currentStream.url}
            className="w-full h-full max-h-[70vh]"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={data?.title}
          />
        ) : isDirectStream ? (
          <video
            ref={videoRef}
            className="w-full h-full max-h-[70vh] object-contain"
            playsInline
            controls={false}
            preload="auto"
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          />
        ) : (
          <div className="text-center p-8 max-w-lg">
            <MonitorPlay className="w-16 h-16 text-sb-gray mx-auto mb-4" />
            <h2 className="text-xl text-white mb-2">{data?.title}</h2>
            {type === 'tv' && season && episode && (
              <p className="text-sb-gray mb-4">עונה {season} פרק {episode}</p>
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
              <div className="text-center">
                <p className="text-sb-gray mb-2">מחפש מקורות זמינים...</p>
                <p className="text-xs text-sb-gray/60">אם לא נמצאו מקורות, נסה לרענן או בחר תוכן אחר</p>
              </div>
            )}
          </div>
        )}

        {/* Center Play Button */}
        {(isMagnet || isTorrent) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-6 max-w-md">
              <MonitorPlay className="w-12 h-12 text-sb-red mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">מקור ישיר (טורנט)</h3>
              <p className="text-sb-gray text-sm mb-4">
                {isMagnet ? 'Magnet link' : 'קובץ .torrent'} — דורש נגן חיצוני כמו VLC או Webtorrent
              </p>
              <a
                href={currentStream.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sb-red hover:bg-sb-red-hover text-white rounded-xl font-medium text-sm transition-colors"
              >
                <Play className="w-4 h-4" />
                פתח בנגן חיצוני
              </a>
            </div>
          </div>
        )}

        {!playing && isDirectStream && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-20 h-20 rounded-full bg-sb-red/90 hover:bg-sb-red flex items-center justify-center pointer-events-auto transition-colors"
            >
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </button>
          </div>
        )}

        {/* Audio Warning */}
        {audioWarning && !error && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-yellow-500/90 text-black px-4 py-2 rounded-lg text-sm font-medium shadow-lg max-w-md text-center">
            {audioWarning}
            <button
              onClick={(e) => { e.stopPropagation(); setAudioWarning(null); }}
              className="mr-2 font-bold hover:opacity-70"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60" onClick={(e) => e.stopPropagation()}>
            <div className="bg-sb-card rounded-xl p-6 text-center max-w-sm mx-4">
              <AlertCircle className="w-8 h-8 text-sb-red mx-auto mb-2" />
              <p className="text-sb-red font-medium mb-2">{error}</p>
              {error.includes('מנוי') && (
                <button
                  onClick={() => navigate('/subscription')}
                  className="mt-2 flex items-center justify-center gap-2 mx-auto bg-sb-purple hover:bg-sb-purple/80 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <Crown className="w-4 h-4" />
                  צפה במנויים
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
                      onClick={() => selectStream(i)}
                      className={`w-full text-right px-4 py-3 rounded-xl transition-colors ${
                        streamIndex === i ? 'bg-sb-red text-white' : 'bg-sb-surface text-sb-light hover:bg-sb-border'
                      }`}
                    >
                      <p className="text-sm font-medium">{stream.title}</p>
                      <p className="text-xs opacity-70">{stream.quality} • {stream.provider}{stream.service ? ` (${stream.service.toUpperCase()})` : ''}</p>
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
                const isRTL = document.dir === 'rtl' || getComputedStyle(document.body).direction === 'rtl';
                let ratio = (e.clientX - rect.left) / rect.width;
                if (isRTL) ratio = 1 - ratio;
                seek(Math.max(0, Math.min(1, ratio)));
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
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => skip(-10)} className="text-white hover:text-sb-red transition-colors p-1" title="10 שניות אחורה">
                <RotateCcw className="w-4 h-4" />
                <span className="text-[9px] block text-center -mt-1">10</span>
              </button>

              <button onClick={togglePlay} className="text-white hover:text-sb-red transition-colors">
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <button onClick={() => skip(10)} className="text-white hover:text-sb-red transition-colors p-1" title="10 שניות קדימה">
                <RotateCw className="w-4 h-4" />
                <span className="text-[9px] block text-center -mt-1">10</span>
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
                </button>
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
                onClick={() => { setShowSubStyle(!showSubStyle); resetControlsTimeout(); }}
                className={`p-2 rounded-lg transition-colors ${showSubStyle ? 'bg-sb-red text-white' : 'text-white hover:text-sb-red'}`}
                title="סגנון כתוביות"
              >
                <Type className="w-5 h-5" />
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

          {/* Subtitle Style Settings */}
          {showSubStyle && (
            <div className="mt-3 p-3 bg-sb-surface rounded-lg animate-fade-in">
              <p className="text-white text-sm mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                סגנון כתוביות
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-sb-gray text-xs mb-1.5 block">גודל טקסט</label>
                  <div className="flex gap-2">
                    {[
                      { val: 'small', label: 'קטן' },
                      { val: 'medium', label: 'בינוני' },
                      { val: 'large', label: 'גדול' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setSubStyle(s => ({ ...s, fontSize: opt.val }))}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          subStyle.fontSize === opt.val ? 'bg-sb-red text-white' : 'bg-sb-card text-sb-light hover:bg-sb-border'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sb-gray text-xs mb-1.5 block">צבע טקסט</label>
                  <div className="flex gap-2">
                    {[
                      { val: '#ffffff', label: 'לבן' },
                      { val: '#f5c518', label: 'צהוב' },
                      { val: '#46d369', label: 'ירוק' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setSubStyle(s => ({ ...s, color: opt.val }))}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          subStyle.color === opt.val ? 'bg-sb-red text-white' : 'bg-sb-card text-sb-light hover:bg-sb-border'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sb-gray text-xs mb-1.5 block">שקיפות רקע</label>
                  <div className="flex gap-2">
                    {[
                      { val: '0', label: 'ללא' },
                      { val: '0.5', label: 'חצי' },
                      { val: '0.8', label: 'כהה' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setSubStyle(s => ({ ...s, bgOpacity: opt.val }))}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          subStyle.bgOpacity === opt.val ? 'bg-sb-red text-white' : 'bg-sb-card text-sb-light hover:bg-sb-border'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Player;
