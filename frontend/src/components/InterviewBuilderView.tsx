import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Wand2,
  Upload,
  Globe,
  Target,
  Code2,
  FileText,
  ChevronRight,
  Zap,
  HelpCircle,
  TrendingUp,
  Volume2,
  VolumeX,
  Languages,
  Square,
  MessageSquare,
  Check
} from 'lucide-react';
import { ResumeProfile, InterviewSessionState, LLMStatus } from '../types';
import { apiService, sampleSWEProfile } from '../services/api';
import { AdilVoiceOrb } from './AdilVoiceOrb';
import { VoiceService, VoiceState } from '../services/voiceService';

interface InterviewBuilderViewProps {
  onNavigate: (tab: 'studio' | 'analyzer') => void;
  activeResume: ResumeProfile;
  setActiveResume: (profile: ResumeProfile) => void;
}

// Steps for the progress tracker
const INTERVIEW_STEPS = [
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'projects', label: 'Projects', icon: Code2 },
  { key: 'skills', label: 'Skills', icon: Sparkles },
  { key: 'certifications', label: 'Certs', icon: Award },
  { key: 'summary', label: 'Executive Pitch', icon: Target },
  { key: 'completed', label: 'ATS Ready', icon: CheckCircle2 },
];

function getStepIndex(step: string): number {
  const base = step.split('|')[0];
  const idx = INTERVIEW_STEPS.findIndex(s => s.key === base || base.startsWith(s.key.split('_')[0]));
  return idx === -1 ? 0 : idx;
}

