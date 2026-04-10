"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  ExternalLink,
  ChevronDown,
  X,
  Zap,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Drawer } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
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
import {
  getProspects,
  type Prospect,
  type ProspectStatus,
  type PaginatedResponse,
} from "@/lib/api";
import { timeAgo } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────────

const PAGE_SIZE = 20;

const ALL_STATUSES: ProspectStatus[] = [
  "SCRAPED",
  "QUALIFIED",
  "PREVIEW_READY",
  "CONTACTED",
  "FOLLOWED_UP",
  "REPLIED",
  "CONVERTED",
  "LOST",
  "BLACKLISTED",
];

const STATUS_LABEL: Record<ProspectStatus, string> = {
  SCRAPED: "Scraped",
  QUALIFIED: "Qualified",
  PREVIEW_READY: "Preview Ready",
  CONTACTED: "Contacted",
  FOLLOWED_UP: "Followed Up",
  REPLIED: "Replied",
  CONVERTED: "Converted",
  LOST: "Lost",
  BLACKLISTED: "Blacklisted",
};

const STATUS_COLOR: Record<
  ProspectStatus,
  "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "gray"
> = {
  SCRAPED: "gray",
  QUALIFIED: "violet",
  PREVIEW_READY: "cyan",
  CONTACTED: "amber",
  FOLLOWED_UP: "blue",
  REPLIED: "green",
  CONVERTED: "green",
  LOST: "red",
  BLACKLISTED: "red",
};

// ─── Helpers ───────────────────────────────────────────────────

function scoreColor(score: number): "red" | "amber" | "green" {
  if (score <= 40) return "red";
  if (score <= 70) return "amber";
  return "green";
}

// ─── Skeleton ──────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border-subtle/50">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 animate-pulse rounded bg-slate-800"
                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Prospect Detail Drawer ────────────────────────────────────

