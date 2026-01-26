import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type UpdateStatusInput = z.infer<typeof api.negotiations.updateStatus.input>;
type CreateNegotiationInput = z.infer<typeof api.negotiations.create.input>;

export function useNegotiations() {
  return useQuery({
    queryKey: [api.negotiations.list.path],
    queryFn: async () => {
      const res = await fetch(api.negotiations.list.path);
      if (!res.ok) throw new Error("Failed to fetch negotiations");
      return api.negotiations.list.responses[200].parse(await res.json());
    },
  });
}

export function useNegotiation(id: number) {
  return useQuery({
    queryKey: [api.negotiations.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.negotiations.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch negotiation");
      return api.negotiations.get.responses[200].parse(await res.json());
    },
    enabled: !isNaN(id),
  });
}

export function useCreateNegotiation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateNegotiationInput) => {
      const res = await fetch(api.negotiations.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create negotiation");
      return api.negotiations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.negotiations.list.path] });
    },
  });
}

export function useUpdateNegotiationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateStatusInput & { id: number }) => {
      const url = buildUrl(api.negotiations.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.negotiations.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.negotiations.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.negotiations.get.path, id] });
    },
  });
}
