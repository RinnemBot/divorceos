import { useState, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  User as UserIcon, 
  Bot, 
  CircleCheckBig,
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
import { extractChatAttachmentContext } from '@/services/chatAttachments';
import { MariaDocumentError, createMariaDocument } from '@/services/documents';
import { authService, type User, type ChatSession, type ChatMessage, type ChatAttachment } from '@/services/auth';
import { CALIFORNIA_DIVORCE_TOPICS } from '@/services/personality';
import { v4 as uuidv4 } from 'uuid';
import { SUBSCRIPTION_LIMITS } from '@/services/auth';
import { toast } from 'sonner';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const MAX_TTS_CHARS = 900;
const SILENT_AUDIO_DATA_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
const SAVE_PROMPT_PATTERN = /(save this|save that|make (this|that) (a )?pdf|turn (this|that) into (a )?pdf|put (this|that) in (my )?(dashboard|saved files)|save (it|this|that) to (my )?(dashboard|saved files)|export (this|that)|save as a pdf|save (this|that) as pdf|pdf-ready|pdf ready|save .* to (my )?saved files|make me a pdf|create .*pdf)/i;
const DRAFT_REQUEST_PATTERN = /\b(draft|create|make|generate|prepare|write|finalize|polish|revise|summar(?:y|ize)|declaration|findings|packet|based on)\b/i;

interface PdfDraftSection {
  id: string;
  heading?: string;
  body: string;
  label: string;
}

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

function cleanPdfLine(value: string): string {
  return value
    .replace(/^[-*•◦▪‣]+\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/\*\*/g, '')
    .trim();
}

function truncatePdfLabel(value: string, max = 72): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function extractPdfSectionsFromMessage(content: string): PdfDraftSection[] {
  const cleaned = content.replace(/\*\*/g, '').trim();
  if (!cleaned) return [];

  const paragraphs = cleaned
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const sections: PdfDraftSection[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const lines = paragraph
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const bulletLines = lines
      .filter((line) => /^([-*•◦▪‣]|\d+[.)])\s+/.test(line))
      .map(cleanPdfLine)
      .filter(Boolean);

    if (bulletLines.length >= 2) {
      bulletLines.forEach((line, bulletIndex) => {
        sections.push({
          id: `p${paragraphIndex}-b${bulletIndex}`,
          body: line,
          label: truncatePdfLabel(line),
        });
      });
      return;
    }

    if (lines.length > 1 && lines[0].length < 90 && !/[.!?]$/.test(lines[0])) {
      const heading = cleanPdfLine(lines[0]);
      const body = lines.slice(1).map(cleanPdfLine).join('\n').trim();
      if (body) {
        sections.push({
          id: `p${paragraphIndex}`,
          heading,
          body,
          label: truncatePdfLabel(heading || body),
        });
        return;
      }
    }

    const body = lines.map(cleanPdfLine).join('\n').trim();
    if (!body) return;

    sections.push({
      id: `p${paragraphIndex}`,
      body,
      label: truncatePdfLabel(lines[0] ? cleanPdfLine(lines[0]) : body),
    });
  });

  return sections.length ? sections : [{ id: 'p0', body: cleaned, label: truncatePdfLabel(cleaned) }];
}

