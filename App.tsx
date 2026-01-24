// import React, { useState, useEffect } from 'react';
// import { useAuth } from './hooks/useAuth';
// import { UserRole, UserStatus, CustomerStatus, ExecutionStage } from './types';
// import { Icons } from './constants';
// import { registerUser, loginUser, logoutUser } from './lib/auth';
// import { createLead, deleteLead } from './services/leadService';
// import { convertLeadToCustomer, activateCustomer, updateOpsMetrics } from './services/customerService';
// import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
// import { db } from './lib/firebase';
// import { getSalesAdvice } from './services/geminiService';

// const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

// export default function App() {
//   const { user, loading } = useAuth();

//   const [view, setView] = useState<'login' | 'register'>('login');
//   const [leads, setLeads] = useState<any[]>([]);
//   const [customers, setCustomers] = useState<any[]>([]);
//   const [allUsers, setAllUsers] = useState<any[]>([]);
//   const [aiTip, setAiTip] = useState<string | null>(null);

//   // ✅ ALWAYS DECLARED — NEVER CONDITIONAL
//   const [activeTab, setActiveTab] = useState<'leads' | 'customers' | 'users' | 'billing'>('leads');

//   // 🔁 Sync active tab AFTER user loads
//   useEffect(() => {
//     if (!user) return;

//     if (user.role === UserRole.SALES) setActiveTab('leads');
//     else if (user.role === UserRole.OPERATIONS) setActiveTab('customers');
//     else if (user.role === UserRole.MASTER_ADMIN) setActiveTab('users');
//   }, [user]);

//   // 🔁 Firestore sync
//   useEffect(() => {
//     if (!user || user.status !== UserStatus.ACTIVE) return;

//     const unsubLeads = onSnapshot(collection(db, "leads"), s =>
//       setLeads(s.docs.map(d => ({ id: d.id, ...d.data() })))
//     );

//     const unsubCustomers = onSnapshot(collection(db, "customers"), s =>
//       setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() })))
//     );

//     let unsubUsers = () => {};
//     if (user.role === UserRole.MASTER_ADMIN) {
//       unsubUsers = onSnapshot(collection(db, "users"), s =>
//         setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))
//       );
//     }

//     return () => {
//       unsubLeads();
//       unsubCustomers();
//       unsubUsers();
//     };
//   }, [user]);

//   // ⏳ Loading
//   if (loading) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
//         Initializing Synckraft...
//       </div>
//     );
//   }

//   // ⛔ Pending approval
//   if (user && user.status === UserStatus.PENDING) {
//     return (
//       <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-center p-8">
//         <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
//           <Icons.Users />
//         </div>
//         <h1 className="text-3xl font-bold text-white mb-2">Account Pending Approval</h1>
//         <p className="text-slate-400 max-w-md mb-8">
//           Hello {user.displayName}, a Master Admin needs to verify your role.
//         </p>
//         <button onClick={logoutUser} className="text-indigo-400 font-bold hover:underline">
//           Sign Out
//         </button>
//       </div>
//     );
//   }

//   // 🔐 AUTH PAGES
//   if (!user) {
//     return view === 'login' ? <LoginView setView={setView} /> : <RegisterView setView={setView} />;
//   }

//   // ================= DASHBOARD =================

//   return (
//     <div className="flex h-screen bg-slate-50 overflow-hidden">
//       {/* SIDEBAR */}
//       <aside className="w-72 bg-slate-900 flex flex-col p-6">
//         <div className="flex items-center space-x-3 mb-10">
//           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">S</div>
//           <h1 className="text-xl font-bold text-white">Synckraft</h1>
//         </div>

//         <nav className="flex-1 space-y-2">
//           {user.role === UserRole.MASTER_ADMIN && (
//             <SidebarLink label="Users" icon={<Icons.Users />} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
//           )}
//           {user.role !== UserRole.OPERATIONS && (
//             <SidebarLink label="Sales Hub" icon={<Icons.Leads />} active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
//           )}
//           <SidebarLink label="Portfolio" icon={<Icons.Operations />} active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
//           {user.role === UserRole.MASTER_ADMIN && (
//             <SidebarLink label="Financials" icon={<Icons.Dashboard />} active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
//           )}
//         </nav>

