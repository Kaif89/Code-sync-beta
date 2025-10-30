import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Editor, { OnMount } from "@monaco-editor/react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Users, Wifi, WifiOff, Play, MessageSquare, Terminal, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import ChatPanel from "@/components/ChatPanel";
import OutputPanel from "@/components/OutputPanel";

interface User {
  id: string;
  name: string;
  color: string;
}

interface PresenceState {
  [key: string]: {
    user_id: string;
    name: string;
    color: string;
  }[];
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];

const COLORS = ["#00d9ff", "#ff006e", "#8338ec", "#fb5607", "#06ffa5"];

export default function EditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get("room");
  
  const [code, setCode] = useState("// Start coding together!\n\n");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isError, setIsError] = useState(false);
  const [userName, setUserName] = useState(() => {
    const param = searchParams.get('name');
    if (param && param.trim()) {
      localStorage.setItem('username', param.trim());
      return param.trim();
    }
    return localStorage.getItem('username') || '';
  });

  // If not set, overlay an input so user MUST enter their name before editing/collaborating.
  const [nameEntered, setNameEntered] = useState(!!userName.trim());

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }

    if (userName.trim()) {
      localStorage.setItem('username', userName);
      setNameEntered(true);
    } else {
      setNameEntered(false);
    }
  }, [userName]);
  
  const [currentUser] = useState({
    id: crypto.randomUUID(),
    name: userName || `User ${Math.floor(Math.random() * 1000)}`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  });
  
  const channelRef = useRef<any>(null);
  // Add theme selector state
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const toggleTheme = () => {
    setEditorTheme(theme => (theme === "vs-dark" ? "vs-light" : "vs-dark"));
  };
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }

    const channel = supabase.channel(`room:${roomId}`);
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state: PresenceState = channel.presenceState();
        const activeUsers: User[] = [];
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            activeUsers.push({
              id: presence.user_id,
              name: presence.name,
              color: presence.color,
            });
          });
        });
        
        setUsers(activeUsers);
      })
      .on("broadcast", { event: "code-change" }, ({ payload }) => {
        if (payload.userId !== currentUser.id) {
          setCode(payload.code);
        }
      })
      .on("broadcast", { event: "language-change" }, ({ payload }) => {
        if (payload.userId !== currentUser.id) {
          setLanguage(payload.language);
          toast.info(`Language changed to ${payload.language}`);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          await channel.track({
            user_id: currentUser.id,
            name: currentUser.name,
            color: currentUser.color,
          });
        }
      });

    return () => {
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [roomId, currentUser, navigate]);

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined && channelRef.current) {
      setCode(value);
      channelRef.current.send({
        type: "broadcast",
        event: "code-change",
        payload: { code: value, userId: currentUser.id },
      });
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "language-change",
        payload: { language: newLanguage, userId: currentUser.id },
      });
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("");
    setIsError(false);

    try {
      const { data, error } = await supabase.functions.invoke("execute-code", {
        body: { code, language },
      });

      if (error) throw error;

      if (data.error) {
        setOutput(
          `Code not executed.\nError: ${data.error}${data.details ? `\n\n${data.details}` : ""}`
        );
        setIsError(true);
        toast.error("Code execution failed");
      } else {
        const combinedOutput = [data.stdout, data.stderr, data.output]
          .filter(Boolean)
          .join("\n");
        // Remove duplicate outputs if present
        const uniqueOutputs = Array.from(new Set(combinedOutput.split("\n"))).join("\n");
        setOutput(uniqueOutputs || "No output produced");
        setIsError(false);
        toast.success("Code executed successfully");
      }
    } catch (error) {
      console.error("Error running code:", error);
      setOutput(
        error instanceof Error
          ? `Code not executed.\nError: ${error.message}`
          : "Code not executed.\nUnknown error."
      );
      setIsError(true);
      toast.error("Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };

  const handlePaste = async () => {
    if (!editorRef.current) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const editor = editorRef.current;
      const selection = editor.getSelection();
      editor.executeEdits("paste", [
        {
          range: selection,
          text,
          forceMoveMarkers: true,
        },
      ]);
      editor.focus();
    } catch (err) {
      toast.error("Could not paste from clipboard.");
    }
  };

  // Register context menu action when editor loads
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    editor.addAction({
      id: "paste-action",
      label: "Paste",
      keybindings: [],
      contextMenuGroupId: "9_cutcopypaste",
      contextMenuOrder: 2,
      run: handlePaste,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {!nameEntered && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Enter your name to join/edit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                className="block w-full px-4 py-3 rounded-lg border border-border text-lg focus:outline-none"
                placeholder="Your Name"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && userName.trim() && setNameEntered(true)}
              />
              <Button
                className="w-full py-3"
                onClick={() => userName.trim() && setNameEntered(true)}
                disabled={!userName.trim()}
              >
                Join Room
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">CodeSync</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-primary" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-destructive" />
                  <span>Disconnected</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-muted-foreground">
              <span className="bg-secondary/80 py-1 px-3 rounded-lg">👤 {userName}</span>
            </span>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleRunCode} 
              disabled={isRunning}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? "Running..." : "Run Code"}
            </Button>

            <div className="flex gap-2 mb-2">
              <Button onClick={toggleTheme} variant="outline" size="icon" aria-label={editorTheme === "vs-dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                {editorTheme === "vs-dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>

            <Button variant="secondary" onClick={() => navigate("/")}>
              Leave Room
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative">
            <Editor
              theme={editorTheme}
              onMount={handleEditorMount}
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
              }}
            />
          </div>

          {/* Right Sidebar */}
          <Card className="w-80 border-l rounded-none flex flex-col">
            <Tabs defaultValue="users" className="flex-1 flex flex-col">
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="users" className="flex-1 gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1 gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="flex-1 flex flex-col m-0">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Active Users</h2>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {users.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 transition-colors hover:bg-secondary"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: user.color,
                          boxShadow: `0 0 8px ${user.color}`,
                        }}
                      />
                      <span className="text-sm font-medium truncate">
                        {user.name}
                        {user.id === currentUser.id && (
                          <span className="text-xs text-muted-foreground ml-2">(You)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    <p className="mb-1">Room ID:</p>
                    <p className="font-mono bg-secondary/50 p-2 rounded text-[10px] break-all">
                      {roomId}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="chat" className="flex-1 m-0">
                <ChatPanel
                  roomId={roomId || ""}
                  currentUserId={currentUser.id}
                  currentUserName={currentUser.name}
                  currentUserColor={currentUser.color}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="h-48">
          <OutputPanel output={output} isError={isError} isLoading={isRunning} />
        </div>
      </div>
    </div>
  );
}
