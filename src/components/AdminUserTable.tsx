import React, { useState } from "react";

const initialUsers = [
  { id: 1, name: "Alice Smith", email: "alice@ascend.com", role: "Student", status: "Active" },
  { id: 2, name: "Bob Lee", email: "bob@ascend.com", role: "Admin", status: "Active" },
  { id: 3, name: "Carol Jones", email: "carol@ascend.com", role: "Student", status: "Inactive" },
  { id: 4, name: "David Kim", email: "david@ascend.com", role: "Student", status: "Active" },
];

export default function AdminUserTable() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Student" });

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <input className="px-4 py-2 rounded-lg border focus-ring w-64" placeholder="Search users..." value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn-primary" onClick={()=>setShowAdd(true)}>Add User</button>
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white dark:bg-gray-900">
          <thead>
            <tr className="bg-gradient-primary text-white">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-2 font-semibold">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${u.status==='Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{u.status}</span>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button className="text-blue-600 hover:underline">Edit</button>
                  <button className="text-red-600 hover:underline">Deactivate</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add User</h2>
            <input className="w-full mb-2 px-4 py-2 rounded border focus-ring" placeholder="Name" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} />
            <input className="w-full mb-2 px-4 py-2 rounded border focus-ring" placeholder="Email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} />
            <select className="w-full mb-4 px-4 py-2 rounded border focus-ring" value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}>
              <option>Student</option>
              <option>Admin</option>
            </select>
            <div className="flex gap-4 justify-end">
              <button className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={()=>{setUsers([...users, {id: users.length+1, ...newUser, status: 'Active'}]); setShowAdd(false); setNewUser({name: '', email: '', role: 'Student'});}}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 