//         <button onClick={logoutUser} className="mt-auto bg-slate-800 text-white p-3 rounded-xl text-xs font-bold uppercase">
//           Sign Out
//         </button>
//       </aside>

//       {/* MAIN */}
//       <main className="flex-1 p-10 overflow-y-auto">
//         <h2 className="text-3xl font-black mb-6 uppercase">{activeTab}</h2>

//         {/* AI BAR */}
//         <div className="mb-6 bg-white p-6 rounded-2xl border flex justify-between items-center">
//           <div>
//             <h4 className="font-bold">Synckraft AI</h4>
//             <p className="text-sm text-slate-500">{aiTip || "Ready to assist."}</p>
//           </div>
//           <button
//             onClick={async () => {
//               setAiTip("Thinking...");
//               const tip = await getSalesAdvice("Portfolio", 0);
//               setAiTip(tip);
//             }}
//             className="text-xs font-bold uppercase text-indigo-600"
//           >
//             Generate
//           </button>
//         </div>

//         {/* CONTENT TABLES (UNCHANGED LOGIC BELOW) */}
//         {/* 👉 Your existing tables remain exactly as-is */}
//       </main>
//     </div>
//   );
// }

// /* ---------------- SUB COMPONENTS ---------------- */

// const LoginView = ({ setView }: any) => {
//   const [form, setForm] = useState({ email: '', pass: '' });

//   return (
//     <form
//       onSubmit={e => {
//         e.preventDefault();
//         loginUser(form.email, form.pass).catch(e => alert(e.message));
//       }}
//       className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white"
//     >
//       <input placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
//       <input placeholder="Password" type="password" onChange={e => setForm({ ...form, pass: e.target.value })} />
//       <button>Login</button>
//       <button type="button" onClick={() => setView('register')}>Register</button>
//     </form>
//   );
// };

// const RegisterView = ({ setView }: any) => {
//   const [form, setForm] = useState({ name: '', email: '', pass: '', role: UserRole.SALES });

//   return (
//     <form
//       onSubmit={e => {
//         e.preventDefault();
//         registerUser(form.email, form.pass, form.name, form.role).catch(e => alert(e.message));
//       }}
//       className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white"
//     >
//       <input placeholder="Name" onChange={e => setForm({ ...form, name: e.target.value })} />
//       <input placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
//       <input placeholder="Password" type="password" onChange={e => setForm({ ...form, pass: e.target.value })} />
//       <button>Register</button>
//       <button type="button" onClick={() => setView('login')}>Login</button>
//     </form>
//   );
// };

// const SidebarLink = ({ icon, label, active, onClick }: any) => (
//   <button
//     onClick={onClick}
//     className={`w-full flex items-center space-x-3 p-4 rounded-xl text-xs font-bold uppercase ${
//       active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
//     }`}
//   >
//     {icon}
//     <span>{label}</span>
//   </button>
// );


import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { UserRole, UserStatus, CustomerStatus, ExecutionStage } from './types';
import { Icons } from './constants';
import { registerUser, loginUser, logoutUser } from './lib/auth';
import { createLead, deleteLead, updateLeadAssignment } from './services/leadService';
import { convertLeadToCustomer, activateCustomer, updateOpsMetrics, updateCustomerAssignment } from './services/customerService';
import { getProfileByUserId } from './services/profileService';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { getSalesAdvice } from './services/geminiService';
import { approveUser, rejectUser } from './services/userService';
import ProfileView from './src/Profile';

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

