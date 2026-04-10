import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ClipboardList, Send } from 'lucide-react';
import { StorageService } from '@/services/storage';
import { OnboardingAddress, OnboardingApplicationData, OnboardingDeal, OnboardingOwnerProfile, ProcessorTarget } from '@/types';

const WIZARD_STEPS = [
  { id: 'setup', label: 'Setup' },
  { id: 'contact', label: 'Contact' },
  { id: 'business', label: 'Business' },
  { id: 'address', label: 'Address' },
  { id: 'owners', label: 'Owners' },
  { id: 'banking', label: 'Banking' },
  { id: 'pricing', label: 'Pricing & Agreement' }
] as const;

const ONBOARDING_WIZARD_DRAFT_KEY = 'one82_onboarding_wizard_draft_v1';

type WizardStepId = typeof WIZARD_STEPS[number]['id'];
type WizardStepValidation = { valid: boolean; missing: string[] };

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

type OnboardingWizardDraft = {
  v: 1;
  wizardStep: number;
  applicationData: OnboardingApplicationData;
  merchantIdentity: { ownerRepName: string; processorTarget: ProcessorTarget };
  internalNotes: string;
  legalSameAsBusiness: boolean;
  coOwnerVisibleCount: number;
};

function loadWizardDraft(): OnboardingWizardDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_WIZARD_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingWizardDraft>;
    if (parsed?.v !== 1 || !parsed.applicationData) return null;
    let coOwnerVisibleCount = typeof parsed.coOwnerVisibleCount === 'number' ? parsed.coOwnerVisibleCount : 0;
    if (coOwnerVisibleCount === 0 && parsed.applicationData?.ownerInformation?.additionalOwners) {
      let maxIdx = -1;
      parsed.applicationData.ownerInformation.additionalOwners.forEach((o, i) => {
        const has = [o.firstName, o.lastName, o.ownershipPercent, o.ssn, o.dateOfBirth, o.mobilePhone, o.email].some((v) => String(v || '').trim().length > 0);
        if (has) maxIdx = i;
      });
      if (maxIdx >= 0) coOwnerVisibleCount = maxIdx + 1;
    }
    return {
      v: 1,
      wizardStep: typeof parsed.wizardStep === 'number' ? Math.min(WIZARD_STEPS.length - 1, Math.max(0, parsed.wizardStep)) : 0,
      applicationData: parsed.applicationData,
      merchantIdentity: {
        ownerRepName: parsed.merchantIdentity?.ownerRepName ?? '',
        processorTarget: (parsed.merchantIdentity?.processorTarget as ProcessorTarget) || 'stripe'
      },
      internalNotes: typeof parsed.internalNotes === 'string' ? parsed.internalNotes : '',
      legalSameAsBusiness: parsed.legalSameAsBusiness !== false,
      coOwnerVisibleCount: Math.min(4, Math.max(0, coOwnerVisibleCount))
    };
  } catch {
    return null;
  }
}

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

