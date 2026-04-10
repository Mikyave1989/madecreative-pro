"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, RefreshCw, ExternalLink, X, Building2, Mail, MapPin, Calendar, CreditCard } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Drawer } from "@/components/ui/Modal";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableEmpty,
  Pagination,
} from "@/components/ui/Table";
import { Spinner } from "@/components/ui/Spinner";
import { getClients } from "@/lib/api";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";
import type { Client } from "@/lib/api";

// ─── Constants ─────────────────────────────────────────────────

const STATUS_COLOR: Record<string, "green" | "red" | "amber" | "gray"> = {
  ACTIVE:    "green",
  CHURNED:   "red",
  REFUNDED:  "amber",
};

const PLAN_COLOR: Record<string, "cyan" | "violet" | "amber" | "gray"> = {
  STARTER:      "cyan",
  PROFESSIONAL: "violet",
  ENTERPRISE:   "amber",
};

const PAGE_SIZE = 20;

// ─── Skeleton Row ──────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border-subtle/50">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-bg-elevated animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Client Detail Drawer ──────────────────────────────────────

function ClientDrawer({
  client,
  onClose,
}: {
  client: Client | null;
  onClose: () => void;
}) {
  const open = !!client;

  return (
    <Drawer open={open} onClose={onClose} title="Client Details" width="w-full max-w-lg">
      {client && (
        <div className="space-y-5">
          {/* Header */}
          <div>
            <h2 className="font-orbitron text-lg font-bold text-slate-100">
              {client.companyName}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge color={STATUS_COLOR[client.status] ?? "gray"}>
                {client.status}
              </Badge>
              <Badge color={PLAN_COLOR[client.plan] ?? "gray"}>
                {client.plan}
              </Badge>
              <span className="font-mono-tech text-[10px] text-slate-500">
                {client.country}{client.city ? ` — ${client.city}` : ""}
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1 flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </p>
              <a
                href={`mailto:${client.email}`}
                className="font-mono-tech text-xs text-neon-cyan hover:underline break-all"
              >
                {client.email}
              </a>
            </div>
            {client.contactName && (
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1">
                  Contact
                </p>
                <p className="font-mono-tech text-xs text-slate-300">{client.contactName}</p>
              </div>
            )}
          </div>

          {/* Location + Sector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Location
              </p>
              <p className="font-mono-tech text-xs text-slate-300">
                {[client.city, client.country].filter(Boolean).join(", ")}
              </p>
            </div>
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1">
                Sector
              </p>
              <p className="font-mono-tech text-xs text-slate-300">{client.sector}</p>
            </div>
          </div>

          {/* Website */}
          {client.websiteUrl && (
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1">
                Website
              </p>
              <a
                href={client.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono-tech text-xs text-neon-cyan hover:underline"
              >
                {client.websiteUrl}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}

          {/* Billing */}
          <div>
            <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-2 flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Billing
            </p>
            <div className="rounded border border-border-subtle bg-bg-elevated/50 p-3 space-y-2">
              {client.stripeCustomerId && (
                <div className="flex justify-between">
                  <span className="font-mono-tech text-[10px] text-slate-600">Customer ID</span>
                  <span className="font-mono-tech text-[10px] text-slate-400">{client.stripeCustomerId}</span>
                </div>
              )}
              {client.stripeSubId && (
                <div className="flex justify-between">
                  <span className="font-mono-tech text-[10px] text-slate-600">Subscription ID</span>
                  <span className="font-mono-tech text-[10px] text-slate-400">{client.stripeSubId}</span>
                </div>
              )}
              {!client.stripeCustomerId && !client.stripeSubId && (
                <p className="font-mono-tech text-[10px] text-slate-700">No Stripe data</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Created
              </p>
              <p className="font-mono-tech text-xs text-slate-400">
                {new Date(client.createdAt).toLocaleDateString("it-IT")}
              </p>
              <p className="font-mono-tech text-[10px] text-slate-600">
                {timeAgo(client.createdAt)}
              </p>
            </div>
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1">
                Language
              </p>
              <p className="font-mono-tech text-xs text-slate-400 uppercase">{client.language}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
            {client.websiteUrl && (
              <Button
                color="cyan"
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="h-3 w-3" />}
                onClick={() => window.open(client.websiteUrl!, "_blank")}
              >
                Visit Site
              </Button>
            )}
            {client.stripeCustomerId && (
              <Button
                color="green"
                variant="outline"
                size="sm"
                leftIcon={<CreditCard className="h-3 w-3" />}
                onClick={() =>
                  window.open(
                    `https://dashboard.stripe.com/customers/${client.stripeCustomerId}`,
                    "_blank"
                  )
                }
              >
                Stripe
              </Button>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeClient, setActiveClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getClients({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setClients(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(fetchClients, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchClients, search]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const hasFilters = search || statusFilter;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            className="font-orbitron text-lg sm:text-xl md:text-2xl font-bold text-neon-green"
            style={{ textShadow: "0 0 12px #10b98140" }}
          >
            Clients
          </h1>
          <p className="mt-1 font-mono-tech text-xs text-slate-500">
            {loading ? "Loading..." : `${total} clients total`}
          </p>
        </div>
        <Button
          color="cyan"
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />}
          onClick={() => fetchClients()}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card neon="subtle" className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search company or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-3.5 w-3.5" />}
              label="Search"
            />
          </div>
          <div className="w-40">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="CHURNED">Churned</option>
              <option value="REFUNDED">Refunded</option>
            </Select>
          </div>
          {hasFilters && (
            <Button
              color="red"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              leftIcon={<X className="h-3 w-3" />}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded border border-neon-red/30 bg-neon-red/5 px-4 py-3 flex items-center justify-between">
          <p className="font-mono-tech text-xs text-neon-red">{error}</p>
          <Button color="red" variant="ghost" size="sm" onClick={() => fetchClients()}>
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <Table>
        <Thead>
          <tr>
            <Th>Company</Th>
            <Th className="hidden md:table-cell">Email</Th>
            <Th>Plan</Th>
            <Th>Status</Th>
            <Th className="hidden md:table-cell">Country</Th>
            <Th className="hidden md:table-cell">Created</Th>
          </tr>
        </Thead>
        <Tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : clients.length === 0 ? (
            <TableEmpty message="No clients match the current filters" colSpan={6} />
          ) : (
            clients.map((client, i) => (
              <motion.tr
                key={client.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.25 }}
                onClick={() => setActiveClient(client)}
                className="cursor-pointer border-b border-border-subtle/50 transition-colors duration-150 hover:bg-neon-green/5"
              >
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-neon-green/20 bg-neon-green/5">
                      <Building2 className="h-3.5 w-3.5 text-neon-green/60" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200 text-sm">
                        {client.companyName}
                      </p>
                      {client.contactName && (
                        <p className="font-mono-tech text-[10px] text-slate-600">
                          {client.contactName}
                        </p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td className="hidden md:table-cell">
                  <span className="font-mono-tech text-xs text-slate-400">
                    {client.email}
                  </span>
                </Td>
                <Td>
                  <Badge color={PLAN_COLOR[client.plan] ?? "gray"} size="sm">
                    {client.plan}
                  </Badge>
                </Td>
                <Td>
                  <Badge color={STATUS_COLOR[client.status] ?? "gray"} size="sm">
                    {client.status}
                  </Badge>
                </Td>
                <Td className="hidden md:table-cell">
                  <span className="font-mono-tech text-[11px] text-slate-400">
                    {client.country}
                    {client.city && (
                      <span className="text-slate-600"> / {client.city}</span>
                    )}
                  </span>
                </Td>
                <Td className="hidden md:table-cell">
                  <span className="font-mono-tech text-[10px] text-slate-600">
                    {new Date(client.createdAt).toLocaleDateString("it-IT")}
                  </span>
                </Td>
              </motion.tr>
            ))
          )}
        </Tbody>
      </Table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Client Detail Drawer */}
      <ClientDrawer client={activeClient} onClose={() => setActiveClient(null)} />
    </PageWrapper>
  );
}
