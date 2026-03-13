import React, { useEffect, useMemo, useState } from "react";
import { HardHat, Save } from "lucide-react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { ActivityType, type InstallationStage } from "../../types";
import { logActivity } from "../../services/activityService";

type ProjectRow = {
  id: string;
  companyName?: string;
  clientName?: string;
  systemSize?: number;
  installationStage?: InstallationStage;
  assignedTeam?: string;
  completionPercentage?: number;
};

export const Installations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "customers"), (s) => {
      const data = s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ProjectRow[];
      setRows(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const tableRows = useMemo(() => {
    return [...rows].sort((a, b) => (a.companyName || "").localeCompare(b.companyName || ""));
  }, [rows]);

  const updateProject = async (id: string, patch: Partial<ProjectRow>, activityDesc?: string) => {
    if (!user) return;
    setSavingId(id);
    try {
      await updateDoc(doc(db, "customers", id), { ...patch, updatedAt: Date.now() } as any);
      if (activityDesc) {
        await logActivity(user.uid, ActivityType.INSTALLATION_STAGE_CHANGED, activityDesc, { customerId: id });
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Installations</h1>
        <p className="text-slate-500 mt-1">Track installation stages and completion progress.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="py-3 px-4 font-semibold">Project Name</th>
                <th className="py-3 px-4 font-semibold">Client Name</th>
                <th className="py-3 px-4 font-semibold">System Size</th>
                <th className="py-3 px-4 font-semibold">Installation Stage</th>
                <th className="py-3 px-4 font-semibold">Assigned Team</th>
                <th className="py-3 px-4 font-semibold">Completion %</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4">
                    <div className="h-5 bg-slate-100 rounded animate-pulse w-full" />
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No projects found.
                  </td>
                </tr>
              ) : (
                tableRows.map((p) => {
                  const name = p.companyName || p.clientName || p.id.slice(0, 6);
                  const stage = (p.installationStage || "planning") as InstallationStage;
                  const busy = savingId === p.id;
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{name}</td>
                      <td className="py-3 px-4 text-slate-700">{p.clientName || p.companyName || "—"}</td>
                      <td className="py-3 px-4 text-slate-700">{p.systemSize ?? "—"}</td>
                      <td className="py-3 px-4">
                        <select
                          value={stage}
                          onChange={(e) =>
                            updateProject(p.id, { installationStage: e.target.value as InstallationStage }, `Installation stage set to ${e.target.value}`)
                          }
                          disabled={busy}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                        >
                          <option value="planning">planning</option>
                          <option value="material_dispatch">material_dispatch</option>
                          <option value="installation">installation</option>
                          <option value="testing">testing</option>
                          <option value="completed">completed</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          value={p.assignedTeam || ""}
                          onChange={(e) => updateProject(p.id, { assignedTeam: e.target.value })}
                          placeholder="Team name…"
                          disabled={busy}
                          className="w-44 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={p.completionPercentage ?? 0}
                          onChange={(e) => updateProject(p.id, { completionPercentage: Math.max(0, Math.min(100, Number(e.target.value))) })}
                          disabled={busy}
                          className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                          <HardHat className="w-4 h-4" />
                          {busy ? "Saving…" : "Live"}
                        </span>
                        {busy ? <Save className="w-4 h-4 text-indigo-600 inline-block ml-2" /> : null}
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

