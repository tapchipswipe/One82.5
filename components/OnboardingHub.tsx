import React, { useEffect, useState } from 'react';
import { ClipboardList, Send } from 'lucide-react';
import { StorageService } from '../services/storage';
import { OnboardingDeal, ProcessorTarget } from '../types';

const OnboardingHub: React.FC = () => {
  const [onboardingDeals, setOnboardingDeals] = useState<OnboardingDeal[]>([]);
  const [repOptions, setRepOptions] = useState<string[]>([]);
  const [dealForm, setDealForm] = useState({
    merchantName: '',
    merchantEmail: '',
    ownerRepName: '',
    processorTarget: 'stripe' as ProcessorTarget,
    notes: ''
  });

  useEffect(() => {
    const load = async () => {
      setOnboardingDeals(await StorageService.getOnboardingDealsResolved());
      const importedTeam = StorageService.getImportedTeam();
      const teamReps = importedTeam
        .map((row) => row.name || row.repName || row.rep || row.owner || '')
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
      const deduped = Array.from(new Set(teamReps));
      setRepOptions(deduped);
      setDealForm((current) => ({
        ...current,
        ownerRepName: current.ownerRepName || deduped[0] || ''
      }));
    };

    void load();
    const onUpdate = () => {
      void load();
    };
    window.addEventListener('user-update', onUpdate);
    return () => window.removeEventListener('user-update', onUpdate);
  }, []);

  const createOnboardingDeal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dealForm.merchantName.trim()) return;
    const hasValidEmail = dealForm.merchantEmail.includes('@');
    const status: OnboardingDeal['status'] = hasValidEmail ? 'ready-to-submit' : 'validation-required';

    StorageService.addOnboardingDeal({
      merchantName: dealForm.merchantName.trim(),
      merchantEmail: dealForm.merchantEmail.trim(),
      ownerRepName: dealForm.ownerRepName.trim() || 'Unassigned Rep',
      processorTarget: dealForm.processorTarget,
      status,
      packageSummary: hasValidEmail
        ? `${dealForm.processorTarget.toUpperCase()} package ready`
        : 'Missing valid merchant email for package generation',
      notes: dealForm.notes.trim() || undefined
    });

    const latestDeals = StorageService.getOnboardingDeals();
    await StorageService.saveOnboardingDealsResolved(latestDeals);
    setOnboardingDeals(StorageService.getOnboardingDeals());
    setDealForm((current) => ({
      ...current,
      merchantName: '',
      merchantEmail: '',
      notes: ''
    }));
  };

  const updateDealStatus = async (dealId: string, status: OnboardingDeal['status']) => {
    StorageService.updateOnboardingDealStatus(dealId, status);
    await StorageService.saveOnboardingDealsResolved(StorageService.getOnboardingDeals());
    setOnboardingDeals(StorageService.getOnboardingDeals());
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
        <p className="mt-1 text-sm text-gray-500">Centralized intake for merchant onboarding packages, rep ownership, and processor routing.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-500" /> Centralized Onboarding Hub
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter each merchant deal once, assign rep ownership, and route package readiness to the target processor.
            </p>
          </div>
          <span className="text-xs text-gray-500">Open deals: {onboardingDeals.length}</span>
        </div>

        <form onSubmit={(event) => { void createOnboardingDeal(event); }} className="px-6 py-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            value={dealForm.merchantName}
            onChange={(event) => setDealForm((current) => ({ ...current, merchantName: event.target.value }))}
            placeholder="Merchant name"
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            required
          />
          <input
            value={dealForm.merchantEmail}
            onChange={(event) => setDealForm((current) => ({ ...current, merchantEmail: event.target.value }))}
            placeholder="Merchant email"
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
          <select
            value={dealForm.ownerRepName}
            onChange={(event) => setDealForm((current) => ({ ...current, ownerRepName: event.target.value }))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
          >
            {repOptions.length === 0 && <option value="">Unassigned Rep</option>}
            {repOptions.map((rep) => <option key={rep} value={rep}>{rep}</option>)}
          </select>
          <select
            value={dealForm.processorTarget}
            onChange={(event) => setDealForm((current) => ({ ...current, processorTarget: event.target.value as ProcessorTarget }))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
          >
            <option value="stripe">Stripe</option>
            <option value="tsys">TSYS</option>
            <option value="fiserv">Fiserv</option>
            <option value="worldpay">Worldpay</option>
            <option value="global">Global Payments</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
            Add Deal
          </button>
          <input
            value={dealForm.notes}
            onChange={(event) => setDealForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Notes (optional)"
            className="md:col-span-5 px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Merchant', 'Rep Owner', 'Processor', 'Package', 'Status', 'Action'].map((header) => (
                  <th key={header} className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {onboardingDeals.slice(0, 12).map((deal) => (
                <tr key={deal.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{deal.merchantName}</p>
                    <p className="text-xs text-gray-500">{deal.merchantEmail || 'Email pending'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{deal.ownerRepName}</td>
                  <td className="px-4 py-3 text-gray-700 uppercase">{deal.processorTarget}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{deal.packageSummary}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${deal.status === 'submitted'
                      ? 'bg-green-100 text-green-700'
                      : deal.status === 'ready-to-submit'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {deal.status !== 'ready-to-submit' && deal.status !== 'submitted' && (
                      <button
                        onClick={() => { void updateDealStatus(deal.id, 'ready-to-submit'); }}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Mark Ready
                      </button>
                    )}
                    {deal.status === 'ready-to-submit' && (
                      <button
                        onClick={() => { void updateDealStatus(deal.id, 'submitted'); }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:underline"
                      >
                        <Send className="w-3 h-3" /> Submit
                      </button>
                    )}
                    {deal.status === 'submitted' && <span className="text-xs text-gray-400">Completed</span>}
                  </td>
                </tr>
              ))}
              {onboardingDeals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No onboarding deals yet. Create the first merchant deal to start centralized intake.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OnboardingHub;
