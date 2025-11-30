import { useState, useEffect, useRef } from 'react';
import { Clock, Pause, Square, Play, Settings, Maximize2 } from 'lucide-react';
import Webcam from 'react-webcam';
import TodoList from '../components/Widgets/TodoList';
import WhatsNext from '../components/Widgets/WhatsNext';
import FocusHeatMap from '../components/Widgets/FocusHeatMap';
import { useSession } from '../hooks/useSession';
import { useWebcam } from '../hooks/useWebCam';
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

  const { 
    webcamRef, 
    isWebcamReady, 
    captureFrame, 
    sendFrameToAPI 
  } = useWebcam();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWebcam, setShowWebcam] = useState(true);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Send frames to vision API during active session
  useEffect(() => {
    if (isActive && !isPaused && isWebcamReady) {
      const interval = setInterval(async () => {
        const frame = captureFrame();
        if (frame) {
          await sendFrameToAPI(frame, session._id);
        }
      }, 3000); // Every 3 seconds

      return () => clearInterval(interval);
    }
  }, [isActive, isPaused, isWebcamReady, session]);

  const handleStartSession = async () => {
    try {
      await startSession({
        tags: ['focused', 'productive'],
        notes: 'Deep work session'
      });
      toast.success('Session started! Stay focused! 🎯');
    } catch (error) {
      toast.error('Failed to start session');
    }
  };

  const handlePauseSession = async () => {
    try {
      await pauseSession(session._id);
      toast('Session paused', { icon: '⏸️' });
    } catch (error) {
      toast.error('Failed to pause session');
    }
  };

  const handleResumeSession = async () => {
    try {
      await resumeSession(session._id);
      toast.success('Session resumed! 🚀');
    } catch (error) {
      toast.error('Failed to resume session');
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
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url("/backgrounds/forest.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Header */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-display font-bold text-white drop-shadow-lg">
            GetLockedIn
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="glass px-6 py-3 rounded-full">
            <div className="flex items-center gap-2 text-white">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Session Active</span>
            </div>
          </div>
          <button className="glass w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-8 pb-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Todo List */}
            <div className="col-span-3">
              <TodoList />
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

              {/* Search Bar (Optional) */}
              <div className="w-full max-w-2xl">
                <input
                  type="text"
                  placeholder="Search the web..."
                  className="w-full px-6 py-4 rounded-full glass text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
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
                    className="glass px-8 py-3 rounded-full text-white font-semibold hover:bg-white/20 transition flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Start
                  </button>
                ) : (
                  <>
                    {isPaused ? (
                      <button
                        onClick={handleResumeSession}
                        className="glass px-8 py-3 rounded-full text-white font-semibold hover:bg-white/20 transition flex items-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Resume
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
                <FocusHeatMap />
              </div>

              {/* Quick Stats */}
              <div className="glass px-6 py-3 rounded-full">
                <p className="text-white font-medium">
                  Today's Focus Time: <span className="text-green-300">4h</span>
                </p>
              </div>
            </div>

            {/* Right Sidebar - What's Next & Webcam */}
            <div className="col-span-3 space-y-6">
              <WhatsNext />
              
              {/* Webcam Widget */}
              {showWebcam && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">Live View</h3>
                      <button
                        onClick={() => setShowWebcam(false)}
                        className="text-white/60 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="relative aspect-video bg-black">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: 'user'
                      }}
                    />
                    {isActive && (
                      <div className="absolute top-2 left-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span className="text-white text-xs font-medium">REC</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}