import { z } from "zod";

export const deviceCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  ip: z
    .string()
    .min(1, "IP or hostname is required")
    .max(253, "IP or hostname is too long")
    .refine(
      (val) => {
        const ipv4 =
          /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
        const hostname =
          /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/;
        return ipv4.test(val) || hostname.test(val);
      },
      { message: "Must be a valid IPv4 address or hostname" }
    ),
  email: z.string().email("Invalid email address"),
  enabled: z.boolean().default(true),
});

export const deviceUpdateSchema = deviceCreateSchema.partial();

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  status: z.enum(["online", "offline", "unknown"]).optional(),
  sort: z.enum(["timestamp", "latency"]).default("timestamp"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const deviceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["online", "offline", "unknown", "all"]).default("all"),
  enabled: z
    .enum(["true", "false", "all"])
    .default("all")
    .transform((v) => (v === "all" ? "all" : v === "true")),
  sortBy: z
    .enum(["name", "ip", "status", "lastPing", "lastSeen", "createdAt"])
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Aliases for compatibility with existing imports
export const deviceSchema = deviceCreateSchema;

export type DeviceCreateInput = z.infer<typeof deviceCreateSchema>;
export type DeviceUpdateInput = z.infer<typeof deviceUpdateSchema>;
export type DeviceInput = z.infer<typeof deviceSchema>;
