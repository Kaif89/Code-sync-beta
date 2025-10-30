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
import clsx from "clsx"; // add clsx for easy conditional class joining

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
    navigate(
      `/editor?room=${newRoomId}&name=${encodeURIComponent(userName.trim())}`
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
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] font-sans justify-center items-center overflow-x-hidden">
      <div
        className="w-full flex flex-col items-center justify-center flex-1 px-2 py-4"
        style={{ flex: 1, minHeight: "0" }}
      >
        <div className="max-w-4xl mx-auto text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-3">
            <Code2 className="h-12 w-12 text-[#fff]" />
            <h1 className="text-5xl font-black tracking-tight text-[#fff] ml-1">
              CodeSync
            </h1>
          </div>
          <p className="text-xl text-[#fff] font-medium mb-1">
            Real-Time Collaborative Code Editor
          </p>
          <p className="text-sm text-[#b1b1b9] max-w-2xl mx-auto">
            Write code together with your team instantly—simply share a room
            link, collaborate live, and build amazing projects.
          </p>
        </div>
        {/* Room Actions */}
        <Card className="max-w-md w-full border border-[#44455599] bg-[#15151a]/95 rounded-2xl mb-6 p-0 text-[#fff] shadow-none">
          <CardHeader className="pt-6 pb-3 px-6">
            <CardTitle className="text-xl font-bold tracking-tight text-[#fff] mb-1">
              Get Started
            </CardTitle>
            <CardDescription className="text-[#b1b1b9] text-sm">
              Create a new room or join an existing one
            </CardDescription>
          </CardHeader>
          <CardContent
            className={clsx(
              "space-y-4 pb-6 px-6 pt-0",
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
            <p className="text-xs text-[#b1b1b9] mb-1 text-center">
              You can invite friends with the room link after joining.
            </p>
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
        {/* Features */}
        <div className="grid md:grid-cols-3 gap-7 mb-0 max-w-4xl w-full">
          <Card className="bg-[#181824] border-none shadow-none rounded-2xl hover:ring-2 hover:ring-[#23232c] hover:scale-101">
            <CardHeader className="items-center p-5 pb-2">
              <Users className="h-9 w-9 text-[#fff] mb-2" />
              <CardTitle className="text-lg font-semibold text-[#fff] mb-0">
                Real-Time Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pt-0 pb-4">
              <p className="text-sm text-[#b1b1b9]">
                See changes instantly as your teammates type. No delays or
                refreshing.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#181824] border-none shadow-none rounded-2xl hover:ring-2 hover:ring-[#23232c] hover:scale-101">
            <CardHeader className="items-center p-5 pb-2">
              <Code2 className="h-9 w-9 text-[#fff] mb-2" />
              <CardTitle className="text-lg font-semibold text-[#fff] mb-0">
                Multi-Language
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pt-0 pb-4">
              <p className="text-sm text-[#b1b1b9]">
                Support for JavaScript, Python, Java, C++, Go, Rust, and C (with
                suggestions & execution!).
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#181824] border-none shadow-none rounded-2xl hover:ring-2 hover:ring-[#23232c] hover:scale-101">
            <CardHeader className="items-center p-5 pb-2">
              <Zap className="h-9 w-9 text-[#fff] mb-2" />
              <CardTitle className="text-lg font-semibold text-[#fff] mb-0">
                Instant Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pt-0 pb-4">
              <p className="text-sm text-[#b1b1b9]">
                No signup required. Create a room and start coding in seconds.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
