import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, StickyNote, X, Save } from "lucide-react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { ActivityType, type OpsVisitStatus } from "../../types";
import { logActivity } from "../../services/activityService";

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
  visitNotes?: string;
};

type ProfileRow = { uid: string; displayName?: string; email?: string };

const SkeletonRow = () => (
  <tr className="border-b border-slate-100">
    <td className="py-4 px-4" colSpan={8}>
      <div className="h-5 bg-slate-100 rounded animate-pulse w-full" />
    </td>
  </tr>
);

const formatDateTimeLocal = (ts?: number) => {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const parseDateTimeLocal = (value: string) => {
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : undefined;
};

export const SiteVisits = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ visitDate?: number; visitStatus?: OpsVisitStatus; visitNotes?: string }>({});

  useEffect(() => {
    const unsubLeads = onSnapshot(collection(db, "leads"), (s) => {
      const rows = s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as LeadRow[];
      setLeads(rows);
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, "sales_users"), (s) => {
      const map: Record<string, ProfileRow> = {};
      s.docs.forEach((d) => {
        const data = d.data() as any;
        map[d.id] = { uid: d.id, displayName: data.displayName, email: data.email };
      });
      setProfiles(map);
    });

    return () => {
      unsubLeads();
      unsubUsers();
    };
  }, []);

  const rows = useMemo(() => {
    const normalizeStatus = (s?: OpsVisitStatus) => s || (undefined as any);
    return [...leads].sort((a, b) => {
      const ad = a.visitDate || 0;
      const bd = b.visitDate || 0;
      return bd - ad;
    }).map((l) => ({ ...l, visitStatus: normalizeStatus(l.visitStatus) }));
  }, [leads]);

  const startEdit = (lead: LeadRow) => {
    setEditingId(lead.id);
    setDraft({
      visitDate: lead.visitDate,
      visitStatus: lead.visitStatus || "scheduled",
      visitNotes: lead.visitNotes || "",
    });
  };

  const closeEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveEdit = async () => {
    if (!editingId || !user) return;
    const payload: any = {
      visitDate: draft.visitDate || null,
      visitStatus: draft.visitStatus || "scheduled",
      visitNotes: draft.visitNotes || "",
      updatedAt: Date.now(),
    };
    await updateDoc(doc(db, "leads", editingId), payload);
    await logActivity(
      user.uid,
      ActivityType.SITE_VISIT_STATUS_CHANGED,
      `Site visit set to ${payload.visitStatus}${payload.visitDate ? ` on ${new Date(payload.visitDate).toLocaleString()}` : ""}`,
      { leadId: editingId }
    );
    closeEdit();
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Site Visits</h1>
        <p className="text-slate-500 mt-1">Schedule visits, update status, and capture ops notes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="py-3 px-4 font-semibold">Lead Name</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">City</th>
                <th className="py-3 px-4 font-semibold">Address</th>
                <th className="py-3 px-4 font-semibold">Assigned Sales</th>
                <th className="py-3 px-4 font-semibold">Visit Date</th>
                <th className="py-3 px-4 font-semibold">Visit Status</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No leads found.
                  </td>
                </tr>
              ) : (
                rows.map((l) => {
                  const name = l.companyName || l.contactPerson || l.id.slice(0, 6);
                  const assigned = l.salesUserId ? profiles[l.salesUserId] : undefined;
                  return (
                    <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{name}</td>
                      <td className="py-3 px-4 text-slate-700">{l.phone || "—"}</td>
                      <td className="py-3 px-4 text-slate-700">{l.city || "—"}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-[280px] truncate">{(l as any).address || "—"}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {assigned?.displayName || assigned?.email || (l.salesUserId ? l.salesUserId.slice(0, 6) + "…" : "—")}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {l.visitDate ? new Date(l.visitDate).toLocaleString() : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {l.visitStatus || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => startEdit(l)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          <CalendarDays className="w-4 h-4" />
                          Schedule / Update
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editingId ? (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Manage Site Visit</h2>
              </div>
              <button onClick={closeEdit} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Visit Date</div>
                  <input
                    type="datetime-local"
                    value={formatDateTimeLocal(draft.visitDate)}
                    onChange={(e) => setDraft((d) => ({ ...d, visitDate: parseDateTimeLocal(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  />
                </label>
                <label className="text-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Visit Status</div>
                  <select
                    value={draft.visitStatus || "scheduled"}
                    onChange={(e) => setDraft((d) => ({ ...d, visitStatus: e.target.value as OpsVisitStatus }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  >
                    <option value="scheduled">scheduled</option>
                    <option value="completed">completed</option>
                    <option value="rescheduled">rescheduled</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </label>
              </div>

              <label className="text-sm block">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  Visit Notes
                </div>
                <textarea
                  value={draft.visitNotes || ""}
                  onChange={(e) => setDraft((d) => ({ ...d, visitNotes: e.target.value }))}
                  rows={4}
                  placeholder="Add internal notes for the ops team…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 resize-none"
                />
              </label>
            </div>
            <div className="p-5 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
              <button
                onClick={closeEdit}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-white border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

