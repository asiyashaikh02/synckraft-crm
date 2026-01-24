import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getProfileByPath, getProfileByUserId, updateProfile, subscribeToProfile } from '../services/profileService';
import { UserRole } from '../types';

type Props = { onClose: () => void; profileId?: string };

export default function ProfileView({ onClose, profileId }: Props) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', contact: '', email: '' });

  useEffect(() => {
    let unsub: any;
    const load = async () => {
      if (!user) return;
      // If a profileId is provided, view that profile (admin viewing others)
      if (profileId) {
        const p = await getProfileByPath(`profiles/${profileId}`);
        if (p) {
          setProfile(p);
          setForm({ name: p.name || '', contact: p.contact || '', email: p.email || '' });
          unsub = subscribeToProfile(p.id, (d: any) => setProfile(d));
        }
      } else {
        // if user has profileRef, read by path
        if ((user as any).profileRef) {
          const p = await getProfileByPath((user as any).profileRef);
          if (p) {
            setProfile(p);
            setForm({ name: p.name || '', contact: p.contact || '', email: p.email || '' });
            unsub = subscribeToProfile(p.id, (d: any) => setProfile(d));
          }
        } else {
          // fallback: query by userId
          const p = await getProfileByUserId(user.uid);
          if (p) {
            setProfile(p);
            setForm({ name: p.name || '', contact: p.contact || '', email: p.email || '' });
            unsub = subscribeToProfile(p.id, (d: any) => setProfile(d));
          }
        }
      }

      setLoading(false);
    };

    load();
    return () => unsub && unsub();
  }, [user]);

  if (!user) return null;

  const canEditRole = user.role === UserRole.MASTER_ADMIN;

  const save = async () => {
    if (!profile) return;
    try {
      await updateProfile(profile.id, { name: form.name, contact: form.contact, email: form.email });
      alert('Profile updated');
    } catch (e: any) {
      alert(e.message || e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="w-96 bg-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">My Profile</h3>
          <button onClick={onClose} className="text-slate-500">Close</button>
        </div>

        {loading && <div className="py-8 text-center">Loading...</div>}

        {!loading && !profile && (
          <div className="py-8 text-center text-slate-500">No profile found.</div>
        )}

        {!loading && profile && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">Unique ID</div>
            <div className="font-mono font-bold">{profile.uniqueId}</div>

            <label className="block text-sm">Name</label>
            <input className="w-full p-2 rounded-md border" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

            <label className="block text-sm">Email</label>
            <input className="w-full p-2 rounded-md border" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

            <label className="block text-sm">Contact</label>
            <input className="w-full p-2 rounded-md border" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />

            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500">Role: <span className="font-bold">{profile.role}</span></div>
              {canEditRole && <div className="text-xs text-slate-400">Admin can change role in Users panel</div>}
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button onClick={save} className="bg-indigo-600 text-white px-4 py-2 rounded-md">Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
