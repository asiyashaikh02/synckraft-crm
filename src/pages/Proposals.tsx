import React, { useEffect, useMemo, useState } from "react";
import { FileSignature, Save } from "lucide-react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { ActivityType, type OpsProposalStatus } from "../../types";
import { logActivity } from "../../services/activityService";

type ProposalRow = {
  id: string; // usually leadId
  leadId?: string;
  panelCount?: number;
  panelSizeKw?: number;
  roofArea?: number;
  proposalAmount?: number;
  finalAmount?: number;
  status?: OpsProposalStatus;
};

type LeadRow = {
  id: string;
  companyName?: string;
  contactPerson?: string;
};

const money = (n?: number) => {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

export const Proposals = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [leads, setLeads] = useState<Record<string, LeadRow>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const unsubLeads = onSnapshot(collection(db, "leads"), (s) => {
      const map: Record<string, LeadRow> = {};
      s.docs.forEach((d) => {
        map[d.id] = { id: d.id, ...(d.data() as any) };
      });
      setLeads(map);
    });

    const unsubProps = onSnapshot(collection(db, "Phase2_details"), (s) => {
      const rows = s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ProposalRow[];
      setProposals(rows);
      setLoading(false);
    });

    return () => {
      unsubLeads();
      unsubProps();
    };
  }, []);

  const rows = useMemo(() => {
    return [...proposals].sort((a, b) => a.id.localeCompare(b.id));
  }, [proposals]);

  const updateStatus = async (proposalId: string, next: OpsProposalStatus) => {
    if (!user) return;
    setSaving(proposalId);
    try {
      await updateDoc(doc(db, "Phase2_details", proposalId), { status: next, updatedAt: Date.now() } as any);
      await logActivity(
        user.uid,
        ActivityType.PROPOSAL_STATUS_CHANGED,
        `Proposal status updated to ${next}`,
        { leadId: proposalId }
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Proposals</h1>
        <p className="text-slate-500 mt-1">Review Phase 2 proposals and update approval status.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="py-3 px-4 font-semibold">Lead Name</th>
                <th className="py-3 px-4 font-semibold">Panel Count</th>
                <th className="py-3 px-4 font-semibold">Panel Size (kW)</th>
                <th className="py-3 px-4 font-semibold">Roof Area</th>
                <th className="py-3 px-4 font-semibold">Proposal Amount</th>
                <th className="py-3 px-4 font-semibold">Final Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4">
                    <div className="h-5 bg-slate-100 rounded animate-pulse w-full" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No proposals found in `Phase2_details`.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const lead = leads[p.leadId || p.id];
                  const leadName = lead?.companyName || lead?.contactPerson || (p.leadId || p.id).slice(0, 6);
                  const status = (p.status || "draft") as OpsProposalStatus;
                  const busy = saving === p.id;
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{leadName}</td>
                      <td className="py-3 px-4 text-slate-700">{p.panelCount ?? "—"}</td>
                      <td className="py-3 px-4 text-slate-700">{p.panelSizeKw ?? "—"}</td>
                      <td className="py-3 px-4 text-slate-700">{p.roofArea ?? "—"}</td>
                      <td className="py-3 px-4 text-slate-700">{money(p.proposalAmount)}</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">{money(p.finalAmount)}</td>
                      <td className="py-3 px-4">
                        <select
                          value={status}
                          onChange={(e) => updateStatus(p.id, e.target.value as OpsProposalStatus)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                          disabled={busy}
                        >
                          <option value="draft">draft</option>
                          <option value="sent">sent</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                          <FileSignature className="w-4 h-4" />
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