const OnboardingHub: React.FC = () => {
  const initialDraft = loadWizardDraft();
  const [onboardingDeals, setOnboardingDeals] = useState<OnboardingDeal[]>([]);
  const [repOptions, setRepOptions] = useState<string[]>([]);
  const [internalNotes, setInternalNotes] = useState(initialDraft?.internalNotes ?? '');
  const [wizardStep, setWizardStep] = useState(initialDraft?.wizardStep ?? 0);
  const [wizardValidationMessage, setWizardValidationMessage] = useState('');
  const [applicationData, setApplicationData] = useState<OnboardingApplicationData>(() => initialDraft?.applicationData ?? emptyApplicationData());
  const [legalSameAsBusiness, setLegalSameAsBusiness] = useState(initialDraft?.legalSameAsBusiness !== false);
  const [submitSuccess, setSubmitSuccess] = useState<{ merchantName: string } | null>(null);
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showOptionalPricingDetails, setShowOptionalPricingDetails] = useState(false);

  const [coOwnerVisibleCount, setCoOwnerVisibleCount] = useState(() => {
    if (initialDraft?.coOwnerVisibleCount !== undefined) {
      return Math.min(4, Math.max(0, initialDraft.coOwnerVisibleCount));
    }
    if (!initialDraft?.applicationData) return 0;
    let max = -1;
    initialDraft.applicationData.ownerInformation.additionalOwners.forEach((o, i) => {
      const has = [o.firstName, o.lastName, o.ownershipPercent, o.ssn, o.dateOfBirth, o.mobilePhone, o.email].some((v) => String(v || '').trim().length > 0);
      if (has) max = i;
    });
    return max < 0 ? 0 : Math.min(4, max + 1);
  });
  const currentUser = StorageService.getUser();
  const currentRole = currentUser?.role || 'merchant';
  const currentUserEmail = (currentUser?.email || '').toLowerCase();
  const [scopedRepName, setScopedRepName] = useState('');
  const isScopedRep = currentRole !== 'overseer' && scopedRepName.trim().length > 0;

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
    ownerRepName: initialDraft?.merchantIdentity.ownerRepName ?? '',
    processorTarget: (initialDraft?.merchantIdentity.processorTarget ?? 'stripe') as ProcessorTarget
  });

  const activeStep = WIZARD_STEPS[wizardStep];
  const activeStepId: WizardStepId = activeStep.id;
  const isFirstStep = wizardStep === 0;
  const isLastStep = wizardStep === WIZARD_STEPS.length - 1;

  const stepValidationById = useMemo<Record<WizardStepId, WizardStepValidation>>(() => {
    const setupMissing = isScopedRep || repOptions.length === 0
      ? []
      : (merchantIdentity.ownerRepName.trim().length > 0 ? [] : ['Rep Owner']);
    const contactMissing = [
      applicationData.contactInformation.firstName.trim().length > 0 ? null : 'Contact First Name',
      applicationData.contactInformation.lastName.trim().length > 0 ? null : 'Contact Last Name',
      applicationData.contactInformation.email.includes('@') ? null : 'Valid Contact Email'
    ].filter(Boolean) as string[];
    const businessMissing = [
      applicationData.businessInformation.legalName.trim().length > 0 ? null : 'Business Legal Name'
    ].filter(Boolean) as string[];
    const addressMissing = [
      applicationData.businessAddress.street1.trim().length > 0 ? null : 'Business Street Address',
      applicationData.businessAddress.city.trim().length > 0 ? null : 'Business City',
      applicationData.businessAddress.state.trim().length > 0 ? null : 'Business State',
      applicationData.businessAddress.zip.trim().length > 0 ? null : 'Business ZIP'
    ].filter(Boolean) as string[];
    const ownersMissing = [
      applicationData.ownerInformation.primaryOwner.firstName.trim().length > 0 ? null : 'Primary Owner First Name',
      applicationData.ownerInformation.primaryOwner.lastName.trim().length > 0 ? null : 'Primary Owner Last Name'
    ].filter(Boolean) as string[];
    const bankingMissing = [
      applicationData.bankingAndProcessing.depositBankAccount.routingNumber.trim().length > 0 ? null : 'Deposit Routing Number',
      applicationData.bankingAndProcessing.depositBankAccount.accountNumber.trim().length > 0 ? null : 'Deposit Account Number'
    ].filter(Boolean) as string[];
    const pricingMissing = [
      applicationData.agreement.signerName.trim().length > 0 ? null : 'Signer Name',
      applicationData.agreement.signatureDate.trim().length > 0 ? null : 'Signature Date'
    ].filter(Boolean) as string[];

    return {
      setup: { valid: setupMissing.length === 0, missing: setupMissing },
      contact: { valid: contactMissing.length === 0, missing: contactMissing },
      business: { valid: businessMissing.length === 0, missing: businessMissing },
      address: { valid: addressMissing.length === 0, missing: addressMissing },
      owners: { valid: ownersMissing.length === 0, missing: ownersMissing },
      banking: { valid: bankingMissing.length === 0, missing: bankingMissing },
      pricing: { valid: pricingMissing.length === 0, missing: pricingMissing }
    };
  }, [applicationData, isScopedRep, merchantIdentity.ownerRepName, repOptions.length]);

  const activeStepValidation = stepValidationById[activeStepId];

  const stepsCompleteCount = useMemo(
    () => WIZARD_STEPS.filter((step) => stepValidationById[step.id].valid).length,
    [stepValidationById]
  );

  const buildStepValidationMessage = (stepId: WizardStepId): string => {
    const targetStep = WIZARD_STEPS.find((step) => step.id === stepId);
    const missing = stepValidationById[stepId].missing;
    return `${targetStep?.label || 'Step'} requires: ${missing.join(', ')}`;
  };

  const handleStepClick = (targetStepIndex: number) => {
    if (targetStepIndex <= wizardStep) {
      setWizardValidationMessage('');
      setWizardStep(targetStepIndex);
      return;
    }

    for (let i = 0; i < targetStepIndex; i++) {
      const stepId = WIZARD_STEPS[i].id;
      if (!stepValidationById[stepId].valid) {
        setWizardStep(i);
        setWizardValidationMessage(buildStepValidationMessage(stepId));
        return;
      }
    }

    setWizardValidationMessage('');
    setWizardStep(targetStepIndex);
  };

  const handleNextStep = () => {
    if (!activeStepValidation.valid) {
      setWizardValidationMessage(buildStepValidationMessage(activeStepId));
      return;
    }
    setWizardValidationMessage('');
    setWizardStep((current) => Math.min(WIZARD_STEPS.length - 1, current + 1));
  };

  useEffect(() => {
    if (activeStepValidation.valid && wizardValidationMessage) {
      setWizardValidationMessage('');
    }
  }, [activeStepValidation.valid, wizardValidationMessage]);

  useEffect(() => {
    if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = setTimeout(() => {
      const payload: OnboardingWizardDraft = {
        v: 1,
        wizardStep,
        applicationData,
        merchantIdentity,
        internalNotes,
        legalSameAsBusiness,
        coOwnerVisibleCount
      };
      try {
        localStorage.setItem(ONBOARDING_WIZARD_DRAFT_KEY, JSON.stringify(payload));
      } catch {
        /* quota or private mode */
      }
    }, 450);
    return () => {
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    };
  }, [wizardStep, applicationData, merchantIdentity, internalNotes, legalSameAsBusiness, coOwnerVisibleCount]);

  useEffect(() => {
    const panel = document.getElementById('onboarding-wizard-panel');
    panel?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [wizardStep]);

  const patchBusinessAddress = useCallback((patch: Partial<OnboardingAddress>) => {
    setApplicationData((current) => {
      const next = { ...current.businessAddress, ...patch };
      return {
        ...current,
        businessAddress: next,
        legalMailingAddress: legalSameAsBusiness ? { ...next } : current.legalMailingAddress
      };
    });
  }, [legalSameAsBusiness]);

  const handleLegalSameToggle = (checked: boolean) => {
    setLegalSameAsBusiness(checked);
    if (checked) {
      setApplicationData((current) => ({
        ...current,
        legalMailingAddress: { ...current.businessAddress }
      }));
    }
  };

  const updateAdditionalOwner = (index: number, patch: Partial<OnboardingOwnerProfile>) => {
    setApplicationData((current) => {
      const owners = [...current.ownerInformation.additionalOwners];
      owners[index] = { ...owners[index], ...patch };
      return {
        ...current,
        ownerInformation: { ...current.ownerInformation, additionalOwners: owners }
      };
    });
  };

  const addCoOwnerRow = () => {
    setCoOwnerVisibleCount((c) => Math.min(4, c + 1));
  };

  const removeCoOwnerAt = (index: number) => {
    updateAdditionalOwner(index, emptyOwner());
    setCoOwnerVisibleCount((c) => {
      if (index === c - 1 && c > 0) return c - 1;
      return c;
    });
  };

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

  const visibleDeals = useMemo(() => {
    if (!isScopedRep) return onboardingDeals;
    const scoped = scopedRepName.trim().toLowerCase();
    return onboardingDeals.filter((deal) => deal.ownerRepName.trim().toLowerCase() === scoped);
  }, [isScopedRep, onboardingDeals, scopedRepName]);

  const createOnboardingDeal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const merchantName = applicationData.businessInformation.dbaName.trim() || applicationData.businessInformation.legalName.trim();
    const merchantEmail = applicationData.contactInformation.email.trim();
    if (!merchantName) return;

    const status: OnboardingDeal['status'] = requiredChecklist.isReady ? 'ready-to-submit' : 'validation-required';
    const missingFields = [
      requiredChecklist.businessLegalNameReady ? null : 'Business Legal Name',
      requiredChecklist.contactEmailReady ? null : 'Contact Email',
      requiredChecklist.primaryOwnerReady ? null : 'Primary Owner Name',
      requiredChecklist.depositAccountReady ? null : 'Deposit Account Routing/Number',
      requiredChecklist.agreementReady ? null : 'Signature Name/Date'
    ].filter(Boolean);

    const normalizedMissingFields = missingFields.filter((field): field is string => typeof field === 'string');
    const resolvedOwnerRepName = isScopedRep
      ? scopedRepName.trim()
      : merchantIdentity.ownerRepName.trim() || 'Unassigned Rep';

    StorageService.addOnboardingDeal({
      merchantName,
      merchantEmail,
      ownerRepName: resolvedOwnerRepName,
      processorTarget: merchantIdentity.processorTarget,
      status,
      packageSummary: requiredChecklist.isReady
        ? `${merchantIdentity.processorTarget.toUpperCase()} package mapped to ${PROCESSOR_DESTINATION_BY_TARGET[merchantIdentity.processorTarget]} and ready for underwriting review`
        : `Missing required fields: ${normalizedMissingFields.join(', ')}`,
      onboardingPackage: {
        processorTarget: merchantIdentity.processorTarget,
        destinationSystem: PROCESSOR_DESTINATION_BY_TARGET[merchantIdentity.processorTarget],
        readiness: requiredChecklist.isReady ? 'ready' : 'incomplete',
        missingFields: normalizedMissingFields,
        generatedAt: Date.now()
      },
      notes: internalNotes.trim() || undefined,
      applicationData
    });

    const latestDeals = StorageService.getOnboardingDeals();
    await StorageService.saveOnboardingDealsResolved(latestDeals);
    setOnboardingDeals(StorageService.getOnboardingDeals());
    try {
      localStorage.removeItem(ONBOARDING_WIZARD_DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setSubmitSuccess({ merchantName });
    window.setTimeout(() => setSubmitSuccess(null), 8000);
    setInternalNotes('');
    setApplicationData(emptyApplicationData());
    setLegalSameAsBusiness(true);
    setCoOwnerVisibleCount(0);
    setShowOptionalPricingDetails(false);
    setWizardValidationMessage('');
    setWizardStep(0);
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

  const clearWizardDraft = () => {
    try {
      localStorage.removeItem(ONBOARDING_WIZARD_DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setWizardStep(0);
    setApplicationData(emptyApplicationData());
    setInternalNotes('');
    setLegalSameAsBusiness(true);
    setCoOwnerVisibleCount(0);
    setShowOptionalPricingDetails(false);
    setWizardValidationMessage('');
    setMerchantIdentity((current) => ({ ...current, ownerRepName: isScopedRep ? scopedRepName : repOptions[0] || '' }));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Merchant onboarding</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Guided application—one section at a time. Your progress is saved automatically in this browser until you submit.
        </p>
      </div>

      {submitSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/40 dark:border-green-800 px-4 py-3 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900 dark:text-green-100">Package created</p>
            <p className="text-sm text-green-800 dark:text-green-200 mt-0.5">
              &ldquo;{submitSuccess.merchantName}&rdquo; was added to your deals list below. You can submit it for underwriting when ready.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-500" /> New merchant application
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-xl">
              Complete the essentials first; optional pricing and equipment details can be filled as you have them. Use the steps above to jump back—completed sections stay unlocked.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-500 dark:text-slate-400">Open deals: {onboardingDeals.length}</span>
            <button
              type="button"
              onClick={clearWizardDraft}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Clear form & start over
            </button>
          </div>
        </div>

        <form
          onSubmit={(event) => { void createOnboardingDeal(event); }}
          id="onboarding-wizard-panel"
          className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 space-y-6 max-h-[min(78vh,920px)] overflow-y-auto overscroll-contain"
        >
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-medium text-gray-600 dark:text-slate-300">
                {stepsCompleteCount} of {WIZARD_STEPS.length} sections complete
              </p>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Step {wizardStep + 1} / {WIZARD_STEPS.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden mb-3">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 transition-[width] duration-300 ease-out"
                style={{ width: `${Math.round((stepsCompleteCount / WIZARD_STEPS.length) * 100)}%` }}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {WIZARD_STEPS.map((step, index) => {
                const isActive = index === wizardStep;
                const stepValid = stepValidationById[step.id].valid;
                const isCompleted = stepValid && index !== wizardStep;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepClick(index)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors shrink-0 ${isActive
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : isCompleted
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {isCompleted && !isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {index + 1}. {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-sm font-medium text-gray-800 dark:text-slate-200">{activeStep.label}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {activeStepId === 'setup' && 'Choose who owns this deal and which processor route to use.'}
              {activeStepId === 'contact' && 'Primary contact for this application (we will use this email for status updates).'}
              {activeStepId === 'business' && 'Legal entity and tax details—only Legal Name is required to save; add the rest when you have them.'}
              {activeStepId === 'address' && 'Where the business operates and where mail should go.'}
              {activeStepId === 'owners' && 'Beneficial owners with 25%+ ownership typically need to be listed.'}
              {activeStepId === 'banking' && 'Settlement account and how the merchant takes cards.'}
              {activeStepId === 'pricing' && 'Rates, equipment, and agreement—finish signer and date to mark the file ready.'}
            </p>
            {wizardValidationMessage && (
              <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-2 py-1.5">{wizardValidationMessage}</p>
            )}
          </div>

          {activeStepId === 'setup' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block text-sm">
                  <span className="text-gray-700 dark:text-slate-300 font-medium">Sales rep / owner</span>
                  <select
                    value={merchantIdentity.ownerRepName}
                    onChange={(event) => setMerchantIdentity((current) => ({ ...current, ownerRepName: event.target.value }))}
                    disabled={isScopedRep}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
                  >
                    {repOptions.length === 0 && <option value="">Unassigned rep</option>}
                    {repOptions.map((rep) => <option key={rep} value={rep}>{rep}</option>)}
                  </select>
                  {repOptions.length === 0 && (
                    <span className="text-xs text-amber-700 dark:text-amber-300 mt-1 block">Import a team roster in Team to assign reps by name.</span>
                  )}
                </label>
                <label className="block text-sm">
                  <span className="text-gray-700 dark:text-slate-300 font-medium">Processor route</span>
                  <select
                    value={merchantIdentity.processorTarget}
                    onChange={(event) => setMerchantIdentity((current) => ({ ...current, processorTarget: event.target.value as ProcessorTarget }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="tsys">TSYS</option>
                    <option value="fiserv">Fiserv</option>
                    <option value="worldpay">Worldpay</option>
                    <option value="global">Global Payments</option>
                  </select>
                </label>
                <label className="block text-sm md:col-span-1">
                  <span className="text-gray-700 dark:text-slate-300 font-medium">Internal notes <span className="font-normal text-gray-400">(optional)</span></span>
                  <input
                    value={internalNotes}
                    onChange={(event) => setInternalNotes(event.target.value)}
                    placeholder="e.g. referral source, pricing discussion"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400"
                  />
                </label>
              </div>
              {isScopedRep && (
                <p className="text-xs text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-lg px-3 py-2">
                  You can only create and manage deals assigned to <strong>{scopedRepName}</strong>.
                </p>
              )}
            </>
          )}

          {activeStepId === 'contact' && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3 bg-white dark:bg-slate-900/30">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Primary contact</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">This person receives updates about this application. It can be the owner or an authorized signer.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input value={applicationData.contactInformation.firstName} onChange={(event) => setApplicationData((current) => ({ ...current, contactInformation: { ...current.contactInformation, firstName: event.target.value } }))} placeholder="First name *" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <input value={applicationData.contactInformation.lastName} onChange={(event) => setApplicationData((current) => ({ ...current, contactInformation: { ...current.contactInformation, lastName: event.target.value } }))} placeholder="Last name *" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <input type="email" autoComplete="email" value={applicationData.contactInformation.email} onChange={(event) => setApplicationData((current) => ({ ...current, contactInformation: { ...current.contactInformation, email: event.target.value } }))} placeholder="Email *" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <input type="tel" autoComplete="tel" value={applicationData.contactInformation.phoneNumber} onChange={(event) => setApplicationData((current) => ({ ...current, contactInformation: { ...current.contactInformation, phoneNumber: event.target.value } }))} placeholder="Phone (optional)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
            </div>
          </div>
          )}

          {activeStepId === 'business' && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-4 bg-white dark:bg-slate-900/30">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Business entity</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Legal name is required. Everything else can wait until you have it—expand the section below when ready.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={applicationData.businessInformation.legalName} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, legalName: event.target.value } }))} placeholder="Legal business name *" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <input value={applicationData.businessInformation.dbaName} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, dbaName: event.target.value } }))} placeholder="DBA / trade name (optional)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
            </div>
            <details className="rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50/80 dark:bg-slate-900/50">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-800 dark:text-slate-200">Tax ID, industry, and other details</summary>
              <div className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3">
                  <input value={applicationData.businessInformation.taxFilingName} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, taxFilingName: event.target.value } }))} placeholder="Tax filing name" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.businessInformation.taxFilingMethod} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, taxFilingMethod: event.target.value } }))} placeholder="Tax filing method" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <select value={applicationData.businessInformation.taxIdType} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, taxIdType: event.target.value as 'ein' | 'ssn' } }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100">
                    <option value="ein">EIN</option>
                    <option value="ssn">SSN</option>
                  </select>
                  <input value={applicationData.businessInformation.taxIdValue} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, taxIdValue: event.target.value } }))} placeholder="Tax ID number" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" autoComplete="off" />
                  <input value={applicationData.businessInformation.ownershipType} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, ownershipType: event.target.value } }))} placeholder="Entity type (LLC, Corp, …)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.businessInformation.industryMcc} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, industryMcc: event.target.value } }))} placeholder="Industry / MCC" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input type="date" value={applicationData.businessInformation.businessStartDate} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, businessStartDate: event.target.value } }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.businessInformation.businessPhone} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, businessPhone: event.target.value } }))} placeholder="Business phone" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                </div>
                <input value={applicationData.businessInformation.businessDescription} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, businessDescription: event.target.value } }))} placeholder="Short description of what you sell / do" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input value={applicationData.businessInformation.website} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, website: event.target.value } }))} placeholder="Website" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.businessInformation.quasiCash} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, quasiCash: event.target.value } }))} placeholder="Quasi-cash %" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.businessInformation.stockExchange} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, stockExchange: event.target.value } }))} placeholder="Stock exchange (if public)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.businessInformation.stockTickerSymbol} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, stockTickerSymbol: event.target.value } }))} placeholder="Ticker" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                  <input type="checkbox" checked={applicationData.businessInformation.taxExempt} onChange={(event) => setApplicationData((current) => ({ ...current, businessInformation: { ...current.businessInformation, taxExempt: event.target.checked } }))} className="rounded border-gray-300 text-indigo-600" />
                  Tax-exempt organization
                </label>
              </div>
            </details>
          </div>
          )}

          {activeStepId === 'address' && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-4 bg-white dark:bg-slate-900/30">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Business & mailing address</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Use the location customers know; legal mail can match or differ.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legalSameAsBusiness}
                  onChange={(e) => handleLegalSameToggle(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Legal mailing same as business
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Business location</p>
                <input value={applicationData.businessAddress.street1} onChange={(event) => patchBusinessAddress({ street1: event.target.value })} placeholder="Street line 1 *" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <input value={applicationData.businessAddress.street2 || ''} onChange={(event) => patchBusinessAddress({ street2: event.target.value })} placeholder="Street line 2" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={applicationData.businessAddress.city} onChange={(event) => patchBusinessAddress({ city: event.target.value })} placeholder="City *" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.businessAddress.state} onChange={(event) => patchBusinessAddress({ state: event.target.value })} placeholder="State *" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={applicationData.businessAddress.zip} onChange={(event) => patchBusinessAddress({ zip: event.target.value })} placeholder="ZIP *" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.businessAddress.country} onChange={(event) => patchBusinessAddress({ country: event.target.value })} placeholder="Country" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                </div>
              </div>
              <div className={`space-y-2 ${legalSameAsBusiness ? 'opacity-60 pointer-events-none' : ''}`}>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Legal mailing {legalSameAsBusiness && '(matches business)'}</p>
                <input value={applicationData.legalMailingAddress.street1} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, street1: event.target.value } }))} placeholder="Street line 1" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <input value={applicationData.legalMailingAddress.street2 || ''} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, street2: event.target.value } }))} placeholder="Street line 2" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={applicationData.legalMailingAddress.city} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, city: event.target.value } }))} placeholder="City" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.legalMailingAddress.state} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, state: event.target.value } }))} placeholder="State" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={applicationData.legalMailingAddress.zip} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, zip: event.target.value } }))} placeholder="ZIP" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.legalMailingAddress.country} onChange={(event) => setApplicationData((current) => ({ ...current, legalMailingAddress: { ...current.legalMailingAddress, country: event.target.value } }))} placeholder="Country" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                </div>
              </div>
            </div>
          </div>
          )}

          {activeStepId === 'owners' && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-4 bg-white dark:bg-slate-900/30">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Beneficial owners</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Start with the primary owner (required). Add co-owners with 25%+ if applicable—one row each, no special format to memorize.</p>
            </div>
            <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 space-y-3">
              <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">Primary owner *</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={applicationData.ownerInformation.primaryOwner.firstName} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, firstName: event.target.value } } }))} placeholder="First name" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <input value={applicationData.ownerInformation.primaryOwner.lastName} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, lastName: event.target.value } } }))} placeholder="Last name" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <input value={applicationData.ownerInformation.primaryOwner.title || ''} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, title: event.target.value } } }))} placeholder="Title (e.g. CEO)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input value={applicationData.ownerInformation.primaryOwner.ownershipPercent || ''} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, ownershipPercent: event.target.value } } }))} placeholder="Ownership % (e.g. 51)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <input value={applicationData.ownerInformation.primaryOwner.ssn || ''} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, ssn: event.target.value } } }))} placeholder="SSN / ITIN (optional here)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" autoComplete="off" />
                <input type="date" value={applicationData.ownerInformation.primaryOwner.dateOfBirth || ''} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, dateOfBirth: event.target.value } } }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <input value={applicationData.ownerInformation.primaryOwner.mobilePhone || ''} onChange={(event) => setApplicationData((current) => ({ ...current, ownerInformation: { ...current.ownerInformation, primaryOwner: { ...current.ownerInformation.primaryOwner, mobilePhone: event.target.value } } }))} placeholder="Mobile" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">Additional owners (optional)</p>
              {applicationData.ownerInformation.additionalOwners.map((owner, index) => {
                const hasAny = [owner.firstName, owner.lastName, owner.ownershipPercent, owner.ssn, owner.dateOfBirth, owner.mobilePhone, owner.email].some((v) => String(v || '').trim().length > 0);
                const showForm = index < coOwnerVisibleCount || hasAny;
                if (!showForm) {
                  return null;
                }
                return (
                  <div key={index} className="rounded-lg border border-gray-200 dark:border-slate-600 p-3 space-y-2 bg-gray-50/80 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Co-owner {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeCoOwnerAt(index)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <input value={owner.firstName} onChange={(e) => updateAdditionalOwner(index, { firstName: e.target.value })} placeholder="First name" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                      <input value={owner.lastName} onChange={(e) => updateAdditionalOwner(index, { lastName: e.target.value })} placeholder="Last name" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                      <input value={owner.ownershipPercent || ''} onChange={(e) => updateAdditionalOwner(index, { ownershipPercent: e.target.value })} placeholder="Ownership %" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                      <input type="date" value={owner.dateOfBirth || ''} onChange={(e) => updateAdditionalOwner(index, { dateOfBirth: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                    </div>
                  </div>
                );
              })}
              {coOwnerVisibleCount < 4 && (
                <button
                  type="button"
                  onClick={addCoOwnerRow}
                  className="w-full sm:w-auto text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                >
                  + Add co-owner (25%+ ownership)
                </button>
              )}
            </div>
          </div>
          )}

          {activeStepId === 'banking' && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-4 bg-white dark:bg-slate-900/30">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Deposits & card volume</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Settlement account is required. Estimated splits and volumes help underwriting.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={applicationData.bankingAndProcessing.modeOfTransaction.inPerson} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, modeOfTransaction: { ...current.bankingAndProcessing.modeOfTransaction, inPerson: event.target.value } } }))} placeholder="In-person sales % (optional)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <input value={applicationData.bankingAndProcessing.modeOfTransaction.telephone} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, modeOfTransaction: { ...current.bankingAndProcessing.modeOfTransaction, telephone: event.target.value } } }))} placeholder="Phone / MOTO % (optional)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <input value={applicationData.bankingAndProcessing.modeOfTransaction.online} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, modeOfTransaction: { ...current.bankingAndProcessing.modeOfTransaction, online: event.target.value } } }))} placeholder="Online / e-com % (optional)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={applicationData.bankingAndProcessing.deliveryWindow} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, deliveryWindow: event.target.value as OnboardingApplicationData['bankingAndProcessing']['deliveryWindow'] } }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100">
                <option value="">Typical delivery / fulfillment window</option>
                <option value="same-day">Same day</option>
                <option value="0-7">0–7 days</option>
                <option value="8-14">8–14 days</option>
                <option value="15-30">15–30 days</option>
                <option value="30+">30+ days</option>
              </select>
              <input value={applicationData.bankingAndProcessing.averageMonthlyCardVolume} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, averageMonthlyCardVolume: event.target.value } }))} placeholder="Est. monthly card volume ($)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <input value={applicationData.bankingAndProcessing.averageTransactionAmount} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, averageTransactionAmount: event.target.value } }))} placeholder="Avg ticket ($)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                <input type="checkbox" checked={applicationData.bankingAndProcessing.withdrawalSameAsDeposit} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, withdrawalSameAsDeposit: event.target.checked } }))} className="rounded border-gray-300 text-indigo-600" />
                Fees debit same account as deposits
              </label>
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">Deposit account *</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input value={applicationData.bankingAndProcessing.depositBankAccount.bankName} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, depositBankAccount: { ...current.bankingAndProcessing.depositBankAccount, bankName: event.target.value } } }))} placeholder="Bank name" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <select value={applicationData.bankingAndProcessing.depositBankAccount.accountType} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, depositBankAccount: { ...current.bankingAndProcessing.depositBankAccount, accountType: event.target.value as 'checking' | 'savings' | '' } } }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100">
                <option value="">Account type</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
              <input inputMode="numeric" value={applicationData.bankingAndProcessing.depositBankAccount.routingNumber} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, depositBankAccount: { ...current.bankingAndProcessing.depositBankAccount, routingNumber: event.target.value } } }))} placeholder="Routing # *" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" autoComplete="off" />
              <input inputMode="numeric" value={applicationData.bankingAndProcessing.depositBankAccount.accountNumber} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, depositBankAccount: { ...current.bankingAndProcessing.depositBankAccount, accountNumber: event.target.value } } }))} placeholder="Account # *" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" autoComplete="off" />
            </div>

            {!applicationData.bankingAndProcessing.withdrawalSameAsDeposit && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">Separate account for debits</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input value={applicationData.bankingAndProcessing.withdrawalBankAccount.bankName} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, withdrawalBankAccount: { ...current.bankingAndProcessing.withdrawalBankAccount, bankName: event.target.value } } }))} placeholder="Bank name" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <select value={applicationData.bankingAndProcessing.withdrawalBankAccount.accountType} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, withdrawalBankAccount: { ...current.bankingAndProcessing.withdrawalBankAccount, accountType: event.target.value as 'checking' | 'savings' | '' } } }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100">
                    <option value="">Account type</option>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                  <input value={applicationData.bankingAndProcessing.withdrawalBankAccount.routingNumber} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, withdrawalBankAccount: { ...current.bankingAndProcessing.withdrawalBankAccount, routingNumber: event.target.value } } }))} placeholder="Routing #" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" autoComplete="off" />
                  <input value={applicationData.bankingAndProcessing.withdrawalBankAccount.accountNumber} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, withdrawalBankAccount: { ...current.bankingAndProcessing.withdrawalBankAccount, accountNumber: event.target.value } } }))} placeholder="Account #" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" autoComplete="off" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 md:col-span-1">
                <input type="checkbox" checked={applicationData.bankingAndProcessing.thirdPartyProvider.usesProvider} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, thirdPartyProvider: { ...current.bankingAndProcessing.thirdPartyProvider, usesProvider: event.target.checked } } }))} className="rounded border-gray-300 text-indigo-600" />
                Third-party platform (POS / gateway)
              </label>
              <input value={applicationData.bankingAndProcessing.thirdPartyProvider.name || ''} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, thirdPartyProvider: { ...current.bankingAndProcessing.thirdPartyProvider, name: event.target.value } } }))} placeholder="Provider name" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <input value={applicationData.bankingAndProcessing.thirdPartyProvider.email || ''} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, thirdPartyProvider: { ...current.bankingAndProcessing.thirdPartyProvider, email: event.target.value } } }))} placeholder="Contact email" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              <input value={applicationData.bankingAndProcessing.thirdPartyProvider.phone || ''} onChange={(event) => setApplicationData((current) => ({ ...current, bankingAndProcessing: { ...current.bankingAndProcessing, thirdPartyProvider: { ...current.bankingAndProcessing.thirdPartyProvider, phone: event.target.value } } }))} placeholder="Phone" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
            </div>
          </div>
          )}

          {activeStepId === 'pricing' && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-5 bg-white dark:bg-slate-900/30">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agreement & pricing</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Confirm who is signing and when. Rate tables and equipment are optional—expand the section below if you already have numbers.
              </p>
            </div>

            <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 space-y-3">
              <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">Authorized signer *</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input value={applicationData.agreement.signerName} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, signerName: event.target.value } }))} placeholder="Full name *" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <input value={applicationData.agreement.signerTitle} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, signerTitle: event.target.value } }))} placeholder="Title (optional)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <input type="date" value={applicationData.agreement.signatureDate} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, signatureDate: event.target.value } }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                <input value={applicationData.agreement.clientInitials} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, clientInitials: event.target.value } }))} placeholder="Initials (optional)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                  <input type="checkbox" checked={applicationData.agreement.earlyTerminationFeeAccepted} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, earlyTerminationFeeAccepted: event.target.checked } }))} className="rounded border-gray-300 text-indigo-600" />
                  Early termination fee reviewed
                </label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                  <input type="checkbox" checked={applicationData.agreement.personalGuaranteeAccepted} onChange={(event) => setApplicationData((current) => ({ ...current, agreement: { ...current.agreement, personalGuaranteeAccepted: event.target.checked } }))} className="rounded border-gray-300 text-indigo-600" />
                  Personal guarantee reviewed (if applicable)
                </label>
              </div>
            </div>

            <details
              className="rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50/80 dark:bg-slate-900/50"
              open={showOptionalPricingDetails}
              onToggle={(e) => setShowOptionalPricingDetails((e.target as HTMLDetailsElement).open)}
            >
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-800 dark:text-slate-200">
                Optional: equipment, program & rate details
              </summary>
              <div className="px-4 pb-4 pt-0 space-y-4 border-t border-gray-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                    <input type="checkbox" checked={applicationData.equipment.cloverMenuRequested} onChange={(event) => setApplicationData((current) => ({ ...current, equipment: { ...current.equipment, cloverMenuRequested: event.target.checked } }))} className="rounded border-gray-300 text-indigo-600" />
                    Request Clover menu build
                  </label>
                  <input value={applicationData.equipment.shipToAttention} onChange={(event) => setApplicationData((current) => ({ ...current, equipment: { ...current.equipment, shipToAttention: event.target.value } }))} placeholder="Ship-to attention" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.equipment.shipToEmail} onChange={(event) => setApplicationData((current) => ({ ...current, equipment: { ...current.equipment, shipToEmail: event.target.value } }))} placeholder="Ship-to email" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select value={applicationData.pricingAndProgram.pricingModel} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, pricingModel: event.target.value as OnboardingApplicationData['pricingAndProgram']['pricingModel'] } }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100">
                    <option value="">Pricing model</option>
                    <option value="flat-rate">Flat rate</option>
                    <option value="swiped-non-swiped">Swiped / non-swiped</option>
                    <option value="bill-back">Bill back</option>
                    <option value="interchange-plus">Interchange plus</option>
                    <option value="tiered">Tiered</option>
                  </select>
                  <select value={applicationData.pricingAndProgram.discountFrequency} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, discountFrequency: event.target.value as OnboardingApplicationData['pricingAndProgram']['discountFrequency'] } }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100">
                    <option value="">Discount frequency</option>
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <select value={applicationData.pricingAndProgram.fundingRollup} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, fundingRollup: event.target.value as OnboardingApplicationData['pricingAndProgram']['fundingRollup'] } }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100">
                    <option value="">Funding rollup</option>
                    <option value="individual-batches">Individual batches</option>
                    <option value="separate-fees-and-deposits">Separate fees and deposits</option>
                    <option value="net-fees-and-deposits">Net fees and deposits</option>
                  </select>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                    <input type="checkbox" checked={applicationData.pricingAndProgram.surchargeProgramEnabled} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, surchargeProgramEnabled: event.target.checked } }))} className="rounded border-gray-300 text-indigo-600" />
                    Surcharge program
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input value={applicationData.pricingAndProgram.visaCreditDiscountFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, visaCreditDiscountFee: event.target.value } }))} placeholder="Visa credit %" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.pricingAndProgram.mastercardCreditDiscountFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, mastercardCreditDiscountFee: event.target.value } }))} placeholder="Mastercard credit %" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.pricingAndProgram.discoverCreditDiscountFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, discoverCreditDiscountFee: event.target.value } }))} placeholder="Discover credit %" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.pricingAndProgram.amexCreditDiscountFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, amexCreditDiscountFee: event.target.value } }))} placeholder="Amex %" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.pricingAndProgram.debitCardDiscountFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, debitCardDiscountFee: event.target.value } }))} placeholder="Debit discount %" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                  <input value={applicationData.pricingAndProgram.debitCardTransactionFee} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, debitCardTransactionFee: event.target.value } }))} placeholder="Debit per-txn fee" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
                </div>

                <textarea value={applicationData.pricingAndProgram.monthlyAndMiscFees} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, monthlyAndMiscFees: event.target.value } }))} placeholder="Monthly & other fees (PCI, gateway, statement, etc.)" rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />

                <input value={applicationData.pricingAndProgram.consumerSurchargeRate} onChange={(event) => setApplicationData((current) => ({ ...current, pricingAndProgram: { ...current.pricingAndProgram, consumerSurchargeRate: event.target.value } }))} placeholder="Consumer surcharge % (if applicable)" className="w-full md:max-w-md px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100" />
              </div>
            </details>
          </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
            <p className={`text-xs font-semibold ${requiredChecklist.isReady ? 'text-green-700 dark:text-green-400' : 'text-amber-800 dark:text-amber-200'}`}>
              {requiredChecklist.isReady
                ? 'All required fields are complete—you can create the package now.'
                : 'Some required fields are still empty—deal will be saved as “needs review” until complete.'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isFirstStep}
                onClick={() => {
                  setWizardValidationMessage('');
                  setWizardStep((current) => Math.max(0, current - 1));
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border ${isFirstStep
                  ? 'border-gray-200 dark:border-slate-700 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
              >
                Back
              </button>
              {!isLastStep && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`px-4 py-2 text-white rounded-xl text-sm font-semibold ${activeStepValidation.valid ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600' : 'bg-indigo-400/90 cursor-not-allowed'}`}
                >
                  Continue to {WIZARD_STEPS[wizardStep + 1].label}
                </button>
              )}
              {isLastStep && (
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm">
                  Create onboarding package
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your deals</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Track status and submit when the file is complete.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700">
              <tr>
                {['Merchant', 'Rep Owner', 'Processor', 'Destination', 'Package', 'Status', 'Action'].map((header) => (
                  <th key={header} className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {visibleDeals.slice(0, 12).map((deal) => (
                <tr key={deal.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{deal.merchantName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{deal.merchantEmail || 'Email pending'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{deal.ownerRepName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-slate-300 uppercase">{deal.processorTarget}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{deal.onboardingPackage?.destinationSystem || PROCESSOR_DESTINATION_BY_TARGET[deal.processorTarget]}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400 max-w-xs truncate" title={deal.packageSummary}>{deal.packageSummary}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${deal.status === 'submitted'
                      ? 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300'
                      : deal.status === 'ready-to-submit'
                        ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300'
                        : 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200'
                      }`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {deal.status !== 'ready-to-submit' && deal.status !== 'submitted' && (
                      <button
                        type="button"
                        onClick={() => { void updateDealStatus(deal.id, 'ready-to-submit'); }}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Mark ready
                      </button>
                    )}
                    {deal.status === 'ready-to-submit' && (
                      <button
                        type="button"
                        onClick={() => { void updateDealStatus(deal.id, 'submitted'); }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 hover:underline"
                      >
                        <Send className="w-3 h-3" /> Submit
                      </button>
                    )}
                    {deal.status === 'submitted' && <span className="text-xs text-gray-400 dark:text-slate-500">Done</span>}
                  </td>
                </tr>
              ))}
              {visibleDeals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-slate-400">
                    No deals yet. Complete the wizard above to create your first merchant package.
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
