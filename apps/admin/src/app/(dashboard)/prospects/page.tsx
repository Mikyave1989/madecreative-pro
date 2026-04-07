"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  Zap,
  ExternalLink,
  ChevronDown,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
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
import { MOCK_PROSPECTS } from "@/lib/mockData";
import type { Prospect, ProspectStatus } from "@/lib/api";

// ─── Helpers ───────────────────────────────────────────────────

const STATUS_COLOR: Record<
  ProspectStatus,
  "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "pink" | "gray"
> = {
  SCRAPED: "gray",
  ANALYZING: "blue",
  QUALIFIED: "violet",
  CONTACTED: "amber",
  REPLIED: "cyan",
  CONVERTED: "green",
  REJECTED: "red",
};

function scoreColor(score: number): "red" | "amber" | "green" {
  if (score < 40) return "red";
  if (score < 60) return "amber";
  return "green";
}

const UNIQUE_COUNTRIES = [...new Set(MOCK_PROSPECTS.map((p) => p.country))].sort();
const UNIQUE_SECTORS = [...new Set(MOCK_PROSPECTS.map((p) => p.sector))].sort();
const ALL_STATUSES: ProspectStatus[] = [
  "SCRAPED",
  "ANALYZING",
  "QUALIFIED",
  "CONTACTED",
  "REPLIED",
  "CONVERTED",
  "REJECTED",
];