function buildPdfTitleFromMessage(content: string): string {
  const ignoredPatterns = [
    /^hey\b/i,
    /^hi\b/i,
    /^hello\b/i,
    /^i['’]m maria\b/i,
    /^my full chat brain\b/i,
    /^if you want\b/i,
    /^important\b/i,
    /^here are the basics\b/i,
    /^below is\b/i,
    /^got it\b/i,
  ];

  const firstLine = content
    .replace(/\*\*/g, '')
    .split('\n')
    .map((line) => cleanPdfLine(line))
    .find((line) => line && !ignoredPatterns.some((pattern) => pattern.test(line)))
    || content
      .replace(/\*\*/g, '')
      .split('\n')
      .map((line) => cleanPdfLine(line))
    .find(Boolean);

  if (!firstLine) return 'Maria conversation export';
  return truncatePdfLabel(firstLine.replace(/[.:]+$/, ''), 48);
}

function buildPdfTitleFromRequest(userMessage: string, assistantContent: string): string {
  const request = userMessage.toLowerCase();

  if (request.includes('spousal support')) {
    if (request.includes('4320')) return 'Spousal Support 4320 Summary';
    if (request.includes('finding')) return 'Spousal Support Findings';
    if (request.includes('declaration')) return 'Spousal Support Declaration';
    return 'Spousal Support Summary';
  }

  if (request.includes('custody')) return 'Custody Summary';
  if (request.includes('support')) return 'Support Summary';
  if (request.includes('declaration')) return 'Declaration Draft';
  if (request.includes('hearing')) return 'Hearing Summary';

  return buildPdfTitleFromMessage(assistantContent);
}

function isSaveOnlyRequest(userMessage: string): boolean {
  return SAVE_PROMPT_PATTERN.test(userMessage) && !DRAFT_REQUEST_PATTERN.test(userMessage);
}

function isMetaAssistantMessage(content: string): boolean {
  return [
    /saved that to your saved files/i,
    /saved to your saved files/i,
    /i can['’]?t save/i,
    /i cannot save/i,
    /copy\/paste format/i,
    /save as pdf/i,
    /^please sign in again/i,
  ].some((pattern) => pattern.test(content));
}

function looksDocumentLike(content: string): boolean {
  if (content.length >= 260) return true;
  if (/\n[-*•]/.test(content)) return true;
  if (/(family code|summary of request|declaration|findings|§\s?4320|hearing date|case no\.|county:|petitioner\/respondent)/i.test(content)) return true;
  return false;
}

function findLastSavableAssistantMessage(messages: ChatMessage[]): ChatMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== 'assistant') continue;
    if (!message.content.trim()) continue;
    if (isMetaAssistantMessage(message.content)) continue;
    if (!looksDocumentLike(message.content)) continue;
    return message;
  }

  return null;
}

