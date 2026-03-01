import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ListChecks } from 'lucide-react';
import { ActionPlan, UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { ProvenanceBadges } from '../ProvenanceIndicators';

interface SharedActionPlansDemoProps {
  role: UserRole;
}

const ACTION_PLAN_EVENT = 'one82_action_plans_update';

const SharedActionPlansDemo: React.FC<SharedActionPlansDemoProps> = ({ role }) => {
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const load = () => {
      setPlans(StorageService.getActionPlans());
    };

    load();
    window.addEventListener(ACTION_PLAN_EVENT, load);
    return () => window.removeEventListener(ACTION_PLAN_EVENT, load);
  }, []);

  const visiblePlans = useMemo(() => {
    if (role === 'overseer') {
      return plans;
    }
    return plans.filter(plan => plan.visibleTo.includes(role));
  }, [plans, role]);

  const addPlan = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    const nextPlan: ActionPlan = {
      id: `plan_${Date.now()}`,
      title: cleanTitle,
      ownerRole: role === 'merchant' ? 'merchant' : 'iso',
      visibleTo: ['iso', 'merchant'],
      status: 'todo',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    StorageService.saveActionPlans([nextPlan, ...plans]);
    setTitle('');
  };

  const updateStatus = (id: string, status: ActionPlan['status']) => {
    const next = plans.map(plan =>
      plan.id === id
        ? { ...plan, status, updatedAt: Date.now() }
        : plan
    );

    StorageService.saveActionPlans(next);
  };

  return (
    <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-indigo-500" />
            Shared Action Plans
          </h3>
          <p className="text-sm text-gray-500 mt-1">Cross-role plan board for ISO and merchant execution tracking.</p>
        </div>
        <ProvenanceBadges size="sm" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Add shared action item..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          onClick={addPlan}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Add Plan
        </button>
      </div>

      <div className="space-y-2">
        {visiblePlans.length === 0 && (
          <p className="text-sm text-gray-400">No shared plans yet. Create one to start collaboration.</p>
        )}
        {visiblePlans.map(plan => (
          <div key={plan.id} className="rounded-lg border border-gray-200 p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{plan.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                Owner: {plan.ownerRole.toUpperCase()} · Updated: {new Date(plan.updatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {plan.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
              <select
                value={plan.status}
                onChange={event => updateStatus(plan.id, event.target.value as ActionPlan['status'])}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">Experimental collaboration board persisted in local browser storage.</p>
    </div>
  );
};

export default SharedActionPlansDemo;
