import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp, Eye, EyeOff, Zap, Upload, FileSpreadsheet, Users, AlertTriangle } from 'lucide-react';
import {
    INTEGRATIONS,
    IntegrationCategory,
    isIntegrationConnected,
    saveIntegrationKey,
    getIntegrationKey,
} from '../services/integrationsConfig';
import { stripeService } from '../services/processorService';
import { StorageService } from '../services/storage';
import { ImportAuditEntry, MerchantInvite, Transaction } from '../types';

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

const transformStripeTransactions = (records: Awaited<ReturnType<typeof stripeService.getTransactions>>): Transaction[] => {
    return records
        .map((record, index): Transaction | null => {
            const parsedDate = new Date(record.date);
            if (!Number.isFinite(record.amount) || record.amount <= 0) return null;

            const method: Transaction['method'] =
                record.cardBrand === 'Mastercard'
                    ? 'MasterCard'
                    : record.cardBrand === 'Amex'
                        ? 'Amex'
                        : 'Visa';

            const status: Transaction['status'] =
                record.status === 'Declined'
                    ? 'Failed'
                    : record.status === 'Pending'
                        ? 'Pending'
                        : 'Completed';

            const nextRow: Transaction = {
                id: `stripe_${record.id || index}`,
                date: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
                amount: Number(record.amount),
                status,
                customer: record.merchantId || 'Stripe Merchant',
                items: ['Stripe charge'],
                method,
                category: 'Uncategorized'
            };

            return nextRow;
        })
        .filter((transaction): transaction is Transaction => Boolean(transaction));
};

