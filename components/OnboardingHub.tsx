import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Send } from 'lucide-react';
import { StorageService } from '@/services/storage';
import { OnboardingAddress, OnboardingApplicationData, OnboardingDeal, OnboardingOwnerProfile, ProcessorTarget } from '@/types';

const PROCESSOR_DESTINATION_BY_TARGET: Record<ProcessorTarget, 'stripe-underwriting' | 'tsys-boarding' | 'fiserv-boarding' | 'worldpay-boarding' | 'global-boarding'> = {
  stripe: 'stripe-underwriting',
  tsys: 'tsys-boarding',
  fiserv: 'fiserv-boarding',
  worldpay: 'worldpay-boarding',
  global: 'global-boarding'
};

const inferRepNameFromTeamRow = (row: Record<string, string>): string => {
  const candidates = [row.name, row.repName, row.rep, row.owner, row.ownerRepName, row.fullName]
    .map((value) => (value || '').trim())
    .filter((value) => value.length > 0);
  return candidates[0] || '';
};

const inferRepEmailFromTeamRow = (row: Record<string, string>): string => {
  const candidates = [row.email, row.repEmail, row.ownerEmail, row.workEmail]
    .map((value) => (value || '').trim().toLowerCase())
    .filter((value) => value.length > 0);
  return candidates[0] || '';
};

const emptyAddress = (): OnboardingAddress => ({
  street1: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US'
});

const emptyOwner = (): OnboardingOwnerProfile => ({
  firstName: '',
  lastName: '',
  title: '',
  ownershipPercent: '',
  ssn: '',
  dateOfBirth: '',
  mobilePhone: '',
  email: '',
  personalGuarantee: false,
  address: emptyAddress()
});

const emptyApplicationData = (): OnboardingApplicationData => ({
  contactInformation: {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  },
  businessInformation: {
    legalName: '',
    dbaName: '',
    taxFilingName: '',
    taxIdType: 'ein',
    taxIdValue: '',
    taxFilingMethod: '',
    ownershipType: '',
    businessDescription: '',
    industryMcc: '',
    businessStartDate: '',
    businessPhone: '',
    website: '',
    quasiCash: '',
    stockExchange: '',
    stockTickerSymbol: '',
    taxExempt: false
  },
  businessAddress: emptyAddress(),
  legalMailingAddress: emptyAddress(),
  ownerInformation: {
    primaryOwner: emptyOwner(),
    additionalOwners: [emptyOwner(), emptyOwner(), emptyOwner(), emptyOwner()]
  },
  bankingAndProcessing: {
    modeOfTransaction: {
      inPerson: '',
      telephone: '',
      online: ''
    },
    deliveryWindow: '',
    averageMonthlyCardVolume: '',
    averageTransactionAmount: '',
    depositBankAccount: {
      bankName: '',
      accountType: '',
      routingNumber: '',
      accountNumber: ''
    },
    withdrawalBankAccount: {
      bankName: '',
      accountType: '',
      routingNumber: '',
      accountNumber: ''
    },
    withdrawalSameAsDeposit: true,
    thirdPartyProvider: {
      usesProvider: false,
      name: '',
      email: '',
      phone: ''
    }
  },
  equipment: {
    cloverMenuRequested: false,
    shipToAttention: '',
    shipToEmail: '',
    shipToAddress: emptyAddress(),
    orderNotes: ''
  },
  pricingAndProgram: {
    pricingModel: '',
    discountFrequency: '',
    fundingRollup: '',
    visaCreditDiscountFee: '',
    mastercardCreditDiscountFee: '',
    discoverCreditDiscountFee: '',
    amexCreditDiscountFee: '',
    debitCardDiscountFee: '',
    debitCardTransactionFee: '',
    consumerSurchargeRate: '',
    monthlyAndMiscFees: '',
    surchargeProgramEnabled: false
  },
  agreement: {
    signerName: '',
    signerTitle: '',
    signatureDate: '',
    clientInitials: '',
    earlyTerminationFeeAccepted: false,
    personalGuaranteeAccepted: false
  }
});

type WizardStepId =
  | 'deal'
  | 'contact'
  | 'business'
  | 'addresses'
  | 'owners'
  | 'banking'
  | 'pricing'
  | 'review';

