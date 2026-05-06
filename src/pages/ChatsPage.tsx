import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ChatInterface, type ChatCaseFolderContext } from '@/components/ChatInterface';
import { AuthModal } from '@/components/AuthModal';
import type { User } from '@/services/auth';
import { listVaultDocuments, type VaultDocument } from '@/services/documents';
import { Archive, BookOpenText, CheckCircle2, FileText, FolderPlus, Globe2, Loader2, MessageSquareText, Mic, Paperclip, Pin, Settings2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ChatsPageProps {
  currentUser: User | null;
  onAuthSuccess?: (user: User) => void;
}

interface CaseFolder {
  id: string;
  name: string;
  documentIds: string[];
  chatSessionIds: string[];
}

const folderStorageKey = (userId: string) => `divorceos_case_folders_${userId}`;

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `folder-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const quickPrompts = [
  'Help me figure out my next divorce step in California.',
  'What forms do I need if I have children?',
  'Explain disclosures and deadlines in plain English.',
  'Help me prepare for custody and support questions.',
  'Turn my facts into a draft forms checklist.',
];

const chatTools = [
  { icon: Paperclip, title: 'Upload documents', body: 'Attach PDFs, images, DOCX, TXT, CSV, JSON, Markdown, and HEIC photos for Maria to review.' },
  { icon: Mic, title: 'Voice mode', body: 'Use speech input and voice replies when typing is not the easiest path.' },
  { icon: BookOpenText, title: 'Prompt library', body: 'Quick-start common California divorce questions, forms, hearings, support, and settlement prompts.' },
  { icon: Pin, title: 'Pinned chats', body: 'Coming next: pin important conversations and group them by case or issue.' },
  { icon: FolderPlus, title: 'Case folders', body: 'Coming next: shared case context and uploads across multiple chats.' },
  { icon: Globe2, title: 'Research mode', body: 'Coming next: one-question web research for court pages, forms, and county filing updates.' },
];

export function ChatsPage({ currentUser, onAuthSuccess }: ChatsPageProps) {
  const [prefillPrompt, setPrefillPrompt] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [vaultDocs, setVaultDocs] = useState<VaultDocument[]>([]);
  const [isVaultLoading, setIsVaultLoading] = useState(false);
  const [caseFolders, setCaseFolders] = useState<CaseFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isFolderUploading, setIsFolderUploading] = useState(false);
  const folderUploadInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const displayName = useMemo(() => {
    if (!currentUser) return 'Guest';
    return currentUser.name || currentUser.profile?.firstName || currentUser.email.split('@')[0];
  }, [currentUser]);

  useEffect(() => {
    const state = location.state as { prefillPrompt?: string } | null;
    const prompt = typeof state?.prefillPrompt === 'string' ? state.prefillPrompt.trim() : '';
    if (!prompt) return;
    setPrefillPrompt(prompt);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);

  useEffect(() => {
    if (!currentUser?.id) {
      setVaultDocs([]);
      setCaseFolders([]);
      setActiveFolderId(null);
      return;
    }

    const stored = window.localStorage.getItem(folderStorageKey(currentUser.id));
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CaseFolder[];
        if (Array.isArray(parsed)) {
          const folders = parsed
            .filter((folder) => folder?.id && folder?.name && Array.isArray(folder.documentIds))
            .map((folder) => ({ ...folder, chatSessionIds: Array.isArray(folder.chatSessionIds) ? folder.chatSessionIds : [] }));
          setCaseFolders(folders);
          setActiveFolderId((current) => current || folders[0]?.id || null);
        }
      } catch (error) {
        console.error('Failed to load case folders.', error);
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    window.localStorage.setItem(folderStorageKey(currentUser.id), JSON.stringify(caseFolders));
  }, [caseFolders, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    let cancelled = false;
    setIsVaultLoading(true);
    listVaultDocuments()
      .then((documents) => {
        if (cancelled) return;
        setVaultDocs(documents);
        setCaseFolders((current) => {
          if (current.length > 0 || documents.length === 0) return current;
          const starterFolder = {
            id: createId(),
            name: 'My case folder',
            documentIds: documents.map((doc) => doc.id),
            chatSessionIds: [],
          };
          setActiveFolderId(starterFolder.id);
          return [starterFolder];
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load vault documents for chats.', error);
      })
      .finally(() => {
        if (!cancelled) setIsVaultLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const activeFolder = useMemo(() => caseFolders.find((folder) => folder.id === activeFolderId) ?? null, [activeFolderId, caseFolders]);
  const activeCaseFolder = useMemo<ChatCaseFolderContext | null>(() => {
    if (!activeFolder) return null;
    const documentMap = new Map(vaultDocs.map((doc) => [doc.id, doc]));
    const documents = activeFolder.documentIds
      .map((id) => documentMap.get(id))
      .filter((doc): doc is VaultDocument => Boolean(doc));
    return { id: activeFolder.id, name: activeFolder.name, documents };
  }, [activeFolder, vaultDocs]);

  const addCaseFolder = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const name = newFolderName.trim() || `Case folder ${caseFolders.length + 1}`;
    const folder: CaseFolder = {
      id: createId(),
      name,
      documentIds: vaultDocs.map((doc) => doc.id),
      chatSessionIds: [],
    };

    setCaseFolders((current) => [folder, ...current]);
    setActiveFolderId(folder.id);
    setNewFolderName('');
    toast.success('Case folder created.', {
      description: vaultDocs.length ? 'All current Saved Files were included automatically.' : 'Upload Saved Files, then add them to this folder.',
    });
  };

  const toggleFolderDocument = (documentId: string, checked: boolean | 'indeterminate') => {
    if (!activeFolder || checked === 'indeterminate') return;
    setCaseFolders((current) => current.map((folder) => {
      if (folder.id !== activeFolder.id) return folder;
      const documentIds = checked
        ? Array.from(new Set([...folder.documentIds, documentId]))
        : folder.documentIds.filter((id) => id !== documentId);
      return { ...folder, documentIds };
    }));
  };

  const addSessionToActiveFolder = (sessionId: string) => {
    if (!activeFolder) return;
    setCaseFolders((current) => current.map((folder) => {
      if (folder.id !== activeFolder.id || folder.chatSessionIds.includes(sessionId)) return folder;
      return { ...folder, chatSessionIds: [sessionId, ...folder.chatSessionIds] };
    }));
  };

  const refreshVaultDocuments = async () => {
    const documents = await listVaultDocuments();
    setVaultDocs(documents);
    return documents;
  };

  const handleFolderUploadChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !activeFolder) return;
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const pdfs = files.filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length !== files.length) {
      toast.error('Only PDF uploads are supported in Saved Files right now.');
    }
    if (pdfs.length === 0) {
      event.target.value = '';
      return;
    }

    setIsFolderUploading(true);
    const uploadedIds: string[] = [];

    try {
      for (const file of pdfs) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/vault-upload', {
          method: 'POST',
          body: formData,
          credentials: 'same-origin',
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(typeof payload.error === 'string' ? payload.error : `Upload failed for ${file.name}`);
        }
        if (payload.document?.id) {
          uploadedIds.push(payload.document.id);
        }
      }

      const documents = await refreshVaultDocuments();
      const knownIds = new Set(documents.map((doc) => doc.id));
      setCaseFolders((current) => current.map((folder) => {
        if (folder.id !== activeFolder.id) return folder;
        const documentIds = Array.from(new Set([...uploadedIds.filter((id) => knownIds.has(id)), ...folder.documentIds]));
        return { ...folder, documentIds };
      }));
      toast.success('Uploaded to this case folder.', {
        description: `${uploadedIds.length} file${uploadedIds.length === 1 ? '' : 's'} added to ${activeFolder.name}.`,
      });
    } catch (error) {
      toast.error('Folder upload failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsFolderUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.16),transparent_25%),radial-gradient(circle_at_88%_8%,rgba(34,211,238,0.13),transparent_22%),linear-gradient(180deg,#f7fffb_0%,#effcf8_44%,#f8fafc_100%)] py-8 dark:bg-[radial-gradient(circle_at_15%_0%,rgba(16,185,129,0.2),transparent_26%),radial-gradient(circle_at_85%_8%,rgba(34,211,238,0.14),transparent_22%),linear-gradient(180deg,#020617_0%,#03111f_48%,#020617_100%)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="rounded-full border-0 bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200">Maria chat workspace</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-5xl">Chats</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              A full-page workspace for deeper California divorce conversations, document review, forms planning, and saved case context.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/dashboard"><Archive className="mr-2 h-4 w-4" />Saved files</Link>
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/draft-forms"><FileText className="mr-2 h-4 w-4" />Draft forms</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <Card className="rounded-3xl border-white/80 bg-white/78 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950 dark:text-white">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-400/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Signed in as</p>
                  <p className="mt-1 font-semibold text-slate-950 dark:text-white">{displayName}</p>
                  {!currentUser && <p className="mt-2 text-xs">Guest chats work, but sign in to save history and personalize your avatar.</p>}
                </div>
                {!currentUser && (
                  <Button onClick={() => setShowAuthModal(true)} className="w-full rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
                    Sign in to save chats
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/80 bg-white/78 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950 dark:text-white">
                  <FolderPlus className="h-5 w-5 text-emerald-600" />
                  Case folders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Start a chat inside a folder and Maria automatically reads that folder&apos;s Saved Files for case-specific context.
                </p>
                {currentUser ? (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={newFolderName}
                        onChange={(event) => setNewFolderName(event.target.value)}
                        placeholder="New case folder"
                        className="h-10 rounded-2xl"
                      />
                      <Button type="button" onClick={addCaseFolder} className="h-10 rounded-2xl bg-emerald-700 text-white hover:bg-emerald-800">
                        Add
                      </Button>
                    </div>
                    {isVaultLoading ? (
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-white/5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading Saved Files…
                      </div>
                    ) : vaultDocs.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500 dark:border-white/10">
                        No Saved Files yet. Upload PDFs in <Link to="/dashboard" className="font-medium text-emerald-700 underline">Saved files</Link>, then add them to a folder.
                      </div>
                    ) : null}

                    {caseFolders.length > 0 && (
                      <div className="space-y-2">
                        {caseFolders.map((folder) => {
                          const isActive = folder.id === activeFolderId;
                          return (
                            <button
                              key={folder.id}
                              type="button"
                              onClick={() => setActiveFolderId(folder.id)}
                              className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${isActive ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100' : 'border-slate-200 bg-white/70 text-slate-700 hover:border-emerald-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{folder.name}</span>
                                <span className="text-xs opacity-70">{folder.documentIds.length} file{folder.documentIds.length === 1 ? '' : 's'} • {folder.chatSessionIds.length} chat{folder.chatSessionIds.length === 1 ? '' : 's'}</span>
                              </span>
                              {isActive ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {activeFolder && (
                      <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Folder documents</div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isFolderUploading}
                            onClick={() => folderUploadInputRef.current?.click()}
                            className="h-8 rounded-full text-xs"
                          >
                            {isFolderUploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Paperclip className="mr-1 h-3.5 w-3.5" />}
                            Upload to folder
                          </Button>
                          <input
                            ref={folderUploadInputRef}
                            type="file"
                            accept="application/pdf"
                            multiple
                            className="hidden"
                            onChange={handleFolderUploadChange}
                          />
                        </div>
                        <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                          {vaultDocs.length === 0 ? (
                            <p className="text-xs text-slate-500">No documents yet. Upload PDFs directly into this folder.</p>
                          ) : (
                            vaultDocs.map((doc) => (
                              <label key={doc.id} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <Checkbox
                                  checked={activeFolder.documentIds.includes(doc.id)}
                                  onCheckedChange={(checked) => toggleFolderDocument(doc.id, checked)}
                                  className="mt-0.5"
                                />
                                <span className="min-w-0 flex-1 truncate" title={doc.name}>{doc.name}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Button onClick={() => setShowAuthModal(true)} variant="outline" className="w-full rounded-full">
                    Sign in to use folders
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/80 bg-white/78 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950 dark:text-white">
                  <MessageSquareText className="h-5 w-5 text-emerald-600" />
                  Quick prompts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setPrefillPrompt(prompt)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-left text-sm leading-5 text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-emerald-400/10"
                  >
                    {prompt}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/80 bg-white/78 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950 dark:text-white">
                  <Settings2 className="h-5 w-5 text-emerald-600" />
                  Options
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {[
                  ['Formal tone', 'Coming soon'],
                  ['Internet research', 'Coming soon'],
                  ['Auto-delete history', 'Coming soon'],
                  ['Pin this chat', 'Coming soon'],
                ].map(([label, status]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <span className="text-slate-700 dark:text-slate-200">{label}</span>
                    <span className="text-xs text-slate-400">{status}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          <main className="min-h-[840px] rounded-[2rem] border border-white/80 bg-white/75 p-3 shadow-[0_30px_100px_-55px_rgba(15,23,42,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
            <ChatInterface
              currentUser={currentUser}
              prefillPrompt={prefillPrompt}
              onPrefillConsumed={() => setPrefillPrompt('')}
              activeCaseFolder={activeCaseFolder}
              folderSessionIds={activeFolder?.chatSessionIds ?? []}
              onFolderSessionSaved={addSessionToActiveFolder}
            />
          </main>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {chatTools.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="rounded-3xl border-white/80 bg-white/72 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardContent className="p-5">
                <Icon className="h-5 w-5 text-emerald-600" />
                <h2 className="mt-3 font-semibold text-slate-950 dark:text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setShowAuthModal(false);
          onAuthSuccess?.(user);
        }}
      />
    </div>
  );
}
