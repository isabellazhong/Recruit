import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Square,
  TrendingUp,
  Video,
  VideoOff,
} from 'lucide-react';
import '../../pages/project_page/ProjectPage.css';
import type { ResumeData } from './ProjectPage';

interface BehavioralPracticeProps {
  resumeData: ResumeData | null;
  jobDescription: string;
  questions: string[];
  loading: boolean;
  error: string | null;
  hasRequestedQuestions: boolean;
}

interface BehavioralQuestion {
  id: string;
  prompt: string;
  category: string;
  duration: number;
  isPlaceholder?: boolean;
}

interface FeedbackMetric {
  id: string;
  label: string;
  score: number;
  insight: string;
}

const formatSeconds = (total: number) => {
  const min = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const sec = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');
  return `${min}:${sec}`;
};

const deriveJobSnippet = (jobDescription: string) => {
  if (!jobDescription?.trim()) {
    return '';
  }
  const normalized = jobDescription.replace(/\s+/g, ' ').trim();
  return normalized.length > 160 ? `${normalized.slice(0, 160)}…` : normalized;
};

const CATEGORY_ROTATION = ['Leadership', 'Ownership', 'Collaboration', 'Problem Solving'];

const inferCategoryFromPrompt = (prompt: string, index: number) => {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('conflict') || normalized.includes('team')) {
    return 'Collaboration';
  }
  if (normalized.includes('lead') || normalized.includes('mentor')) {
    return 'Leadership';
  }
  if (normalized.includes('challenge') || normalized.includes('solve')) {
    return 'Problem Solving';
  }
  if (normalized.includes('owner') || normalized.includes('drive')) {
    return 'Ownership';
  }
  return CATEGORY_ROTATION[index % CATEGORY_ROTATION.length];
};

const createPlaceholderQuestions = (count: number): BehavioralQuestion[] =>
  Array.from({ length: count }).map((_, index) => ({
    id: `loading-${index}`,
    prompt: 'Loading behavioral question…',
    category: 'Loading',
    duration: 120,
    isPlaceholder: true,
  }));

