import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface ChatMessage {
  id: string;
  user_name: string;
  user_color: string;
  message: string;
  created_at: string;
}

interface ChatPanelProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserColor: string;
  isAdmin?: boolean;
}

export default function ChatPanel({ 
  roomId, 
  currentUserId, 
  currentUserName, 
  currentUserColor,
  isAdmin = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load existing messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);
      
      if (data) {
        setMessages(data);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((current) => {
            // Remove any optimistic message that matches (same user, message, close timestamp)
            const dbMsg = payload.new as ChatMessage;
            return [
              ...current.filter(
                (msg) =>
                  !msg._optimistic ||
                  !(
                    msg.user_name === dbMsg.user_name &&
                    msg.message === dbMsg.message &&
                    Math.abs(new Date(msg.created_at).getTime() - new Date(dbMsg.created_at).getTime()) < 2000 // 2s window
                  )
              ),
              dbMsg,
            ].filter((msg, i, arr) => arr.findIndex(m2 => m2.id === msg.id) === i) // no exact duplicate ids
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    // Optimistic local update
    const now = new Date();
    const isoNow = now.toISOString();
    const optimisticMsg = {
      id: `optimistic-${now.getTime()}-${Math.random()}`,
      user_name: currentUserName,
      user_color: currentUserColor,
      message: newMessage.trim(),
      created_at: isoNow,
      _optimistic: true,
    } as any;
    setMessages((current) => [...current, optimisticMsg]);

    await supabase.from("chat_messages").insert({
      room_id: roomId,
      user_id: currentUserId,
      user_name: currentUserName,
      user_color: currentUserColor,
      message: newMessage.trim(),
    });

    setNewMessage("");
  };

  const deleteMessage = async (id: string) => {
    if (!isAdmin) return;
    await supabase.from("chat_messages").delete().eq("id", id);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-2 group">
              <div
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{
                  backgroundColor: msg.user_color,
                  boxShadow: `0 0 6px ${msg.user_color}`,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {msg.user_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => deleteMessage(msg.id)}
                      className="ml-auto text-xs text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity underline"
                      title="Delete message"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/90 break-words">
                  {msg.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
