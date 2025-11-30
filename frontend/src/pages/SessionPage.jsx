import { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, Pause, Square, Play, Settings, Maximize2, Home, BarChart3, Trophy, Users, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import TodoList from '../components/Widgets/TodoList';
import FocusHeatMap from '../components/Widgets/FocusHeatmap';
import MusicPlayer from '../components/Widgets/MusicPlayer';
import DraggableWidget from '../components/Widgets/DraggableWidget';
import { useSession } from '../hooks/useSession';
import { useWebcam } from '../hooks/useWebCam';
import { useAuth } from '../hooks/useAuth';
import { formatTime } from '../utils/formatTime';
import toast from 'react-hot-toast';

export default function SessionPage() {
  const { 
    session, 
    isActive, 
    isPaused, 
    startSession, 
    pauseSession, 
    resumeSession, 
    endSession,
    elapsedTime 
  } = useSession();

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { 
    webcamRef, 
    isWebcamReady, 
    setIsWebcamReady,
    captureFrame, 
    sendFrameToAPI 
  } = useWebcam();

  const webcamContainerRef = useRef(null);

  const [isPageVisible, setIsPageVisible] = useState(document.visibilityState === 'visible');
  const [heatmapData, setHeatmapData] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [analyses, setAnalyses] = useState([]); // recent analysis history
  const [lastLatency, setLastLatency] = useState(null);
  const [failureCount, setFailureCount] = useState(0);
  const [lastSource, setLastSource] = useState(null);
  const [extensionStatus, setExtensionStatus] = useState({ active: false, blockedSites: 0, lastSeen: null });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWebcam, setShowWebcam] = useState(true);
  const [isResuming, setIsResuming] = useState(false);
  const pauseResumeDebounceRef = useRef({ isPending: false, lastAction: null, lastActionTime: 0 });

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Send frames to vision API during active session
  useEffect(() => {
    // CRITICAL: Send frames continuously even when page is hidden
    // Backend will detect if no frames are received for 12+ seconds and auto-pause
    if (isActive && !isPaused && isWebcamReady && session?._id) {
  const VISION_INTERVAL = parseInt(import.meta.env.VITE_VISION_INTERVAL || 3500);
      let frameCount = 0;
      let lastFrameSent = Date.now();
      
      // cooldownRef prevents hammering the backend when it's returning 429/500
  // cooldown state with exponential backoff (ms)
  const cooldownRef = { until: 0, backoff: 8000 };

      const interval = setInterval(async () => {
        if (Date.now() < cooldownRef.until) return;
        // Only send frames if webcam is actually ready and we have a session
        if (!isWebcamReady || !session?._id) {
          return;
        }
        
        const frame = captureFrame();
        if (frame) {
          frameCount++;
          lastFrameSent = Date.now();
          try {
            const resp = await sendFrameToAPI(frame, session._id);
            // normalize response shape from hook
            if (resp) {
              if (resp.success) {
                // Handle different response structures from backend
                let analysis = null;
                // Backend returns: { data: { analysis, sessionStatus, latency } }
                if (resp.data?.analysis) {
                  analysis = resp.data.analysis;
                } else if (resp.data?.data?.analysis) {
                  analysis = resp.data.data.analysis;
                } else if (resp.data?.data) {
                  analysis = resp.data.data;
                } else if (resp.data) {
                  analysis = resp.data;
                }
                
                const entry = {
                  ts: Date.now(),
                  analysis,
                  latency: resp.latency ?? null,
                  source: resp.source ?? null,
                  success: true
                };
                setAnalyses(prev => {
                  const next = [...prev, entry].slice(-30);
                  return next;
                });
                if (analysis) {
                  setLatestAnalysis(analysis);
                }
                if (resp.latency != null) setLastLatency(resp.latency);
                setLastSource(resp.source ?? lastSource);
              } else {
                // failure: increment failureCount and if server returned 429/500, back off
                setFailureCount(c => c + 1);
                setAnalyses(prev => [...prev, { ts: Date.now(), success: false, error: resp.error, status: resp.status }].slice(-30));

                // Backoff on server errors or rate limits to avoid flooding
                const status = parseInt(resp.status) || 0;
                if (status === 429 || status === 500 || status === 503 || status === 504) {
                  // exponential backoff: increase cooldown each time we hit server errors
                  const backoff = cooldownRef.backoff;
                  // add small random jitter (+/- 500ms) to avoid thundering retries
                  const jitter = Math.floor((Math.random() - 0.5) * 1000);
                  cooldownRef.until = Date.now() + backoff + jitter;
                  // increase backoff up to a cap (60s)
                  cooldownRef.backoff = Math.min(60000, Math.floor(backoff * 1.8));
                  console.warn('Vision API returned', status, `- cooling down frame sends for ${backoff/1000}s`);
                }
              }
            }
          } catch (error) {
            console.error('Error sending frame:', error);
            setFailureCount(c => c + 1);
          }
        } else {
          // No frame captured - this is expected if webcam is not ready
          // Backend will detect no frames and auto-pause after timeout
        }
      }, VISION_INTERVAL); // configurable interval

      return () => clearInterval(interval);
    }
  }, [isActive, isPaused, isWebcamReady, session?._id]); // Removed isPageVisible - send frames even when page hidden

  // Page visibility listener — keep for reference but don't block frame sending
  useEffect(() => {
    const onVisibility = () => setIsPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Poll session status to detect backend auto-pause - more frequent polling for better responsiveness
  useEffect(() => {
    if (!isActive || !session) return;

    const pollInterval = setInterval(async () => {
      try {
        const { sessionAPI } = await import('../api/session');
        const res = await sessionAPI.getActive();
        const updatedSession = res.data.data;
        
        if (updatedSession && updatedSession._id === session._id) {
          // Check if status changed to auto_paused
          if (updatedSession.status === 'auto_paused' && !isPaused) {
            const { useSessionStore } = await import('../store/sessionStore');
            const store = useSessionStore.getState();
            store.handleAutoPause(updatedSession._id);
            toast('Session auto-paused - you were away from camera', { icon: '⏸️', duration: 4000 });
            // Update session in store and ensure timer is stopped
            store.stopTimer();
            useSessionStore.setState({ 
              session: updatedSession,
              isPaused: true,
              isActive: true
            });
          }
          // Check if status changed back to active
          else if (updatedSession.status === 'active' && isPaused && session.status === 'auto_paused') {
            toast('Session resumed - you\'re back!', { icon: '▶️' });
          }
          // If session is auto_paused, ensure timer is stopped
          else if (updatedSession.status === 'auto_paused' && !isPaused) {
            const { useSessionStore } = await import('../store/sessionStore');
            useSessionStore.getState().stopTimer();
            useSessionStore.setState({ 
              isPaused: true,
              session: updatedSession
            });
          }
        }
      } catch (err) {
        // Silently fail - don't spam errors
        console.debug('Session poll error:', err);
      }
  }, 3000); // Poll every 3 seconds to reduce API noise and CPU load

    return () => clearInterval(pollInterval);
  }, [isActive, isPaused, session]);

  // Client-side auto-pause: if recent analyses show sustained absence/looking-away,
  // automatically pause the session to avoid counting time while user is away.
  useEffect(() => {
    if (!isActive || isPaused || !session) return;

    // More aggressive detection: check for very low visibility (user not in frame) or distractions
    const WINDOW = 3; // Reduced window for faster detection
    const THRESHOLD = 0.6; // Lower threshold - 60% of samples need to show absence
    const VISIBILITY_THRESHOLD = 0.4; // Higher threshold - more sensitive
    const DISTRACTION_THRESHOLD = 0.5; // Concentration score threshold

    const recent = analyses.slice(-WINDOW);
    if (recent.length < 2) return; // Need at least 2 samples

    let absentCount = 0;
    let distractedCount = 0;
    
    for (const a of recent) {
      const analysis = a.analysis || null;
      // Consider absence if no analysis (camera not detecting anything)
      if (!analysis) {
        absentCount++;
        continue;
      }

      // Get visibility score - if 0 or null, user is not in frame
      const vis = analysis.metrics?.posture?.visibility_score ?? analysis.metrics?.visibility_score ?? 0;
      const lookingAway = analysis.metrics?.eyeTracking?.looking_away || false;
      const concentration = analysis.concentrationScore ?? 0;
      
      // User is absent if visibility is low (not in frame) - use same threshold as backend (0.3)
      // If visibility_score is 0, user is definitely not in frame
      if (vis < VISIBILITY_THRESHOLD || vis === 0) {
        absentCount++;
      }
      
      // User is distracted if looking away or low concentration
      if (lookingAway || concentration < DISTRACTION_THRESHOLD) {
        distractedCount++;
      }
    }

    const absentFrac = absentCount / recent.length;
    const distractedFrac = distractedCount / recent.length;
    
    // Auto-pause if user is away OR significantly distracted
    // BUT: skip if pause/resume action just happened (debounce)
    const now = Date.now();
    const debounce = pauseResumeDebounceRef.current;
    const tooSoon = (now - debounce.lastActionTime) < 2000; // 2s grace period after resume/pause
    
    if (!tooSoon && (absentFrac >= THRESHOLD || (distractedFrac >= 0.8 && recent.length >= 3))) {
      // auto-pause - user not in frame or very distracted
      // Only proceed if we're not already paused and not in the middle of an action
      if (isPaused || debounce.isPending) return;
      
      debounce.isPending = true;
      debounce.lastAction = 'pause';
      debounce.lastActionTime = now;
      
      (async () => {
        try {
          // Import session store dynamically
          const { useSessionStore } = await import('../store/sessionStore');
          // Stop timer immediately before API call
          useSessionStore.getState().stopTimer();
          
          await pauseSession(session._id);
          const reason = absentFrac >= THRESHOLD ? 'away from camera' : 'distracted';
          toast(`Session paused (${reason} detected)`, { icon: '⏸️' });
        } catch (err) {
          console.warn('Auto-pause failed', err);
        } finally {
          debounce.isPending = false;
        }
      })();
    }
  }, [analyses, isActive, isPaused, session, pauseSession]);

  // Load heatmap data (last 365 days) and convert to values
  useEffect(() => {
    const onMessage = (ev) => {
      const msg = ev.data;
      if (!msg) return;

      if (msg.__study_monitor_response && msg.payload) {
        const payload = msg.payload;
        if (payload.isSessionActive !== undefined) {
          setExtensionStatus({ active: !!payload.isSessionActive, blockedSites: (payload.blockedSites || []).length || 0, lastSeen: Date.now() });
        }
      }

      if (msg.__study_monitor_from_ext && msg.payload) {
        const p = msg.payload;
        // background forwarded message
        if (p && p.isSessionActive !== undefined) {
          setExtensionStatus({ active: !!p.isSessionActive, blockedSites: (p.blockedSites || []).length || 0, lastSeen: Date.now() });
        }
      }
    };

    window.addEventListener('message', onMessage);

    // ask extension for current status (content script will forward)
    try {
      window.postMessage({ __study_monitor: true, payload: { type: 'GET_STATUS' } }, '*');
    } catch (err) {
      // ignore
    }

    // Poll extension status periodically
    const pollInterval = setInterval(() => {
      try {
        window.postMessage({ __study_monitor: true, payload: { type: 'GET_STATUS' } }, '*');
      } catch (err) {}
    }, 5000);

    return () => {
      window.removeEventListener('message', onMessage);
      clearInterval(pollInterval);
    };
  }, []);


  // Voice notifications when user is distracted
  useEffect(() => {
    if (!latestAnalysis || !user?.settings?.notifications?.voice) return;
    
    const shouldAlert = latestAnalysis.shouldAlert || 
                       (latestAnalysis.alert?.triggered && latestAnalysis.alert?.message);
    
    if (shouldAlert && isActive && !isPaused) {
      const message = latestAnalysis.alert?.message || 
                     'Please focus on your work. You seem distracted.';
      
      // Use browser speech synthesis
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.volume = 0.8;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        // Speak the alert
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [latestAnalysis?.shouldAlert, latestAnalysis?.alert?.triggered, user?.settings?.notifications?.voice, isActive, isPaused]);

  

  // Load heatmap data (last 365 days) and convert to values
  useEffect(() => {
    let mounted = true;
    async function loadHistory() {
      try {
        const { sessionAPI } = await import('../api/session');
        const res = await sessionAPI.getHistory({ page: 1, limit: 365 });
        // res.data should be an array of sessions
        const sessions = res.data?.data || res.data || [];

        // Build a 365-length array mapping days relative to today to normalized focus values
        const today = new Date();
        const days = Array.from({ length: 365 }, () => 0);

        sessions.forEach(s => {
          const d = new Date(s.createdAt || s.startTime || s.start);
          const diffDays = Math.floor((today - new Date(d.setHours(0,0,0,0))) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 365) {
            const idx = 364 - diffDays; // map recent to end
            // accumulate duration (seconds) and normalize later
            days[idx] = (days[idx] || 0) + (s.duration || 0);
          }
        });

        // normalize by max
        const max = Math.max(...days, 1);
        const normalized = days.map(d => d / max);

        if (mounted) setHeatmapData(normalized);
      } catch (error) {
        console.error('Failed to load session history for heatmap:', error);
      }
    }
    loadHistory();
    return () => { mounted = false };
  }, []);

  const handleStartSession = async () => {
    try {
      await startSession({
        tags: ['focused', 'productive'],
        notes: 'Deep work session'
      });
      toast.success('Session started! Stay focused! 🎯');
    } catch (error) {
      const errorMessage = error.message || error.response?.data?.message || 'Failed to start session'
      if (errorMessage.includes('hearts') || errorMessage.includes('No hearts')) {
        toast.error('No hearts remaining! Wait for regeneration or check your hearts in the dashboard.', { duration: 5000 })
      } else if (errorMessage.includes('active session')) {
        toast.error('You already have an active session. Please end it first.', { duration: 4000 })
      } else {
        toast.error(errorMessage)
      }
    }
  };

  const handlePauseSession = async () => {
    const debounce = pauseResumeDebounceRef.current;
    if (debounce.isPending || (Date.now() - debounce.lastActionTime) < 1000) return;
    
    debounce.isPending = true;
    debounce.lastAction = 'pause';
    debounce.lastActionTime = Date.now();
    
    try {
      await pauseSession(session._id);
      toast('Session paused', { icon: '⏸️' });
    } catch (error) {
      toast.error('Failed to pause session');
    } finally {
      debounce.isPending = false;
    }
  };

  const handleResumeSession = async () => {
    const debounce = pauseResumeDebounceRef.current;
    if (debounce.isPending || (Date.now() - debounce.lastActionTime) < 1000) return;
    
    debounce.isPending = true;
    debounce.lastAction = 'resume';
    debounce.lastActionTime = Date.now();
    setIsResuming(true);
    
    try {
      // CRITICAL: Clear analyses BEFORE starting resume to prevent immediate re-pause
      setAnalyses([]);
      setLatestAnalysis(null);
      setFailureCount(0);
      setLastLatency(null);
      
      await resumeSession(session._id);
      toast.success(session?.status === 'auto_paused' ? 'Session resumed! Welcome back! 🚀' : 'Session resumed! 🚀');
    } catch (error) {
      const serverMessage = error?.response?.data?.message || error?.message || 'Failed to resume session';
      console.error('Resume failed:', error);
      toast.error(serverMessage);
    } finally {
      setIsResuming(false);
      debounce.isPending = false;
    }
  };

  const handleStopSession = async () => {
    try {
      const result = await endSession(session._id);
      toast.success(`Session complete! +${result.userStats.pointsGained} points! 🎉`);
    } catch (error) {
      toast.error('Failed to end session');
    }
  };

  return (
    <div 
      className="session-page min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url("/backgrounds/forest.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Softer Overlay to reduce brightness */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Navigation Bar */}
      <nav className="relative z-10 px-8 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-display font-bold text-white drop-shadow-lg">
            DeepDive
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-white/80 hover:text-white transition text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/leaderboard" className="text-white/80 hover:text-white transition text-sm font-medium">
              Leaderboard
            </Link>
            <Link to="/clans" className="text-white/80 hover:text-white transition text-sm font-medium">
              Clans
            </Link>
            <Link to="/settings" className="text-white/80 hover:text-white transition text-sm font-medium">
              Settings
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-white/80 text-sm">
              {user.username}
            </div>
          )}
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="p-2 rounded-full hover:bg-white/10 transition text-white"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white/90 drop-shadow">
            Focus Session
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="glass px-6 py-3 rounded-full">
            <div className="flex items-center gap-2 text-white">
              {isActive && !isPaused ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Session Active</span>
                </>
              ) : isPaused && session?.status === 'auto_paused' ? (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Auto-Paused (Away)</span>
                </>
              ) : isPaused ? (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <span className="text-sm font-medium">Session Paused</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <span className="text-sm font-medium">No Active Session</span>
                </>
              )}
            </div>
          </div>
          <Link to="/settings" className="glass w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
            <Settings className="w-5 h-5 text-white" />
          </Link>
        </div>
      </header>


      {/* Main Content */}
      <main className="relative z-10 px-8 pb-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Todo List */}
            <div className="col-span-3">
              <DraggableWidget title="Your Tasks" id="todo-list">
                <TodoList />
              </DraggableWidget>
            </div>

            {/* Center - Timer & Main Content */}
            <div className="col-span-6 flex flex-col items-center space-y-8">
              {/* Motivational Quote */}
              <div className="text-center">
                <p className="text-white text-xl font-light drop-shadow-lg">
                  "The only way to do great work is to love what you do"
                </p>
              </div>

              {/* Date & Time */}
              <div className="text-center">
                <p className="text-white/90 text-lg font-medium drop-shadow">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  {' | '}
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>

              {/* Timer Display */}
              <div className="relative">
                <div className="text-center">
                  <div className="timer-digits text-[120px] font-display font-bold text-white leading-none tracking-tighter">
                    {formatTime(elapsedTime)}
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-4">
                {!isActive ? (
                  <button
                    onClick={handleStartSession}
                    className="btn-primary px-8 py-3 rounded-full font-semibold transition flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Start
                  </button>
                ) : (
                  <>
                    {isPaused ? (
                      <button
                        onClick={handleResumeSession}
                        className="btn-primary px-8 py-3 rounded-full font-semibold transition flex items-center gap-2"
                        disabled={isResuming}
                        aria-busy={isResuming}
                      >
                        <Play className="w-5 h-5" />
                        {isResuming ? 'Resuming...' : (session?.status === 'auto_paused' ? 'Resume (Back)' : 'Resume')}
                      </button>
                    ) : (
                      <button
                        onClick={handlePauseSession}
                        className="glass px-8 py-3 rounded-full text-white font-semibold hover:bg-white/20 transition flex items-center gap-2"
                      >
                        <Pause className="w-5 h-5" />
                        Pause
                      </button>
                    )}
                    <button
                      onClick={handleStopSession}
                      className="glass px-8 py-3 rounded-full text-white font-semibold hover:bg-red-500/30 transition flex items-center gap-2"
                    >
                      <Square className="w-5 h-5" />
                      Stop
                    </button>
                  </>
                )}
              </div>

              {/* Focus Heatmap */}
              <div className="w-full">
                <DraggableWidget title="Focus Heatmap" id="heatmap">
                  <FocusHeatMap data={heatmapData} />
                </DraggableWidget>
              </div>

              {/* Quick Stats */}
              <div className="glass px-6 py-3 rounded-full">
                <p className="text-white font-medium">
                  Session Time: <span className="text-green-300">{formatTime(elapsedTime)}</span>
                </p>
                {session?.status === 'auto_paused' && (
                  <p className="text-yellow-300 text-sm mt-1">
                    ⚠️ Session auto-paused - you were away from camera
                  </p>
                )}
              </div>
            </div>

            {/* Right Sidebar - Music & Webcam */}
            <div className="col-span-3 space-y-6">
              {/* Music Player Widget - Draggable */}
              <DraggableWidget title="Music Player" id="music-player">
                <MusicPlayer />
              </DraggableWidget>
              
              {/* Webcam Widget - Draggable */}
              {showWebcam && (
                <DraggableWidget title="Live View" id="webcam">
                  <div className="flex items-center justify-end mb-3">
                    <button
                      onClick={() => setShowWebcam(false)}
                      className="text-white/60 hover:text-white text-xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                  {/* Vision preview: show latest analysis metrics */}
                  {latestAnalysis && (
                    <div className="p-3 border-b border-white/6 text-sm text-white">
                      <div className="flex items-center justify-between mb-2">
                        <strong>Vision Preview</strong>
                        <span className="text-xs text-white/70">Live</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>Concentration</div>
                        <div className="text-right font-mono">{(latestAnalysis.concentrationScore ?? latestAnalysis?.concentration ?? 0).toFixed(2)}</div>
                        <div>Visibility</div>
                        <div className="text-right font-mono">{(latestAnalysis.metrics?.posture?.visibility_score ?? 0).toFixed(2)}</div>
                        <div>Looking away</div>
                        <div className="text-right font-mono">{latestAnalysis.metrics?.eyeTracking?.looking_away ? 'yes' : 'no'}</div>
                        <div>Slouch</div>
                        <div className="text-right font-mono">{latestAnalysis.metrics?.posture?.slouch ? 'yes' : 'no'}</div>
                      </div>
                      {/* sparkline */}
                      <div className="mt-3">
                        <Sparkline data={analyses.map(a => a.analysis?.concentrationScore ?? a.analysis?.concentration ?? 0)} />
                      </div>
                    </div>
                  )}
                  <div className="relative aspect-video bg-black">
                    <div ref={webcamContainerRef} className="w-full h-full relative">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                        // mark webcam as ready when media stream is available so frame sending starts
                        onUserMedia={() => setIsWebcamReady(true)}
                        onUserMediaError={(err) => {
                          console.warn('Webcam error / permission denied:', err);
                          setIsWebcamReady(false);
                        }}
                        videoConstraints={{
                          width: 640,
                          height: 480,
                          facingMode: 'user'
                        }}
                      />

                      {/* overlay for bounding boxes */}
                      <div className="absolute inset-0 pointer-events-none">
                        {latestAnalysis && renderBoxes(latestAnalysis, webcamContainerRef)}
                      </div>

                      {/* Status indicators */}
                      {isActive && (
                        <div className="absolute top-2 left-2 flex flex-col gap-2">
                          <div className="flex items-center gap-2 px-3 py-1.5 rec-badge rounded-full">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <span className="text-white text-xs font-medium">REC</span>
                          </div>
                          {latestAnalysis && latestAnalysis.metrics?.posture?.visibility_score < 0.3 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/80 rounded-full">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              <span className="text-white text-xs font-medium">Away</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </DraggableWidget>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Simple sparkline component — lightweight, dependency-free
function Sparkline({ data = [], width = 220, height = 36, stroke = 'rgba(255,255,255,0.9)' }) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = Math.max(max - min, 0.0001);
    return data.map((v, i) => {
      const x = (i / Math.max(1, data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
  }, [data, width, height]);

  if (!points) {
    return <div className="text-white/60 text-xs">No history</div>;
  }

  return (
    <svg width={width} height={height} className="block">
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Render bounding boxes if available in the analysis payload.
function renderBoxes(analysis, containerRef) {
  try {
    if (!analysis) return null;
    // possible places for boxes
    const boxes = analysis.boundingBoxes || analysis.boxes || analysis.faces || analysis.metrics?.faces || analysis.metrics?.face?.boxes;
    if (!boxes || !boxes.length) return null;

    const container = containerRef?.current;
    const rect = container ? container.getBoundingClientRect() : { width: 640, height: 480 };
    const w = rect.width;
    const h = rect.height;

    return boxes.map((b, idx) => {
      // b could be {x,y,w,h} normalized (0-1) or pixels. Or [x,y,w,h]
      let x, y, bw, bh;
      if (Array.isArray(b)) {
        [x, y, bw, bh] = b;
      } else if ('x' in b && 'y' in b && ('w' in b || 'width' in b)) {
        x = b.x; y = b.y; bw = b.w ?? b.width; bh = b.h ?? b.height;
      } else if ('left' in b && 'top' in b && 'width' in b) {
        x = b.left; y = b.top; bw = b.width; bh = b.height;
      } else {
        return null;
      }

      // assume normalized if values between 0 and 1
      const norm = Math.max(x, y, bw, bh) <= 1;
      const left = norm ? x * w : x;
      const top = norm ? y * h : y;
      const boxW = norm ? bw * w : bw;
      const boxH = norm ? bh * h : bh;

      const style = {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${boxW}px`,
        height: `${boxH}px`,
        border: '2px solid rgba(255,255,255,0.9)',
        boxSizing: 'border-box',
        borderRadius: '6px'
      };

      return <div key={idx} style={style} />;
    });
  } catch (err) {
    console.warn('renderBoxes error', err);
    return null;
  }
}