export default function BehavioralPractice({
  resumeData,
  jobDescription,
  questions: questionPrompts,
  loading,
  error,
  hasRequestedQuestions,
}: BehavioralPracticeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [showFeedback, setShowFeedback] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const preparedQuestions = useMemo<BehavioralQuestion[]>(() => {
    if (loading) {
      return createPlaceholderQuestions(Math.max(questionPrompts?.length || 0, 3));
    }

    if (Array.isArray(questionPrompts) && questionPrompts.length) {
      return questionPrompts.map((prompt, index) => ({
        id: `behavioral-${index}`,
        prompt,
        category: inferCategoryFromPrompt(prompt, index),
        duration: 120 + (index % 2) * 30,
      }));
    }

    return [];
  }, [loading, questionPrompts]);

  const feedbackMetrics = useMemo<FeedbackMetric[]>(
    () => [
      {
        id: 'clarity',
        label: 'Clarity',
        score: 84,
        insight: 'Keep sentences tight and finish thoughts before jumping to the next point.',
      },
      {
        id: 'confidence',
        label: 'Confidence',
        score: 78,
        insight: 'Great presence. Maintain eye contact with the camera during key moments.',
      },
      {
        id: 'structure',
        label: 'Structure',
        score: 73,
        insight: 'Use the STAR method explicitly to highlight actions and measurable impact.',
      },
      {
        id: 'energy',
        label: 'Energy',
        score: 81,
        insight: 'Vary tone to accentuate outcomes and keep the interviewer engaged.',
      },
    ],
    [],
  );

  const currentQuestion = preparedQuestions[currentQuestionIndex] ?? null;
  const progress = preparedQuestions.length
    ? ((currentQuestionIndex + 1) / preparedQuestions.length) * 100
    : 0;
  const jobSnippet = deriveJobSnippet(jobDescription);

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setTimeLeft(preparedQuestions[0]?.duration ?? 90);
    setShowFeedback(false);
  }, [preparedQuestions]);

  const updateStatus = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setStatus({ type, message });
    window.setTimeout(() => {
      setStatus((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  }, []);

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
          }
          setIsRecording(false);
          setShowFeedback(true);
          updateStatus('Recording stopped. Generating AI feedback…');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRecording, updateStatus]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    setIsPreviewing(false);
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      updateStatus('Camera access is unavailable in this browser.', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsPreviewing(true);
      setVideoEnabled(true);
      setAudioEnabled(true);
      updateStatus('Camera ready. Adjust framing before you record.');
    } catch (error) {
      updateStatus((error as Error).message || 'Unable to start camera.', 'error');
    }
  }, [updateStatus]);

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoEnabled(track.enabled);
  };

  const toggleAudio = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioEnabled(track.enabled);
  };

  const handleStartRecording = () => {
    if (!currentQuestion || currentQuestion.isPlaceholder) {
      updateStatus('Behavioral questions are still loading. Please wait a moment.', 'error');
      return;
    }
    if (!streamRef.current) {
      updateStatus('Start the camera before recording.', 'error');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      updateStatus('MediaRecorder is not supported in this browser.', 'error');
      return;
    }
    try {
      const recorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setShowFeedback(false);
      setTimeLeft(currentQuestion.duration ?? 90);
      updateStatus('Recording started. Answer the prompt with STAR.');
    } catch (error) {
      updateStatus((error as Error).message || 'Unable to start recording.', 'error');
    }
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setShowFeedback(true);
    updateStatus('Recording stopped. Generating AI feedback…');
  };

  const handleNextQuestion = () => {
    if (!preparedQuestions.length) {
      updateStatus('No questions available yet.', 'error');
      return;
    }
    if (currentQuestionIndex >= preparedQuestions.length - 1) {
      updateStatus('You have completed all practice prompts!');
      return;
    }
    const nextIndex = currentQuestionIndex + 1;
    if (preparedQuestions[nextIndex]?.isPlaceholder) {
      updateStatus('Still generating the remaining prompts.', 'error');
      return;
    }
    setCurrentQuestionIndex(nextIndex);
    setTimeLeft(preparedQuestions[nextIndex]?.duration ?? 90);
    setShowFeedback(false);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setTimeLeft(preparedQuestions[0]?.duration ?? 90);
    setShowFeedback(false);
    setIsRecording(false);
  };

  return (
    <div className="ih-behavior-grid ih-fade-in">
      {status && (
        <div className={`ih-behavior-toast ${status.type}`}>
          {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{status.message}</span>
        </div>
      )}

      <section className="ih-card ih-card-column ih-behavior-panel">
        <header className="ih-card-header">
          <div>
            <h3>Video Interview Practice</h3>
            <p>Simulate behavioral interview rounds with live video capture.</p>
          </div>
          <div className="ih-behavior-tag">
            {currentQuestion?.isPlaceholder ? 'Loading' : currentQuestion?.category ?? 'Behavior'}
          </div>
        </header>

        {jobSnippet && (
          <div className="ih-job-hint">
            <span>Tailoring for</span>
            <p>{jobSnippet}</p>
          </div>
        )}

        {error && (
          <div className="ih-status-banner error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="ih-behavior-video">
          <video ref={videoRef} autoPlay playsInline muted className="ih-behavior-video-feed" />

          {!isPreviewing && (
            <div className="ih-behavior-video-empty">
              <VideoOff size={42} />
              <p>Camera preview is idle</p>
              <small>Start the camera to check framing and lighting.</small>
            </div>
          )}

          {isRecording && (
            <div className="ih-behavior-rec-indicator">
              <span className="ih-rec-dot" />
              Recording • {formatSeconds(timeLeft)}
            </div>
          )}
        </div>

        <div className="ih-behavior-controls">
          {!isPreviewing ? (
            <button className="ih-primary-btn" onClick={startCamera}>
              <Video size={18} />
              <span>Start Camera</span>
            </button>
          ) : (
            <>
              <button className={`ih-outline-btn ${videoEnabled ? '' : 'ih-control-disabled'}`} onClick={toggleVideo}>
                {videoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                <span>{videoEnabled ? 'Video On' : 'Video Off'}</span>
              </button>
              <button className={`ih-outline-btn ${audioEnabled ? '' : 'ih-control-disabled'}`} onClick={toggleAudio}>
                {audioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                <span>{audioEnabled ? 'Mic On' : 'Mic Off'}</span>
              </button>
              {!isRecording ? (
                <button className="ih-primary-btn ih-danger" onClick={handleStartRecording}>
                  <Play size={16} />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button className="ih-primary-btn ih-danger" onClick={handleStopRecording}>
                  <Square size={16} />
                  <span>Stop Recording</span>
                </button>
              )}
              <button className="ih-outline-btn" onClick={stopCamera}>
                <span>Stop Camera</span>
              </button>
            </>
          )}
        </div>

        {showFeedback && (
          <div className="ih-behavior-feedback">
            <div className="ih-behavior-feedback-header">
              <h4>AI Feedback</h4>
              <div className="ih-behavior-feedback-actions">
                <button className="ih-outline-btn" onClick={handleRestart}>
                  <RotateCcw size={16} />
                  <span>Restart</span>
                </button>
                {currentQuestionIndex < preparedQuestions.length - 1 &&
                  !preparedQuestions[currentQuestionIndex + 1]?.isPlaceholder && (
                  <button className="ih-primary-btn" onClick={handleNextQuestion}>
                    <span>Next Prompt</span>
                  </button>
                )}
              </div>
            </div>
            <div className="ih-behavior-feedback-grid">
              {feedbackMetrics.map((metric) => (
                <article key={metric.id} className="ih-behavior-feedback-card">
                  <div className="ih-behavior-feedback-meta">
                    <TrendingUp size={16} />
                    <span>{metric.label}</span>
                    <strong>{metric.score}%</strong>
                  </div>
                  <p>{metric.insight}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="ih-card ih-card-column ih-behavior-side">
        <header className="ih-card-header">
          <div>
            <h3>Current Prompt</h3>
            <p>
              {currentQuestion?.isPlaceholder
                ? 'Hang tight—your personalized behavioral prompts are loading.'
                : currentQuestion?.prompt || 'Upload a resume to generate practice prompts.'}
            </p>
          </div>
        </header>

        <div className="ih-behavior-progress">
          <div className="ih-behavior-progress-meta">
            <span>
              Question {preparedQuestions.length ? Math.min(currentQuestionIndex + 1, preparedQuestions.length) : 0} / {preparedQuestions.length || 0}
            </span>
            <span>
              <Clock size={14} /> {formatSeconds(currentQuestion?.duration ?? 90)}
            </span>
          </div>
          <div className="ih-behavior-progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="ih-behavior-queue">
          {preparedQuestions.length ? (
            preparedQuestions.map((question, index) => (
              <button
                key={question.id}
                disabled={Boolean(question.isPlaceholder)}
                onClick={() => {
                  if (question.isPlaceholder) return;
                  setCurrentQuestionIndex(index);
                  setShowFeedback(false);
                  setTimeLeft(question.duration);
                }}
                className={`ih-behavior-queue-item ${index === currentQuestionIndex ? 'active' : ''}`}
              >
                <div>
                  <p>{question.isPlaceholder ? 'Loading behavioral question…' : question.prompt}</p>
                  <small>{question.isPlaceholder ? 'Loading' : question.category}</small>
                </div>
                <span>
                  {question.isPlaceholder ? (
                    <span className="ih-behavior-loading-pill">
                      <Loader2 size={14} className="ih-spin" />
                      Loading
                    </span>
                  ) : (
                    formatSeconds(question.duration)
                  )}
                </span>
              </button>
            ))
          ) : (
            <div className="ih-behavior-queue-empty">
              <p>
                {hasRequestedQuestions
                  ? 'We were unable to load your behavioral prompts. Try converting your resume again.'
                  : 'Convert your resume with a job description to unlock tailored behavioral prompts.'}
              </p>
            </div>
          )}
        </div>

        <div className="ih-behavior-tips">
          <h4>Coach Marks</h4>
          <ul>
            <li>
              <CheckCircle2 size={16} /> Use STAR to keep answers crisp and measurable.
            </li>
            <li>
              <CheckCircle2 size={16} /> Reference impact metrics from your resume to stay concrete.
            </li>
            <li>
              <CheckCircle2 size={16} /> Pause briefly after each section to let points land.
            </li>
            <li>
              <AlertCircle size={16} /> Limit filler words like “um” or “like”.
            </li>
          </ul>
        </div>

        {resumeData && (
          <div className="ih-behavior-profile">
            <div>
              <h5>{resumeData.name}</h5>
              <p>{resumeData.summary}</p>
            </div>
            <span>{resumeData.skills.slice(0, 3).join(' · ')}</span>
          </div>
        )}
      </section>
    </div>
  );
}