export default function App() {
  const { user, loading } = useAuth();

  const [view, setView] = useState<'login' | 'register'>('login');
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // ✅ ALWAYS DECLARED — NEVER CONDITIONAL
  const [activeTab, setActiveTab] = useState<'leads' | 'customers' | 'users' | 'billing'>('leads');

  // 🔁 Sync active tab AFTER user loads
  useEffect(() => {
    if (!user) return;

    if (user.role === UserRole.SALES) setActiveTab('leads');
    else if (user.role === UserRole.OPERATIONS) setActiveTab('customers');
    else if (user.role === UserRole.MASTER_ADMIN) setActiveTab('users');
  }, [user]);

  // 🔁 Firestore sync
  useEffect(() => {
    if (!user || user.status !== UserStatus.ACTIVE) return;

    const unsubLeads = onSnapshot(collection(db, "leads"), s =>
      setLeads(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubCustomers = onSnapshot(collection(db, "customers"), s =>
      setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    let unsubUsers = () => {};
    if (user.role === UserRole.MASTER_ADMIN) {
      unsubUsers = onSnapshot(collection(db, "users"), s =>
        setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))
      );
    }

    // subscribe to profiles for real-time mapping and updates
    const unsubProfiles = onSnapshot(collection(db, 'profiles'), s =>
      setProfiles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubLeads();
      unsubCustomers();
      unsubUsers();
      unsubProfiles();
    };
  }, [user]);

  // Derived maps for quick lookups (recomputed when profiles change)
  const profilesByUserId = useMemo(() => {
    const m: Record<string, any> = {};
    for (const p of profiles) {
      if (p.userRef) {
        const parts = (p.userRef as string).split('/');
        const uid = parts[1];
        if (uid) m[uid] = p;
      }
    }
    return m;
  }, [profiles]);

  const profilesByUniqueId = useMemo(() => {
    const m: Record<string, any> = {};
    for (const p of profiles) {
      if (p.uniqueId) m[p.uniqueId] = p;
    }
    return m;
  }, [profiles]);

  // ⏳ Loading
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        Initializing Synckraft...
      </div>
    );
  }

  // ⛔ Pending approval
  if (user && user.status === UserStatus.PENDING) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-center p-8">
        <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-amber-500">
          <div className="animate-pulse">
            <Icons.Users />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Account Pending Approval</h1>
        <p className="text-slate-400 max-w-md mb-8">
          Hello {user.displayName}, a Master Admin needs to verify your role.
        </p>
        <button
          onClick={logoutUser}
          className="text-indigo-400 font-bold hover:underline transition-colors duration-200"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // 🔐 AUTH PAGES
  if (!user) {
    return view === 'login' ? <LoginView setView={setView} /> : <RegisterView setView={setView} />;
  }

  // ================= DASHBOARD =================

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 flex flex-col p-6">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
            S
          </div>
          <h1 className="text-xl font-bold text-white">Synckraft</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {user.role === UserRole.MASTER_ADMIN && (
            <SidebarLink
              label="Users"
              icon={<Icons.Users />}
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
            />
          )}
          {user.role !== UserRole.OPERATIONS && (
            <SidebarLink
              label="Sales Hub"
              icon={<Icons.Leads />}
              active={activeTab === 'leads'}
              onClick={() => setActiveTab('leads')}
            />
          )}
          <SidebarLink
            label="Portfolio"
            icon={<Icons.Operations />}
            active={activeTab === 'customers'}
            onClick={() => setActiveTab('customers')}
          />
          {user.role === UserRole.MASTER_ADMIN && (
            <SidebarLink
              label="Financials"
              icon={<Icons.Dashboard />}
              active={activeTab === 'billing'}
              onClick={() => setActiveTab('billing')}
            />
          )}
        </nav>

        <button
          onClick={logoutUser}
          className="mt-auto bg-slate-800 text-white p-3 rounded-xl text-xs font-bold uppercase hover:bg-slate-700 transition-colors duration-200"
        >
          Sign Out
        </button>
        <button
          onClick={() => setShowProfile(true)}
          className="mt-3 bg-indigo-600 text-white p-2 rounded-md text-xs font-bold uppercase hover:bg-indigo-700 transition-colors duration-200"
        >
          My Profile
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-10 overflow-y-auto">
        <h2 className="text-3xl font-black mb-6 uppercase">{activeTab}</h2>

        {/* AI BAR */}
        <div className="mb-6 bg-white p-6 rounded-2xl border flex justify-between items-center">
          <div>
            <h4 className="font-bold">Synckraft AI</h4>
            <p className="text-sm text-slate-500">{aiTip || "Ready to assist."}</p>
          </div>
          <button
            onClick={async () => {
              setAiTip("Thinking...");
              const tip = await getSalesAdvice("Portfolio", 0);
              setAiTip(tip);
            }}
            className="text-xs font-bold uppercase text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
          >
            Generate
          </button>
        </div>

        {/* CONTENT TABLES (Users / Leads / Customers) */}
        {activeTab === 'users' && user.role === UserRole.MASTER_ADMIN && (
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl border">
              <h3 className="font-bold mb-4">Pending Users</h3>
              <div className="space-y-3">
                {allUsers.filter(u => u.status === UserStatus.PENDING).length === 0 && (
                  <p className="text-sm text-slate-500">No pending users.</p>
                )}
                {allUsers.filter(u => u.status === UserStatus.PENDING).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50">
                    <div>
                      <div className="font-bold">{u.displayName || u.name || u.email}</div>
                      <div className="text-sm text-slate-500">{u.email}</div>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            await approveUser(u.id);
                            alert('User approved');
                          } catch (e: any) {
                            alert(e.message || e);
                          }
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await rejectUser(u.id);
                            alert('User rejected');
                          } catch (e: any) {
                            alert(e.message || e);
                          }
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded-md text-xs hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl border">
              <h3 className="font-bold mb-4">All Users</h3>
              <div className="space-y-2">
                {allUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50">
                    <div>
                      <div className="font-bold">{u.displayName || u.name || u.email}</div>
                      <div className="text-sm text-slate-500">{u.email} • {u.role} • {u.status}</div>
                    </div>
                    <div className="text-sm text-slate-400">{u.profileRef ? 'Has Profile' : 'No Profile'}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'leads' && user.status === UserStatus.ACTIVE && (
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl border">
              <h3 className="font-bold mb-4">Create Lead</h3>
              <CreateLeadForm user={user} profiles={profiles} allUsers={allUsers} />
            </section>

            <section className="bg-white p-6 rounded-2xl border">
              <h3 className="font-bold mb-4">Leads</h3>
              <div className="space-y-2">
                {leads.map(l => {
                  const assignedProfile = profilesByUserId[l.salesUserId] || profilesByUniqueId[l.salesUniqueId];
                  const assignedName = assignedProfile?.name || assignedProfile?.displayName || l.salesUserId;
                  const assignedUid = l.salesUniqueId || assignedProfile?.uniqueId || '—';
                  return (
                    <div key={l.id} className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50">
                      <div>
                        <div className="font-bold">{l.companyName}</div>
                        <div className="text-sm text-slate-500">{l.contactPerson} • {l.email}</div>
                        <div className="text-xs text-slate-400">
                          Assigned: 
                          <button
                            onClick={() => {
                              // open profile modal for assigned profile if available
                              const profile = profilesByUserId[l.salesUserId] || profilesByUniqueId[l.salesUniqueId];
                              if (profile) {
                                setSelectedProfileId(profile.id);
                                setShowProfile(true);
                              } else {
                                alert('Profile not found for this assignee');
                              }
                            }}
                            className="underline text-indigo-600 hover:text-indigo-800 mx-1 text-xs"
                          >{assignedName}</button>
                          • UID: {assignedUid} • Code: {l.clientCode || '—'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {user.role === UserRole.MASTER_ADMIN && (
                          <ReassignControl
                            currentUserId={l.salesUserId}
                            lead={l}
                            allUsers={allUsers}
                            profiles={profiles}
                          />
                        )}
                        <div className="text-sm text-slate-400">{l.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'customers' && user.status === UserStatus.ACTIVE && (
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl border">
              <h3 className="font-bold mb-4">Customers</h3>
              <div className="space-y-2">
                {customers.map(c => {
                  const assignedProfile = profilesByUserId[c.salesUserId] || profilesByUniqueId[c.salesUniqueId];
                  const assignedName = assignedProfile?.name || assignedProfile?.displayName || c.salesUserId;
                  const assignedUid = c.salesUniqueId || assignedProfile?.uniqueId || '—';
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50">
                      <div>
                        <div className="font-bold">{c.companyName}</div>
                        <div className="text-sm text-slate-500">Linked Lead: {c.leadId}</div>
                        <div className="text-xs text-slate-400">
                          Assigned: 
                          <button
                            onClick={() => {
                              const profile = profilesByUserId[c.salesUserId] || profilesByUniqueId[c.salesUniqueId];
                              if (profile) {
                                setSelectedProfileId(profile.id);
                                setShowProfile(true);
                              } else {
                                alert('Profile not found for this assignee');
                              }
                            }}
                            className="underline text-indigo-600 hover:text-indigo-800 mx-1 text-xs"
                          >{assignedName}</button>
                          • UID: {assignedUid} • Code: {c.clientCode || '—'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {user.role === UserRole.MASTER_ADMIN && (
                          <ReassignCustomerControl
                            currentUserId={c.salesUserId}
                            customer={c}
                            allUsers={allUsers}
                            profiles={profiles}
                          />
                        )}
                        <div className="text-sm text-slate-400">{c.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>
      {showProfile && <ProfileView onClose={() => { setShowProfile(false); setSelectedProfileId(null); }} profileId={selectedProfileId || undefined} />}
    </div>
  );
}

/* ---------------- SUB COMPONENTS ---------------- */

const LoginView = ({ setView }: any) => {
  const [form, setForm] = useState({ email: '', pass: '' });
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!form.email || !form.pass) return alert('Email and password are required');
        if (!validateEmail(form.email)) return alert('Invalid email');
        loginUser(form.email, form.pass).catch((e: any) => alert(e.message));
      }}
      className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4"
    >
      <input
        placeholder="Email"
        className="p-2 rounded-md text-black w-64"
        onChange={e => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Password"
        type="password"
        className="p-2 rounded-md text-black w-64"
        onChange={e => setForm({ ...form, pass: e.target.value })}
      />
      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-bold transition-colors duration-200">
        Login
      </button>
      <button
        type="button"
        onClick={() => setView('register')}
        className="text-indigo-400 font-bold hover:underline transition-colors duration-200"
      >
        Register
      </button>
    </form>
  );
};

const RegisterView = ({ setView }: any) => {
  const [form, setForm] = useState({ name: '', email: '', pass: '', role: UserRole.SALES });
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!form.name || !form.email || !form.pass) return alert('Name, email and password are required');
        if (!validateEmail(form.email)) return alert('Invalid email');
        if (form.pass.length < 6) return alert('Password must be at least 6 characters');
        registerUser(form.email, form.pass, form.name, form.role).catch((e: any) => alert(e.message));
      }}
      className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4"
    >
      <input
        placeholder="Name"
        className="p-2 rounded-md text-black w-64"
        onChange={e => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Email"
        className="p-2 rounded-md text-black w-64"
        onChange={e => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Password"
        type="password"
        className="p-2 rounded-md text-black w-64"
        onChange={e => setForm({ ...form, pass: e.target.value })}
      />
      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-bold transition-colors duration-200">
        Register
      </button>
      <button
        type="button"
        onClick={() => setView('login')}
        className="text-indigo-400 font-bold hover:underline transition-colors duration-200"
      >
        Login
      </button>
    </form>
  );
};

const SidebarLink = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 p-4 rounded-xl text-xs font-bold uppercase transition-colors duration-200 ${
      active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

/** Create Lead Form component */
const CreateLeadForm = ({ user, profiles, allUsers }: any) => {
  const [form, setForm] = useState({ companyName: '', contactPerson: '', email: '', phone: '', potentialValue: '' });
  const [assignedUserId, setAssignedUserId] = useState<string>(user.uid);
  const submittingRef = React.useRef(false);

  useEffect(() => {
    setAssignedUserId(user.uid);
  }, [user]);

  const submit = async (e: any) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!form.companyName || !form.contactPerson) return alert('Company name and contact person required');
    const potential = Number(form.potentialValue) || 0;
    try {
      submittingRef.current = true;
      const salesUserId = assignedUserId || user.uid;
      // find profile for the selected sales user to get uniqueId
      const profile = profiles.find((p: any) => p.userRef === `users/${salesUserId}`);
      const salesUniqueId = (profile as any)?.uniqueId || null;
      await createLead({ companyName: form.companyName, contactPerson: form.contactPerson, email: form.email, phone: form.phone, potentialValue: potential }, salesUserId, salesUniqueId);
      alert('Lead created');
      setForm({ companyName: '', contactPerson: '', email: '', phone: '', potentialValue: '' });
    } catch (err: any) {
      alert(err.message || err);
    } finally { submittingRef.current = false; }
  };

  // Admins can assign leads to a sales user
  const salesOptions = (allUsers || []).filter((u: any) => u.role === UserRole.SALES);

  return (
    <form className="space-y-3" onSubmit={submit}>
      <input className="w-full p-2 rounded-md border" placeholder="Company name" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
      <input className="w-full p-2 rounded-md border" placeholder="Contact person" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
      <input className="w-full p-2 rounded-md border" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      <input className="w-full p-2 rounded-md border" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      <input className="w-full p-2 rounded-md border" placeholder="Potential value" value={form.potentialValue} onChange={e => setForm({ ...form, potentialValue: e.target.value })} />

      {user.role === UserRole.MASTER_ADMIN && (
        <div>
          <label className="block text-sm mb-1">Assign to Sales User</label>
          <select className="w-full p-2 rounded-md border" value={assignedUserId} onChange={e => setAssignedUserId(e.target.value)}>
            <option value="">Select a user</option>
            {salesOptions.map((su: any) => (
              <option key={su.id} value={su.id}>{su.displayName || su.name || su.email}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end">
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md" type="submit">Create</button>
      </div>
    </form>
  );
};

/** Reassign control component used by admins to reassign leads/customers */
const ReassignControl = ({ currentUserId, lead, allUsers, profiles }: any) => {
  const [selected, setSelected] = useState<string>(currentUserId || '');
  const submittingRef = React.useRef(false);

  const salesOptions = (allUsers || []).filter((u: any) => u.role === UserRole.SALES);

  const save = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const salesUserId = selected || currentUserId;
      const profile = profiles.find((p: any) => p.userRef === `users/${salesUserId}`);
      const salesUniqueId = (profile as any)?.uniqueId || null;
      const clientCode = salesUniqueId || (lead as any).clientCode || null;
      await updateLeadAssignment(lead.id, salesUserId, salesUniqueId, clientCode);
      alert('Lead reassigned');
    } catch (e: any) {
      alert(e.message || e);
    } finally { submittingRef.current = false; }
  };

  return (
    <div className="flex items-center space-x-2">
      <select className="p-1 rounded-md border text-xs" value={selected} onChange={e => setSelected(e.target.value)}>
        {salesOptions.map((su: any) => (
          <option key={su.id} value={su.id}>{su.displayName || su.name || su.email}</option>
        ))}
      </select>
      <button onClick={save} className="bg-yellow-500 text-white px-2 py-1 rounded-md text-xs">Reassign</button>
    </div>
  );
};

/** Reassign control for customers */
const ReassignCustomerControl = ({ currentUserId, customer, allUsers, profiles }: any) => {
  const [selected, setSelected] = useState<string>(currentUserId || '');
  const submittingRef = React.useRef(false);
  const salesOptions = (allUsers || []).filter((u: any) => u.role === UserRole.SALES);

  const save = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const salesUserId = selected || currentUserId;
      const profile = profiles.find((p: any) => p.userRef === `users/${salesUserId}`);
      const salesUniqueId = (profile as any)?.uniqueId || null;
      const clientCode = salesUniqueId || (customer as any).clientCode || null;
      await updateCustomerAssignment(customer.id, salesUserId, salesUniqueId, clientCode);
      alert('Customer reassigned');
    } catch (e: any) {
      alert(e.message || e);
    } finally { submittingRef.current = false; }
  };

  return (
    <div className="flex items-center space-x-2">
      <select className="p-1 rounded-md border text-xs" value={selected} onChange={e => setSelected(e.target.value)}>
        {salesOptions.map((su: any) => (
          <option key={su.id} value={su.id}>{su.displayName || su.name || su.email}</option>
        ))}
      </select>
      <button onClick={save} className="bg-yellow-500 text-white px-2 py-1 rounded-md text-xs">Reassign</button>
    </div>
  );
};

// Profile modal wrapper usage
const ProfileModal = ({ visible, onClose }: any) => {
  if (!visible) return null;
  return <ProfileView onClose={onClose} />;
};
