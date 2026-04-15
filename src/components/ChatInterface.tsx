import { useState, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  User as UserIcon, 
  Bot, 
  Mic,
  Square,
  Volume2,
  Loader2, 
  History,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  FileText as FileTextIcon,
  XCircle
} from 'lucide-react';
import { generateAIResponse, generateWelcomeMessage } from '@/services/api';
import { authService, type User, type ChatSession, type ChatMessage, type ChatAttachment } from '@/services/auth';
import { CALIFORNIA_DIVORCE_TOPICS } from '@/services/personality';
import { v4 as uuidv4 } from 'uuid';
import { SUBSCRIPTION_LIMITS } from '@/services/auth';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const MAX_TTS_CHARS = 900;

function renderMessageContent(content: string): string | (string | JSX.Element)[] {
  const matches = [...content.matchAll(URL_REGEX)];
  if (matches.length === 0) {
    return content;
  }

  const segments: (string | JSX.Element)[] = [];
  let lastIndex = 0;

  matches.forEach((match, idx) => {
    const url = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push(content.slice(lastIndex, index));
    }
    let hostname = '';
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = '';
    }
    const favicon = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}` : '';
    segments.push(
      <a
        key={`link-${index}-${idx}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-2 py-1 bg-emerald-50 text-emerald-700 font-medium rounded-full break-all hover:bg-emerald-100 transition-colors"
      >
        {favicon ? <img src={favicon} alt="" className="h-4 w-4 rounded-sm" /> : null}
        <span>{url}</span>
      </a>
    );
    lastIndex = index + url.length;
  });

  if (lastIndex < content.length) {
    segments.push(content.slice(lastIndex));
  }

  return segments;
}

function getSpeechFriendlyText(content: string): string {
  const cleaned = content
    .replace(URL_REGEX, '')
    .replace(/\[(Attachments?)\][\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= MAX_TTS_CHARS) {
    return cleaned;
  }

  const truncated = cleaned.slice(0, MAX_TTS_CHARS);
  const lastSentenceBreak = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('! ')
  );

  if (lastSentenceBreak > 280) {
    return `${truncated.slice(0, lastSentenceBreak + 1).trim()} ...`;
  }

  return `${truncated.trim()} ...`;
}

