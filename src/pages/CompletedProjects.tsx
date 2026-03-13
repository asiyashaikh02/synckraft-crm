import React, { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Search } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { InstallationStage } from "../../types";

type ProjectRow = {
  id: string;
  companyName?: string;
  systemSize?: number;
  billingAmount?: number;
  finalAmount?: number;
  completionDate?: number;
  assignedTeam?: string;
  installationStage?: InstallationStage;
};

const money = (n?: number) => {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

export const CompletedProjects = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [q, setQ] = useState("");
  const [team, setTeam] = useState<string>("all");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "customers"), (s) => {
      const data = s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ProjectRow[];
      setRows(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const completed = useMemo(() => {
    const isCompleted = (p: ProjectRow) => (p.installationStage || "planning") === "completed" || !!p.completionDate;
    const base = rows.filter(isCompleted);

    const queryText = q.trim().toLowerCase();
    const filtered = base.filter((p) => {
      const nameOk = !queryText || (p.companyName || "").toLowerCase().includes(queryText) || p.id.toLowerCase().includes(queryText);
      const teamOk = team === "all" || (p.assignedTeam || "").toLowerCase() === team.toLowerCase();
      return nameOk && teamOk;
    });

    filtered.sort((a, b) => (b.completionDate || 0) - (a.completionDate || 0));
    return filtered;
  }, [rows, q, team]);

  const teams = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.assignedTeam) set.add(r.assignedTeam);
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Completed Projects</h1>
        <p className="text-slate-500 mt-1">Search and filter delivered installations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by client name or project id…"
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </div>
        </div>
        <div>
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          >
            {teams.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All teams" : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="py-3 px-4 font-semibold">Client Name</th>
                <th className="py-3 px-4 font-semibold">System Size</th>
                <th className="py-3 px-4 font-semibold">Final Amount</th>
                <th className="py-3 px-4 font-semibold">Completion Date</th>
                <th className="py-3 px-4 font-semibold">Installation Team</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4">
                    <div className="h-5 bg-slate-100 rounded animate-pulse w-full" />
                  </td>
                </tr>
              ) : completed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No completed projects match your filters.
                  </td>
                </tr>
              ) : (
                completed.map((p) => {
                  const amount = p.finalAmount ?? p.billingAmount;
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.companyName || p.id.slice(0, 6)}</td>
                      <td className="py-3 px-4 text-slate-700">{p.systemSize ?? "—"}</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">{money(amount)}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {p.completionDate ? new Date(p.completionDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{p.assignedTeam || "—"}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <BadgeCheck className="w-4 h-4" />
                          completed
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

