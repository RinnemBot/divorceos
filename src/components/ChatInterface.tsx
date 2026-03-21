import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  User as UserIcon, 
  Bot, 
  Loader2, 
  History,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { generateAIResponse, generateWelcomeMessage } from '@/services/api';
import { authService, type User, type ChatSession, type ChatMessage } from '@/services/auth';
import { CALIFORNIA_DIVORCE_TOPICS } from '@/services/personality';
import { v4 as uuidv4 } from 'uuid';
import { SUBSCRIPTION_LIMITS } from '@/services/auth';

interface ChatInterfaceProps {
  currentUser: User | null;
}

export function ChatInterface({ currentUser }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = () => {
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: generateWelcomeMessage(),
      timestamp: new Date().toISOString(),
    };
    
    setMessages([welcomeMessage]);
    setCurrentSessionId(null);
    setInput('');
  };

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // Check if user can chat (for non-guest users)
    if (currentUser) {
      const canChat = authService.canUserChat(currentUser);
      if (!canChat.allowed) {
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `I apologize, but ${canChat.reason}`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
    }
    
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    
    try {
      // Increment chat count for logged in users
      if (currentUser) {
        authService.incrementChatCount(currentUser);
      }
      
      // Prepare conversation history for AI
      const conversationHistory = updatedMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      // Generate AI response
      const aiResponse = await generateAIResponse(userMessage.content, conversationHistory);
      
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again in a moment.',
        timestamp: new Date().toISOString(),
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b bg-emerald-700 text-white py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Bot className="h-5 w-5" />
            Chat with Alex
          </CardTitle>
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
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Alex
            </h3>
            <p className="text-gray-500 mb-6">AI Divorce Specialist</p>
            
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {CALIFORNIA_DIVORCE_TOPICS.slice(0, 4).map(topic => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className="p-3 text-left bg-white border rounded-lg hover:border-emerald-400 hover:shadow-sm transition-all"
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
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-emerald-200' : 'text-gray-400'}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t bg-white">
        {currentUser && remainingChats <= 3 && remainingChats !== Infinity && remainingChats > 0 && (
          <Alert className="mb-3 bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-700 text-sm">
              You have {remainingChats} chat{remainingChats === 1 ? '' : 's'} remaining today. 
              <a href="/pricing" className="underline font-medium ml-1">Upgrade for unlimited chats</a>.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Alex about your divorce questions..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Alex is an AI assistant. Not legal advice. Consult an attorney for your specific situation.
        </p>
      </div>
    </Card>
  );
}
