import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Code2, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import clsx from "clsx";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Index = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState(
    () => localStorage.getItem("username") || ""
  );
  const [shakeJoin, setShakeJoin] = useState(false); // New state for shake animation

  useEffect(() => {
    localStorage.setItem("username", userName);
  }, [userName]);

  const createRoom = () => {
    if (!userName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    const newRoomId = crypto.randomUUID();
    setRoomId(newRoomId);
    navigate(
      `/editor?room=${newRoomId}&name=${encodeURIComponent(
        userName.trim()
      )}&admin=true`
    );
  };

  const joinRoom = () => {
    if (!userName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!uuidRegex.test(roomId.trim())) {
      toast.error("Please enter a valid Room ID.");
      return;
    }
    navigate(
      `/editor?room=${roomId.trim()}&name=${encodeURIComponent(
        userName.trim()
      )}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] font-sans relative">
      {/* Title Section - Absolute Position */}
      <div className="absolute top-4 left-6">
        <div className="inline-flex items-center gap-3">
          <Code2 className="h-12 w-11 text-primary" />
          <h1 className="text-4xl font-black tracking-tight text-[#fff] ml-1">
            CodeSync
          </h1>
        </div>
      </div>

      <div className="w-full flex flex-col items-center flex-1 px-6 mt-24">
        {/* Main Content Section */}
        <div className="relative w-full">
          {/* Description Section */}
          <div className="absolute left-12 top-12 w-[640px] max-h-[calc(100vh-120px)] rounded-3xl p-8 animate-fade-in bg-gradient-to-b from-[#15151a]/80 to-transparent backdrop-blur-sm border border-[#ffffff0f] overflow-hidden">
            <div className="relative">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mb-3 animate-slide-up">
                Code Sync
              </h2>
              <p className="text-3xl text-[#fff] font-semibold leading-tight mb-6 animate-slide-up delay-100">
                Where Teams Code Together in Perfect Harmony
              </p>
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-3xl animate-pulse-glow"></div>
            </div>

            <div className="space-y-6 relative">
              <div className="bg-[#ffffff06] rounded-xl p-4 border border-[#ffffff0f] animate-slide-up delay-150">
                <p className="text-sm leading-relaxed text-[#b1b1b9]">
                  Experience the future of collaborative coding. Share your
                  workspace instantly, code in real-time, and watch your
                  projects come to life together.
                </p>
              </div>

              <div className="space-y-4 animate-slide-up delay-200">
                <h3 className="text-[#fff] font-medium mb-2 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  Supported Languages
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-[#ffffff06] p-3 rounded-lg border border-[#ffffff0f]">
                    <span className="text-primary font-medium">
                      TypeScript & JavaScript
                    </span>
                    <p className="text-xs text-[#b1b1b9] mt-1">
                      Full ES6+ support
                    </p>
                  </div>
                  <div className="bg-[#ffffff06] p-3 rounded-lg border border-[#ffffff0f]">
                    <span className="text-primary font-medium">Python</span>
                    <p className="text-xs text-[#b1b1b9] mt-1">
                      Type hints & LSP
                    </p>
                  </div>
                  <div className="bg-[#ffffff06] p-3 rounded-lg border border-[#ffffff0f]">
                    <span className="text-primary font-medium">Java</span>
                    <p className="text-xs text-[#b1b1b9] mt-1">
                      Project support
                    </p>
                  </div>
                  <div className="bg-[#ffffff06] p-3 rounded-lg border border-[#ffffff0f]">
                    <span className="text-primary font-medium">C/C++</span>
                    <p className="text-xs text-[#b1b1b9] mt-1">IntelliSense</p>
                  </div>
                  <div className="bg-[#ffffff06] p-3 rounded-lg border border-[#ffffff0f]">
                    <span className="text-primary font-medium">Rust</span>
                    <p className="text-xs text-[#b1b1b9] mt-1">
                      Cargo integration
                    </p>
                  </div>
                  <div className="bg-[#ffffff06] p-3 rounded-lg border border-[#ffffff0f]">
                    <span className="text-primary font-medium">Go</span>
                    <p className="text-xs text-[#b1b1b9] mt-1">Gopls support</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 animate-slide-up delay-300">
                <h3 className="text-[#fff] font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  Key Features
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                    Live Collaboration
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                    Smart Completion
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                    Multi-cursor Support
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                    Code Execution
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Get Started Section */}
          <Card className="absolute right-32 top-36 w-[580px] bg-[#15151a]/95 rounded-2xl p-0 text-[#fff] shadow-none animate-fade-in hover:ring-2 hover:ring-primary/20 transition-all duration-300">
            <CardHeader className="pt-6 pb-3 px-6">
              <CardTitle className="text-xl font-bold tracking-tight text-[#fff] mb-1 animate-slide-up">
                Get Started
              </CardTitle>
              <CardDescription className="text-[#b1b1b9] text-sm animate-slide-up delay-100">
                Create a new room or join an existing one
              </CardDescription>
            </CardHeader>
            <CardContent
              className={clsx(
                "space-y-4 pb-6 px-6 pt-0 animate-slide-up delay-200",
                shakeJoin && "animate-shake"
              )}
            >
              <Input
                placeholder="Enter your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="rounded-lg bg-[#111216] border-[#23232c] text-[#fff] focus:border-white focus:ring-2 focus:ring-[#fff] text-base py-3"
              />
              <Button
                onClick={createRoom}
                className="w-full text-base font-bold py-4 rounded-xl bg-[#15151a] border border-[#23232c] text-[#fff] hover:bg-[#23242d] focus:ring-2 focus:ring-[#fff] transition-all"
                size="lg"
                disabled={!userName.trim()}
              >
                Create New Room
              </Button>
              <div className="relative space-y-3">
                <p className="text-xs text-[#b1b1b9] text-center">
                  {roomId
                    ? "Share this room link with your friends to collaborate:"
                    : "You can invite friends with the room link after joining."}
                </p>
                {roomId && (
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/editor?room=${roomId}`
                      );
                      toast.success("Room link copied to clipboard!");
                    }}
                    className="w-full py-3 rounded-xl bg-[#23242d] border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 animate-pulse-glow"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67157 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67157 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        />
                      </svg>
                      Click to Copy Room Link
                    </div>
                  </Button>
                )}
              </div>
              {/* Custom "Or" separator */}
              <div className="flex items-center gap-2 mb-1 select-none">
                <div className="flex-1 h-px bg-[#23232c]" />
                <span className="py-1 px-4 font-bold uppercase tracking-tight bg-[#19191e] text-[#b1b1b9] border border-[#23232c] rounded-full text-xs shadow-none">
                  Or
                </span>
                <div className="flex-1 h-px bg-[#23232c]" />
              </div>
              <div className="space-y-2 mt-2">
                <Input
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                  className="rounded-lg bg-[#111216] border-[#23232c] text-[#fff] focus:border-white focus:ring-2 focus:ring-[#fff] text-base py-3"
                />
                <Button
                  onClick={joinRoom}
                  variant="secondary"
                  className="w-full rounded-xl font-bold text-base bg-[#15151a] border border-[#23232c] text-[#fff] hover:bg-[#23242d] focus:ring-2 focus:ring-white focus:outline-none transition-all shadow-none"
                  disabled={!userName.trim()}
                >
                  Join Room
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
