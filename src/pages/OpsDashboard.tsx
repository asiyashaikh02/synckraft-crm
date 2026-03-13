import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, FileSignature, HardHat, BadgeCheck, BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { InstallationStage, OpsProposalStatus, OpsVisitStatus } from "../../types";

type LeadRow = {
  id: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  city?: string;
  address?: string;
  salesUserId?: string;
  visitDate?: number;
  visitStatus?: OpsVisitStatus;
};

type ProposalRow = {
  id: string; // doc id (usually lead id)
  leadId?: string;
  panelCount?: number;
  panelSizeKw?: number;
  roofArea?: number;
  proposalAmount?: number;
  finalAmount?: number;
  status?: OpsProposalStatus;
};

type ProjectRow = {
  id: string;
  leadId?: string;
  companyName?: string;
  billingAmount?: number;
  installationStage?: InstallationStage;
  completionPercentage?: number;
  completionDate?: number;
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-slate-100 ${className || ""}`} />
);

const monthKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const OpsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);

  useEffect(() => {
    const unsubLeads = onSnapshot(collection(db, "leads"), (s) => {
      const rows = s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as LeadRow[];
      setLeads(rows);
    });

    const unsubProposals = onSnapshot(collection(db, "Phase2_details"), (s) => {
      const rows = s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ProposalRow[];
      setProposals(rows);
    });

    const unsubProjects = onSnapshot(collection(db, "customers"), (s) => {
      const rows = s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ProjectRow[];
      setProjects(rows);
      setLoading(false);
    });

    return () => {
      unsubLeads();
      unsubProposals();
      unsubProjects();
    };
  }, []);

  const scheduledSiteVisits = leads.filter((l) => l.visitStatus === "scheduled").length;
  const pendingProposals = proposals.filter((p) => (p.status || "draft") === "draft" || p.status === "sent").length;
  const activeInstallations = projects.filter((p) => (p.installationStage || "planning") !== "completed").length;
  const completedProjects = projects.filter((p) => (p.installationStage || "planning") === "completed" || !!p.completionDate).length;

  const monthlyInstallations = useMemo(() => {
    const completed = projects
      .filter((p) => p.completionDate || (p.installationStage || "planning") === "completed")
      .map((p) => p.completionDate || Date.now());

    const counts: Record<string, number> = {};
    for (const ts of completed) {
      const key = monthKey(ts);
      counts[key] = (counts[key] || 0) + 1;
    }

    const sorted = Object.keys(counts)
      .sort()
      .slice(-8)
      .map((k) => ({ month: k, installations: counts[k] }));
    return sorted;
  }, [projects]);

  const completionRateData = useMemo(() => {
    const total = projects.length || 1;
    const done = completedProjects;
    const rate = Math.round((done / total) * 100);
    return [{ name: "Completion Rate", rate }];
  }, [projects.length, completedProjects]);

  const stageDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of projects) {
      const st = (p.installationStage || "planning") as InstallationStage;
      counts[st] = (counts[st] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const COLORS = ["#6366f1", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
        <p className="text-slate-500 mt-2">Track execution from site visit to installation completion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Scheduled Site Visits
                </h3>
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{scheduledSiteVisits}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending Proposals</h3>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{pendingProposals}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Installations</h3>
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <HardHat className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{activeInstallations}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Completed Projects</h3>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{completedProjects}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
            Monthly Installations
          </h2>
          <div className="h-80 w-full">
            {loading ? (
              <Skeleton className="h-80" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyInstallations} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="installations" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Projects Completion Rate</h2>
          <div className="h-80 w-full flex items-center">
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionRateData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="rate" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={72} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Installation Status Distribution</h2>
          <div className="h-80 w-full flex items-center justify-center">
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : stageDistribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stageDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={4}>
                    {stageDistribution.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-slate-400">No installation data yet.</div>
            )}
          </div>
          {!loading && stageDistribution.length ? (
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {stageDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-sm font-medium text-slate-600">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

