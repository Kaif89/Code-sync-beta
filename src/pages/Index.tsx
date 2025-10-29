import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Users, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  const createRoom = () => {
    const newRoomId = crypto.randomUUID();
    navigate(`/editor?room=${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/editor?room=${roomId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <Code2 className="h-12 w-12 text-primary" style={{ filter: "drop-shadow(0 0 12px hsl(var(--primary)))" }} />
            <h1 className="text-5xl font-bold tracking-tight">
              Code<span className="text-primary">Sync</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-2">
            Real-Time Collaborative Code Editor
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Write code together with your team in real-time. Share a room, collaborate instantly, and build amazing things together.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl w-full">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Real-Time Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                See changes instantly as your teammates type. No delays, no refreshing.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader>
              <Code2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Multi-Language</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Support for JavaScript, Python, Java, C++, and many more languages.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Instant Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No signup required. Create a room and start coding in seconds.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Room Actions */}
        <Card className="max-w-md w-full bg-card border-border">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Create a new room or join an existing one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={createRoom} 
              className="w-full"
              size="lg"
            >
              Create New Room
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              />
              <Button 
                onClick={joinRoom} 
                variant="secondary" 
                className="w-full"
                disabled={!roomId.trim()}
              >
                Join Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>Built with React, Monaco Editor, and Lovable Cloud</p>
      </footer>
    </div>
  );
};

export default Index;