const PAGE_SIZE = 20;

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
    <Drawer open={open} onClose={onClose} title="Prospect Details" width="w-full max-w-lg">
      {prospect && (
        <div className="space-y-5">
          {/* Header */}
          <div>
            <h2 className="font-orbitron text-lg font-bold text-slate-100">
              {prospect.companyName}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge color={STATUS_COLOR[prospect.status]}>
                {prospect.status}
              </Badge>
              <Badge color={scoreColor(prospect.leadScore)}>
                Score {prospect.leadScore}
              </Badge>
              <span className="font-mono-tech text-[10px] text-slate-500">
                {prospect.country} — {prospect.sector}
              </span>
            </div>
          </div>

          {/* Website */}
          <div>
            <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1">
              Website
            </p>
            <a
              href={prospect.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono-tech text-xs text-neon-cyan hover:underline"
            >
              {prospect.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Pain Points */}
          {prospect.painPoints.length > 0 && (
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-2">
                Pain Points
              </p>
              <ul className="space-y-1">
                {prospect.painPoints.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-2 font-mono-tech text-xs text-slate-400"
                  >
                    <span className="h-1 w-1 rounded-full bg-neon-red" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Services */}
          {prospect.suggestedServices.length > 0 && (
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-2">
                Suggested Services
              </p>
              <div className="flex flex-wrap gap-2">
                {prospect.suggestedServices.map((s) => (
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
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-2">
                AI Analysis
              </p>
              <div className="rounded border border-neon-violet/20 bg-neon-violet/5 p-3">
                <p className="text-xs leading-relaxed text-slate-400">
                  {prospect.aiAnalysis}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
            <Button
              color="cyan"
              variant="outline"
              size="sm"
              leftIcon={<ExternalLink className="h-3 w-3" />}
              onClick={() => window.open(prospect.website, "_blank")}
            >
              Preview Site
            </Button>
            <Button
              color="violet"
              variant="outline"
              size="sm"
              leftIcon={<Zap className="h-3 w-3" />}
            >
              Analyze
            </Button>
            <Button
              color="green"
              variant="outline"
              size="sm"
            >
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
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState<ProspectStatus | "">("");
  const [sortBy, setSortBy] = useState<"score" | "createdAt" | "country">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = MOCK_PROSPECTS.filter((p) => {
      if (search && !p.companyName.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (country && p.country !== country) return false;
      if (sector && p.sector !== sector) return false;
      if (status && p.status !== status) return false;
      return true;
    });

    result.sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      if (sortBy === "score") { va = a.leadScore; vb = b.leadScore; }
      else if (sortBy === "country") { va = a.country; vb = b.country; }
      else { va = a.createdAt; vb = b.createdAt; }
      if (va < vb) return sortOrder === "asc" ? -1 : 1;
      if (va > vb) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [search, country, sector, status, sortBy, sortOrder]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allSelected =
    paginated.length > 0 && paginated.every((p) => selected.has(p.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        paginated.forEach((p) => next.delete(p.id));
      } else {
        paginated.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setCountry("");
    setSector("");
    setStatus("");
    setPage(1);
  };

  const hasFilters = search || country || sector || status;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-neon-violet"
            style={{ textShadow: "0 0 12px #a855f740" }}>
            Prospects
          </h1>
          <p className="mt-1 font-mono-tech text-xs text-slate-500">
            {filtered.length} prospects found
          </p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-xs text-neon-cyan">
              {selected.size} selected
            </span>
            <Button
              color="violet"
              variant="outline"
              size="sm"
              leftIcon={<Zap className="h-3 w-3" />}
            >
              Analyze Selected
            </Button>
            <Button
              color="green"
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3 w-3" />}
            >
              Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card neon="subtle" className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search company..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftIcon={<Search className="h-3.5 w-3.5" />}
              label="Search"
            />
          </div>
          <div className="w-32">
            <Select
              label="Country"
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
            >
              <option value="">All</option>
              {UNIQUE_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="w-40">
            <Select
              label="Sector"
              value={sector}
              onChange={(e) => { setSector(e.target.value); setPage(1); }}
            >
              <option value="">All</option>
              {UNIQUE_SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="w-36">
            <Select
              label="Status"
              value={status}
              onChange={(e) => { setStatus(e.target.value as ProspectStatus | ""); setPage(1); }}
            >
              <option value="">All</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="w-36">
            <Select
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "score" | "createdAt" | "country")}
            >
              <option value="score">Score</option>
              <option value="createdAt">Date</option>
              <option value="country">Country</option>
            </Select>
          </div>
          <Button
            color="cyan"
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`}
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

      {/* Table */}
      <Table>
        <Thead>
          <tr>
            <Th className="w-10">
              <button onClick={toggleAll} aria-label="Select all">
                {allSelected ? (
                  <CheckSquare className="h-4 w-4 text-neon-cyan" />
                ) : (
                  <Square className="h-4 w-4 text-slate-600" />
                )}
              </button>
            </Th>
            <Th>Company</Th>
            <Th>Country</Th>
            <Th>Sector</Th>
            <Th>Score</Th>
            <Th>Status</Th>
            <Th>Website</Th>
            <Th>Date</Th>
          </tr>
        </Thead>
        <Tbody>
          {paginated.length === 0 ? (
            <TableEmpty message="No prospects match the current filters" colSpan={8} />
          ) : (
            paginated.map((prospect) => (
              <Tr
                key={prospect.id}
                onClick={() => setActiveProspect(prospect)}
                selected={selected.has(prospect.id)}
              >
                <Td>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleOne(prospect.id); }}
                    aria-label={`Select ${prospect.companyName}`}
                  >
                    {selected.has(prospect.id) ? (
                      <CheckSquare className="h-4 w-4 text-neon-cyan" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-600" />
                    )}
                  </button>
                </Td>
                <Td>
                  <span className="font-medium text-slate-200">
                    {prospect.companyName}
                  </span>
                </Td>
                <Td>
                  <span className="font-mono-tech text-[11px]">
                    {prospect.country}
                  </span>
                </Td>
                <Td>
                  <span className="text-slate-400 text-xs">{prospect.sector}</span>
                </Td>
                <Td>
                  <Badge color={scoreColor(prospect.leadScore)} size="sm">
                    {prospect.leadScore}
                  </Badge>
                </Td>
                <Td>
                  <Badge color={STATUS_COLOR[prospect.status]} size="sm">
                    {prospect.status}
                  </Badge>
                </Td>
                <Td>
                  <a
                    href={prospect.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 font-mono-tech text-[10px] text-neon-cyan/60 hover:text-neon-cyan"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Site
                  </a>
                </Td>
                <Td>
                  <span className="font-mono-tech text-[10px] text-slate-600">
                    {new Date(prospect.createdAt).toLocaleDateString("it-IT")}
                  </span>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Prospect Detail Drawer */}
      <ProspectDrawer
        prospect={activeProspect}
        onClose={() => setActiveProspect(null)}
      />
    </PageWrapper>
  );
}
