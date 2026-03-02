import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eSignApi } from '../../services/apiHelper';
import { Download, Printer, ChevronLeft, ExternalLink, CheckCircle2, PenLine, ListOrdered, Info, ArrowLeft, Copy, Check } from 'lucide-react';

declare global {
    interface Window { pdfjsLib: any }
}

interface Recipient {
    id: string;
    name: string;
    email: string;
    role?: string;
    status: string; // e.g. completed, delivered, sent
    order?: number; // signing order
}

interface EnvelopeDetailsResponse {
    id: string;
    subject: string;
    status: string;
    createdAt?: string;
    sentAt?: string;
    updatedAt?: string;
    isPowerForm?: boolean;
    powerFormId?: string;
    sender?: { name?: string; email?: string };
    recipients?: Recipient[];
    envelopetype?: string;
    documents?: Array<{ id: string; name?: string }>;
    message?: string;
    direction?: string;
    currRecipient?:string;
}

const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    return d.toLocaleString();
};

// Try to fetch a printable/downloadable PDF blob for an envelope
// Removed active usage; left here commented for future reference
// async function fetchEnvelopePdfBlob(envelopeId: string): Promise<{ blob: Blob; filename: string } | null> { return null; }

const EnvelopeDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [envelope, setEnvelope] = useState<EnvelopeDetailsResponse | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    // No iframe preview – open full preview in new tab instead
    const previewWrapRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeScale, setIframeScale] = useState<number>(0.25);
    const [pageCount] = useState<number | null>(null);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const [showSigningOrder, setShowSigningOrder] = useState<boolean>(false);
    const infoRef = useRef<HTMLDivElement>(null);
    const [showIdPopover, setShowIdPopover] = useState<boolean>(false);
    const idRef = useRef<HTMLButtonElement>(null);
    const [copiedId, setCopiedId] = useState<boolean>(false);
    const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
    const [showMoveDialog, setShowMoveDialog] = useState<boolean>(false);
    const [selectedFolder, setSelectedFolder] = useState<string>('Inbox');
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const moreBtnRef = useRef<HTMLButtonElement>(null);
    const resendBtnRef = useRef<HTMLButtonElement>(null);
    const [resendLoading, setResendLoading] = useState<boolean>(false);
    const [_showEmbedUrl, setShowEmbedUrl] = useState<boolean>(false);
    const [copiedEmbedUrl, setCopiedEmbedUrl] = useState<boolean>(false);
    const [copiedEmbedCode, setCopiedEmbedCode] = useState<boolean>(false);

    // scaling handled below with baseW/baseH for signer view
    // Preview now uses signer iframe; canvas kept for future

    // Load PDF.js and set worker like in InsertPDF.tsx
    // const loadPDFJS = useCallback(async () => {/* reserved */}, []);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            setLoading(true);
            setError('');
            try {
                const res = await eSignApi.get(`/api/e-sign/envelope/${id}`);
                if (res?.status === 200 && res.data?.status === 'success') {
                    const envelopeData = res.data.data as EnvelopeDetailsResponse;
                    setEnvelope(envelopeData);
                    // Show embed URL if powerFormId exists (already configured)
                    if (envelopeData.isPowerForm && envelopeData.powerFormId) {
                        setShowEmbedUrl(true);
                    }
                } else {
                    setError(res?.data?.message || 'Failed to load envelope');
                }
            } catch (err: any) {
                setError('Failed to load envelope');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // Build a preview using existing signer route (scaled iframe to look like thumbnail)
    useEffect(() => {
        let revoked = false;
        const makePreview = async () => {
            if (!id) return;
            try {
                const res = await eSignApi.get(`/api/e-sign/envelope/${id}`);
                if (res?.status === 200 && res.data?.status === 'success') {
                    const docs: Array<{ id: string }> = res.data.data.documents || [];
                    if (docs.length > 0) {
                        const url = `/e-sign/signer/${id}/${res?.data?.data?.currRecipient}`;
                        if (!revoked) setPreviewUrl(url);
                        // If backend later provides page count, set it here
                        // setPageCount(res.data.data.documents[0].pages || null);
                    }
                }
            } catch (_) { }
        };
        makePreview();
        return () => {
            revoked = true;
            // nothing to revoke when using route URL
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Close info popover on outside click
    useEffect(() => {
        if (!showInfo) return;
        const onClick = (e: MouseEvent) => {
            if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
                setShowInfo(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [showInfo]);

    // Close ID popover on outside click
    useEffect(() => {
        if (!showIdPopover) return;
        const onClick = (e: MouseEvent) => {
            const pop = document.getElementById('envelope-id-popover');
            if (pop && !pop.contains(e.target as Node) && idRef.current && !idRef.current.contains(e.target as Node)) {
                setShowIdPopover(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [showIdPopover]);

    // Close More menu on outside click only
    useEffect(() => {
        if (!showMoreMenu) return;
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node;
            const insideMenu = moreMenuRef.current && moreMenuRef.current.contains(target);
            const onTrigger = moreBtnRef.current && moreBtnRef.current.contains(target);
            if (!insideMenu && !onTrigger) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [showMoreMenu]);

    // no dropdown for resend; single click

    // Fit iframe to container (keep it small and crisp)
    useEffect(() => {
        const baseW = 1034; // logical width of signer view
        const baseH = 1325; // logical height (portrait)
        const fit = () => {
            const el = previewWrapRef.current;
            if (!el) return;
            const w = el.clientWidth;
            const h = el.clientHeight;
            if (!w || !h) return;
            const scale = Math.min(w / baseW, h / baseH);
            setIframeScale(scale);
        };
        fit();
        window.addEventListener('resize', fit);
        return () => window.removeEventListener('resize', fit);
    }, []);

    const handleDownload = async () => {
        if (!id) return;
        try {
            const res = await eSignApi.get(`/api/e-sign/envelope/${id}`);
            const docs: Array<{ id: string; name?: string }> = res?.data?.data?.documents || [];
            if (docs.length > 0) {
                // Fall back to signer view; user can save from there
                window.open(`/e-sign/signer/${id}/${docs[0].id}`, '_blank');
                return;
            }
        } catch (_) { }
        alert('Download endpoint is not available for this server.');
    };

    const handlePrint = async () => {
        if (!id) return;
        try {
            const res = await eSignApi.get(`/api/e-sign/envelope/${id}`);
            const docs: Array<{ id: string }> = res?.data?.data?.documents || [];
            if (docs.length > 0) {
                // Open signer route and let the user print from there
                window.open(`/e-sign/signer/${id}/${docs[0].id}`, '_blank');
                return;
            }
        } catch (_) { }
        alert('Print endpoint is not available for this server.');
    };

    const recipients = useMemo(() => envelope?.recipients || [], [envelope]);
    const isCompleted = useMemo(() => {
        const s = (envelope?.status || '').toLowerCase();
        if (s === 'completed') return true;
        const anyIncomplete = (envelope?.recipients || []).some(r => (r.status || '').toLowerCase() !== 'completed');
        return !anyIncomplete ? true : false;
    }, [envelope]);

    const handleCorrect = () => {
        if (!id) return;
        const url = `/e-sign/edit/${id}`;
        try { setTimeout(() => navigate(url), 0); } catch (_) { }
        // Hard fallback to guarantee navigation
        setTimeout(() => { window.location.href = url; }, 0);
    };

    const handleResendAll = async () => {
        if (!id) return;
        try {
            setResendLoading(true);
            const status = (envelope?.status || '').toLowerCase();
            if (status === 'draft') {
                await eSignApi.post(`/api/e-sign/send-envelope/${id}`);
            } else if (status === 'in-progress' || status === 'waiting' || status === 'pending') {
                await eSignApi.post(`/api/e-sign/envelope/reminder/${id}`);
            } else {
                alert(`Envelope is '${envelope?.status}'. Resend not applicable.`);
                return;
            }
            alert('Email queued successfully');
        } catch (e) {
            alert('Failed to trigger email');
        } finally {
            setResendLoading(false);
        }
    };

    // reserved for future per-recipient resend

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    if (error || !envelope) {
        return (
            <div className="p-6">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"><ChevronLeft className="w-4 h-4" /> Back</button>
                <div className="text-red-600">{error || 'Envelope not found'}</div>
            </div>
        );
    }

    return (
        <div className="text-[10px]">
            <div className="flex items-start gap-8">
                {/* Main content */}
                <div className="bg-white p-4 flex-1">
                    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mr-4"><ArrowLeft className="w-4 h-4" /> </button>
                    <div className="relative inline-flex items-center gap-2 mb-2">
                        <h1 className="text-[18px] leading-8 font-semibold text-gray-900">{envelope.subject || 'Untitled'}</h1>
                        <div className="relative inline-block" ref={infoRef}>
                            <button
                                onClick={() => setShowInfo((s) => !s)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
                                aria-label="Details"
                            >
                                <Info className="w-4 h-4" />
                            </button>

                            {showInfo && (
                                <div
                                    className="
                    absolute z-50 
                    bg-white rounded-lg shadow-xl 
                    p-2 text-[12px]
                    w-45
                  "
                                >
                                    <div className="text-[16px] font-semibold mb-3">Details</div>

                                    <div className="mb-3">
                                        <div className="font-semibold">Folders</div>
                                        <a href="#" className="text-indigo-600 hover:underline">Sent Items</a>
                                    </div>

                                    <div className="mb-3">
                                        <div className="font-semibold">Created</div>
                                        <div>{formatDateTime(envelope.createdAt)}</div>
                                    </div>

                                    <div className="mb-3">
                                        <div className="font-semibold">Sent</div>
                                        <div>{formatDateTime(envelope.sentAt)}</div>
                                    </div>

                                    <div>
                                        <div className="font-semibold">Expires</div>
                                        <div>—</div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                    <div className="text-xs text-gray-600 space-y-1 mb-6 relative">
                        <div className="flex items-center gap-1">
                            <button
                                ref={idRef}
                                type="button"
                                onClick={() => setShowIdPopover((s) => !s)}
                                className="text-blue-900 font-bold hover:underline"
                            >
                                Envelope ID
                            </button>

                        </div>
                        {showIdPopover && (
                            <div
                                id="envelope-id-popover"
                                className="absolute z-50 bg-white rounded-xl shadow-2xl p-4 w-[320px]"
                                style={{ top: '-20px', left: '10%' }}
                            >
                                {/* Left Arrow */}
                                <div
                                    className="
                    absolute 
                    left-[-8px] top-1/5 -translate-y-1/2
                    w-0 h-0
                    border-t-8 border-t-transparent
                    border-b-8 border-b-transparent
                    border-r-8 border-r-white
                    drop-shadow
                  "
                                ></div>

                                <div className="flex items-start justify-between mb-3">
                                    <div className="text-[16px] font-semibold text-blue">Envelope ID</div>
                                    <button
                                        onClick={() => setShowIdPopover(false)}
                                        className="text-gray-600 hover:text-gray-800"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="text-[14px] text-gray-900 break-all mb-3">
                                    {envelope.id}
                                </div>

                                <div className="text-right">
                                    <button
                                        onClick={async () => {
                                            try {
                                                if ((navigator as any).clipboard && (navigator as any).clipboard.writeText) {
                                                    await (navigator as any).clipboard.writeText(envelope.id || '');
                                                } else {
                                                    const ta = document.createElement('textarea');
                                                    ta.value = envelope.id || '';
                                                    ta.style.position = 'fixed';
                                                    ta.style.left = '-9999px';
                                                    document.body.appendChild(ta);
                                                    ta.select();
                                                    document.execCommand('copy');
                                                    document.body.removeChild(ta);
                                                }
                                                setCopiedId(true);
                                                setTimeout(() => setCopiedId(false), 1500);
                                            } catch (e) {
                                                const ta = document.createElement('textarea');
                                                ta.value = envelope.id || '';
                                                ta.style.position = 'fixed';
                                                ta.style.left = '-9999px';
                                                document.body.appendChild(ta);
                                                ta.select();
                                                document.execCommand('copy');
                                                document.body.removeChild(ta);
                                                setCopiedId(true);
                                                setTimeout(() => setCopiedId(false), 1500);
                                            }
                                        }}
                                        className="px-4 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                                    >
                                        {copiedId ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        )}


                        <div>
                            From: <span className="text-indigo-700">{envelope.sender?.name || envelope.sender?.email || 'Unknown'}</span>
                        </div>
                        <div>Last change on {formatDateTime(envelope.updatedAt || envelope.sentAt || envelope.createdAt)}</div>
                        <div>Sent on {formatDateTime(envelope.sentAt || envelope.createdAt)}</div>
                    </div>

                    {(() => {
                        const s = (envelope.status || '').toLowerCase();
                        const anyWaiting = (envelope.recipients || []).some(
                            r => (r.status || '').toLowerCase() === 'waiting'
                        );

                        let label;
                        if (envelope.isPowerForm) {
                            label = 'Power Form';
                        } else if (anyWaiting || s === 'waiting') {
                            label = 'Waiting for Others';
                        } else if (s === 'in-progress') {
                            label = 'In Progress';
                        } else if (envelope.status) {
                            label = envelope.status.charAt(0).toUpperCase() + envelope.status.slice(1);
                        } else {
                            label = 'Completed';
                        }

                        const kind = label.toLowerCase();

                        const chipClass =
                            kind === 'power form'
                                ? 'bg-amber-50 text-xs text-amber-600 border border-amber-200' // magenta theme
                                : kind === 'waiting for others'
                                    ? 'bg-gray-100 text-xs text-gray-900 border border-gray-300'
                                    : kind === 'completed'
                                        ? 'bg-green-50 text-xs text-green-700 border border-green-200'
                                        : kind === 'in progress'
                                            ? 'bg-yellow-50 text-xs text-yellow-800 border border-yellow-200'
                                            : 'bg-gray-100 text-xs text-gray-900 border border-gray-300';

                        const dotClass =
                            kind === 'power form'
                                ? 'bg-amber-600'
                                : kind === 'waiting for others'
                                    ? 'bg-gray-600'
                                    : kind === 'completed'
                                        ? 'bg-green-500'
                                        : kind === 'in progress'
                                            ? 'bg-yellow-500'
                                            : 'bg-gray-600';

                        return (
                            <div
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-6 ${chipClass}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
                                {label}
                            </div>
                        );
                    })()}


                    {/* Actions */}
                    <div className="flex justify-between items-center mb-6 relative w-full">

                        {/* LEFT GROUP — MOVE + MORE */}
                        <div className="flex items-center gap-3">
                            {/* Correct and Resend (only if not completed) */}
                            {!isCompleted && (
                                <>  
                                   {envelope.direction!='Received' && (
                                    <>
                                    <button
                                        onClick={handleCorrect}
                                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-small font-bold"
                                    >
                                        CORRECT
                                    </button>

                                    <button
                                        ref={resendBtnRef}
                                        onClick={() => { if (!resendLoading) handleResendAll(); }}
                                        className={`px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-small font-bold ${resendLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {resendLoading ? 'RESENDING…' : 'RESEND'}
                                    </button>
                                    </>
                                 )}
                                </>
                            )}
                            {/* Move button */}
                            {/* <div className="relative">
                                <button
                                    onClick={() => setShowMoveDialog(true)}
                                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-small font-bold"
                                >
                                    MOVE
                                </button>
                            </div> */}

                            {/* More button */}
                            {/* <div className="relative">
                                <button
                                    ref={moreBtnRef}
                                    onClick={() => setShowMoreMenu(prev => !prev)}
                                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-small flex items-center gap-1 font-bold"
                                >
                                    MORE <span className="text-xs">▾</span>
                                </button>
                                {showMoreMenu && (
                                    <div ref={moreMenuRef} className="absolute left-0 mt-2 w-52 bg-white rounded-md shadow-lg z-20">
                                        <button
                                            onClick={() => {
                                                setShowMoreMenu(false);
                                                if (id) {
                                                    const url = `/e-sign/edit/${id}`;
                                                    setTimeout(() => {
                                                        try { navigate(url); } catch (_) {}
                                                        // Hard fallback to guarantee navigation
                                                        window.location.href = url;
                                                    }, 0);
                                                }
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                                        >
                                            Forward
                                        </button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Copy</button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Save as Template</button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">History</button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Transfer Ownership</button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Export as CSV</button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600">Delete</button>
                                    </div>
                                )}
                            </div> */}
                        </div>

                        {/* RIGHT GROUP — DOWNLOAD + PRINT */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleDownload}
                                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                <Download className="w-4 h-4 text-gray-600" />
                            </button>

                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                <Printer className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>


                    <hr className="border-gray-300 mb-6" />
                    {/* Recipients */}

                    <div className="mb-8">


                        {envelope.isPowerForm ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-[15px] font-semibold text-gray-900">Power Form</h2>
                                </div>
                                { envelope.isPowerForm ? (
                                    <div className="py-3 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">Embed URL:</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                            <code className="flex-1 text-sm text-gray-800 break-all">
                                                {`${window.location.origin}/e-sign/power-form/${envelope.id}`}
                                            </code>
                                            <button
                                                onClick={async () => {
                                                    const url = `${window.location.origin}/e-sign/power-form/${envelope.id}`;
                                                    try {
                                                        if (navigator.clipboard && navigator.clipboard.writeText) {
                                                            await navigator.clipboard.writeText(url);
                                                        } else {
                                                            const ta = document.createElement('textarea');
                                                            ta.value = url;
                                                            ta.style.position = 'fixed';
                                                            ta.style.left = '-9999px';
                                                            document.body.appendChild(ta);
                                                            ta.select();
                                                            document.execCommand('copy');
                                                            document.body.removeChild(ta);
                                                        }
                                                        setCopiedEmbedUrl(true);
                                                        setTimeout(() => setCopiedEmbedUrl(false), 2000);
                                                    } catch (e) {
                                                        console.error('Failed to copy:', e);
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                            >
                                                {copiedEmbedUrl ? (
                                                    <>
                                                        <Check className="w-4 h-4 text-green-600" />
                                                        <span>Copied</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        <span>Copy</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-medium text-blue-900">Embed Code:</p>
                                                <button
                                                    onClick={async () => {
                                                        const embedCode = `<iframe src="${window.location.origin}/e-sign/power-form/${envelope.powerFormId}/${envelope.id}" width="600" height="800" frameborder="0"></iframe>`;
                                                        try {
                                                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                                                await navigator.clipboard.writeText(embedCode);
                                                            } else {
                                                                const ta = document.createElement('textarea');
                                                                ta.value = embedCode;
                                                                ta.style.position = 'fixed';
                                                                ta.style.left = '-9999px';
                                                                document.body.appendChild(ta);
                                                                ta.select();
                                                                document.execCommand('copy');
                                                                document.body.removeChild(ta);
                                                            }
                                                            setCopiedEmbedCode(true);
                                                            setTimeout(() => setCopiedEmbedCode(false), 2000);
                                                        } catch (e) {
                                                            console.error('Failed to copy:', e);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                                                >
                                                    {copiedEmbedCode ? (
                                                        <>
                                                            <Check className="w-3 h-3 text-green-600" />
                                                            <span>Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3 h-3" />
                                                            <span>Copy Code</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <code className="text-xs text-blue-800 break-all block">
                                                {`<iframe src="${window.location.origin}/e-sign/power-form/${envelope.id}" width="600" height="800" frameborder="0"></iframe>`}
                                            </code>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 py-3">
                                        <button
                                            onClick={() => {
                                                if (envelope.powerFormId) {
                                                    setShowEmbedUrl(true);
                                                } else {
                                                    // If powerFormId doesn't exist, navigate to embed page
                                                    navigate(`/e-sign/power-form-embed/${envelope.id}`);
                                                }
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#D600AA] text-white text-sm font-medium rounded-md hover:bg-[#b30088] transition-colors"
                                        >
                                            <PenLine className="w-4 h-4" />
                                            Generate Embed URL
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Generate embed URL for this power form
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-[15px] font-semibold text-gray-900">Recipients</h2>
                                    <button
                                        type="button"
                                        onClick={() => setShowSigningOrder(true)}
                                        className="flex items-center gap-2 text-gray-900 font-semibold tracking-wide hover:underline"
                                    >
                                        <ListOrdered className="w-4 h-4" /> SIGNING ORDER
                                    </button>
                                </div>
                                <div className="divide-y">
                                    {recipients.length === 0 ? (
                                        <div className="p-4 text-gray-600">No recipients</div>
                                    ) : (
                                        recipients.map((r, idx) => {
                                            const status = (r.status || '').toLowerCase();
                                            const isSigned = status === 'signed' || status === 'completed';
                                            const isWaiting =
                                                status === 'waiting' || status === 'needs to sign' || status === 'pending';
                                            const isCopy =
                                                (r.role || '').toLowerCase() === 'cc' ||
                                                (r.role || '').toLowerCase() === 'carbon_copy';
                                            const isInPerson = (r.role || '').toLowerCase() === 'in_person_signer';
                                            const rightTitle = isCopy
                                                ? 'Copy Received'
                                                : isInPerson && isWaiting
                                                    ? 'In-person signer'
                                                    : isWaiting
                                                        ? 'Needs to Sign'
                                                        : isSigned
                                                            ? 'Signed'
                                                            : status.charAt(0).toUpperCase() + status.slice(1);
                                            const rightTime = formatDateTime(
                                                envelope.updatedAt || envelope.sentAt || envelope.createdAt
                                            );
                                            const signerUrl = id && r.id ? `${window.location.origin}/e-sign/signer/${id}/${r.id}` : '';

                                            return (
                                                <div key={r.id || idx} className="flex items-start justify-between p-4">
                                                    <div className="flex items-start gap-3">
                                                        {isSigned ? (
                                                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                                                        ) : (
                                                            <span className="w-4 h-4 mt-1 inline-block"></span>
                                                        )}
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{r.name || r.email}</div>
                                                            <div className="text-sm text-gray-600">{r.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right min-w-[220px]">
                                                        <div className="flex items-center justify-end gap-2 text-gray-900 font-semibold">
                                                            {!isCopy && !isInPerson && <PenLine className="w-4 h-4" />}
                                                            {isCopy && <span className="text-gray-700">CC</span>}
                                                            <span>{rightTitle}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-600">on {rightTime}</div>
                                                        {isInPerson && !isSigned && signerUrl && (
                                                            <a
                                                                href={signerUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 mt-2 text-indigo-600 hover:underline text-sm"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                Start in-person signing
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <hr className="border-gray-300 mb-6" />
                    {/* Custom fields */}
                    <div className="mb-8">
                        <h2 className="text-[15px] font-semibold text-gray-900 mb-3">Envelope Type</h2>
                        <div className="p-4 text-sm text-gray-800">
                            {envelope.envelopetype && envelope.envelopetype.length > 0 ? (
                                <p>• {envelope.envelopetype}</p>
                            ) : (
                                <div className="text-gray-600">No custom fields</div>
                            )}
                        </div>
                    </div>
                    <hr className="border-gray-300 mb-6" />
                    {/* Message */}
                    <div>
                        <h2 className="text-[15px] font-semibold text-gray-900 mb-3">Message</h2>
                        <div className="p-4 text-sm text-gray-800 min-h-[120px]">
                            {envelope.message || ''}
                        </div>
                    </div>
                </div>

                {/* Right sidebar (PDF preview & meta) */}
                <aside className="w-[260px] hidden lg:flex lg:flex-col">
                    <div className="text-gray-900 font-medium mb-1 truncate" title={envelope.documents?.[0]?.name || 'Document'}>
                        {envelope.documents?.[0]?.name || 'Document'}
                    </div>
                    <div className="text-gray-600 mb-3">Pages: {pageCount ?? 1}</div>
                    <div ref={previewWrapRef} className="overflow-hidden h-[260px] shrink-0">
                        {previewUrl ? (
                            <div className="w-full h-full overflow-hidden">
                                <iframe
                                    ref={iframeRef}
                                    title="document-preview"
                                    src={previewUrl}
                                    style={{
                                        width: '1034px',
                                        height: '1325px',
                                        transform: `scale(${iframeScale})`,
                                        transformOrigin: '0 0',
                                        border: '0',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">PDF Preview</div>
                        )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-gray-700">
                        <span className="text-sm">1 of {pageCount ?? 1}</span>
                        {previewUrl && (
                            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                <ExternalLink />

                            </a>
                        )}
                    </div>
                </aside>
            </div>
            {/* Signing Order Modal */}
            {showSigningOrder && (() => {
                // Get all recipients sorted by order (excluding CC recipients)
                const signers = (envelope?.recipients || [])
                    .filter(r => (r.role || '').toLowerCase() !== 'cc' && (r.role || '').toLowerCase() !== 'carbon_copy')
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                const totalSteps = signers.length + 2; // sender + recipients + completed
                const rowHeight = Math.max(80, 400 / totalSteps);

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                            onClick={() => setShowSigningOrder(false)}
                        />

                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setShowSigningOrder(false)}
                                className="absolute right-6 top-6 text-2xl text-[#3E2B66] hover:text-gray-800"
                            >
                                ✕
                            </button>

                            <h2 className="text-[20px] font-semibold text-[#3E2B66] mb-8">
                                Signing Order Diagram
                            </h2>

                            <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-4 flex flex-col text-sm text-gray-600">
                                    <div className="flex items-center font-semibold mb-4" style={{ minHeight: `${rowHeight}px` }}>
                                        SENDER
                                    </div>
                                    {signers.map((recipient, idx) => (
                                        <div key={recipient.id} className="flex items-center mb-4" style={{ minHeight: `${rowHeight}px` }}>
                                            {recipient.order ?? idx + 1}. {recipient.name || recipient.email || 'Unnamed'}
                                        </div>
                                    ))}
                                    <div className="flex items-center font-semibold mt-4" style={{ minHeight: `${rowHeight}px` }}>COMPLETED</div>
                                </div>
                                <div className="col-span-8 relative flex flex-col">
                                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gray-300 z-0" />

                                    {/* Sender */}
                                    <div className="relative flex justify-center items-center z-10 mb-4" style={{ minHeight: `${rowHeight}px` }}>
                                        <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-gray-300 z-0" />
                                        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                            {((envelope.sender?.name || envelope.sender?.email || "?")
                                                .match(/\b\w/g) || [])
                                                .slice(0, 2)
                                                .join("")
                                                .toUpperCase()}
                                        </div>
                                    </div>

                                    {/* Recipients */}
                                    {signers.map((recipient, idx) => (
                                        <div key={recipient.id} className="relative flex justify-center items-center z-10 mb-4" style={{ minHeight: `${rowHeight}px` }}>
                                            {idx < signers.length - 1 && (
                                                <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-gray-300 z-0" />
                                            )}
                                            <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                                {((recipient.name || recipient.email || "?")
                                                    .match(/\b\w/g) || [])
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Completed */}
                                    <div className="relative flex justify-center items-center z-10 mt-4" style={{ minHeight: `${rowHeight}px` }}>
                                        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                            ✓
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 text-right">
                                <button
                                    onClick={() => setShowSigningOrder(false)}
                                    className="border border-[#3E2B66] text-[#3E2B66] px-5 py-2 rounded-md"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Move to Folder Modal */}
            {showMoveDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowMoveDialog(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                        <button onClick={() => setShowMoveDialog(false)} className="absolute right-6 top-6 text-2xl text-[#3E2B66]">✕</button>
                        <h3 className="text-[22px] font-semibold text-[#3E2B66] mb-6">Move to Folder</h3>
                        <div className="space-y-2 mb-6">
                            {['Inbox', 'Sent', 'test'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setSelectedFolder(f)}
                                    className={`w-full text-left px-4 py-3 rounded-md border ${selectedFolder === f ? 'bg-gray-100 border-gray-300' : 'border-transparent hover:bg-gray-50'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-between">
                            <button className="px-4 py-2 bg-gray-100 rounded-md">New Folder</button>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowMoveDialog(false)} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
                                <button onClick={() => setShowMoveDialog(false)} className="px-5 py-2 bg-[#3E2B66] text-white rounded-md">Move</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnvelopeDetailPage;


