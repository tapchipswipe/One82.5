import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp, Eye, EyeOff, Zap, Upload, FileSpreadsheet, Users } from 'lucide-react';
import {
    INTEGRATIONS,
    IntegrationCategory,
    LIVE_INTEGRATIONS_ENABLED,
    isIntegrationConnected,
    saveIntegrationKey,
    getIntegrationKey,
} from '../services/integrationsConfig';
import { StorageService } from '../services/storage';
import { MerchantInvite, MerchantInviteStrategy, Transaction } from '../types';

const CATEGORIES: IntegrationCategory[] = ['AI', 'POS & Payment', 'ISO Processor'];

type ImportType = 'transactions' | 'merchants' | 'team';

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const parseCsvRows = (content: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < content.length; index += 1) {
        const char = content[index];
        const next = content[index + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                cell += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            row.push(cell.trim());
            cell = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') {
                index += 1;
            }
            row.push(cell.trim());
            if (row.some(col => col.length > 0)) {
                rows.push(row);
            }
            row = [];
            cell = '';
            continue;
        }

        cell += char;
    }

    row.push(cell.trim());
    if (row.some(col => col.length > 0)) {
        rows.push(row);
    }

    return rows;
};

const pickValue = (record: Record<string, string>, keys: string[]): string => {
    for (const key of keys) {
        const value = record[key];
        if (value && value.length > 0) return value;
    }
    return '';
};

const parseAmount = (raw: string): number => {
    const cleaned = raw.replace(/[$,\s]/g, '');
    const value = Number.parseFloat(cleaned);
    return Number.isFinite(value) ? value : 0;
};

const normalizeStatus = (raw: string): Transaction['status'] => {
    const value = raw.trim().toLowerCase();
    if (value === 'pending') return 'Pending';
    if (value === 'failed' || value === 'declined') return 'Failed';
    return 'Completed';
};

const normalizeMethod = (raw: string): Transaction['method'] => {
    const value = raw.trim().toLowerCase();
    if (value.includes('master')) return 'MasterCard';
    if (value.includes('amex') || value.includes('american')) return 'Amex';
    if (value.includes('stripe')) return 'Stripe';
    if (value.includes('square')) return 'Square';
    if (value.includes('cash')) return 'Cash';
    if (value.includes('apple')) return 'Apple Pay';
    if (value.includes('wire')) return 'Wire';
    return 'Visa';
};

const normalizeCategory = (raw: string): Transaction['category'] => {
    const value = raw.trim().toLowerCase();
    if (value === 'inventory') return 'Inventory';
    if (value === 'utilities') return 'Utilities';
    if (value === 'payroll') return 'Payroll';
    if (value === 'marketing') return 'Marketing';
    if (value === 'software') return 'Software';
    if (value === 'rent') return 'Rent';
    if (value === 'miscellaneous') return 'Miscellaneous';
    return 'Uncategorized';
};

const toMerchantInvitesFromRows = (records: Record<string, string>[]): MerchantInvite[] => {
    const now = Date.now();
    return records
        .map((record, index) => {
            const email = pickValue(record, ['email', 'owneremail', 'contactemail']).trim().toLowerCase();
            if (!email) return null;

            const merchantName = pickValue(record, ['name', 'merchantname', 'company', 'businessname']) || `Imported Merchant ${index + 1}`;
            return {
                id: `invite_${now}_${index}_${email.replace(/[^a-z0-9]/g, '')}`,
                merchantName,
                email,
                status: 'sent' as const,
                strategy: 'csv-auto-invite' as const,
                createdAt: now
            };
        })
        .filter((invite): invite is NonNullable<typeof invite> => Boolean(invite));
};