export const InterviewBuilderView: React.FC<InterviewBuilderViewProps> = ({
  onNavigate,
  activeResume,
  setActiveResume
}) => {
  const [session, setSession] = useState<InterviewSessionState | null>(null);
  const [sessionId, setSessionId] = useState<string>('local-session');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [llmOnline, setLlmOnline] = useState(false);
  const [showStarGuide, setShowStarGuide] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Conversational Voice State
  const [voiceState, setVoiceState] = useState<VoiceState>('Connecting');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [userLiveTranscript, setUserLiveTranscript] = useState<string>('');
  const [aiSpokenSubtitle, setAiSpokenSubtitle] = useState<string>('');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const voiceServiceRef = useRef<VoiceService | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const streamControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightTimeoutRef = useRef<any>(null);

  // Trigger live glowing animation on a resume section
  const triggerSectionHighlight = useCallback((section: string) => {
    setHighlightedSection(section);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedSection(null);
    }, 4500);
  }, []);

  // Check LLM status
  useEffect(() => {
    apiService.getLLMStatus().then(status => {
      setLlmStatus(status);
      setLlmOnline(status.available);
    }).catch(() => {
      setLlmOnline(false);
    });
  }, []);

  // Auto-scroll on new tokens / messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, streamingText, userLiveTranscript]);

  // Handle sending message with streaming + speech synthesis
  const handleSendMessage = useCallback(async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const text = (overrideText ?? inputText).trim();
    if (!text || !session || isLoading || isStreaming) return;

    setInputText('');
    setUserLiveTranscript('');
    setIsStreaming(true);
    setStreamingText('');
    setVoiceState('Thinking');

    // Interrupt any ongoing AI speech before user turn
    voiceServiceRef.current?.interruptSpeaking();

    // Optimistically add user message to UI
    const optimisticSession: InterviewSessionState = {
      ...session,
      messages: [...session.messages, { sender: 'user' as const, text }]
    };
    setSession(optimisticSession);

    let fullStreamedResponse = '';

    if (llmOnline) {
      // High-speed SSE stream via Groq LPU
      streamControllerRef.current = apiService.streamInterviewMessage(
        sessionId,
        text,
        (token) => {
          fullStreamedResponse += token;
          setStreamingText(prev => prev + token);
          setAiSpokenSubtitle(fullStreamedResponse);
        },
        (updatedSession) => {
          setSession(updatedSession);
          setStreamingText('');
          setIsStreaming(false);

          if (updatedSession.collected_profile) {
            setActiveResume(updatedSession.collected_profile);
          }

          // Trigger live section animation on right canvas
          if (updatedSession.last_updated_section) {
            triggerSectionHighlight(updatedSession.last_updated_section);
          }

          // Get latest AI response text to speak aloud
          const lastAiMsg = updatedSession.messages[updatedSession.messages.length - 1];
          const textToSpeak = lastAiMsg?.sender === 'ai' ? lastAiMsg.text : fullStreamedResponse;
          setAiSpokenSubtitle(textToSpeak);

          // Adil's AI speaks response aloud!
          if (voiceServiceRef.current && !isMicMuted) {
            setVoiceState('Speaking');
            voiceServiceRef.current.speak(
              textToSpeak,
              () => setVoiceState('Speaking'),
              () => {
                if (!updatedSession.is_complete) {
                  setVoiceState('Listening');
                } else {
                  setVoiceState('Processing');
                }
              }
            );
          } else {
            setVoiceState(updatedSession.is_complete ? 'Processing' : 'Listening');
          }
        },
        (err) => {
          console.error('Stream error:', err);
          setIsStreaming(false);
          setStreamingText('');
          setVoiceState('Listening');
        }
      );
    } else {
      // Fallback: blocking call
      try {
        setIsLoading(true);
        const res = await apiService.sendInterviewMessage(sessionId, text);
        setSession(res.session);
        if (res.session.collected_profile) {
          setActiveResume(res.session.collected_profile);
        }
        if (res.session.last_updated_section) {
          triggerSectionHighlight(res.session.last_updated_section);
        }

        const lastAiMsg = res.session.messages[res.session.messages.length - 1];
        if (lastAiMsg?.sender === 'ai') {
          setAiSpokenSubtitle(lastAiMsg.text);
          if (voiceServiceRef.current && !isMicMuted) {
            setVoiceState('Speaking');
            voiceServiceRef.current.speak(
              lastAiMsg.text,
              () => setVoiceState('Speaking'),
              () => setVoiceState(res.session.is_complete ? 'Processing' : 'Listening')
            );
          }
        }
      } catch (err) {
        console.error(err);
        setVoiceState('Listening');
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    }

    inputRef.current?.focus();
  }, [inputText, session, sessionId, isLoading, isStreaming, llmOnline, isMicMuted, setActiveResume, triggerSectionHighlight]);

  // Initialize VoiceService
  useEffect(() => {
    const vs = new VoiceService({
      onStateChange: (st) => {
        setVoiceState(st);
      },
      onInterimTranscript: (interim) => {
        setUserLiveTranscript(interim);
      },
      onFinalTranscript: (finalText) => {
        setUserLiveTranscript(finalText);
        // Automatically send user answer to Adil's AI
        handleSendMessage(undefined, finalText);
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
      onSpeechStart: () => {
        setVoiceState('Speaking');
      },
      onSpeechEnd: () => {
        setVoiceState('Listening');
      }
    });

    voiceServiceRef.current = vs;

    return () => {
      vs.destroy();
    };
  }, [handleSendMessage]);

  // Initialize interview session
  const initSession = useCallback(async (targetRole?: string) => {
    setIsInitializing(true);
    setVoiceState('Connecting');
    try {
      const res = await apiService.startInterview(targetRole);
      setSession(res.session);
      setSessionId(res.session_id);

      const firstAiMsg = res.session.messages[0]?.text;
      if (firstAiMsg) {
        setAiSpokenSubtitle(firstAiMsg);
        // Speak initial greeting aloud from Adil's AI!
        setTimeout(() => {
          if (voiceServiceRef.current) {
            setVoiceState('Speaking');
            voiceServiceRef.current.speak(
              firstAiMsg,
              () => setVoiceState('Speaking'),
              () => {
                setVoiceState('Listening');
                voiceServiceRef.current?.startListening();
              }
            );
          }
        }, 600);
      } else {
        setVoiceState('Listening');
      }
    } catch (err) {
      console.error('Failed to start interview session:', err);
      setVoiceState('Listening');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Orb click handler: interruption or toggle listening
  const handleOrbClick = () => {
    if (voiceState === 'Speaking') {
      // Natural interruption
      voiceServiceRef.current?.interruptSpeaking();
      setVoiceState('Listening');
      voiceServiceRef.current?.startListening();
    } else if (voiceState === 'Listening') {
      // If currently listening, keep listening or prompt
      voiceServiceRef.current?.startListening();
    } else {
      setVoiceState('Listening');
      voiceServiceRef.current?.startListening();
    }
  };

  // Mic toggle
  const toggleMic = () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      voiceServiceRef.current?.startListening();
      setVoiceState('Listening');
    } else {
      setIsMicMuted(true);
      voiceServiceRef.current?.stopListening();
      voiceServiceRef.current?.interruptSpeaking();
      setVoiceState('Processing');
    }
  };

  // Repeat last question
  const handleRepeatQuestion = () => {
    if (session?.messages && session.messages.length > 0) {
      const lastAi = [...session.messages].reverse().find(m => m.sender === 'ai');
      if (lastAi) {
        setAiSpokenSubtitle(lastAi.text);
        setVoiceState('Speaking');
        voiceServiceRef.current?.speak(
          lastAi.text,
          () => setVoiceState('Speaking'),
          () => setVoiceState('Listening')
        );
      }
    }
  };

  // Language switch
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    voiceServiceRef.current?.setLanguage(lang);
  };

  // File upload parser
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setVoiceState('Processing');
    try {
      const res = await apiService.parseDocument(file);
      if (res.profile) {
        setActiveResume(res.profile);
        if (session) {
          setSession(prev => prev ? { ...prev, collected_profile: res.profile } : prev);
        }
        triggerSectionHighlight('experience');
      }
      alert('✅ Resume loaded! Adil\'s AI has synced your profile and will help deepen your accomplishments.');
      setVoiceState('Listening');
    } catch (err) {
      alert('Failed to parse resume. Please try a PDF or DOCX file.');
      setVoiceState('Listening');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate completeness score
  const calculateCompleteness = (prof?: ResumeProfile): number => {
    if (!prof) return 0;
    let score = 0;
    if (prof.contact_info?.full_name) score += 15;
    if (prof.contact_info?.title || prof.target_role) score += 15;
    if (prof.contact_info?.email) score += 10;
    if (prof.work_experience && prof.work_experience.length > 0) {
      score += 25;
      if (prof.work_experience.some(e => e.highlights && e.highlights.length >= 2)) score += 5;
    }
    const skillCount = (prof.skills?.technical_skills?.length || 0) + (prof.skills?.developer_tools?.length || 0);
    if (skillCount >= 3) score += 15;
    if (prof.education && prof.education.length > 0) score += 10;
    if (prof.summary) score += 5;
    return Math.min(score, 100);
  };

  const currentStepIndex = session ? getStepIndex(session.current_step) : 0;
  const progressPercent = Math.round((currentStepIndex / (INTERVIEW_STEPS.length - 1)) * 100);
  const isComplete = session?.is_complete ?? false;
  const completenessScore = calculateCompleteness(session?.collected_profile);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

      {/* Dynamic Keyframes for Section Glow Pulse */}
      <style>{`
        @keyframes adilSectionPulse {
          0% { outline: 2px solid rgba(99, 102, 241, 0.9); box-shadow: 0 0 16px rgba(99, 102, 241, 0.45); }
          50% { outline: 3px solid rgba(168, 85, 247, 0.9); box-shadow: 0 0 24px rgba(168, 85, 247, 0.55); }
          100% { outline: 2px solid rgba(99, 102, 241, 0.9); box-shadow: 0 0 16px rgba(99, 102, 241, 0.45); }
        }
        .highlight-active-section {
          animation: adilSectionPulse 1.8s infinite ease-in-out;
          border-radius: 8px;
        }
      `}</style>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 mb-1">
            <Bot className="w-4 h-4" />
            <span>Voice Interview Session</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Adil's AI Voice Studio
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Talk naturally in English, Urdu, Hindi, or Roman Urdu. Adil's AI listens, speaks aloud, and builds your structured resume in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* STAR Framework Guide Toggle */}
          <button
            onClick={() => setShowStarGuide(!showStarGuide)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-medium text-gray-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Interview Guide</span>
          </button>

          {/* Upload Existing Resume */}
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-medium text-gray-200 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Upload CV</span>
            <input type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleFileUpload} />
          </label>

          {/* Open in Studio CTA */}
          <button
            onClick={() => {
              if (session?.collected_profile) setActiveResume(session.collected_profile);
              onNavigate('studio');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-medium text-white shadow-sm transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            <span>Resume Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Guide Accordion */}
      {showStarGuide && (
        <div className="glass-panel p-4 sm:p-5 rounded-xl border border-gray-800 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                How Adil's AI Voice Works
              </h3>
            </div>
            <button onClick={() => setShowStarGuide(false)} className="text-xs text-gray-400 hover:text-white">✕ Close</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3 text-xs">
            <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="font-semibold text-indigo-400 block mb-1">Natural Voice</span>
              <p className="text-gray-400 text-[11px] leading-relaxed">Speak freely in English, Roman Urdu, or Hindi. The voice assistant recognizes speech without pauses.</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="font-semibold text-cyan-400 block mb-1">Instant Interruption</span>
              <p className="text-gray-400 text-[11px] leading-relaxed">Interrupt Adil's AI at any time just like a human conversation. Simply start speaking or tap the orb.</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="font-semibold text-emerald-400 block mb-1">Real-Time Extraction</span>
              <p className="text-gray-400 text-[11px] leading-relaxed">Answers update your Candidate Profile and live resume preview on the canvas automatically.</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="font-semibold text-amber-400 block mb-1">Authentic Information</span>
              <p className="text-gray-400 text-[11px] leading-relaxed">Adil's AI organizes your genuine contributions and metrics without fabricating details.</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps Header */}
      <div className="glass-panel px-5 py-3.5 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interview Pipeline</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Current Stage: {INTERVIEW_STEPS[currentStepIndex]?.label || 'Active'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">Progress: {progressPercent}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {INTERVIEW_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStepIndex;
            const isPast = i < currentStepIndex;
            return (
              <React.Fragment key={step.key}>
                <div className={`flex flex-col items-center gap-1 shrink-0 ${isActive || isPast ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isPast
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-500/40 ring-2 ring-brand-400 ring-offset-1 ring-offset-gray-900'
                        : 'bg-gray-800 text-gray-500'
                  }`}>
                    {isPast ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{step.label}</span>
                </div>
                {i < INTERVIEW_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 min-w-[16px] rounded-full transition-all ${isPast ? 'bg-emerald-500' : 'bg-gray-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Screen: Adil's AI Conversational Voice Hub */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-gray-900/90 via-gray-950 to-gray-950 border border-indigo-500/20 shadow-2xl" style={{ minHeight: '660px' }}>
          
          {/* Subtle Ambient Background Aura */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Voice Controls Bar */}
          <div className="flex items-center justify-between gap-2 z-10 pb-3 border-b border-gray-800/80">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <Languages className="w-4 h-4 text-indigo-400" />
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="en-US">Auto (English + Roman Urdu + Hinglish)</option>
                <option value="ur-PK">اردو (Urdu Script)</option>
                <option value="hi-IN">हिन्दी (Hindi Script)</option>
              </select>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Transcript Drawer Toggle */}
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  showTranscript
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                }`}
                title="Toggle Conversation Transcript"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Transcript ({session?.messages?.length || 0})</span>
              </button>

              {/* Repeat Question */}
              <button
                onClick={handleRepeatQuestion}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 transition-colors hover:text-white"
                title="Repeat Question"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              {/* Mute/Unmute Mic */}
              <button
                onClick={toggleMic}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isMicMuted
                    ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                }`}
                title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* End Interview Action */}
              {!session?.is_complete && (
                <button
                  onClick={() => {
                    voiceServiceRef.current?.interruptSpeaking();
                    voiceServiceRef.current?.stopListening();
                    if (session) {
                      setSession({ ...session, is_complete: true });
                    }
                    setVoiceState('Processing');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 text-xs font-medium transition-colors"
                  title="End current interview"
                >
                  End Session
                </button>
              )}
            </div>
          </div>

          {/* Transcript Drawer (Conditional Overlay or Expandable) */}
          {showTranscript && (
            <div className="z-20 my-3 p-4 rounded-xl bg-gray-900/95 border border-indigo-500/30 max-h-[300px] overflow-y-auto space-y-2.5 shadow-2xl backdrop-blur-md animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-xs text-gray-400 font-semibold">
                <span>CONVERSATION HISTORY</span>
                <button onClick={() => setShowTranscript(false)} className="hover:text-white">✕ Close</button>
              </div>
              {session?.messages.map((m, i) => (
                <div key={i} className={`flex flex-col text-xs ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-500 uppercase font-mono mb-0.5">
                    {m.sender === 'ai' ? "Adil's AI" : 'You'}
                  </span>
                  <div className={`px-3 py-2 rounded-xl max-w-[88%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
          )}

          {/* Central Hero AI Voice Orb Section */}
          <div className="flex-1 flex flex-col items-center justify-center my-4 z-10 space-y-4">
            <AdilVoiceOrb
              state={voiceState}
              audioLevel={audioLevel}
              onClick={handleOrbClick}
              size={260}
            />

            {/* Live Subtitle / Voice Captions Box */}
            <div className="w-full max-w-lg space-y-2 text-center">
              {/* Adil's AI Spoken Subtitle */}
              {aiSpokenSubtitle && (
                <div className="p-3.5 rounded-2xl bg-gray-900/90 border border-indigo-500/30 shadow-lg text-xs sm:text-sm text-gray-100 font-medium leading-relaxed transition-all">
                  <span className="text-indigo-400 font-bold block text-[11px] mb-1 uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Adil's AI:</span>
                  </span>
                  "{aiSpokenSubtitle}"
                </div>
              )}

              {/* User Live Speech Transcript Box */}
              {userLiveTranscript && (
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-200 animate-fadeIn">
                  <span className="text-cyan-400 font-bold mr-1.5">🎤 Hearing you:</span>
                  <span className="italic">{userLiveTranscript}</span>
                  <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-pulse rounded-sm" />
                </div>
              )}
            </div>

            {/* Natural Interrupt CTA (Shown when AI is speaking) */}
            {voiceState === 'Speaking' && (
              <button
                onClick={() => {
                  voiceServiceRef.current?.interruptSpeaking();
                  setVoiceState('Listening');
                  voiceServiceRef.current?.startListening();
                }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow-md animate-bounce"
              >
                <Square className="w-3.5 h-3.5 fill-cyan-300" />
                <span>Tap to Interrupt & Respond</span>
              </button>
            )}
          </div>

          {/* Bottom Controls & Fallback Input */}
          <div className="z-10 pt-3 border-t border-gray-800/80 space-y-2.5">
            {!isComplete ? (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Voice Status Button */}
                <button
                  type="button"
                  onClick={handleOrbClick}
                  className={`p-3 rounded-xl border transition-all shrink-0 flex items-center justify-center ${
                    voiceState === 'Listening'
                      ? 'bg-emerald-600 text-white border-emerald-500 animate-pulse shadow-lg shadow-emerald-500/30'
                      : voiceState === 'Speaking'
                        ? 'bg-cyan-600 text-white border-cyan-500 animate-pulse'
                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-indigo-500'
                  }`}
                  title={voiceState === 'Speaking' ? 'Interrupt Adil\'s AI' : 'Listening... speak naturally'}
                >
                  {voiceState === 'Speaking' ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Text Fallback Input */}
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isStreaming || isLoading}
                    placeholder={
                      voiceState === 'Listening'
                        ? '🎤 Listening naturally in English, Urdu, Hindi... or type here'
                        : voiceState === 'Speaking'
                          ? 'Adil\'s AI is speaking (tap orb or interrupt to speak)...'
                          : 'Type an answer, project details, or reply in English/Urdu...'
                    }
                    className="w-full bg-gray-900/90 border border-gray-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-200 focus:outline-none transition-all pr-4 disabled:opacity-50 shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading || isStreaming}
                  className="p-3 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 hover:from-brand-500 hover:to-indigo-600 disabled:opacity-40 text-white shadow-md transition-all shrink-0"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Completion Announcement & CTA */
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-indigo-950/60 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>"Great, Adil. I have enough information to build your resume. I'm going to finalise everything now."</span>
                </div>
                <button
                  onClick={() => {
                    if (session?.collected_profile) setActiveResume(session.collected_profile);
                    onNavigate('studio');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shrink-0"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Finalise & Open Studio</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Screen: Live ATS Resume Paper Canvas Preview */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl flex flex-col justify-between" style={{ minHeight: '660px' }}>
          
          {/* Header & Live Completeness Meter */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Live Resume Canvas</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>ATS Ready: {completenessScore}%</span>
              </span>
            </div>
          </div>

          {/* Actual Styled Paper Canvas Preview */}
          <div className="flex-1 overflow-y-auto bg-white rounded-xl p-5 text-gray-900 shadow-2xl border border-gray-200 space-y-3.5 text-xs select-none max-h-[510px]">
            
            {/* Header / Contact Info */}
            <div className={`border-b border-gray-200 pb-2.5 transition-all p-1.5 ${
              highlightedSection === 'personal' ? 'highlight-active-section' : ''
            }`}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold uppercase tracking-wide text-gray-900">
                  {session?.collected_profile?.contact_info?.full_name || 'Candidate Full Name'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold border border-brand-200">
                  {session?.collected_profile?.contact_info?.title || session?.collected_profile?.target_role || 'Target Role'}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 font-medium">
                {session?.collected_profile?.contact_info?.email && <span>✉️ {session.collected_profile.contact_info.email}</span>}
                {session?.collected_profile?.contact_info?.phone && <span>📞 {session.collected_profile.contact_info.phone}</span>}
                {session?.collected_profile?.contact_info?.location && <span>📍 {session.collected_profile.contact_info.location}</span>}
              </div>
              {highlightedSection === 'personal' && (
                <div className="mt-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold animate-pulse inline-flex items-center gap-1">
                    ✨ Live Updated by Adil's AI
                  </span>
                </div>
              )}
            </div>

            {/* Dynamic Executive Summary */}
            <div className={`space-y-1 p-2 rounded-lg transition-all ${
              highlightedSection === 'summary' ? 'highlight-active-section' : ''
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 flex items-center gap-1">
                  <Target className="w-3 h-3 text-brand-600" />
                  <span>Executive Pitch</span>
                </h4>
                {highlightedSection === 'summary' && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold animate-pulse inline-flex items-center gap-1">
                    ✨ Live Updated
                  </span>
                )}
              </div>
              {session?.collected_profile?.summary ? (
                <p className="text-[11px] text-gray-700 leading-relaxed italic bg-brand-50/50 p-2 rounded border border-brand-100">
                  "{session.collected_profile.summary}"
                </p>
              ) : (
                <div className="p-2 border border-dashed border-gray-300 rounded-lg text-center text-[10px] text-gray-400">
                  Executive summary synthesizes live as Adil's AI talks with you...
                </div>
              )}
            </div>

            {/* Education */}
            <div className={`space-y-1.5 p-2 rounded-lg transition-all ${
              highlightedSection === 'education' ? 'highlight-active-section' : ''
            }`}>
              <div className="flex items-center justify-between border-b border-gray-200 pb-0.5">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-emerald-600" />
                  <span>Education</span>
                </h4>
                {highlightedSection === 'education' && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold animate-pulse inline-flex items-center gap-1">
                    ✨ Live Updated by Adil's AI
                  </span>
                )}
              </div>

              {(session?.collected_profile?.education?.length ?? 0) > 0 ? (
                <div className="space-y-1.5">
                  {session!.collected_profile.education.map((edu, idx) => (
                    <div key={idx} className="text-[11px] flex justify-between items-baseline bg-emerald-50/40 p-2 rounded border border-emerald-100/60">
                      <div>
                        <span className="font-bold text-gray-900">{edu.degree}</span>
                        <span className="text-gray-600 text-[10px] ml-1.5 font-semibold">({edu.institution})</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold">{edu.gpa ? `GPA: ${edu.gpa}` : (edu.end_date || 'Graduate')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 border border-dashed border-gray-300 rounded-lg text-center text-[10px] text-gray-400">
                  Degree, institution, and graduation details will update live here...
                </div>
              )}
            </div>

            {/* Work Experience & Polished Bullets */}
            <div className={`space-y-1.5 p-2 rounded-lg transition-all ${
              highlightedSection === 'experience' ? 'highlight-active-section' : ''
            }`}>
              <div className="flex items-center justify-between border-b border-gray-200 pb-0.5">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-brand-600" />
                  <span>Work Experience & Internships</span>
                </h4>
                {highlightedSection === 'experience' ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold animate-pulse inline-flex items-center gap-1">
                    ✨ Live Updated by Adil's AI
                  </span>
                ) : (
                  (session?.collected_profile?.work_experience?.length ?? 0) > 0 && (
                    <span className="text-[9px] text-emerald-600 font-bold">
                      {session!.collected_profile.work_experience.length} Role(s) Added
                    </span>
                  )
                )}
              </div>

              {(session?.collected_profile?.work_experience?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {session!.collected_profile.work_experience.map((exp, idx) => (
                    <div key={idx} className="text-[11px] space-y-0.5 bg-gray-50/90 p-2.5 rounded-md border border-gray-200">
                      <div className="flex justify-between items-baseline font-bold text-gray-900">
                        <span>{exp.position}</span>
                        <span className="text-[10px] text-gray-500 font-normal">{exp.start_date || '2023'} – {exp.end_date || (exp.current ? 'Present' : '2024')}</span>
                      </div>
                      <div className="text-[10px] font-semibold text-gray-600">{exp.company} {exp.location ? `• ${exp.location}` : ''}</div>
                      {exp.highlights.length > 0 && (
                        <ul className="list-disc list-outside ml-3.5 text-[10px] text-gray-700 space-y-1 mt-1">
                          {exp.highlights.map((h, hIdx) => (
                            <li key={hIdx} className="leading-relaxed">{h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 border border-dashed border-gray-300 rounded-lg text-center text-[10px] text-gray-400">
                  Experience & internship details will format live here...
                </div>
              )}
            </div>

            {/* Key Technical Projects */}
            <div className={`space-y-1.5 p-2 rounded-lg transition-all ${
              highlightedSection === 'projects' ? 'highlight-active-section' : ''
            }`}>
              <div className="flex items-center justify-between border-b border-gray-200 pb-0.5">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-purple-600" />
                  <span>Key Projects</span>
                </h4>
                {highlightedSection === 'projects' ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold animate-pulse inline-flex items-center gap-1">
                    ✨ Live Updated by Adil's AI
                  </span>
                ) : (
                  (session?.collected_profile?.projects?.length ?? 0) > 0 && (
                    <span className="text-[9px] text-emerald-600 font-bold">
                      {session!.collected_profile.projects.length} Project(s)
                    </span>
                  )
                )}
              </div>

              {(session?.collected_profile?.projects?.length ?? 0) > 0 ? (
                <div className="space-y-1.5">
                  {session!.collected_profile.projects.map((proj, idx) => (
                    <div key={idx} className="text-[11px] bg-purple-50/50 p-2 rounded-md border border-purple-100">
                      <div className="font-bold text-gray-900 flex items-center justify-between">
                        <span>{proj.title}</span>
                        {proj.technologies.length > 0 && (
                          <span className="text-[9px] text-purple-700 font-medium">[{proj.technologies.slice(0, 4).join(', ')}]</span>
                        )}
                      </div>
                      {proj.description && <p className="text-[10px] text-gray-600 mt-0.5">{proj.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 border border-dashed border-gray-300 rounded-lg text-center text-[10px] text-gray-400">
                  Projects with stack highlights will appear here...
                </div>
              )}
            </div>

            {/* Categorized Skills */}
            <div className={`space-y-1.5 p-2 rounded-lg transition-all ${
              highlightedSection === 'skills' ? 'highlight-active-section' : ''
            }`}>
              <div className="flex items-center justify-between border-b border-gray-200 pb-0.5">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Technical & Cloud Stack</span>
                </h4>
                {highlightedSection === 'skills' && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold animate-pulse inline-flex items-center gap-1">
                    ✨ Live Updated by Adil's AI
                  </span>
                )}
              </div>

              {(session?.collected_profile?.skills?.technical_skills?.length ?? 0) > 0 || (session?.collected_profile?.skills?.developer_tools?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {[
                    ...(session?.collected_profile?.skills?.technical_skills ?? []),
                    ...(session?.collected_profile?.skills?.frameworks_libraries ?? []),
                    ...(session?.collected_profile?.skills?.developer_tools ?? [])
                  ].map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] bg-gray-100 text-gray-800 font-semibold border border-gray-200">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-2 border border-dashed border-gray-300 rounded-lg text-center text-[10px] text-gray-400">
                  Languages, frameworks, and cloud platforms detected automatically...
                </div>
              )}
            </div>

          </div>

          {/* CTA Footer */}
          <button
            onClick={() => {
              if (session?.collected_profile) setActiveResume(session.collected_profile);
              onNavigate('studio');
            }}
            className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            <span>{isComplete ? '🎉 Finalise & Open Resume in Studio' : 'Edit Live Resume in Studio'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