function toPdfFileName(title: string, fallbackDate: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  return `${base || `maria-${fallbackDate}`}.pdf`;
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
  type ComposerAttachment = ChatAttachment & { file: File; previewUrl?: string };

  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
  const [pdfComposerMessage, setPdfComposerMessage] = useState<ChatMessage | null>(null);
  const [pdfComposerSections, setPdfComposerSections] = useState<PdfDraftSection[]>([]);
  const [selectedPdfSectionIds, setSelectedPdfSectionIds] = useState<string[]>([]);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [savedPdfByMessageId, setSavedPdfByMessageId] = useState<Record<string, string>>({});
  const [pdfSaveErrorByMessageId, setPdfSaveErrorByMessageId] = useState<Record<string, string>>({});
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

  const setPersistentAudioRef = (node: HTMLAudioElement | null) => {
    if (!node) {
      audioRef.current = null;
      return;
    }

    node.preload = 'auto';
    node.setAttribute('playsinline', 'true');
    node.setAttribute('webkit-playsinline', 'true');
    audioRef.current = node;
  };

  const getAudioElement = () => audioRef.current;

  const unlockAudioPlayback = async () => {
    if (typeof window === 'undefined') return;

    const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextConstructor) {
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
    }

    const audio = getAudioElement();
    if (!audio) return;

    const previousMuted = audio.muted;
    const previousVolume = audio.volume;
    const previousSrc = audio.currentSrc || audio.src;

    audio.pause();
    audio.currentTime = 0;
    audio.src = SILENT_AUDIO_DATA_URI;
    audio.muted = true;
    audio.volume = 0;

    try {
      await audio.play();
    } finally {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = previousMuted;
      audio.volume = previousVolume;
      if (previousSrc) {
        audio.src = previousSrc;
      } else {
        audio.removeAttribute('src');
      }
      audio.load();
    }
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
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
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
        file,
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

  const closePdfComposer = () => {
    setPdfComposerMessage(null);
    setPdfComposerSections([]);
    setSelectedPdfSectionIds([]);
    setPdfTitle('');
    setPdfFileName('');
  };

  const openPdfComposer = (message: ChatMessage) => {
    const sections = extractPdfSectionsFromMessage(message.content);
    const nextTitle = buildPdfTitleFromMessage(message.content);
    setPdfComposerMessage(message);
    setPdfComposerSections(sections);
    setSelectedPdfSectionIds(sections.map((section) => section.id));
    setPdfTitle(nextTitle);
    setPdfFileName(toPdfFileName(nextTitle, message.timestamp.slice(0, 10)));
  };

  const saveMessageToPdf = async ({
    message,
    title,
    fileName,
    sections,
  }: {
    message: ChatMessage;
    title?: string;
    fileName?: string;
    sections?: { heading?: string; body: string }[];
  }) => {
    if (!currentUser?.id || savingMessageId) return null;

    const derivedTitle = title?.trim() || buildPdfTitleFromMessage(message.content);
    const derivedFileName = fileName?.trim() || toPdfFileName(derivedTitle, message.timestamp.slice(0, 10));
    const derivedSections = sections?.length
      ? sections
      : extractPdfSectionsFromMessage(message.content).map(({ heading, body }) => ({ heading, body }));

    if (!derivedSections.length) {
      throw new Error('Pick at least one point to save.');
    }

    setSavingMessageId(message.id);
    setPdfSaveErrorByMessageId((current) => {
      const next = { ...current };
      delete next[message.id];
      return next;
    });

    try {
      const createdDocument = await createMariaDocument({
        title: derivedTitle,
        subtitle: `Saved from Maria on ${new Date(message.timestamp).toLocaleString()}`,
        fileName: derivedFileName,
        sections: derivedSections,
        footerNote: 'Generated by Maria and saved to your dashboard vault.',
      });

      window.dispatchEvent(new CustomEvent('divorceos:vault-document-created', { detail: createdDocument }));
      setSavedPdfByMessageId((current) => ({ ...current, [message.id]: derivedFileName }));
      return createdDocument;
    } catch (error) {
      const errorMessage = error instanceof MariaDocumentError
        ? error.message
        : error instanceof Error
          ? `Save failed: ${error.message}`
          : 'Save failed: unable to save this PDF right now.';

      setPdfSaveErrorByMessageId((current) => ({ ...current, [message.id]: errorMessage }));
      throw error;
    } finally {
      setSavingMessageId(null);
    }
  };

  const handleSaveMessageToPdf = async () => {
    if (!pdfComposerMessage) return;

    const trimmedTitle = pdfTitle.trim() || buildPdfTitleFromMessage(pdfComposerMessage.content);
    const trimmedFileName = pdfFileName.trim() || toPdfFileName(trimmedTitle, pdfComposerMessage.timestamp.slice(0, 10));
    const selectedSections = pdfComposerSections
      .filter((section) => selectedPdfSectionIds.includes(section.id))
      .map(({ heading, body }) => ({ heading, body }));

    if (!selectedSections.length) {
      window.alert('Pick at least one point to save.');
      return;
    }

    try {
      await saveMessageToPdf({
        message: pdfComposerMessage,
        title: trimmedTitle,
        fileName: trimmedFileName,
        sections: selectedSections,
      });

      toast.success('Saved to your Saved Files.');
      closePdfComposer();
    } catch (error) {
      console.error('Failed to save Maria document', error);
      if (error instanceof MariaDocumentError) {
        window.alert(error.message);
      } else {
        window.alert(error instanceof Error ? `Save failed: ${error.message}` : 'Save failed: unable to save this PDF right now.');
      }
    }
  };

  const togglePdfSection = (sectionId: string, checked: boolean | 'indeterminate') => {
    if (checked === 'indeterminate') return;

    setSelectedPdfSectionIds((current) => {
      if (checked) {
        return current.includes(sectionId) ? current : [...current, sectionId];
      }

      return current.filter((id) => id !== sectionId);
    });
  };

  const triggerAttachmentPicker = (mode: 'image' | 'document') => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    fileInputRef.current.accept = mode === 'image' ? 'image/*' : '.pdf,.docx,.txt,.md,.csv,.json,.xml';
    fileInputRef.current.click();
  };

  // Load chat sessions when user changes
  useEffect(() => {
    let cancelled = false;

    const loadUserSessions = async () => {
      if (currentUser) {
        const userSessions = await authService.getChatSessions(currentUser.id);
        if (cancelled) return;

        setSessions(userSessions);

        if (userSessions.length > 0 && !currentSessionId) {
          const nextSession = userSessions[0];
          stopSpeaking();
          setAutoVoiceReplies(false);
          setMessages(nextSession.messages);
          setCurrentSessionId(nextSession.id);
          shouldAutoScrollRef.current = false;
          scrollContainerRef.current?.scrollTo({ top: 0 });
        } else if (userSessions.length === 0) {
          startNewChat();
        }
        return;
      }

      setSessions([]);
      if (messages.length === 0) {
        startNewChat();
      }
    };

    void loadUserSessions();

    return () => {
      cancelled = true;
    };
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

  const saveCurrentSession = async (newMessages: ChatMessage[]) => {
    if (!currentUser || newMessages.length === 0) return;

    const titleSource = newMessages.find((message) => message.role === 'user')?.content || newMessages[0]?.content || 'New Chat';

    const session: ChatSession = {
      id: currentSessionId || uuidv4(),
      userId: currentUser.id,
      title: titleSource.slice(0, 50) + '...' || 'New Chat',
      messages: newMessages,
      createdAt: currentSessionId ? sessions.find(s => s.id === currentSessionId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedSession = await authService.saveChatSession(session);
    setCurrentSessionId(savedSession.id);

    const updatedSessions = await authService.getChatSessions(currentUser.id);
    setSessions(updatedSessions);
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await authService.deleteChatSession(sessionId);

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

      const audio = getAudioElement();
      if (!audio) {
        throw new Error('Audio playback is not available in this browser.');
      }

      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
      audio.onerror = null;
      audio.removeAttribute('src');
      audio.load();

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

      audio.src = audioUrl;
      audio.muted = false;
      audio.volume = 1;
      audio.load();
      audio.onended = () => {
        if (speechRequestIdRef.current === requestId) {
          currentSpeechTextRef.current = '';
          setIsSpeaking(false);
        }
      };
      audio.onerror = () => {
        if (speechRequestIdRef.current === requestId) {
          currentSpeechTextRef.current = '';
          setIsSpeaking(false);
        }
      };

      try {
        await audio.play();
      } catch (playError) {
        if ((playError as Error).name === 'AbortError') {
          return;
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
    const selectedAttachments = attachments;
    
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
    
    const attachmentSummary = selectedAttachments.length
      ? selectedAttachments
          .map((file, index) => `Attachment ${index + 1}: ${file.name}${file.sizeLabel ? ` (${file.sizeLabel})` : ''} [${file.type === 'image' ? 'Image' : 'Document'}]`)
          .join('\n')
      : '';
    const baseContent = draftInput.trim();
    const composedContent = attachmentSummary
      ? [baseContent, `[Attachments]\n${attachmentSummary}`].filter(Boolean).join('\n\n')
      : baseContent;
    const attachmentMeta: ChatAttachment[] = selectedAttachments.length
      ? selectedAttachments.map(({ id, name, type, sizeLabel }) => ({ id, name, type, sizeLabel }))
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
      if (isSaveOnlyRequest(userMessage.content)) {
        const targetMessage = findLastSavableAssistantMessage(messages);

        if (!currentUser?.id) {
          const authMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: 'Sign in first and I can save that into your Saved Files here.',
            timestamp: new Date().toISOString(),
          };
          const authMessages = [...updatedMessages, authMessage];
          shouldAutoScrollRef.current = true;
          setMessages(authMessages);
          void saveCurrentSession(authMessages);
          return;
        }

        if (!targetMessage) {
          const noTargetMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: 'I don’t have a drafted document in this chat to save yet. Ask me to draft it first, and I can save it straight into Saved Files here.',
            timestamp: new Date().toISOString(),
          };
          const noTargetMessages = [...updatedMessages, noTargetMessage];
          shouldAutoScrollRef.current = true;
          setMessages(noTargetMessages);
          void saveCurrentSession(noTargetMessages);
          return;
        }

        try {
          const preferredTitle = buildPdfTitleFromRequest(userMessage.content, targetMessage.content);
          const preferredFileName = toPdfFileName(preferredTitle, targetMessage.timestamp.slice(0, 10));
          await saveMessageToPdf({
            message: targetMessage,
            title: preferredTitle,
            fileName: preferredFileName,
          });

          const savedNotice: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `Saved that to your Saved Files as ${preferredFileName}.`,
            timestamp: new Date().toISOString(),
          };
          const savedMessages = [...updatedMessages, savedNotice];
          shouldAutoScrollRef.current = true;
          setMessages(savedMessages);
          void saveCurrentSession(savedMessages);
          toast.success('Maria saved the PDF to your Saved Files.');
        } catch (error) {
          console.error('Direct Maria save failed', error);
          const saveErrorMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: error instanceof MariaDocumentError
              ? error.message
              : 'I hit a problem while saving that to Saved Files. Try again in a sec.',
            timestamp: new Date().toISOString(),
          };
          const errorMessages = [...updatedMessages, saveErrorMessage];
          shouldAutoScrollRef.current = true;
          setMessages(errorMessages);
          void saveCurrentSession(errorMessages);
        }

        return;
      }

      // Prepare conversation history for AI
      const conversationHistory = updatedMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      // Generate AI response with user's name for personalization
      const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Guest';
      const plan = currentUser?.subscription ?? 'free';
      let aiUserMessage = userMessage.content;

      if (selectedAttachments.length > 0) {
        try {
          const attachmentContext = await extractChatAttachmentContext(selectedAttachments.map((attachment) => attachment.file));
          const basePrompt = baseContent || 'Please help me review the uploaded file and tell me what matters most.';

          if (attachmentContext.context) {
            aiUserMessage = [
              basePrompt,
              `[Uploaded file context]\n${attachmentContext.context}`,
            ].join('\n\n');
          } else if (!baseContent) {
            aiUserMessage = basePrompt;
          }

          if (attachmentContext.readableCount === 0 && attachmentContext.unreadableCount > 0) {
            toast.message('Maria can read PDFs, DOCX, TXT, CSV, JSON, Markdown, common images, and HEIC photos right now.');
          }
        } catch (error) {
          console.error('Chat attachment extraction failed', error);
          toast.error(error instanceof Error ? error.message : 'I could not read those file contents just yet.');
          if (!baseContent) {
            aiUserMessage = 'Please help me with the uploaded file based on what you can infer from the attachment names.';
          }
        }
      }

      const aiResponse = await generateAIResponse(aiUserMessage, conversationHistory, userName, plan);
      
      const requestedPdfSave = SAVE_PROMPT_PATTERN.test(userMessage.content);
      const shouldOfferPdfSave = aiResponse.shouldOfferPdfSave || requestedPdfSave;

      const assistantMessage: ChatMessage & { shouldOfferPdfSave?: boolean } = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        suggestedActions: aiResponse.suggestedActions,
        shouldOfferPdfSave,
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      shouldAutoScrollRef.current = true;
      setMessages(finalMessages);
      void saveCurrentSession(finalMessages);

      if (requestedPdfSave && currentUser?.id && aiResponse.content.trim()) {
        try {
          const preferredTitle = buildPdfTitleFromRequest(userMessage.content, aiResponse.content);
          const preferredFileName = toPdfFileName(preferredTitle, assistantMessage.timestamp.slice(0, 10));
          const createdDocument = await saveMessageToPdf({
            message: assistantMessage,
            title: preferredTitle,
            fileName: preferredFileName,
          });

          if (createdDocument) {
            const savedNotice: ChatMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: `Saved that to your Saved Files as ${preferredFileName}.`,
              timestamp: new Date().toISOString(),
            };
            const savedMessages = [...finalMessages, savedNotice];
            shouldAutoScrollRef.current = true;
            setMessages(savedMessages);
            void saveCurrentSession(savedMessages);
            toast.success('Maria saved the PDF to your Saved Files.');
          }
        } catch (error) {
          console.error('Automatic Maria PDF save failed', error);
          const saveFailureText = error instanceof MariaDocumentError
            ? error.message
            : 'I drafted it, but I could not save it to your Saved Files just yet.';
          const saveFailureMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: saveFailureText,
            timestamp: new Date().toISOString(),
          };
          const failureMessages = [...finalMessages, saveFailureMessage];
          shouldAutoScrollRef.current = true;
          setMessages(failureMessages);
          void saveCurrentSession(failureMessages);
        }
      }

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
      void unlockAudioPlayback().catch((error) => {
        console.warn('Audio unlock failed while stopping voice input:', error);
      });
      voiceSubmitPendingRef.current = true;
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      return;
    }

    stopSpeaking();
    void unlockAudioPlayback().catch((error) => {
      console.warn('Audio unlock failed before starting voice input:', error);
    });

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

    try {
      recognition.start();
    } catch (error) {
      console.error('Speech recognition failed to start:', error);
      setIsListening(false);
      recognitionRef.current = null;
    }
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current = null;
      }
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
      
      <audio ref={setPersistentAudioRef} preload="auto" playsInline className="hidden" aria-hidden="true" />

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
                    {(message as ChatMessage & { shouldOfferPdfSave?: boolean }).shouldOfferPdfSave && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openPdfComposer(message)}
                          disabled={savingMessageId === message.id || Boolean(savedPdfByMessageId[message.id])}
                          className="rounded-full border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          {savingMessageId === message.id ? (
                            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving PDF…</>
                          ) : savedPdfByMessageId[message.id] ? (
                            <><CircleCheckBig className="h-4 w-4 mr-1" /> Saved to Saved Files</>
                          ) : (
                            <><FileTextIcon className="h-4 w-4 mr-1" /> Save points to PDF</>
                          )}
                        </Button>
                        {pdfSaveErrorByMessageId[message.id] && (
                          <p className="mt-2 text-xs text-rose-600">{pdfSaveErrorByMessageId[message.id]}</p>
                        )}
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
        <p className="text-xs text-slate-400 mb-3">
          Maria can read PDFs, DOCX, TXT, CSV, JSON, Markdown, common images, and HEIC photos in chat.
        </p>
        
        <div className="flex gap-2 items-end">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Maria a question or upload a file for her to review..."
            className="flex-1 rounded-2xl border-slate-200 h-12 px-4"
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={() => void toggleVoiceInput()}
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

        <Dialog open={Boolean(pdfComposerMessage)} onOpenChange={(open) => { if (!open) closePdfComposer(); }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Save chat points as a PDF</DialogTitle>
              <DialogDescription>
                Pick the parts you want, name the file, and I’ll save it into Saved Files.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pdf-title">PDF title</Label>
                  <Input
                    id="pdf-title"
                    value={pdfTitle}
                    onChange={(event) => setPdfTitle(event.target.value)}
                    placeholder="Maria conversation export"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf-file-name">File name</Label>
                  <Input
                    id="pdf-file-name"
                    value={pdfFileName}
                    onChange={(event) => setPdfFileName(event.target.value)}
                    placeholder="maria-notes.pdf"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Choose points to save</Label>
                <div className="max-h-[340px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  {pdfComposerSections.map((section) => {
                    const checked = selectedPdfSectionIds.includes(section.id);
                    return (
                      <label
                        key={section.id}
                        className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${checked ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => togglePdfSection(section.id, next)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="text-sm font-medium text-slate-900">{section.heading || section.label}</div>
                          <Textarea
                            value={section.body}
                            readOnly
                            className="min-h-[84px] resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 text-slate-600 shadow-none focus-visible:ring-0"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePdfComposer}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveMessageToPdf()}
                disabled={!selectedPdfSectionIds.length || (savingMessageId === pdfComposerMessage?.id && Boolean(savingMessageId))}
              >
                {savingMessageId === pdfComposerMessage?.id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving PDF…</>
                ) : (
                  <><FileTextIcon className="mr-2 h-4 w-4" /> Save to Saved Files</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