const transformImportedTransactions = (records: Record<string, string>[]): Transaction[] => {
    return records
        .map((record, index) => {
            const amountRaw = pickValue(record, ['amount', 'transactionamount', 'total', 'value']);
            const amount = parseAmount(amountRaw);
            const customer = pickValue(record, ['customer', 'customername', 'merchantname', 'name']) || 'Imported Customer';
            const dateRaw = pickValue(record, ['date', 'transactiondate', 'occurredat', 'timestamp']);
            const parsedDate = dateRaw ? new Date(dateRaw) : new Date();
            const statusRaw = pickValue(record, ['status', 'transactionstatus']);
            const methodRaw = pickValue(record, ['method', 'paymentmethod', 'cardbrand']);
            const itemsRaw = pickValue(record, ['items', 'item', 'description', 'product']);
            const categoryRaw = pickValue(record, ['category', 'transactioncategory']);

            if (!Number.isFinite(amount) || amount <= 0) return null;

            return {
                id: `import_tx_${Date.now()}_${index}`,
                date: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
                amount,
                status: normalizeStatus(statusRaw),
                customer,
                items: itemsRaw ? itemsRaw.split(/[;|]/).map(item => item.trim()).filter(Boolean) : ['Imported item'],
                method: normalizeMethod(methodRaw),
                category: normalizeCategory(categoryRaw)
            };
        })
        .filter((transaction): transaction is Transaction => Boolean(transaction));
};

