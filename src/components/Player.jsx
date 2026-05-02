import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getContentDetails } from '../core/StreamBoxCore.js';
import { fetchStreams } from '../core/StreamEngine.js';
import { searchYtsMagnets, addMagnetToRd, getConfiguredDebrids } from '../core/DebridManager.js';
import { addToHistory } from '../core/History.js';
import SubtitleOverlay from './SubtitleOverlay.jsx';
import {
  ArrowRight, Maximize, Minimize, Volume2, VolumeX, Play, Pause,
  Settings as SettingsIcon, Subtitles, Loader2, MonitorPlay, Search,
  Magnet, Film, CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react';

let Hls = null;

function Player() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

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

  // Magnet search states
  const [searchingMagnets, setSearchingMagnets] = useState(false);
  const [magnetResults, setMagnetResults] = useState([]);
  const [addingMagnet, setAddingMagnet] = useState(false);
  const [addProgress, setAddProgress] = useState('');
  const [showMagnetSearch, setShowMagnetSearch] = useState(false);
  const [manualMagnet, setManualMagnet] = useState('');
  const [rdConfigured] = useState(() => getConfiguredDebrids().some(s => s.id === 'realdebrid'));

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

  // Load streams after data is loaded
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    async function loadStreams() {
      setStreamLoading(true);
      setError(null);
      try {
        const results = await fetchStreams(id, type, data.title, data.year);
        if (!cancelled) {
          setStreams(results);
          // Auto-select first direct stream
          if (results.length > 0) {
            setCurrentStream(results[0]);
          }
        }
      } catch (_err) {
        console.warn('Stream load failed:', e);
      } finally {
        if (!cancelled) setStreamLoading(false);
      }
    }
    loadStreams();
    return () => { cancelled = true; };
  }, [data, id, type]);

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

  // Magnet search handlers
  const handleSearchMagnets = async () => {
    if (!data?.title) return;
    setSearchingMagnets(true);
    setMagnetResults([]);
    setError(null);
    try {
      const results = await searchYtsMagnets(data.title, data.year);
      setMagnetResults(results);
      if (results.length === 0) {
        setError('לא נמצאו מגנטים לסרט זה');
      }
    } catch (_err) {
      setError('חיפוש המגנטים נכשל');
    } finally {
      setSearchingMagnets(false);
    }
  };

  const handleAddMagnet = async (magnet, title) => {
    setAddingMagnet(true);
    setAddProgress('מוסיף מגנט ל-Real-Debrid...');
    setError(null);
    try {
      const results = await addMagnetToRd(magnet, title);
      if (results.length > 0) {
        setStreams(prev => [...prev, ...results]);
        setCurrentStream(results[0]);
        setShowMagnetSearch(false);
        setMagnetResults([]);
        setAddProgress('');
      } else {
        setError('לא נמצאו קבצים להורדה');
      }
    } catch (_err) {
      setError(e.message || 'הוספת המגנט נכשלה');
    } finally {
      setAddingMagnet(false);
      setAddProgress('');
    }
  };

  const handleAddManualMagnet = async () => {
    if (!manualMagnet.trim()) return;
    await handleAddMagnet(manualMagnet.trim(), data?.title);
    setManualMagnet('');
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

  return (
    <div ref={containerRef} className={`bg-black flex flex-col ${fullscreen ? 'fixed inset-0 z-[100]' : 'min-h-screen'}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-black/80 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white hover:text-sb-red transition-colors">
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">חזרה</span>
        </button>
        <h1 className="text-white font-semibold truncate max-w-[50vw] sm:max-w-md text-sm sm:text-base">{data?.title}</h1>
        <div className="w-16" />
      </div>

      {/* Video Area */}
      <div
        className="flex-1 relative bg-black flex items-center justify-center"
        onMouseMove={resetControlsTimeout}
        onClick={() => {
          togglePlay();
          resetControlsTimeout();
        }}
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
            <h2 className="text-xl text-white mb-2">נגן וידאו</h2>

            {!rdConfigured && (
              <div className="bg-sb-gold/10 border border-sb-gold/20 rounded-xl p-4 mb-4">
                <p className="text-sb-gold text-sm">Real-Debrid לא מחובר</p>
                <Link to="/settings" className="text-sb-red text-sm hover:underline mt-2 inline-block">
                  התחבר בהגדרות
                </Link>
              </div>
            )}

            {rdConfigured && streamLoading && (
              <div className="flex items-center justify-center gap-2 text-sb-gray py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                מחפש ב-Real-Debrid...
              </div>
            )}

            {rdConfigured && !streamLoading && !hasStreams && (
              <div className="space-y-4">
                <p className="text-sb-gray">הסרט לא נמצא בספרייה שלך ב-Real-Debrid</p>

                {!showMagnetSearch ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSearchMagnets(); setShowMagnetSearch(true); }}
                      disabled={searchingMagnets}
                      className="flex items-center justify-center gap-2 bg-sb-red hover:bg-sb-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {searchingMagnets ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      חפש מגנט
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMagnetSearch(true); }}
                      className="flex items-center justify-center gap-2 bg-sb-surface hover:bg-sb-border text-sb-light px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      <Magnet className="w-4 h-4" />
                      הדבק מגנט ידנית
                    </button>
                  </div>
                ) : (
                  <div className="bg-sb-card rounded-xl p-4 text-left space-y-3" onClick={(e) => e.stopPropagation()}>
                    {/* Manual magnet input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualMagnet}
                        onChange={(e) => setManualMagnet(e.target.value)}
                        placeholder="הדבק קישור מגנט..."
                        className="flex-1 bg-sb-surface border border-sb-border rounded-lg px-3 py-2 text-sm text-white placeholder-sb-gray outline-none focus:border-sb-red/60"
                      />
                      <button
                        onClick={handleAddManualMagnet}
                        disabled={!manualMagnet.trim() || addingMagnet}
                        className="bg-sb-red text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {addingMagnet ? <Loader2 className="w-4 h-4 animate-spin" /> : 'הוסף'}
                      </button>
                    </div>

                    {/* YTS Results */}
                    {magnetResults.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        <p className="text-white text-sm font-medium">תוצאות חיפוש:</p>
                        {magnetResults.map((m, i) => (
                          <button
                            key={i}
                            onClick={() => handleAddMagnet(m.magnet, m.title)}
                            disabled={addingMagnet}
                            className="w-full text-right bg-sb-surface hover:bg-sb-border rounded-lg p-3 transition-colors disabled:opacity-50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm truncate">{m.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sb-green text-xs font-bold">{m.quality}</span>
                                  <span className="text-sb-gray text-xs">{m.size}</span>
                                  <span className="text-sb-gray text-xs">S: {m.seeds}</span>
                                </div>
                              </div>
                              <Magnet className="w-4 h-4 text-sb-red shrink-0 mr-2" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchingMagnets && (
                      <div className="flex items-center gap-2 text-sb-gray py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        מחפש מגנטים...
                      </div>
                    )}

                    {addProgress && (
                      <div className="flex items-center gap-2 text-sb-blue py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {addProgress}
                      </div>
                    )}

                    <button
                      onClick={() => { setShowMagnetSearch(false); setMagnetResults([]); setError(null); }}
                      className="text-sb-gray text-xs hover:text-white"
                    >
                      סגור
                    </button>
                  </div>
                )}
              </div>
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

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60" onClick={(e) => e.stopPropagation()}>
            <div className="bg-sb-card rounded-xl p-6 text-center max-w-sm mx-4">
              <AlertCircle className="w-8 h-8 text-sb-red mx-auto mb-2" />
              <p className="text-sb-red font-medium mb-2">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sb-light text-sm hover:text-white"
              >
                סגור
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
              title={data?.title}
              videoRef={videoRef}
              onClose={() => setShowSubtitles(false)}
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
                      <p className="text-sm font-medium">{stream.title}</p>
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
                </button>
              )}

              {rdConfigured && !hasStreams && !streamLoading && (
                <button
                  onClick={() => { handleSearchMagnets(); setShowMagnetSearch(true); resetControlsTimeout(); }}
                  disabled={searchingMagnets}
                  className="flex items-center gap-1.5 text-xs text-white bg-sb-red hover:bg-sb-red-hover px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {searchingMagnets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  חפש מגנט
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => { setShowSubtitles(!showSubtitles); resetControlsTimeout(); }}
                className={`p-2 rounded-lg transition-colors ${showSubtitles ? 'bg-sb-red text-white' : 'text-white hover:text-sb-red'}`}
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
