'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, RefreshCw, Save, CreditCard, History, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminService, SubscriptionPlan, PaymentTransaction } from '@/services/adminService';

const AdminSubscriptionManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editing, setEditing] = useState<Record<string, { durationDays: number; priceInr: number }>>({});
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const loadPlans = async () => {
    const res = await adminService.getSubscriptionPlans();
    if (res.success && res.data) {
      setPlans(res.data);
      const e: Record<string, { durationDays: number; priceInr: number }> = {};
      res.data.forEach(p => { e[p._id] = { durationDays: p.durationDays, priceInr: p.priceInr }; });
      setEditing(e);
    } else {
      console.log('No plans found, you may need to seed defaults');
    }
  };

  const seedDefaults = async () => {
    setLoading(true);
    const res = await adminService.seedDefaultPlans();
    if (res.success) {
      setNotification({ type: 'success', message: 'Default plans seeded' });
      loadPlans();
    } else {
      setNotification({ type: 'error', message: res.message || 'Failed to seed plans' });
    }
    setLoading(false);
  };

  const savePlan = async (plan: SubscriptionPlan) => {
    setLoading(true);
    const payload = { key: plan.key, name: plan.name, description: plan.description, durationDays: editing[plan._id].durationDays, priceInr: editing[plan._id].priceInr, isActive: plan.isActive, sortOrder: plan.sortOrder };
    const res = await adminService.upsertPlan(payload);
    if (res.success) {
      setNotification({ type: 'success', message: 'Plan saved' });
      loadPlans();
    } else {
      setNotification({ type: 'error', message: res.message || 'Failed to save plan' });
    }
    setLoading(false);
  };

  const togglePlan = async (plan: SubscriptionPlan) => {
    setLoading(true);
    const res = await adminService.togglePlan(plan._id);
    if (res.success) {
      setNotification({ type: 'success', message: 'Plan toggled' });
      loadPlans();
    } else {
      setNotification({ type: 'error', message: res.message || 'Failed to toggle plan' });
    }
    setLoading(false);
  };

  const loadTransactions = async () => {
    setTxLoading(true);
    const res = await adminService.listTransactions({ page: pagination.page, limit: pagination.limit });
    if (res.success && res.data) {
      setTransactions(res.data.items);
      setPagination(prev => ({ ...prev, total: res.data!.pagination.total }));
    }
    setTxLoading(false);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [pagination.page]);

  return (
    <div className="space-y-6">
      {notification.type && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-lg flex items-center justify-between ${notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          <div className="flex items-center">{notification.type === 'success' ? <Check className="w-5 h-5 mr-2"/> : <AlertCircle className="w-5 h-5 mr-2"/>}<span>{notification.message}</span></div>
          <button onClick={() => setNotification({ type: null, message: '' })}><span className="text-sm">Close</span></button>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
          <p className="text-gray-600">Manage plans and view transactions</p>
        </div>
        <button onClick={seedDefaults} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2"/> Seed Defaults
        </button>
      </div>

      {/* Plans */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">{plan.name}</div>
                <button onClick={() => togglePlan(plan)} className="text-gray-600 hover:text-gray-900">
                  {plan.isActive ? <ToggleRight className="w-5 h-5 text-green-600"/> : <ToggleLeft className="w-5 h-5 text-gray-400"/>}
                </button>
              </div>
              <div className="text-xs text-gray-500 mb-3">Key: {plan.key}</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Duration (days)</label>
                  <input type="number" value={editing[plan._id]?.durationDays ?? plan.durationDays} onChange={(e) => setEditing(prev => ({ ...prev, [plan._id]: { ...(prev[plan._id] || {}), durationDays: parseInt(e.target.value) || 0 } }))} className="w-full px-3 py-2 border rounded-lg"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" value={editing[plan._id]?.priceInr ?? plan.priceInr} onChange={(e) => setEditing(prev => ({ ...prev, [plan._id]: { ...(prev[plan._id] || {}), priceInr: parseInt(e.target.value) || 0 } }))} className="w-full px-3 py-2 border rounded-lg"/>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={() => savePlan(plan)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center" disabled={loading}><Save className="w-4 h-4 mr-2"/> Save</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
          <button onClick={loadTransactions} className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center" disabled={txLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${txLoading ? 'animate-spin' : ''}`}/> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {txLoading ? (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-600">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-600">No transactions</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx._id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{typeof tx.user === 'string' ? tx.user : tx.user.name} ({typeof tx.user === 'string' ? '' : tx.user.email})</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{typeof tx.plan === 'string' ? tx.plan : tx.plan.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">₹{tx.amountInr}</td>
                    <td className="px-4 py-2 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'paid' ? 'bg-green-100 text-green-700' : tx.status === 'created' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{tx.status}</span></td>
                    <td className="px-4 py-2 text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <button onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.page <= 1} className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Prev</button>
          <div className="text-sm text-gray-600">Page {pagination.page} of {Math.max(1, Math.ceil(pagination.total / pagination.limit))}</div>
          <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionManagement;