const WIZARD_STEPS: Array<{ id: WizardStepId; label: string; help: string }> = [
  { id: 'deal', label: 'Deal', help: 'Assign rep, processor, and internal notes.' },
  { id: 'contact', label: 'Contact', help: 'Primary contact for the application.' },
  { id: 'business', label: 'Business', help: 'Legal/DBA, tax, and industry details.' },
  { id: 'addresses', label: 'Addresses', help: 'Business + legal mailing addresses.' },
  { id: 'owners', label: 'Owners', help: 'Primary owner and additional owners (2-5).' },
  { id: 'banking', label: 'Banking', help: 'Deposit/withdrawal accounts and processing mix.' },
  { id: 'pricing', label: 'Pricing', help: 'Program, equipment, and agreement acknowledgements.' },
  { id: 'review', label: 'Review', help: 'Validate missing fields and generate package summary.' }
];

const indexOfStep = (id: WizardStepId): number => Math.max(0, WIZARD_STEPS.findIndex((step) => step.id === id));

const OnboardingHub: React.FC = () => {
  const [onboardingDeals, setOnboardingDeals] = useState<OnboardingDeal[]>([]);
  const [repOptions, setRepOptions] = useState<string[]>([]);
  const [internalNotes, setInternalNotes] = useState('');
  const [applicationData, setApplicationData] = useState<OnboardingApplicationData>(() => emptyApplicationData());
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStepId>('deal');
  const currentUser = StorageService.getUser();
  const currentRole = currentUser?.role || 'merchant';
  const currentUserEmail = (currentUser?.email || '').toLowerCase();
  const [scopedRepName, setScopedRepName] = useState('');

  const requiredChecklist = useMemo(() => {
    const businessLegalNameReady = applicationData.businessInformation.legalName.trim().length > 0;
    const contactEmailReady = applicationData.contactInformation.email.includes('@');
    const primaryOwnerReady = applicationData.ownerInformation.primaryOwner.firstName.trim().length > 0
      && applicationData.ownerInformation.primaryOwner.lastName.trim().length > 0;
    const depositAccountReady = applicationData.bankingAndProcessing.depositBankAccount.routingNumber.trim().length > 0
      && applicationData.bankingAndProcessing.depositBankAccount.accountNumber.trim().length > 0;
    const agreementReady = applicationData.agreement.signerName.trim().length > 0
      && applicationData.agreement.signatureDate.trim().length > 0;

    return {
      businessLegalNameReady,
      contactEmailReady,
      primaryOwnerReady,
      depositAccountReady,
      agreementReady,
      isReady: businessLegalNameReady && contactEmailReady && primaryOwnerReady && depositAccountReady && agreementReady
    };
  }, [applicationData]);

  const [merchantIdentity, setMerchantIdentity] = useState({
    ownerRepName: '',
    processorTarget: 'stripe' as ProcessorTarget
  });

  useEffect(() => {
    const load = async () => {
      setOnboardingDeals(await StorageService.getOnboardingDealsResolved());
      const importedTeam = StorageService.getImportedTeam();
      const teamReps = importedTeam
        .map((row) => inferRepNameFromTeamRow(row))
        .filter((name) => name.length > 0);
      const deduped = Array.from(new Set(teamReps));

      const repRowForUser = importedTeam.find((row) => inferRepEmailFromTeamRow(row) === currentUserEmail);
      const inferredScopedRep = repRowForUser ? inferRepNameFromTeamRow(repRowForUser) : '';
      setScopedRepName(inferredScopedRep);
      setRepOptions(deduped);
      setMerchantIdentity((current) => ({
        ...current,
        ownerRepName: inferredScopedRep || current.ownerRepName || deduped[0] || ''
      }));
    };

    void load();
    const onUpdate = () => {
      void load();
    };
    window.addEventListener('user-update', onUpdate);
    return () => window.removeEventListener('user-update', onUpdate);
  }, [currentUserEmail]);

  const isScopedRep = currentRole !== 'overseer' && scopedRepName.trim().length > 0;
  const visibleDeals = useMemo(() => {
    if (!isScopedRep) return onboardingDeals;
    const scoped = scopedRepName.trim().toLowerCase();
    return onboardingDeals.filter((deal) => deal.ownerRepName.trim().toLowerCase() === scoped);
  }, [isScopedRep, onboardingDeals, scopedRepName]);

  const activeDeal = useMemo(() => {
    if (!activeDealId) return null;
    return onboardingDeals.find((deal) => deal.id === activeDealId) || null;
  }, [activeDealId, onboardingDeals]);

  const computeMissingFields = () => {
    const missingFields = [
      requiredChecklist.businessLegalNameReady ? null : 'Business Legal Name',
      requiredChecklist.contactEmailReady ? null : 'Contact Email',
      requiredChecklist.primaryOwnerReady ? null : 'Primary Owner Name',
      requiredChecklist.depositAccountReady ? null : 'Deposit Account Routing/Number',
      requiredChecklist.agreementReady ? null : 'Signature Name/Date'
    ].filter(Boolean);
    return missingFields.filter((field): field is string => typeof field === 'string');
  };

  const persistDeals = async (nextDeals: OnboardingDeal[]) => {
    await StorageService.saveOnboardingDealsResolved(nextDeals);
    setOnboardingDeals(StorageService.getOnboardingDeals());
  };

  const resetWizard = () => {
    setActiveDealId(null);
    setWizardStep('deal');
    setInternalNotes('');
    setApplicationData(emptyApplicationData());
    setMerchantIdentity((current) => ({
      ...current,
      ownerRepName: isScopedRep ? scopedRepName.trim() : current.ownerRepName,
      processorTarget: 'stripe'
    }));
  };

  const loadDealIntoWizard = (deal: OnboardingDeal) => {
    if (isScopedRep && deal.ownerRepName.trim().toLowerCase() !== scopedRepName.trim().toLowerCase()) return;
    setActiveDealId(deal.id);
    setWizardStep('deal');
    setInternalNotes(deal.notes || '');
    setApplicationData(deal.applicationData || emptyApplicationData());
    setMerchantIdentity({
      ownerRepName: deal.ownerRepName || '',
      processorTarget: deal.processorTarget || 'stripe'
    });
  };

  const upsertActiveDeal = async (nextStatus?: OnboardingDeal['status']) => {
    const merchantName = applicationData.businessInformation.dbaName.trim() || applicationData.businessInformation.legalName.trim();
    const merchantEmail = applicationData.contactInformation.email.trim();
    if (!merchantName) return;

    const normalizedMissingFields = computeMissingFields();
    const resolvedOwnerRepName = isScopedRep
      ? scopedRepName.trim()
      : merchantIdentity.ownerRepName.trim() || 'Unassigned Rep';

    const computedStatus: OnboardingDeal['status'] = nextStatus
      ? nextStatus
      : requiredChecklist.isReady
        ? 'ready-to-submit'
        : 'validation-required';

    const packageSummary = requiredChecklist.isReady
      ? `${merchantIdentity.processorTarget.toUpperCase()} package mapped to ${PROCESSOR_DESTINATION_BY_TARGET[merchantIdentity.processorTarget]} and ready for underwriting review`
      : `Missing required fields: ${normalizedMissingFields.join(', ')}`;

    const now = Date.now();
    const base: Omit<OnboardingDeal, 'id' | 'createdAt' | 'updatedAt'> = {
      merchantName,
      merchantEmail,
      ownerRepName: resolvedOwnerRepName,
      processorTarget: merchantIdentity.processorTarget,
      status: computedStatus,
      packageSummary,
      onboardingPackage: {
        processorTarget: merchantIdentity.processorTarget,
        destinationSystem: PROCESSOR_DESTINATION_BY_TARGET[merchantIdentity.processorTarget],
        readiness: requiredChecklist.isReady ? 'ready' : 'incomplete',
        missingFields: normalizedMissingFields,
        generatedAt: now
      },
      notes: internalNotes.trim() || undefined,
      applicationData
    };

    if (!activeDealId) {
      const created = StorageService.addOnboardingDeal(base);
      setActiveDealId(created.id);
      await persistDeals(StorageService.getOnboardingDeals());
      return;
    }

    const nextDeals = onboardingDeals.map((deal) => {
      if (deal.id !== activeDealId) return deal;
      return {
        ...deal,
        ...base,
        updatedAt: now,
        submittedAt: computedStatus === 'submitted' ? now : deal.submittedAt
      };
    });

    StorageService.saveOnboardingDeals(nextDeals);
    await persistDeals(nextDeals);
  };

  const updateDealStatus = async (dealId: string, status: OnboardingDeal['status']) => {
    const targetDeal = onboardingDeals.find((deal) => deal.id === dealId);
    if (!targetDeal) return;
    if (isScopedRep && targetDeal.ownerRepName.trim().toLowerCase() !== scopedRepName.trim().toLowerCase()) {
      return;
    }

    StorageService.updateOnboardingDealStatus(dealId, status);
    await StorageService.saveOnboardingDealsResolved(StorageService.getOnboardingDeals());
    setOnboardingDeals(StorageService.getOnboardingDeals());
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
        <p className="mt-1 text-sm text-gray-500">MPA-aligned onboarding capture for business, owners, banking, pricing, and agreement sign-off.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-500" /> Merchant Onboarding Wizard (MPA)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Form sections mirror the Merchant Processing Application: business details, owner information, banking, processing, pricing, and agreement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Open deals: {visibleDeals.length}</span>
            <button
              type="button"
              onClick={resetWizard}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Start New
            </button>
            <button
              type="button"
              onClick={() => { void upsertActiveDeal('validation-required'); }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => { void upsertActiveDeal(requiredChecklist.isReady ? 'ready-to-submit' : 'validation-required'); }}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              Save Package
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Wizard step</p>
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{WIZARD_STEPS[indexOfStep(wizardStep)]?.label}</span>
                  <span className="text-gray-500"> · {WIZARD_STEPS[indexOfStep(wizardStep)]?.help}</span>
                </p>
                {activeDeal && (
                  <p className="mt-1 text-xs text-gray-500">
                    Editing: <span className="font-semibold text-gray-800">{activeDeal.merchantName}</span> · status <span className="font-mono">{activeDeal.status}</span>
                  </p>
                )}
                {!activeDeal && (
                  <p className="mt-1 text-xs text-gray-500">
                    New deal draft (not saved yet). Enter at least a business legal name to save.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(WIZARD_STEPS[Math.max(0, indexOfStep(wizardStep) - 1)]?.id || 'deal')}
                  disabled={indexOfStep(wizardStep) === 0}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(WIZARD_STEPS[Math.min(WIZARD_STEPS.length - 1, indexOfStep(wizardStep) + 1)]?.id || 'review')}
                  disabled={indexOfStep(wizardStep) >= WIZARD_STEPS.length - 1}
                  className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-40"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => { void upsertActiveDeal('submitted'); }}
                  disabled={!requiredChecklist.isReady}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-40"
                >
                  <Send className="w-3 h-3" /> Submit
                </button>
              </div>
            </div>

            {isScopedRep && (
              <p className="text-xs text-indigo-700">Scoped rep mode: this user can only create and manage onboarding deals assigned to {scopedRepName}.</p>
            )}

            <div className="flex flex-wrap gap-2">
              {WIZARD_STEPS.map((step) => {
                const isActive = step.id === wizardStep;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setWizardStep(step.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {wizardStep === 'deal' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <label className="text-xs text-gray-600">
                  Rep owner
                  <select
                    value={merchantIdentity.ownerRepName}
                    onChange={(event) => setMerchantIdentity((current) => ({ ...current, ownerRepName: event.target.value }))}
                    disabled={isScopedRep}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                  >
                    {repOptions.length === 0 && <option value="">Unassigned Rep</option>}
                    {repOptions.map((rep) => <option key={rep} value={rep}>{rep}</option>)}
                  </select>
                </label>
                <label className="text-xs text-gray-600">
                  Processor target
                  <select
                    value={merchantIdentity.processorTarget}
                    onChange={(event) => setMerchantIdentity((current) => ({ ...current, processorTarget: event.target.value as ProcessorTarget }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="tsys">TSYS</option>
                    <option value="fiserv">Fiserv</option>
                    <option value="worldpay">Worldpay</option>
                    <option value="global">Global Payments</option>
                  </select>
                </label>
                <label className="text-xs text-gray-600">
                  Internal notes
                  <input
                    value={internalNotes}
                    onChange={(event) => setInternalNotes(event.target.value)}
                    placeholder="Internal notes"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Continue draft</p>
                <p className="text-xs text-gray-500 mt-1">Pick an existing deal to resume editing the MPA. (Scoped reps only see their deals.)</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {visibleDeals
                    .filter((deal) => deal.status !== 'submitted')
                    .slice(0, 9)
                    .map((deal) => (
                      <button
                        key={deal.id}
                        type="button"
                        onClick={() => loadDealIntoWizard(deal)}
                        className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                          deal.id === activeDealId
                            ? 'border-indigo-600 bg-white'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-semibold text-gray-900 truncate">{deal.merchantName}</p>
                        <p className="text-gray-500 truncate">{deal.ownerRepName} · {deal.processorTarget.toUpperCase()}</p>
                        <p className="mt-1 font-mono text-[11px] text-gray-500">{deal.status}</p>
                      </button>
                    ))}
                  {visibleDeals.filter((deal) => deal.status !== 'submitted').length === 0 && (
                    <div className="text-xs text-gray-500">No drafts yet. Start a new deal above.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {wizardStep === 'contact' && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input value={applicationData.contactInformation.firstName} onChange={(event) => setApplicationData((current) => ({ ...current, contactInformation: { ...current.contactInformation, firstName: event.target.value } }))} placeholder="First Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.contactInformation.lastName} onChange={(event) => setApplicationData((current) => ({ ...current, contactInformation: { ...current.contactInformation, lastName: event.target.value } }))} placeholder="Last Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.contactInformation.email} onChange={(event) => setApplicationData((current) => ({ ...current, contactInformation: { ...current.contactInformation, email: event.target.value } }))} placeholder="Email" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.contactInformation.phoneNumber} onChange={(event) => setApplicationData((current) => ({ ...current, contactInformation: { ...current.contactInformation, phoneNumber: event.target.value } }))} placeholder="Phone Number" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
            </div>
          )}

          {wizardStep === 'business' && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input value={applicationData.businessInformation.legalName} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, legalName: event.target.value } }))} placeholder="Business Legal Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.businessInformation.dbaName} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, dbaName: event.target.value } }))} placeholder="DBA Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.businessInformation.taxFilingName} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, taxFilingName: event.target.value } }))} placeholder="Tax Filing Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.businessInformation.taxFilingMethod} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, taxFilingMethod: event.target.value } }))} placeholder="Tax Filing Method" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />

                <select value={applicationData.businessInformation.taxIdType} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, taxIdType: event.target.value as 'ein' | 'ssn' } }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                  <option value="ein">EIN</option>
                  <option value="ssn">SSN</option>
                </select>
                <input value={applicationData.businessInformation.taxIdValue} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, taxIdValue: event.target.value } }))} placeholder="Tax ID (EIN/SSN)" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.businessInformation.ownershipType} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, ownershipType: event.target.value } }))} placeholder="Type of Ownership" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.businessInformation.industryMcc} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, industryMcc: event.target.value } }))} placeholder="Industry (MCC)" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />

                <input value={applicationData.businessInformation.businessDescription} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, businessDescription: event.target.value } }))} placeholder="Business Description" className="md:col-span-2 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input type="date" value={applicationData.businessInformation.businessStartDate} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, businessStartDate: event.target.value } }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.businessInformation.businessPhone} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, businessPhone: event.target.value } }))} placeholder="Business Phone" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />

                <input value={applicationData.businessInformation.website} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, website: event.target.value } }))} placeholder="Website" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.businessInformation.quasiCash} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, quasiCash: event.target.value } }))} placeholder="Quasi Cash" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.businessInformation.stockExchange} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, stockExchange: event.target.value } }))} placeholder="Stock Exchange" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.businessInformation.stockTickerSymbol} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, stockTickerSymbol: event.target.value } }))} placeholder="Stock Ticker Symbol" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
            </div>
          )}

          {wizardStep === 'review' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Readiness</p>
                  <p className={`mt-1 text-sm font-semibold ${requiredChecklist.isReady ? 'text-green-700' : 'text-amber-700'}`}>
                    {requiredChecklist.isReady ? 'Ready to submit' : 'Missing required fields'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Destination system: <span className="font-mono">{PROCESSOR_DESTINATION_BY_TARGET[merchantIdentity.processorTarget]}</span>
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 w-full md:max-w-md">
                  <p className="text-xs font-semibold text-gray-700">Package summary</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {requiredChecklist.isReady
                      ? `${merchantIdentity.processorTarget.toUpperCase()} package mapped to ${PROCESSOR_DESTINATION_BY_TARGET[merchantIdentity.processorTarget]} and ready for underwriting review`
                      : `Missing required fields: ${computeMissingFields().join(', ') || '—'}`}
                  </p>
                </div>
              </div>

              {!requiredChecklist.isReady && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-800">Missing fields</p>
                  <ul className="mt-2 list-disc pl-5 text-xs text-amber-800">
                    {computeMissingFields().map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing sections below (addresses, owners, banking, equipment/pricing/agreement, deal table) remain unchanged.
            They are now conditionally shown by wizard step above; the original full-form layout is intentionally preserved
            to minimize data-shape churn during the summer program rollout. */}

        {/* Addresses */}
        {wizardStep === 'addresses' && (
          <div className="px-6 pb-6">
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Business Address & Legal Mailing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Address</p>
                <input value={applicationData.businessAddress.street1} onChange={(event) => setApplicationData((current) => ({ ...current, businessAddress: { ...current.businessAddress, street1: event.target.value } }))} placeholder="Street Address 1" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.businessAddress.street2 || ''} onChange={(event) => setApplicationData((current) => ({ ...current, businessAddress: { ...current.businessAddress, street2: event.target.value } }))} placeholder="Street Address 2" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={applicationData.businessAddress.city} onChange={(event) => setApplicationData((current) => ({ ...current, businessAddress: { ...current.businessAddress, city: event.target.value } }))} placeholder="City" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                  <input value={applicationData.businessAddress.state} onChange={(event) => setApplicationData((current) => ({ ...current, businessAddress: { ...current.businessAddress, state: event.target.value } }))} placeholder="State" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={applicationData.businessAddress.zip} onChange={(event) => setApplicationData((current) => ({ ...current, businessAddress: { ...current.businessAddress, zip: event.target.value } }))} placeholder="ZIP" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                  <input value={applicationData.businessAddress.country} onChange={(event) => setApplicationData((current) => ({ ...current, businessAddress: { ...current.businessAddress, country: event.target.value } }))} placeholder="Country" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Legal Mailing Address</p>
                <input value={applicationData.legalMailingAddress.street1} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, street1: event.target.value } }))} placeholder="Street Address 1" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.legalMailingAddress.street2 || ''} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, street2: event.target.value } }))} placeholder="Street Address 2" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={applicationData.legalMailingAddress.city} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, city: event.target.value } }))} placeholder="City" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                  <input value={applicationData.legalMailingAddress.state} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, state: event.target.value } }))} placeholder="State" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={applicationData.legalMailingAddress.zip} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, zip: event.target.value } }))} placeholder="ZIP" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                  <input value={applicationData.legalMailingAddress.country} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, country: event.target.value } }))} placeholder="Country" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {wizardStep === 'owners' && (
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Business Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={applicationData.ownerInformation.primaryOwner.firstName} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, firstName: event.target.value } } }))} placeholder="Primary Owner First Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.ownerInformation.primaryOwner.lastName} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, lastName: event.target.value } } }))} placeholder="Primary Owner Last Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.ownerInformation.primaryOwner.title || ''} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, title: event.target.value } } }))} placeholder="Title" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input value={applicationData.ownerInformation.primaryOwner.ownershipPercent || ''} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, ownershipPercent: event.target.value } } }))} placeholder="Ownership %" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.ownerInformation.primaryOwner.ssn || ''} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, ssn: event.target.value } } }))} placeholder="SSN" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input type="date" value={applicationData.ownerInformation.primaryOwner.dateOfBirth || ''} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, dateOfBirth: event.target.value } } }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.ownerInformation.primaryOwner.mobilePhone || ''} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, mobilePhone: event.target.value } } }))} placeholder="Mobile Phone" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>
            <textarea
              rows={4}
              value={applicationData.ownerInformation.additionalOwners
                .map((owner, index) => `Owner ${index + 2}: ${owner.firstName} ${owner.lastName} | % ${owner.ownershipPercent || ''} | SSN ${owner.ssn || ''} | DOB ${owner.dateOfBirth || ''}`)
                .join('\n')}
              onChange={(event) => {
                const lines = event.target.value.split('\n');
                const owners = [0, 1, 2, 3].map((index) => {
                  const text = lines[index] || '';
                  const noLabel = text.includes(':') ? text.split(':').slice(1).join(':').trim() : text.trim();
                  const [namePart = '', ownershipPart = '', ssnPart = '', dobPart = ''] = noLabel.split('|').map((part) => part.trim());
                  const [firstName = '', ...lastNameParts] = namePart.replace(/^Owner\s+\d+\s*/i, '').trim().split(' ').filter(Boolean);
                  const lastName = lastNameParts.join(' ');
                  const ownershipPercent = ownershipPart.replace(/^%\s*/i, '').trim();
                  const ssn = ssnPart.replace(/^SSN\s*/i, '').trim();
                  const dateOfBirth = dobPart.replace(/^DOB\s*/i, '').trim();
                  return {
                    ...emptyOwner(),
                    firstName,
                    lastName,
                    ownershipPercent,
                    ssn,
                    dateOfBirth
                  };
                });
                setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, additionalOwners: owners } }));
              }}
              placeholder="Additional Business Owner (2-5) lines: First Last | % 25 | SSN XXX-XX-XXXX | DOB YYYY-MM-DD"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>
        )}

        {wizardStep === 'banking' && (
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Banking and Processing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={applicationData.bankingAndProcessing.modeOfTransaction.inPerson} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, modeOfTransaction: { ...current.bankingAndProcessing.modeOfTransaction, inPerson: event.target.value } } }))} placeholder="In Person %" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.bankingAndProcessing.modeOfTransaction.telephone} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, modeOfTransaction: { ...current.bankingAndProcessing.modeOfTransaction, telephone: event.target.value } } }))} placeholder="Telephone %" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.bankingAndProcessing.modeOfTransaction.online} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, modeOfTransaction: { ...current.bankingAndProcessing.modeOfTransaction, online: event.target.value } } }))} placeholder="Online %" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={applicationData.bankingAndProcessing.deliveryWindow} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, deliveryWindow: event.target.value as OnboardingApplicationData['bankingAndProcessing']['deliveryWindow'] } }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                <option value="">Delivery Window</option>
                <option value="same-day">Same Day</option>
                <option value="0-7">0-7 Days</option>
                <option value="8-14">8-14 Days</option>
                <option value="15-30">15-30 Days</option>
                <option value="30+">30+ Days</option>
              </select>
              <input value={applicationData.bankingAndProcessing.averageMonthlyCardVolume} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, averageMonthlyCardVolume: event.target.value } }))} placeholder="Average Monthly Card Volume" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.bankingAndProcessing.averageTransactionAmount} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, averageTransactionAmount: event.target.value } }))} placeholder="Average Transaction Amount" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
                <input type="checkbox" checked={applicationData.bankingAndProcessing.withdrawalSameAsDeposit} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, withdrawalSameAsDeposit: event.target.checked } }))} />
                Withdrawal = Deposit Account
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input value={applicationData.bankingAndProcessing.depositBankAccount.bankName} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, depositBankAccount: { ...current.bankingAndProcessing.depositBankAccount, bankName: event.target.value } } }))} placeholder="Deposit Bank Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <select value={applicationData.bankingAndProcessing.depositBankAccount.accountType} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, depositBankAccount: { ...current.bankingAndProcessing.depositBankAccount, accountType: event.target.value as 'checking' | 'savings' | '' } } }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                <option value="">Deposit Account Type</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
              <input value={applicationData.bankingAndProcessing.depositBankAccount.routingNumber} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, depositBankAccount: { ...current.bankingAndProcessing.depositBankAccount, routingNumber: event.target.value } } }))} placeholder="Deposit Routing Number" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.bankingAndProcessing.depositBankAccount.accountNumber} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, depositBankAccount: { ...current.bankingAndProcessing.depositBankAccount, accountNumber: event.target.value } } }))} placeholder="Deposit Account Number" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>

            {!applicationData.bankingAndProcessing.withdrawalSameAsDeposit && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input value={applicationData.bankingAndProcessing.withdrawalBankAccount.bankName} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, withdrawalBankAccount: { ...current.bankingAndProcessing.withdrawalBankAccount, bankName: event.target.value } } }))} placeholder="Withdrawal Bank Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <select value={applicationData.bankingAndProcessing.withdrawalBankAccount.accountType} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, withdrawalBankAccount: { ...current.bankingAndProcessing.withdrawalBankAccount, accountType: event.target.value as 'checking' | 'savings' | '' } } }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                  <option value="">Withdrawal Account Type</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
                <input value={applicationData.bankingAndProcessing.withdrawalBankAccount.routingNumber} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, withdrawalBankAccount: { ...current.bankingAndProcessing.withdrawalBankAccount, routingNumber: event.target.value } } }))} placeholder="Withdrawal Routing Number" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input value={applicationData.bankingAndProcessing.withdrawalBankAccount.accountNumber} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, withdrawalBankAccount: { ...current.bankingAndProcessing.withdrawalBankAccount, accountNumber: event.target.value } } }))} placeholder="Withdrawal Account Number" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
                <input type="checkbox" checked={applicationData.bankingAndProcessing.thirdPartyProvider.usesProvider} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, thirdPartyProvider: { ...current.bankingAndProcessing.thirdPartyProvider, usesProvider: event.target.checked } } }))} />
                Uses Third Party Provider
              </label>
              <input value={applicationData.bankingAndProcessing.thirdPartyProvider.name || ''} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, thirdPartyProvider: { ...current.bankingAndProcessing.thirdPartyProvider, name: event.target.value } } }))} placeholder="TPP Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.bankingAndProcessing.thirdPartyProvider.email || ''} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, thirdPartyProvider: { ...current.bankingAndProcessing.thirdPartyProvider, email: event.target.value } } }))} placeholder="TPP Email" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.bankingAndProcessing.thirdPartyProvider.phone || ''} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, thirdPartyProvider: { ...current.bankingAndProcessing.thirdPartyProvider, phone: event.target.value } } }))} placeholder="TPP Phone" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>
          </div>
        )}

        {wizardStep === 'pricing' && (
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Equipment, Pricing, and Agreement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
                <input type="checkbox" checked={applicationData.equipment.cloverMenuRequested} onChange={(event) => setApplicationData((current) => ({ ...current, equipment: { ...current.equipment, cloverMenuRequested: event.target.checked } }))} />
                Clover Menu Requested
              </label>
              <input value={applicationData.equipment.shipToAttention} onChange={(event) => setApplicationData((current) => ({ ...current, equipment: { ...current.equipment, shipToAttention: event.target.value } }))} placeholder="Ship To Attention" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.equipment.shipToEmail} onChange={(event) => setApplicationData((current) => ({ ...current, equipment: { ...current.equipment, shipToEmail: event.target.value } }))} placeholder="Ship To Email" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={applicationData.pricingAndProgram.pricingModel} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, pricingModel: event.target.value as OnboardingApplicationData['pricingAndProgram']['pricingModel'] } }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                <option value="">Pricing Model</option>
                <option value="flat-rate">Flat Rate</option>
                <option value="swiped-non-swiped">Swiped / Non-Swiped</option>
                <option value="bill-back">Bill Back</option>
                <option value="interchange-plus">Interchange Plus</option>
                <option value="tiered">Tiered</option>
              </select>
              <select value={applicationData.pricingAndProgram.discountFrequency} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, discountFrequency: event.target.value as OnboardingApplicationData['pricingAndProgram']['discountFrequency'] } }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                <option value="">Discount Frequency</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
              <select value={applicationData.pricingAndProgram.fundingRollup} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, fundingRollup: event.target.value as OnboardingApplicationData['pricingAndProgram']['fundingRollup'] } }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                <option value="">Funding Rollup</option>
                <option value="individual-batches">Individual Batches</option>
                <option value="separate-fees-and-deposits">Separate Fees and Deposits</option>
                <option value="net-fees-and-deposits">Net Fees and Deposits</option>
              </select>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
                <input type="checkbox" checked={applicationData.pricingAndProgram.surchargeProgramEnabled} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, surchargeProgramEnabled: event.target.checked } }))} />
                Merchant Surcharge Program
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={applicationData.pricingAndProgram.visaCreditDiscountFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, visaCreditDiscountFee: event.target.value } }))} placeholder="Visa Credit Card Discount Fee" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.pricingAndProgram.mastercardCreditDiscountFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, mastercardCreditDiscountFee: event.target.value } }))} placeholder="Mastercard Credit Card Discount Fee" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.pricingAndProgram.discoverCreditDiscountFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, discoverCreditDiscountFee: event.target.value } }))} placeholder="Discover Credit Card Discount Fee" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.pricingAndProgram.amexCreditDiscountFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, amexCreditDiscountFee: event.target.value } }))} placeholder="Amex Credit Card Discount Fee" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.pricingAndProgram.debitCardDiscountFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, debitCardDiscountFee: event.target.value } }))} placeholder="Debit Card Discount Fee" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.pricingAndProgram.debitCardTransactionFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, debitCardTransactionFee: event.target.value } }))} placeholder="Debit Card Transaction Fee" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>

            <textarea value={applicationData.pricingAndProgram.monthlyAndMiscFees} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, monthlyAndMiscFees: event.target.value } }))} placeholder="Monthly and Miscellaneous Fees (statement, PCI, chargeback, gateway, etc.)" rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input value={applicationData.agreement.signerName} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, signerName: event.target.value } }))} placeholder="Signer Name" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.agreement.signerTitle} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, signerTitle: event.target.value } }))} placeholder="Signer Title" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input type="date" value={applicationData.agreement.signatureDate} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, signatureDate: event.target.value } }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.agreement.clientInitials} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, clientInitials: event.target.value } }))} placeholder="Client Initials" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={applicationData.pricingAndProgram.consumerSurchargeRate} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, consumerSurchargeRate: event.target.value } }))} placeholder="Consumer Surcharge Rate" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
                <input type="checkbox" checked={applicationData.agreement.earlyTerminationFeeAccepted} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, earlyTerminationFeeAccepted: event.target.checked } }))} />
                Early Termination Fee acknowledged
              </label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
                <input type="checkbox" checked={applicationData.agreement.personalGuaranteeAccepted} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, personalGuaranteeAccepted: event.target.checked } }))} />
                Personal Guarantee acknowledged
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className={`text-xs font-semibold ${requiredChecklist.isReady ? 'text-green-700' : 'text-amber-700'}`}>
              {requiredChecklist.isReady ? 'Application is ready for submission.' : 'Application is missing required fields before submission.'}
            </p>
              <button
                type="button"
                onClick={() => { void upsertActiveDeal(requiredChecklist.isReady ? 'ready-to-submit' : 'validation-required'); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
              >
                Save Package
              </button>
          </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Merchant', 'Rep Owner', 'Processor', 'Destination', 'Package', 'Status', 'Action'].map((header) => (
                  <th key={header} className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleDeals.slice(0, 12).map((deal) => (
                <tr key={deal.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{deal.merchantName}</p>
                    <p className="text-xs text-gray-500">{deal.merchantEmail || 'Email pending'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{deal.ownerRepName}</td>
                  <td className="px-4 py-3 text-gray-700 uppercase">{deal.processorTarget}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">{deal.onboardingPackage?.destinationSystem || PROCESSOR_DESTINATION_BY_TARGET[deal.processorTarget]}</td>
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
              {visibleDeals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
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