function ProspectDrawer({
  prospect,
  onClose,
}: {
  prospect: Prospect | null;
  onClose: () => void;
}) {
  const open = !!prospect;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Prospect Details"
      width="w-full max-w-lg"
    >
      {prospect && (
        <div className="space-y-5">
          {/* Header */}
          <div>
            <h2 className="font-orbitron text-lg font-bold text-slate-100">
              {prospect.companyName}
            </h2>
            {(prospect.contactName || prospect.city) && (
              <p className="mt-0.5 font-mono-tech text-[11px] text-slate-500">
                {[prospect.contactName, prospect.city]
                  .filter(Boolean)
                  .join(" — ")}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge color={STATUS_COLOR[prospect.status]}>
                {STATUS_LABEL[prospect.status]}
              </Badge>
              <Badge color={scoreColor(prospect.leadScore)}>
                Score {prospect.leadScore}
              </Badge>
              <span className="font-mono-tech text-[10px] text-slate-500">
                {prospect.country}
                {prospect.sector ? ` — ${prospect.sector}` : ""}
              </span>
            </div>
          </div>

          {/* Contact */}
          {(prospect.contactName || prospect.contactEmail) && (
            <div>
              <p className="mb-1 font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
                Contact
              </p>
              <div className="space-y-0.5">
                {prospect.contactName && (
                  <p className="font-mono-tech text-xs text-slate-300">
                    {prospect.contactName}
                  </p>
                )}
                {prospect.contactEmail && (
                  <a
                    href={`mailto:${prospect.contactEmail}`}
                    className="font-mono-tech text-xs text-neon-cyan hover:underline"
                  >
                    {prospect.contactEmail}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Website */}
          {prospect.website && (
            <div>
              <p className="mb-1 font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
                Website
              </p>
              <a
                href={prospect.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono-tech text-xs text-neon-cyan hover:underline"
              >
                {prospect.website}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}

          {/* Pain Points */}
          {Array.isArray(prospect.painPoints) &&
            prospect.painPoints.length > 0 && (
              <div>
                <p className="mb-2 font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
                  Pain Points
                </p>
                <ul className="space-y-1">
                  {(prospect.painPoints as string[]).map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 font-mono-tech text-xs text-slate-400"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon-red" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Suggested Services */}
          {Array.isArray(prospect.suggestedServices) &&
            prospect.suggestedServices.length > 0 && (
              <div>
                <p className="mb-2 font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
                  Suggested Services
                </p>
                <div className="flex flex-wrap gap-2">
                  {(prospect.suggestedServices as string[]).map((s) => (
                    <Badge key={s} color="violet" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* AI Analysis */}
          {prospect.aiAnalysis && (
            <div>
              <p className="mb-2 font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
                AI Analysis
              </p>
              <div className="rounded border border-neon-violet/20 bg-neon-violet/5 p-3">
                <p className="text-xs leading-relaxed text-slate-400">
                  {prospect.aiAnalysis}
                </p>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="rounded border border-border-subtle bg-bg-elevated/50 p-3">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <dt className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
                Created
              </dt>
              <dd className="font-mono-tech text-[10px] text-slate-400">
                {timeAgo(prospect.createdAt)}
              </dd>
              <dt className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
                Updated
              </dt>
              <dd className="font-mono-tech text-[10px] text-slate-400">
                {timeAgo(prospect.updatedAt)}
              </dd>
              <dt className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
                ID
              </dt>
              <dd className="font-mono-tech text-[10px] text-slate-500 truncate">
                {prospect.id}
              </dd>
            </dl>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
            {prospect.website && (
              <Button
                color="cyan"
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="h-3 w-3" />}
                onClick={() => window.open(prospect.website!, "_blank")}
              >
                Preview Site
              </Button>
            )}
            <Button
              color="violet"
              variant="outline"
              size="sm"
              leftIcon={<Zap className="h-3 w-3" />}
            >
              Analyze
            </Button>
            <Button color="green" variant="outline" size="sm">
              Contact
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function ProspectsPage() {
  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState<ProspectStatus | "">("");
  const [sortBy, setSortBy] = useState<"leadScore" | "createdAt" | "country">(
    "leadScore"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // Data state
  const [result, setResult] = useState<PaginatedResponse<Prospect> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer state
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);

  // Debounce search input 300 ms
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 300);
    },
    []
  );

  // Fetch whenever filters or page changes
  const fetchProspects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProspects({
        search: debouncedSearch || undefined,
        country: country || undefined,
        sector: sector || undefined,
        status: status || undefined,
        sortBy,
        sortOrder,
        page,
        limit: PAGE_SIZE,
      });
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load prospects"
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, country, sector, status, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  // Reset to page 1 when any filter changes
  const handleCountryChange = (v: string) => {
    setCountry(v);
    setPage(1);
  };
  const handleSectorChange = (v: string) => {
    setSector(v);
    setPage(1);
  };
  const handleStatusChange = (v: string) => {
    setStatus(v as ProspectStatus | "");
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setCountry("");
    setSector("");
    setStatus("");
    setPage(1);
  };

  const hasFilters = searchInput || country || sector || status;

  const prospects = result?.data ?? [];
  const totalPages = result?.totalPages ?? 0;
  const total = result?.total ?? 0;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            className="font-orbitron text-lg sm:text-xl md:text-2xl font-bold text-neon-violet"
            style={{ textShadow: "0 0 12px #a855f740" }}
          >
            Prospects
          </h1>
          <p className="mt-1 font-mono-tech text-xs text-slate-500">
            {loading && !result
              ? "Loading..."
              : `${total.toLocaleString()} prospects found`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card neon="subtle" className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <Input
              placeholder="Search company..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              leftIcon={<Search className="h-3.5 w-3.5" />}
              label="Search"
            />
          </div>
          <div className="w-full sm:w-32">
            <Select
              label="Country"
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              <option value="">All Countries</option>
              {/* Countries are populated dynamically from the live dataset */}
              {country && <option value={country}>{country}</option>}
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <Select
              label="Sector"
              value={sector}
              onChange={(e) => handleSectorChange(e.target.value)}
            >
              <option value="">All Sectors</option>
              {sector && <option value={sector}>{sector}</option>}
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <Select
              label="Status"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-36">
            <Select
              label="Sort By"
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "leadScore" | "createdAt" | "country"
                )
              }
            >
              <option value="leadScore">Score</option>
              <option value="createdAt">Date</option>
              <option value="country">Country</option>
            </Select>
          </div>
          <Button
            color="cyan"
            variant="ghost"
            size="sm"
            onClick={() =>
              setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
            }
            aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                sortOrder === "asc" ? "rotate-180" : ""
              }`}
            />
            {sortOrder === "desc" ? "Desc" : "Asc"}
          </Button>
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

      {/* Error State */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-neon-red/30 bg-neon-red/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-neon-red" />
            <p className="font-mono-tech text-xs text-neon-red">{error}</p>
          </div>
          <Button
            color="red"
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="h-3 w-3" />}
            onClick={fetchProspects}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <Table>
        <Thead>
          <tr>
            <Th>Company</Th>
            <Th className="hidden sm:table-cell">Contact</Th>
            <Th className="hidden md:table-cell">Country</Th>
            <Th>Sector</Th>
            <Th>Score</Th>
            <Th>Status</Th>
            <Th className="hidden lg:table-cell">Created</Th>
          </tr>
        </Thead>
        <Tbody>
          {loading ? (
            <TableSkeleton />
          ) : error && prospects.length === 0 ? null : prospects.length ===
            0 ? (
            <TableEmpty
              message="No prospects match the current filters"
              colSpan={7}
            />
          ) : (
            prospects.map((prospect) => (
              <Tr
                key={prospect.id}
                onClick={() => setActiveProspect(prospect)}
              >
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">
                      {prospect.companyName}
                    </span>
                    {prospect.website && (
                      <a
                        href={prospect.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-neon-cyan/40 hover:text-neon-cyan transition-colors"
                        aria-label={`Visit ${prospect.companyName} website`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </Td>
                <Td className="hidden sm:table-cell">
                  {prospect.contactName ? (
                    <div>
                      <p className="text-xs text-slate-300">
                        {prospect.contactName}
                      </p>
                      {prospect.contactEmail && (
                        <p className="font-mono-tech text-[10px] text-slate-600 truncate max-w-[160px]">
                          {prospect.contactEmail}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="font-mono-tech text-[10px] text-slate-700">
                      —
                    </span>
                  )}
                </Td>
                <Td className="hidden md:table-cell">
                  <span className="font-mono-tech text-[11px] text-slate-400">
                    {prospect.country}
                    {prospect.city ? (
                      <span className="text-slate-600"> / {prospect.city}</span>
                    ) : null}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs text-slate-400">
                    {prospect.sector}
                  </span>
                </Td>
                <Td>
                  <Badge color={scoreColor(prospect.leadScore)} size="sm">
                    {prospect.leadScore}
                  </Badge>
                </Td>
                <Td>
                  <Badge color={STATUS_COLOR[prospect.status]} size="sm">
                    {STATUS_LABEL[prospect.status]}
                  </Badge>
                </Td>
                <Td className="hidden lg:table-cell">
                  <span
                    className="font-mono-tech text-[10px] text-slate-600"
                    title={new Date(prospect.createdAt).toLocaleString("it-IT")}
                  >
                    {timeAgo(prospect.createdAt)}
                  </span>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {/* Pagination — shown even while loading so layout doesn't jump */}
      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Loading indicator for subsequent fetches (page/filter changes) */}
      {loading && result !== null && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Spinner size="sm" />
          <span className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
            Updating...
          </span>
        </div>
      )}

      {/* Prospect Detail Drawer */}
      <ProspectDrawer
        prospect={activeProspect}
        onClose={() => setActiveProspect(null)}
      />
    </PageWrapper>
  );
}
