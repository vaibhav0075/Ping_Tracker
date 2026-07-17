"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deviceSchema, type DeviceInput } from "@/lib/validations";
import { Button, Input, Label, Checkbox } from "@/components/ui/Button";
import type { Device } from "@/types";

interface DeviceFormProps {
  device?: Device;
  onSubmit: (data: DeviceInput) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function DeviceForm({
  device,
  onSubmit,
  onCancel,
  loading,
}: DeviceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeviceInput>({
    // @ts-ignore: Type mismatch between zod schema and react-hook-form resolver options
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: device?.name ?? "",
      ip: device?.ip ?? "",
      email: device?.email ?? "",
      enabled: device?.enabled ?? true,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit as any)}
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Device Name</Label>
        <Input id="name" placeholder="Production Server" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ip">IP Address / Hostname</Label>
        <Input id="ip" placeholder="192.168.1.1 or google.com" {...register("ip")} />
        {errors.ip && (
          <p className="text-xs text-red-400">{errors.ip.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Alert Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="enabled" {...register("enabled")} />
        <Label htmlFor="enabled">Enable monitoring</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || isSubmitting}>
          {isSubmitting ? "Saving..." : device ? "Update Device" : "Add Device"}
        </Button>
      </div>
    </form>
  );
}