const dedupeTransactions = (transactions: Transaction[]): Transaction[] => {
    const bySignature = new Map<string, Transaction>();
    transactions.forEach((transaction) => {
        const signature = [
            transaction.id,
            transaction.date.slice(0, 10),
            transaction.amount.toFixed(2),
            transaction.customer.toLowerCase()
        ].join('::');
        bySignature.set(signature, transaction);
    });
    return Array.from(bySignature.values()).sort((left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime()
    );
};

const IntegrationCard = ({ integration, onSave }: {
    integration: typeof INTEGRATIONS[0];
    onSave: (integrationId: string, connected: boolean) => void;
}) => {
    const [expanded, setExpanded] = useState(false);
    const [apiKeyValue, setApiKeyValue] = useState(getIntegrationKey(integration.id));
    const [showKey, setShowKey] = useState(false);
    const connected = isIntegrationConnected(integration.id);

    const handleSave = () => {
        saveIntegrationKey(integration.id, apiKeyValue);
        setExpanded(false);
        onSave(integration.id, apiKeyValue.trim().length > 0);
    };

    const handleDisconnect = () => {
        saveIntegrationKey(integration.id, '');
        setApiKeyValue('');
        onSave(integration.id, false);
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
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
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
                                type={showKey ? 'text' : 'password'}
                                value={apiKeyValue}
                                onChange={(e) => setApiKeyValue(e.target.value)}
                                placeholder={`Paste your ${integration.name} API key here...`}
                                className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors"
                        >
                            Save & Connect
                        </button>
                        {connected && (
                            <button
                                onClick={handleDisconnect}
                                className="px-4 py-2 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
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
    const [syncAlert, setSyncAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [lastImportErrorReport, setLastImportErrorReport] = useState<string | null>(null);
    const [importAuditLog, setImportAuditLog] = useState<ImportAuditEntry[]>([]);
    const [retryCooldownUntil, setRetryCooldownUntil] = useState(0);
    const [nowMs, setNowMs] = useState(Date.now());
    const [stripeLastSyncedAt, setStripeLastSyncedAt] = useState<number | null>(null);
    const isAuthTrialMode = StorageService.getDataMode() === 'backend';
    const role = StorageService.getUser()?.role || 'merchant';

    const connectedCount = INTEGRATIONS.filter(i => isIntegrationConnected(i.id)).length;
        const raiseSyncAlert = (alert: { type: 'success' | 'error' | 'info'; message: string }) => {
            setSyncAlert(alert);
            if (alert.type === 'error') {
                localStorage.setItem('one82_sync_alert', JSON.stringify({ ...alert, timestamp: Date.now() }));
                window.dispatchEvent(new Event('one82-sync-alert'));
            }
        };

    const stripeConnected = isIntegrationConnected('stripe');
    const retryCooldownSeconds = Math.max(0, Math.ceil((retryCooldownUntil - nowMs) / 1000));

    useEffect(() => {
        if (retryCooldownUntil <= Date.now()) return;
        const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [retryCooldownUntil]);

    const firstRunChecklist = role === 'iso'
        ? [
            'Connect Stripe first (recommended production path)',
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
            setImportAuditLog(StorageService.getImportAuditLog());
        };

        void loadImportedCounts();
    }, []);

    const logImportAudit = (payload: {
        importType: ImportType;
        fileName: string;
        rowCount: number;
        status: 'success' | 'failed';
        errorMessage?: string;
    }) => {
        const user = StorageService.getUser();
        const actor = user?.name
            ? `${user.name} (${user.email})`
            : user?.email || 'Unknown User';

        StorageService.appendImportAuditLogEntry({
            actor,
            importType: payload.importType,
            fileName: payload.fileName,
            rowCount: payload.rowCount,
            status: payload.status,
            errorMessage: payload.errorMessage
        });
        setImportAuditLog(StorageService.getImportAuditLog());
    };

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setImportError(null);
        setImportSummary(null);
        const file = event.target.files?.[0];
        if (!file) return;

        const buildImportErrorReport = (message: string): string => {
            const lines = [
                `ONE82 Import Error Report`,
                `Generated: ${new Date().toISOString()}`,
                `Import Type: ${importType}`,
                `File: ${file.name}`,
                `Rows Parsed: ${importRows.length}`,
                `Headers: ${importHeaders.join(', ') || 'N/A'}`,
                `Error: ${message}`
            ];
            return `${lines.join('\n')}\n`;
        };

        const text = await file.text();
        const rows = parseCsvRows(text);

        if (rows.length < 2) {
            const message = 'CSV must include a header row and at least one data row.';
            setImportError(message);
            setLastImportErrorReport(buildImportErrorReport(message));
            logImportAudit({
                importType,
                fileName: file.name,
                rowCount: Math.max(0, rows.length - 1),
                status: 'failed',
                errorMessage: message
            });
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
                const message = 'Transaction imports require at least amount and customer/name columns.';
                setImportError(message);
                setLastImportErrorReport(buildImportErrorReport(message));
                logImportAudit({
                    importType,
                    fileName: file.name,
                    rowCount: records.length,
                    status: 'failed',
                    errorMessage: message
                });
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
        const buildImportErrorReport = (message: string): string => {
            const lines = [
                `ONE82 Import Error Report`,
                `Generated: ${new Date().toISOString()}`,
                `Import Type: ${importType}`,
                `File: ${importFileName || 'N/A'}`,
                `Rows Parsed: ${importRows.length}`,
                `Headers: ${importHeaders.join(', ') || 'N/A'}`,
                `Error: ${message}`
            ];
            return `${lines.join('\n')}\n`;
        };

        if (importRows.length === 0) {
            const message = 'Upload a CSV file before importing.';
            setImportError(message);
            setLastImportErrorReport(buildImportErrorReport(message));
            logImportAudit({
                importType,
                fileName: importFileName || 'N/A',
                rowCount: 0,
                status: 'failed',
                errorMessage: message
            });
            return;
        }

        setImportError(null);
        setImportSummary(null);
        setLastImportErrorReport(null);
        setIsImporting(true);

        try {
            const inviteStrategy = StorageService.getMerchantInviteStrategy();

            if (importType === 'transactions') {
                const importedTransactions = transformImportedTransactions(importRows);
                if (importedTransactions.length === 0) {
                    const message = 'No valid transactions found. Include at least amount and customer columns.';
                    setImportError(message);
                    setLastImportErrorReport(buildImportErrorReport(message));
                    logImportAudit({
                        importType,
                        fileName: importFileName || 'N/A',
                        rowCount: importRows.length,
                        status: 'failed',
                        errorMessage: message
                    });
                    setIsImporting(false);
                    return;
                }

                const existing = replaceTransactions ? [] : await StorageService.getTransactionsResolved();
                await StorageService.saveTransactionsResolved([...importedTransactions, ...existing]);
                setImportSummary(`Imported ${importedTransactions.length} transaction${importedTransactions.length === 1 ? '' : 's'} from ${importFileName}. Data landed in Transactions, Dashboard, Forecast, and Data Chat context.`);
                logImportAudit({
                    importType,
                    fileName: importFileName || 'N/A',
                    rowCount: importedTransactions.length,
                    status: 'success'
                });
                raiseSyncAlert({ type: 'success', message: 'Transactions imported successfully. Data sync is healthy for imported rows.' });
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
                setImportSummary(`Imported ${importRows.length} merchant record${importRows.length === 1 ? '' : 's'} from ${importFileName}. ${generatedInvites.length > 0 ? `Auto-invited ${generatedInvites.length} merchant contact${generatedInvites.length === 1 ? '' : 's'}. ` : ''}Data landed in ISO portfolio/merchant views.`);
                logImportAudit({
                    importType,
                    fileName: importFileName || 'N/A',
                    rowCount: importRows.length,
                    status: 'success'
                });
                raiseSyncAlert({ type: 'success', message: 'Merchant roster imported successfully. Portfolio sync context is up to date.' });
            }

            if (importType === 'team') {
                await StorageService.saveImportedDataResolved({ team: importRows });
                setTeamCount(importRows.length);
                setImportSummary(`Imported ${importRows.length} team member record${importRows.length === 1 ? '' : 's'} from ${importFileName}. Data landed in Team views and assignment context.`);
                logImportAudit({
                    importType,
                    fileName: importFileName || 'N/A',
                    rowCount: importRows.length,
                    status: 'success'
                });
                raiseSyncAlert({ type: 'success', message: 'Team import completed successfully.' });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Import failed. Please try again.';
            setImportError(message);
            setLastImportErrorReport(buildImportErrorReport(message));
            logImportAudit({
                importType,
                fileName: importFileName || 'N/A',
                rowCount: importRows.length,
                status: 'failed',
                errorMessage: message
            });
            raiseSyncAlert({ type: 'error', message: 'Sync/import failed. Check CSV format or integration credentials, then retry.' });
        } finally {
            setIsImporting(false);
        }
    };

    const handleRetrySync = async () => {
        if (retryCooldownSeconds > 0 || isImporting) return;
        setRetryCooldownUntil(Date.now() + 30000);

        if (importRows.length > 0) {
            await handleRunImport();
            return;
        }

        raiseSyncAlert({
            type: 'info',
            message: 'No import payload is loaded to retry. Upload a CSV or reconnect an integration, then retry sync.'
        });
    };

    const handleStripeSync = async () => {
        if (!stripeConnected || isImporting) return;

        setImportError(null);
        setImportSummary(null);
        setIsImporting(true);

        try {
            const stripeTransactions = await stripeService.getTransactions();
            const normalized = transformStripeTransactions(stripeTransactions);

            if (normalized.length === 0) {
                const message = 'Stripe returned no completed/pending transactions for sync.';
                setImportError(message);
                raiseSyncAlert({ type: 'info', message });
                logImportAudit({
                    importType: 'transactions',
                    fileName: 'stripe-live-sync',
                    rowCount: 0,
                    status: 'failed',
                    errorMessage: message
                });
                return;
            }

            const existing = await StorageService.getTransactionsResolved();
            const merged = dedupeTransactions([...normalized, ...existing]);
            await StorageService.saveTransactionsResolved(merged);
            window.dispatchEvent(new Event('user-update'));

            const syncedAt = Date.now();
            setStripeLastSyncedAt(syncedAt);
            setImportSummary(`Stripe sync imported ${normalized.length} transaction${normalized.length === 1 ? '' : 's'} and updated dashboard data.`);
            raiseSyncAlert({ type: 'success', message: `Stripe sync completed (${normalized.length} transaction${normalized.length === 1 ? '' : 's'}).` });
            logImportAudit({
                importType: 'transactions',
                fileName: 'stripe-live-sync',
                rowCount: normalized.length,
                status: 'success'
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Stripe sync failed. Please reconnect Stripe and retry.';
            setImportError(message);
            raiseSyncAlert({ type: 'error', message });
            logImportAudit({
                importType: 'transactions',
                fileName: 'stripe-live-sync',
                rowCount: 0,
                status: 'failed',
                errorMessage: message
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadImportErrorReport = () => {
        if (!lastImportErrorReport) return;
        const blob = new Blob([lastImportErrorReport], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `one82-import-error-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                    {isAuthTrialMode
                        ? 'Auth/Trial mode uses real/imported data only. Connect APIs or import CSV to populate dashboards.'
                        : 'Plug in your API keys to go live. Without keys, data can run in simulation mode.'}
                </p>
            </div>

            {/* Status Banner */}
            <div className={`rounded-xl p-4 flex items-center justify-between border ${connectedCount > 0
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {connectedCount > 0
                            ? `${connectedCount} integration${connectedCount > 1 ? 's' : ''} connected`
                            : isAuthTrialMode
                                ? 'Auth/Trial mode ready for imports'
                                : 'Running in simulation mode'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {connectedCount > 0
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

            <div className={`rounded-xl p-4 border ${stripeConnected
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900/40'
                : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40'
                }`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Stripe-first production path</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            Recommended success criteria: Stripe connected, at least one successful transaction import/sync, and Dashboard metrics reflecting fresh records.
                        </p>
                        {stripeLastSyncedAt && (
                            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1">
                                Last Stripe sync: {new Date(stripeLastSyncedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {stripeConnected ? (
                            <button
                                type="button"
                                onClick={() => { void handleStripeSync(); }}
                                disabled={isImporting}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImporting ? 'Syncing Stripe…' : 'Run Stripe Sync'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => document.getElementById('integration-stripe')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                            >
                                Connect Stripe
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {syncAlert && (
                <div className={`rounded-xl p-4 border flex items-start gap-3 ${syncAlert.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40'
                    : syncAlert.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/40'
                        : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/40'
                    }`}>
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${syncAlert.type === 'error'
                        ? 'text-red-600 dark:text-red-300'
                        : syncAlert.type === 'success'
                            ? 'text-green-600 dark:text-green-300'
                            : 'text-blue-600 dark:text-blue-300'
                        }`} />
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">Integration Sync Alert</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{syncAlert.message}</p>
                        {syncAlert.type === 'error' && (
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => void handleRetrySync()}
                                    disabled={retryCooldownSeconds > 0 || isImporting}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {retryCooldownSeconds > 0 ? `Retry Sync (${retryCooldownSeconds}s)` : 'Retry Sync'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSyncAlert(null)}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                                >
                                    Dismiss
                                </button>
                                <a
                                    href="https://stripe.com/docs/api"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                                >
                                    Stripe Docs
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                    {importError && lastImportErrorReport && (
                        <button
                            type="button"
                            onClick={handleDownloadImportErrorReport}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/10"
                        >
                            Download Error Report
                        </button>
                    )}
                    {importSummary && <p className="text-xs text-green-600">{importSummary}</p>}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Import Audit Log</h3>
                {importAuditLog.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No import events yet. Completed and failed imports will appear here with actor, file, and error context.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-500 uppercase tracking-wide">
                                    <th className="py-2 pr-3 text-left font-semibold">When</th>
                                    <th className="py-2 pr-3 text-left font-semibold">Actor</th>
                                    <th className="py-2 pr-3 text-left font-semibold">Type</th>
                                    <th className="py-2 pr-3 text-left font-semibold">File</th>
                                    <th className="py-2 pr-3 text-left font-semibold">Rows</th>
                                    <th className="py-2 pr-3 text-left font-semibold">Status</th>
                                    <th className="py-2 text-left font-semibold">Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importAuditLog.slice(0, 12).map((entry) => (
                                    <tr key={entry.id} className="border-b border-gray-50 dark:border-gray-800">
                                        <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{new Date(entry.createdAt).toLocaleString()}</td>
                                        <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{entry.actor}</td>
                                        <td className="py-2 pr-3 text-gray-600 dark:text-gray-300 uppercase">{entry.importType}</td>
                                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-200">{entry.fileName}</td>
                                        <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{entry.rowCount}</td>
                                        <td className="py-2 pr-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold ${entry.status === 'success'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                                }`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td className="py-2 text-gray-600 dark:text-gray-300">{entry.errorMessage || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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
                                <div key={integration.id} id={`integration-${integration.id}`}>
                                    <IntegrationCard
                                        integration={integration}
                                        onSave={(integrationId, connected) => {
                                            forceUpdate(n => n + 1);
                                            if (integrationId === 'stripe') {
                                                raiseSyncAlert(connected
                                                    ? { type: 'success', message: 'Stripe connected. Next: run transaction import/sync and verify Dashboard freshness.' }
                                                    : { type: 'info', message: 'Stripe disconnected. Reconnect to keep the primary production sync path active.' });
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Footer note */}
            <div className="text-xs text-gray-400 dark:text-gray-600 text-center pb-4">
                All API keys are stored locally in your browser and are never transmitted to One82 servers. Keys are only used to call the respective integration's own API directly.
            </div>
        </div>
    );
};

export default Integrations;
