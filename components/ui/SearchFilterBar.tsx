"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input, Select } from "@/components/ui/Button";
import { cn } from "@/utils";

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  enabledFilter: string;
  onEnabledChange: (value: string) => void;
  className?: string;
}

export function SearchFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  enabledFilter,
  onEnabledChange,
  className,
}: SearchFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>
      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
              <option value="">All</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="unknown">Unknown</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Enabled</label>
            <Select value={enabledFilter} onChange={(e) => onEnabledChange(e.target.value)}>
              <option value="">All</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