const IntegrationCard = ({ integration, onSave }: {
    integration: typeof INTEGRATIONS[0];
    onSave: () => void;
}) => {
    const [expanded, setExpanded] = useState(false);
    const [apiKeyValue, setApiKeyValue] = useState(getIntegrationKey(integration.id));
    const [showKey, setShowKey] = useState(false);
    const connected = isIntegrationConnected(integration.id);

    const handleSave = () => {
        saveIntegrationKey(integration.id, apiKeyValue);
        setExpanded(false);
        onSave();
    };

    const handleDisconnect = () => {
        saveIntegrationKey(integration.id, '');
        setApiKeyValue('');
        onSave();
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${connected
            ? 'border-green-200 dark:border-green-900/40 shadow-sm shadow-green-100 dark:shadow-none'
            : 'border-gray-100 dark:border-gray-700'
            }`}>
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className={`w-10 h-10 rounded-xl ${integration.logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {integration.logoLetter}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{integration.name}</h3>
                            {connected && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                    <Zap className="w-2.5 h-2.5" /> LIVE
                                </span>
                            )}
                            {integration.sandboxAvailable && !connected && (
                                <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">Sandbox</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-md">{integration.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {connected ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                        <XCircle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    )}
                    <a
                        href={integration.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="View API Docs"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                        disabled={!LIVE_INTEGRATIONS_ENABLED}
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                        {connected ? 'Manage' : 'Connect'}
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        API Key / Access Token
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                disabled={!LIVE_INTEGRATIONS_ENABLED}
                                type={showKey ? 'text' : 'password'}
                                value={apiKeyValue}
                                onChange={(e) => setApiKeyValue(e.target.value)}
                                placeholder={`Paste your ${integration.name} API key here...`}
                                className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                            />
                            <button
                                disabled={!LIVE_INTEGRATIONS_ENABLED}
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <button
                            disabled={!LIVE_INTEGRATIONS_ENABLED}
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                        >
                            Save & Connect
                        </button>
                        {connected && (
                            <button
                                disabled={!LIVE_INTEGRATIONS_ENABLED}
                                onClick={handleDisconnect}
                                className="px-4 py-2 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                                Disconnect
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                        Key is stored locally in your browser. Never sent to any server except the integration's own API.
                        {integration.sandboxAvailable && ' Sandbox keys supported for development.'}
                    </p>
                </div>
            )}
        </div>
    );
};

const Integrations: React.FC = () => {
    const [, forceUpdate] = useState(0);
    const [importType, setImportType] = useState<ImportType>('transactions');
    const [replaceTransactions, setReplaceTransactions] = useState(false);
    const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
    const [importHeaders, setImportHeaders] = useState<string[]>([]);
    const [importFileName, setImportFileName] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [importSummary, setImportSummary] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [merchantCount, setMerchantCount] = useState(0);
    const [teamCount, setTeamCount] = useState(0);
    const [inviteCount, setInviteCount] = useState(0);
    const [inviteStrategy, setInviteStrategy] = useState<MerchantInviteStrategy>(StorageService.getMerchantInviteStrategy());
    const [inviteLinkNotice, setInviteLinkNotice] = useState<string | null>(null);
    const isAuthTrialMode = StorageService.getDataMode() === 'backend';
    const role = StorageService.getUser()?.role || 'merchant';

    const connectedCount = INTEGRATIONS.filter(i => isIntegrationConnected(i.id)).length;

    const firstRunChecklist = role === 'iso'
        ? [
            'Import transactions or connect at least one processor',
            'Import merchant roster to unlock portfolio context',
            'Import team members for rep assignment visibility',
            'Open Dashboard and Profitability to confirm data landed'
        ]
        : [
            'Import transactions or connect at least one payment source',
            'Confirm Dashboard and Transactions reflect imported rows',
            'Open Forecast and Data Chat to verify analytics readiness',
            'Check source/provenance labels before sharing insights'
        ];

    useEffect(() => {
        const loadImportedCounts = async () => {
            const imported = await StorageService.getImportedDataResolved();
            setMerchantCount(imported.merchants.length);
            setTeamCount(imported.team.length);
            setInviteCount(StorageService.getMerchantInvites().length);
            setInviteStrategy(StorageService.getMerchantInviteStrategy());
        };

        void loadImportedCounts();
    }, []);

    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/?invite=merchant`
        : 'https://one82-5.vercel.app/?invite=merchant';

    const handleCopyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setInviteLinkNotice('Invite link copied. Share it with merchants who should self-create profiles.');
            window.setTimeout(() => setInviteLinkNotice(null), 2800);
        } catch {
            setInviteLinkNotice('Unable to copy automatically. Manually copy the invite link shown below.');
        }
    };

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setImportError(null);
        setImportSummary(null);
        const file = event.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const rows = parseCsvRows(text);

        if (rows.length < 2) {
            setImportError('CSV must include a header row and at least one data row.');
            setImportRows([]);
            setImportHeaders([]);
            setImportFileName(file.name);
            return;
        }

        const headers = rows[0].map(header => normalizeHeader(header));
        const records = rows.slice(1).map(row => {
            const record: Record<string, string> = {};
            headers.forEach((header, index) => {
                record[header] = row[index] || '';
            });
            return record;
        });

        if (importType === 'transactions') {
            const hasAmount = headers.some((header) => ['amount', 'transactionamount', 'total', 'value'].includes(header));
            const hasCustomer = headers.some((header) => ['customer', 'customername', 'merchantname', 'name'].includes(header));

            if (!hasAmount || !hasCustomer) {
                setImportError('Transaction imports require at least amount and customer/name columns.');
                setImportRows([]);
                setImportHeaders(headers);
                setImportFileName(file.name);
                return;
            }
        }

        setImportHeaders(headers);
        setImportRows(records);
        setImportFileName(file.name);
    };

    const handleRunImport = async () => {
        if (importRows.length === 0) {
            setImportError('Upload a CSV file before importing.');
            return;
        }

        setImportError(null);
        setImportSummary(null);
        setIsImporting(true);

        try {
            if (importType === 'transactions') {
                const importedTransactions = transformImportedTransactions(importRows);
                if (importedTransactions.length === 0) {
                    setImportError('No valid transactions found. Include at least amount and customer columns.');
                    setIsImporting(false);
                    return;
                }

                const existing = replaceTransactions ? [] : await StorageService.getTransactionsResolved();
                await StorageService.saveTransactionsResolved([...importedTransactions, ...existing]);
                setImportSummary(`Imported ${importedTransactions.length} transaction${importedTransactions.length === 1 ? '' : 's'} from ${importFileName}. Data landed in Transactions, Dashboard, Forecast, and Data Chat context.`);
                window.dispatchEvent(new Event('user-update'));
            }

            if (importType === 'merchants') {
                const existingInvites = StorageService.getMerchantInvites();
                const generatedInvites = role === 'iso' && inviteStrategy === 'csv-auto-invite'
                    ? toMerchantInvitesFromRows(importRows)
                    : [];

                const mergedInviteMap = new Map<string, MerchantInvite>();
                [...existingInvites, ...generatedInvites].forEach((invite) => {
                    mergedInviteMap.set(invite.email, invite);
                });
                const mergedInvites = Array.from(mergedInviteMap.values());

                await StorageService.saveImportedDataResolved({
                    merchants: importRows,
                    merchantInvites: mergedInvites,
                    inviteStrategy
                });
                setMerchantCount(importRows.length);
                setInviteCount(mergedInvites.length);
                setImportSummary(`Imported ${importRows.length} merchant record${importRows.length === 1 ? '' : 's'} from ${importFileName}. ${generatedInvites.length > 0 ? `Auto-invited ${generatedInvites.length} merchant contact${generatedInvites.length === 1 ? '' : 's'}. ` : ''}Data landed in ISO portfolio/merchant views.`);
            }

            if (importType === 'team') {
                await StorageService.saveImportedDataResolved({ team: importRows, inviteStrategy });
                setTeamCount(importRows.length);
                setImportSummary(`Imported ${importRows.length} team member record${importRows.length === 1 ? '' : 's'} from ${importFileName}. Data landed in Team views and assignment context.`);
            }
        } catch (error) {
            setImportError(error instanceof Error ? error.message : 'Import failed. Please try again.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Zap className="w-6 h-6 text-indigo-600" />
                    Integrations
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {LIVE_INTEGRATIONS_ENABLED
                        ? isAuthTrialMode
                            ? 'Auth/Trial mode uses real/imported data only. Connect APIs or import CSV to populate dashboards.'
                            : 'Plug in your API keys to go live. Without keys, data can run in simulation mode.'
                        : 'Demo phase lock: live integrations are disabled and the app runs in simulation mode.'}
                </p>
            </div>

            {/* Status Banner */}
            <div className={`rounded-xl p-4 flex items-center justify-between border ${connectedCount > 0
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {!LIVE_INTEGRATIONS_ENABLED
                            ? 'Demo phase lock active'
                            : connectedCount > 0
                            ? `${connectedCount} integration${connectedCount > 1 ? 's' : ''} connected`
                            : isAuthTrialMode
                                ? 'Auth/Trial mode ready for imports'
                                : 'Running in simulation mode'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {!LIVE_INTEGRATIONS_ENABLED
                            ? 'Live integrations are disabled for this phase. Connect/manage actions are unavailable.'
                            : connectedCount > 0
                            ? 'Live data is now flowing into your dashboard.'
                            : isAuthTrialMode
                                ? 'No simulated records are shown in Auth/Trial mode. Import a CSV or connect a processor.'
                                : 'The app is fully functional. Connect a key below to switch to live data.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {connectedCount > 0
                        ? <CheckCircle className="w-6 h-6 text-green-500" />
                        : <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" /></span>
                    }
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">First-Run Checklist ({role.toUpperCase()})</h3>
                <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                    {firstRunChecklist.map((step) => (
                        <li key={step} className="flex items-start gap-2">
                            <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>{step}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {role === 'iso' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Merchant Invite Strategy</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Primary path uses CSV import + auto-invite. Invite-link fallback remains available for edge cases.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={async () => {
                                setInviteStrategy('csv-auto-invite');
                                StorageService.saveMerchantInviteStrategy('csv-auto-invite');
                                await StorageService.saveImportedDataResolved({ inviteStrategy: 'csv-auto-invite' });
                            }}
                            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${inviteStrategy === 'csv-auto-invite'
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            CSV Import + Auto-Invite (Primary)
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                setInviteStrategy('invite-link');
                                StorageService.saveMerchantInviteStrategy('invite-link');
                                await StorageService.saveImportedDataResolved({ inviteStrategy: 'invite-link' });
                            }}
                            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${inviteStrategy === 'invite-link'
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            Invite Link (Fallback)
                        </button>
                    </div>

                    <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            Invite link: <span className="font-semibold break-all text-gray-700 dark:text-gray-200">{inviteLink}</span>
                        </p>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <button
                                type="button"
                                onClick={handleCopyInviteLink}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                            >
                                Copy Invite Link
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Invites sent: {inviteCount}</span>
                        </div>
                        {inviteLinkNotice && <p className="text-xs text-green-600 mt-2">{inviteLinkNotice}</p>}
                    </div>
                </div>
            )}

            {/* Import Hub */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Upload className="w-4 h-4 text-indigo-600" />
                            Import Hub
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Upload CSV files to import transactions, merchant rosters, or team member lists.
                            {isAuthTrialMode && ' In Auth/Trial mode, imported data becomes your dashboard source of truth.'}
                        </p>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Merchants: {merchantCount}</span>
                        <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Team: {teamCount}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                        { id: 'transactions', label: 'Transactions', icon: FileSpreadsheet },
                        { id: 'merchants', label: 'Merchant Roster', icon: Zap },
                        { id: 'team', label: 'Team Members', icon: Users }
                    ].map(option => {
                        const Icon = option.icon;
                        const active = importType === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    setImportType(option.id as ImportType);
                                    setImportError(null);
                                    setImportSummary(null);
                                }}
                                className={`px-3 py-2 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${active
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Upload CSV</span>
                        <input type="file" accept=".csv,text/csv" onChange={handleImportFile} className="hidden" />
                    </label>
                    {importFileName && (
                        <span className="text-xs text-gray-500">Loaded: <span className="font-semibold text-gray-700 dark:text-gray-300">{importFileName}</span> ({importRows.length} rows)</span>
                    )}
                </div>

                {importType === 'transactions' && (
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={replaceTransactions}
                            onChange={(e) => setReplaceTransactions(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        Replace existing transactions instead of appending import rows
                    </label>
                )}

                {importHeaders.length > 0 && (
                    <div className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Preview ({Math.min(importRows.length, 3)} of {importRows.length} rows)
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        {importHeaders.slice(0, 6).map(header => (
                                            <th key={header} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {importRows.slice(0, 3).map((row, index) => (
                                        <tr key={index} className="border-b border-gray-50 dark:border-gray-800">
                                            {importHeaders.slice(0, 6).map(header => (
                                                <td key={header} className="px-3 py-2 text-gray-700 dark:text-gray-300">{row[header] || '—'}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleRunImport}
                        disabled={isImporting || importRows.length === 0}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isImporting ? 'Importing…' : `Import ${importType === 'transactions' ? 'Transactions' : importType === 'merchants' ? 'Merchants' : 'Team'}`}
                    </button>
                    {importError && <p className="text-xs text-red-600">{importError}</p>}
                    {importSummary && <p className="text-xs text-green-600">{importSummary}</p>}
                </div>
            </div>

            {/* Integration Cards by Category */}
            {CATEGORIES.map(category => {
                const items = INTEGRATIONS.filter(i => i.category === category);
                return (
                    <div key={category}>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                            {category}
                        </h3>
                        <div className="space-y-3">
                            {items.map(integration => (
                                <div key={integration.id}>
                                    <IntegrationCard
                                        integration={integration}
                                        onSave={() => forceUpdate(n => n + 1)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Footer note */}
            <div className="text-xs text-gray-400 dark:text-gray-600 text-center pb-4">
                {LIVE_INTEGRATIONS_ENABLED
                    ? 'All API keys are stored locally in your browser and are never transmitted to One82 servers. Keys are only used to call the respective integration\'s own API directly.'
                    : 'Demo phase lock is enabled. Live integration connections are unavailable in this environment.'}
            </div>
        </div>
    );
};

export default Integrations;
