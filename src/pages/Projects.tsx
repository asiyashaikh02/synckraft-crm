import React, { useEffect, useMemo, useState } from "react";
import { FolderKanban, History, StickyNote, X, Save } from "lucide-react";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { ActivityType, type ActivityLog, type InstallationStage } from "../../types";
import { logActivity } from "../../services/activityService";
import { addOpsNote, subscribeToOpsNotes } from "../../services/opsNoteService";

type ProjectRow = {
  id: string;
  leadId?: string;
  companyName?: string;
  projectLocation?: string;
  systemSize?: number;
  installationStage?: InstallationStage;
  assignedEngineer?: string;
  estimatedCompletionDate?: number;
};

type OpsNoteRow = { id: string; note: string; createdAt: number; userId: string; projectId: string };

const formatDate = (ts?: number) => (ts ? new Date(ts).toLocaleDateString() : "—");

const formatDateInput = (ts?: number) => {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const parseDateInput = (value: string) => {
  if (!value) return undefined;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : undefined;
};

const milestoneKey = (type: ActivityType) => type;

const Milestone = ({ label, done }: { label: string; done: boolean }) => (
  <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white">
    <div className="text-sm font-semibold text-slate-800">{label}</div>
    <div className={`text-xs font-bold px-2 py-1 rounded-full ${done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
      {done ? "Done" : "Pending"}
    </div>
  </div>
);

export const Projects = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [timeline, setTimeline] = useState<ActivityLog[]>([]);
  const [notes, setNotes] = useState<OpsNoteRow[]>([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "customers"), (s) => {
      const data = s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ProjectRow[];
      setRows(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeId) return;

    const unsubTimeline = onSnapshot(
      query(collection(db, "activity_logs"), where("customerId", "==", activeId)),
      (s) => {
        const items = s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ActivityLog[];
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setTimeline(items);
      }
    );

    const unsubNotes = subscribeToOpsNotes(activeId, (n) => setNotes(n as any));

    return () => {
      unsubTimeline();
      unsubNotes();
    };
  }, [activeId]);

  const activeProject = useMemo(() => rows.find((r) => r.id === activeId) || null, [rows, activeId]);

  const tableRows = useMemo(() => {
    const isCompleted = (p: ProjectRow) => (p.installationStage || "planning") === "completed";
    return [...rows].filter((r) => !isCompleted(r)).sort((a, b) => (a.companyName || "").localeCompare(b.companyName || ""));
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

  const milestones = useMemo(() => {
    const doneTypes = new Set(timeline.map((t) => milestoneKey(t.type)));
    return {
      siteVisit: doneTypes.has(ActivityType.SITE_VISIT) || doneTypes.has(ActivityType.SITE_VISIT_STATUS_CHANGED),
      proposalApproved: doneTypes.has(ActivityType.PROPOSAL_STATUS_CHANGED) && timeline.some((t) => (t.description || "").toLowerCase().includes("approved")),
      installationStarted: timeline.some((t) => (t.description || "").toLowerCase().includes("installation stage set to installation")),
      testingCompleted: doneTypes.has(ActivityType.TESTING_COMPLETED) || timeline.some((t) => (t.description || "").toLowerCase().includes("installation stage set to testing")),
      delivered: doneTypes.has(ActivityType.PROJECT_DELIVERED) || timeline.some((t) => (t.description || "").toLowerCase().includes("installation stage set to completed")),
    };
  }, [timeline]);

  const addNote = async () => {
    if (!user || !activeId) return;
    const text = newNote.trim();
    if (!text) return;
    setNewNote("");
    await addOpsNote(activeId, user.uid, text);
    await logActivity(user.uid, ActivityType.NOTE_ADDED, `Ops note added: "${text.substring(0, 40)}${text.length > 40 ? "…" : ""}"`, { customerId: activeId });
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
        <p className="text-slate-500 mt-1">Manage active projects and track execution milestones.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="py-3 px-4 font-semibold">Client Name</th>
                <th className="py-3 px-4 font-semibold">Project Location</th>
                <th className="py-3 px-4 font-semibold">System Size</th>
                <th className="py-3 px-4 font-semibold">Installation Stage</th>
                <th className="py-3 px-4 font-semibold">Assigned Engineer</th>
                <th className="py-3 px-4 font-semibold">Estimated Completion</th>
                <th className="py-3 px-4 font-semibold">Timeline</th>
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
                    No active projects.
                  </td>
                </tr>
              ) : (
                tableRows.map((p) => {
                  const stage = (p.installationStage || "planning") as InstallationStage;
                  const busy = savingId === p.id;
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.companyName || p.id.slice(0, 6)}</td>
                      <td className="py-3 px-4 text-slate-700">{p.projectLocation || "—"}</td>
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
                          value={p.assignedEngineer || ""}
                          onChange={(e) => updateProject(p.id, { assignedEngineer: e.target.value })}
                          placeholder="Engineer…"
                          disabled={busy}
                          className="w-44 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="date"
                          value={formatDateInput(p.estimatedCompletionDate)}
                          onChange={(e) => updateProject(p.id, { estimatedCompletionDate: parseDateInput(e.target.value) })}
                          disabled={busy}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setActiveId(p.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          <History className="w-4 h-4" />
                          View
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

      {/* Timeline + Notes drawer */}
      {activeId && activeProject ? (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{activeProject.companyName || activeProject.id}</h2>
                  <p className="text-xs text-slate-500">Project timeline & internal ops notes</p>
                </div>
              </div>
              <button onClick={() => setActiveId(null)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Milestones</h3>
                <Milestone label="Site Visit Completed" done={!!milestones.siteVisit} />
                <Milestone label="Proposal Approved" done={!!milestones.proposalApproved} />
                <Milestone label="Installation Started" done={!!milestones.installationStarted} />
                <Milestone label="Testing Completed" done={!!milestones.testingCompleted} />
                <Milestone label="Project Delivered" done={!!milestones.delivered} />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
                {timeline.length === 0 ? (
                  <div className="text-sm text-slate-400">No activity yet.</div>
                ) : (
                  <div className="space-y-2">
                    {timeline.slice(0, 12).map((t) => (
                      <div key={t.id} className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-700">{t.type}</div>
                          <div className="text-[11px] text-slate-500">{formatDate(t.createdAt)}</div>
                        </div>
                        <div className="text-sm text-slate-700 mt-1">{t.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Operations Notes</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <StickyNote className="w-4 h-4 text-slate-500 mt-1" />
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      placeholder="Add an internal ops note…"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      Add Note
                    </button>
                  </div>
                </div>

                {notes.length === 0 ? (
                  <div className="text-sm text-slate-400">No notes added yet.</div>
                ) : (
                  <div className="space-y-2">
                    {notes.map((n) => (
                      <div key={n.id} className="px-4 py-3 rounded-xl border border-slate-200 bg-white">
                        <div className="text-sm text-slate-800 whitespace-pre-wrap">{n.note}</div>
                        <div className="text-[11px] text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

