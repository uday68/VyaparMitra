import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  messages: Message[];
}

export function useConversation(id: number) {
  return useQuery<Conversation>({
    queryKey: ["/api/conversations", id],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
    enabled: !isNaN(id),
    refetchInterval: 1000, // Poll for updates since we're not using full websocket for everything yet
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const res = await fetch(`/api/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      // This endpoint streams response, handling that is complex in standard fetch
      // For text chat we just fire and forget, polling will catch the update
      // For voice chat we use useVoiceStream hook
      if (!res.ok) throw new Error("Failed to send message");
      return res;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", id] });
    },
  });
}