interface ChatInterfaceProps {
  currentUser: User | null;
  prefillPrompt?: string | null;
  onPrefillConsumed?: () => void;
}

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function ChatInterface({ currentUser, prefillPrompt, onPrefillConsumed }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoVoiceReplies, setAutoVoiceReplies] = useState(false);
  const [fallbackAudio, setFallbackAudio] = useState<{ url: string; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  type ComposerAttachment = ChatAttachment & { previewUrl?: string };

  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const voiceSubmitPendingRef = useRef(false);
  const shouldSpeakNextReplyRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRequestIdRef = useRef(0);
  const speechAbortControllerRef = useRef<AbortController | null>(null);
  const currentSpeechTextRef = useRef('');
  const speechCacheRef = useRef<Map<string, string>>(new Map());
  const speechPrefetchRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const maxAttachments = 4;

  const speechRecognitionSupported = typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const clearFallbackAudio = () => {
    setFallbackAudio((current) => {
      if (current?.url && !Array.from(speechCacheRef.current.values()).includes(current.url)) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  };

  const unlockAudioPlayback = async () => {
    if (typeof window === 'undefined') return;

    const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    const context = audioContextRef.current;
    if (context.state === 'suspended') {
      await context.resume();
    }

    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, 22050);
    const gainNode = context.createGain();
    gainNode.gain.value = 0;
    source.connect(gainNode);
    gainNode.connect(context.destination);
    source.start(0);
  };

  const primeSpeechAudio = async (text: string) => {
    const safeText = text.trim();
    const speechText = getSpeechFriendlyText(safeText);
    if (!safeText || !speechText) return;
    if (speechCacheRef.current.has(safeText) || speechPrefetchRef.current.has(safeText)) return;

    speechPrefetchRef.current.add(safeText);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: speechText }),
      });

      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      speechCacheRef.current.set(safeText, audioUrl);
    } catch (error) {
      console.error('TTS prefetch error:', error);
    } finally {
      speechPrefetchRef.current.delete(safeText);
    }
  };

  const stopSpeaking = () => {
    speechRequestIdRef.current += 1;
    speechAbortControllerRef.current?.abort();
    speechAbortControllerRef.current = null;
    currentSpeechTextRef.current = '';

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }

    clearFallbackAudio();
    setIsSpeaking(false);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const releaseAttachmentPreview = (attachment: ComposerAttachment) => {
    if (attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
  };

  const handleAttachmentSelection = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const availableSlots = maxAttachments - attachments.length;
    if (availableSlots <= 0) return;
    const accepted = files.slice(0, availableSlots).map((file) => {
      const isImage = file.type.startsWith('image/');
      const attachmentType: ChatAttachment['type'] = isImage ? 'image' : 'document';
      return {
        id: uuidv4(),
        name: file.name,
        type: attachmentType,
        sizeLabel: formatFileSize(file.size),
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      };
    });
    if (accepted.length) {
      setAttachments((prev) => [...prev, ...accepted]);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const next = prev.filter((attachment) => {
        if (attachment.id === id) {
          releaseAttachmentPreview(attachment);
          return false;
        }
        return true;
      });
      return next;
    });
  };

  const clearAttachments = () => {
    attachments.forEach(releaseAttachmentPreview);
    setAttachments([]);
  };

  const triggerAttachmentPicker = (mode: 'image' | 'document') => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    fileInputRef.current.accept = mode === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt,.rtf,.xlsx,.csv';
    fileInputRef.current.click();
  };

  // Load chat sessions when user changes
  useEffect(() => {
    if (currentUser) {
      const userSessions = authService.getChatSessions(currentUser.id);
      setSessions(userSessions);
      
      if (userSessions.length > 0 && !currentSessionId) {
        loadSession(userSessions[0].id);
      } else if (userSessions.length === 0) {
        startNewChat();
      }
    } else {
      // For guest users, start fresh
      setSessions([]);
      if (messages.length === 0) {
        startNewChat();
      }
    }
  }, [currentUser]);

  const isNearBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 120; // px from bottom to still auto-scroll
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= threshold;
  };

  // Scroll only when user is already near bottom or we triggered it
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (shouldAutoScrollRef.current || isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: shouldAutoScrollRef.current ? 'smooth' : 'auto' });
      shouldAutoScrollRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (prefillPrompt && prefillPrompt.trim()) {
      setInput(prefillPrompt);
      inputRef.current?.focus();
      onPrefillConsumed?.();
    }
  }, [prefillPrompt, onPrefillConsumed]);

  const startNewChat = () => {
    stopSpeaking();
    setAutoVoiceReplies(false);
    const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Guest';
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: generateWelcomeMessage(userName),
      timestamp: new Date().toISOString(),
    };
    
    setMessages([welcomeMessage]);
    setCurrentSessionId(null);
    setInput('');
    shouldAutoScrollRef.current = false;
    scrollContainerRef.current?.scrollTo({ top: 0 });
  };

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      stopSpeaking();
      setAutoVoiceReplies(false);
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      shouldAutoScrollRef.current = false;
      scrollContainerRef.current?.scrollTo({ top: 0 });
    }
  };

  const saveCurrentSession = (newMessages: ChatMessage[]) => {
    if (!currentUser || newMessages.length === 0) return;
    
    const session: ChatSession = {
      id: currentSessionId || uuidv4(),
      userId: currentUser.id,
      title: newMessages[0]?.content.slice(0, 50) + '...' || 'New Chat',
      messages: newMessages,
      createdAt: currentSessionId ? sessions.find(s => s.id === currentSessionId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    authService.saveChatSession(session);
    setCurrentSessionId(session.id);
    
    // Refresh sessions list
    const updatedSessions = authService.getChatSessions(currentUser.id);
    setSessions(updatedSessions);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    authService.deleteChatSession(sessionId);
    
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    
    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        loadSession(updatedSessions[0].id);
      } else {
        startNewChat();
      }
    }
  };

  const speakText = async (text: string) => {
    const safeText = text.trim();
    const speechText = getSpeechFriendlyText(safeText);
    if (!safeText || !speechText) return;

    if (isSpeaking && currentSpeechTextRef.current === safeText) {
      stopSpeaking();
      return;
    }

    const requestId = speechRequestIdRef.current + 1;
    speechRequestIdRef.current = requestId;
    currentSpeechTextRef.current = safeText;
    clearFallbackAudio();

    try {
      speechAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      speechAbortControllerRef.current = abortController;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current.load();
        audioRef.current = null;
      }

      setIsSpeaking(true);

      let audioUrl = speechCacheRef.current.get(safeText);
      if (!audioUrl) {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: speechText }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`TTS error: ${response.status}`);
        }

        const blob = await response.blob();
        if (speechRequestIdRef.current !== requestId) {
          setIsSpeaking(false);
          return;
        }

        audioUrl = URL.createObjectURL(blob);
        speechCacheRef.current.set(safeText, audioUrl);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        if (speechRequestIdRef.current === requestId) {
          currentSpeechTextRef.current = '';
          setIsSpeaking(false);
        }
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        if (speechRequestIdRef.current === requestId) {
          currentSpeechTextRef.current = '';
          setIsSpeaking(false);
        }
      };

      try {
        await audio.play();
      } catch (playError) {
        if ((playError as Error).name === 'AbortError') {
          URL.revokeObjectURL(audioUrl);
          return;
        }

        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setFallbackAudio({ url: audioUrl, text: safeText });
        currentSpeechTextRef.current = '';
        setIsSpeaking(false);
        return;
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error('TTS playback error:', error);
      if (speechRequestIdRef.current === requestId) {
        currentSpeechTextRef.current = '';
        setIsSpeaking(false);
      }
    }
  };

  const handleSend = async (overrideInput?: string, fromVoice: boolean = false) => {
    const draftInput = overrideInput ?? input;
    if ((draftInput.trim().length === 0 && attachments.length === 0) || isLoading) return;
    
    if (currentUser) {
      const canChat = authService.canUserChat(currentUser);
      if (!canChat.allowed) {
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `${canChat.reason}`,
          timestamp: new Date().toISOString(),
        };
        shouldAutoScrollRef.current = true;
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
    }
    
    const attachmentSummary = attachments.length
      ? attachments
          .map((file, index) => `Attachment ${index + 1}: ${file.name}${file.sizeLabel ? ` (${file.sizeLabel})` : ''} [${file.type === 'image' ? 'Image' : 'Document'}]`)
          .join('\n')
      : '';
    const baseContent = draftInput.trim();
    const composedContent = attachmentSummary
      ? [baseContent, `[Attachments]\n${attachmentSummary}`].filter(Boolean).join('\n\n')
      : baseContent;
    const attachmentMeta: ChatAttachment[] = attachments.length
      ? attachments.map(({ id, name, type, sizeLabel }) => ({ id, name, type, sizeLabel }))
      : [];

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: composedContent,
      timestamp: new Date().toISOString(),
      attachments: attachmentMeta.length ? attachmentMeta : undefined,
    };
    
    const updatedMessages = [...messages, userMessage];
    shouldAutoScrollRef.current = true;
    setMessages(updatedMessages);
    setInput('');
    clearAttachments();
    setIsLoading(true);

    if (fromVoice) {
      setAutoVoiceReplies(true);
      shouldSpeakNextReplyRef.current = true;
    } else {
      setAutoVoiceReplies(false);
      shouldSpeakNextReplyRef.current = false;
    }
    
    try {
      // Prepare conversation history for AI
      const conversationHistory = updatedMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      // Generate AI response with user's name for personalization
      const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Guest';
      const plan = currentUser?.subscription ?? 'free';
      const aiResponse = await generateAIResponse(userMessage.content, conversationHistory, userName, plan);
      
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        suggestedActions: aiResponse.suggestedActions,
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      shouldAutoScrollRef.current = true;
      setMessages(finalMessages);
      saveCurrentSession(finalMessages);

      if (shouldSpeakNextReplyRef.current && aiResponse.content.trim()) {
        shouldSpeakNextReplyRef.current = false;
        void speakText(aiResponse.content);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Something glitched on my end. Try again in a sec, and if it keeps happening I can help you narrow down what is triggering it.',
        timestamp: new Date().toISOString(),
      };
      shouldAutoScrollRef.current = true;
      setMessages([...updatedMessages, errorMessage]);
      shouldSpeakNextReplyRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isLoading) return;

    if (isListening) {
      void unlockAudioPlayback();
      voiceSubmitPendingRef.current = true;
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      return;
    }

    stopSpeaking();

    transcriptRef.current = '';
    voiceSubmitPendingRef.current = false;

    const recognition: BrowserSpeechRecognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      const combinedTranscript = [finalTranscript.trim(), interimTranscript.trim()].filter(Boolean).join(' ');
      transcriptRef.current = combinedTranscript;
      setInput(combinedTranscript);
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      const finalText = transcriptRef.current.trim() || input.trim();

      if (voiceSubmitPendingRef.current && finalText) {
        transcriptRef.current = '';
        voiceSubmitPendingRef.current = false;
        void handleSend(finalText, true);
        setInput('');
        return;
      }

      voiceSubmitPendingRef.current = false;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  useEffect(() => {
    const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant');
    if (latestAssistantMessage?.content) {
      void primeSpeechAudio(latestAssistantMessage.content);
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
      speechCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      speechCacheRef.current.clear();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTopicClick = (topicId: string) => {
    const topic = CALIFORNIA_DIVORCE_TOPICS.find(t => t.id === topicId);
    if (topic) {
      setInput(`Tell me about ${topic.title.toLowerCase()}`);
    }
  };

  const getRemainingChats = () => {
    if (!currentUser) return Infinity; // Guest users have unlimited
    const limits = SUBSCRIPTION_LIMITS[currentUser.subscription];
    if (limits.maxChats === Infinity) return Infinity;
    return Math.max(0, limits.maxChats - currentUser.chatCount);
  };

  const remainingChats = getRemainingChats();

  return (
    <Card className="min-h-[780px] lg:min-h-[820px] flex flex-col border-[3px] border-emerald-400 shadow-[0_25px_70px_rgba(16,185,129,0.16),0_0_0_1px_rgba(16,185,129,0.32)] bg-white rounded-3xl dark:bg-slate-950 overflow-hidden">
      <CardHeader className="border-b border-emerald-300/70 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-white/15 text-white border-0">California divorce info</Badge>
              <Badge variant="secondary" className="bg-white/15 text-white border-0">Practical next steps</Badge>
            </div>
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <span className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shadow-sm">
                <Bot className="h-5 w-5" />
              </span>
              Chat with Maria
            </CardTitle>
            <p className="mt-2 text-sm text-emerald-50 max-w-2xl leading-6">
              Strategic guidance for California divorce, custody, support, and related family law issues.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!currentUser && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                Guest Mode
              </Badge>
            )}
            {currentUser && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                {SUBSCRIPTION_LIMITS[currentUser.subscription].name}
              </Badge>
            )}
            {currentUser && remainingChats !== Infinity && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {remainingChats} chats left today
              </Badge>
            )}
            {currentUser && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-white hover:bg-white/20"
                >
                  <History className="h-4 w-4 mr-1" />
                  History
                  {showHistory ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startNewChat}
                  className="text-white hover:bg-white/20"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Chat
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      {showHistory && currentUser && (
        <div className="border-b bg-gray-50 p-3 max-h-40 overflow-y-auto">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Previous Conversations</h4>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400">No previous conversations</p>
          ) : (
            <div className="space-y-1">
              {sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${
                    currentSessionId === session.id 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="truncate flex-1">{session.title}</span>
                  <button
                    onClick={(e) => deleteSession(e, session.id)}
                    className="ml-2 p-1 hover:bg-red-100 hover:text-red-600 rounded"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto mb-4 flex items-center justify-center shadow-sm">
              <Bot className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Maria
            </h3>
            <p className="text-gray-500 mb-2">California divorce guide, practical and human</p>
            <p className="text-sm text-slate-500 mb-6 max-w-lg mx-auto leading-6">
              Ask a question, upload paperwork, or start with one of the topics below. I’ll help you sort the next move without making it more overwhelming.
            </p>
            
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {CALIFORNIA_DIVORCE_TOPICS.slice(0, 4).map(topic => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className="p-3 text-left bg-white border rounded-2xl hover:border-emerald-400 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-gray-700 text-sm">{topic.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{topic.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-3xl p-4 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md ring-1 ring-emerald-50'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-6">
                  {renderMessageContent(message.content)}
                </div>
                {message.role === 'assistant' && (
                  <>
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <div className="text-[11px] uppercase tracking-wide text-emerald-600/80 font-medium">
                        Maria
                      </div>
                      <button
                        type="button"
                        onClick={() => void speakText(message.content)}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        {isSpeaking && currentSpeechTextRef.current === message.content ? 'Stop voice' : 'Play voice'}
                      </button>
                    </div>
                    {fallbackAudio?.text === message.content && (
                      <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                        <p className="mb-2 text-xs font-medium text-emerald-700">
                          Tap play below if your browser blocked Maria from auto-playing audio.
                        </p>
                        <audio controls preload="auto" src={fallbackAudio.url} className="w-full" />
                      </div>
                    )}
                  </>
                )}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.attachments.map((attachment) => (
                      <span
                        key={attachment.id}
                        className={`inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${
                          message.role === 'user'
                            ? 'border-white/30 text-white bg-white/10'
                            : 'border-slate-200 text-slate-600 bg-slate-50'
                        }`}
                      >
                        {attachment.type === 'image' ? (
                          <ImageIcon className="h-3.5 w-3.5" />
                        ) : (
                          <FileTextIcon className="h-3.5 w-3.5" />
                        )}
                        <span className="truncate max-w-[120px]">{attachment.name}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className={`text-[11px] mt-3 ${message.role === 'user' ? 'text-emerald-200' : 'text-gray-400'}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-9 h-9 rounded-2xl bg-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t bg-white/95 backdrop-blur-sm">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => handleAttachmentSelection(event.target.files)}
        />
        {currentUser && remainingChats <= 3 && remainingChats !== Infinity && remainingChats > 0 && (
          <Alert className="mb-3 bg-emerald-50 border-emerald-200">
            <AlertDescription className="text-emerald-700 text-sm">
              You have {remainingChats} chat{remainingChats === 1 ? '' : 's'} remaining today. 
              <a href="/pricing" className="underline font-medium ml-1">Upgrade for unlimited chats</a>.
            </AlertDescription>
          </Alert>
        )}

        {attachments.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Attachments ({attachments.length}/{maxAttachments})</span>
              <button
                type="button"
                onClick={clearAttachments}
                className="text-slate-400 hover:text-slate-600"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600"
                >
                  {attachment.previewUrl ? (
                    <img
                      src={attachment.previewUrl}
                      alt={attachment.name}
                      className="h-10 w-10 rounded-md object-cover border border-white"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-white flex items-center justify-center border">
                      {attachment.type === 'image' ? (
                        <ImageIcon className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <FileTextIcon className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                  )}
                  <div className="max-w-[140px]">
                    <p className="font-medium text-slate-700 truncate">{attachment.name}</p>
                    {attachment.sizeLabel && (
                      <p className="text-[11px] text-slate-500">{attachment.sizeLabel}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Share supporting files:</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-600 hover:text-emerald-700"
                onClick={() => triggerAttachmentPicker('document')}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-600 hover:text-emerald-700"
                onClick={() => triggerAttachmentPicker('image')}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <span className="text-xs text-slate-400">{attachments.length}/{maxAttachments} attachments</span>
        </div>
        
        <div className="flex gap-2 items-end">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Maria a question or describe the files you're sharing..."
            className="flex-1 rounded-2xl border-slate-200 h-12 px-4"
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={toggleVoiceInput}
            disabled={isLoading || !speechRecognitionSupported}
            variant="outline"
            className={`rounded-2xl h-12 px-4 border-slate-200 ${isListening ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100' : 'text-slate-600 hover:text-emerald-700'}`}
          >
            {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            onClick={() => void handleSend()}
            disabled={((!input.trim() && attachments.length === 0) || isLoading)}
            className="bg-emerald-700 hover:bg-emerald-800 rounded-2xl h-12 px-4 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          {speechRecognitionSupported
            ? isListening
              ? 'Listening... tap stop when you’re done, and Maria will answer out loud.'
              : isSpeaking
                ? 'Maria is speaking.'
                : autoVoiceReplies
                  ? 'Voice replies are on for this conversation. Send a typed message to switch Maria back to text-only replies.'
                  : 'Tap the mic to start, tap stop when you’re done.'
            : 'Voice input depends on browser support. Text chat still works normally.'}
        </p>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Maria gives California divorce information, not legal advice. For advice about your specific facts, talk to an attorney.
        </p>
      </div>
    </Card>
  );
}
