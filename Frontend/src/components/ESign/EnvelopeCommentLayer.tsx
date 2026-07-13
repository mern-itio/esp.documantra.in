import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import {
  createEnvelopeComment,
  fetchEnvelopeComments,
  fetchSenderEnvelopeComments,
  resolveEnvelopeComment,
  resolveSenderEnvelopeComment,
  replyToSenderEnvelopeComment,
  replyToRecipientEnvelopeComment,
  type EnvelopeComment,
  type EnvelopeCommentAnchor,
} from '../../services/envelopeCommentService';

export type PendingCommentSelection = {
  documentId: string;
  docIndex: number;
  page: number;
  anchor: EnvelopeCommentAnchor;
  selectedText: string;
  composerTop: number;
  composerLeft: number;
};

type EnvelopeCommentComposerProps = {
  open: boolean;
  authorName: string;
  selectedText: string;
  top: number;
  left: number;
  submitting: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (message: string) => void;
};

export const EnvelopeCommentComposer: React.FC<EnvelopeCommentComposerProps> = ({
  open,
  authorName,
  selectedText,
  top,
  left,
  submitting,
  error,
  onCancel,
  onSubmit,
}) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) setMessage('');
  }, [open, selectedText]);

  if (!open) return null;

  const initials = authorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

  return (
    <div
      className="fixed z-[75] w-[min(320px,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white p-4 shadow-2xl"
      style={{ top: Math.max(16, top), left: Math.max(16, Math.min(left, window.innerWidth - 336)) }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-start gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{authorName || 'Signer'}</p>
          {selectedText ? (
            <p className="mt-1 line-clamp-3 rounded bg-amber-50 px-2 py-1 text-xs text-gray-700">
              &ldquo;{selectedText}&rdquo;
            </p>
          ) : null}
        </div>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={2000}
        autoFocus
        placeholder="Add a comment..."
        className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#248567] focus:outline-none focus:ring-1 focus:ring-[#248567]"
      />

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!message.trim() || submitting}
          onClick={() => onSubmit(message.trim())}
          className="rounded bg-[#248567] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f7158] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Comment'}
        </button>
      </div>
    </div>
  );
};

export function CommentHighlight({
  comment,
  active = false,
  onClick,
}: {
  comment: EnvelopeComment;
  active?: boolean;
  onClick?: () => void;
}) {
  const isResolved = comment.status === 'resolved';
  const hasSenderReply = (comment.replies || []).some((r) => r.authorType === 'sender');
  return (
    <button
      type="button"
      onClick={onClick}
      title={comment.message}
      className={`absolute z-20 rounded border text-left ${
        isResolved
          ? 'border-gray-300 bg-gray-100/70'
          : active
            ? 'border-[#248567] bg-[#248567]/20 ring-2 ring-[#248567]/40'
            : hasSenderReply
              ? 'border-sky-400 bg-sky-200/35 hover:bg-sky-200/50'
              : 'border-amber-400 bg-amber-200/35 hover:bg-amber-200/50'
      }`}
      style={{
        left: `${comment.anchor.xPercent}%`,
        top: `${comment.anchor.yPercent}%`,
        width: `${Math.max(comment.anchor.widthPercent, 1)}%`,
        height: `${Math.max(comment.anchor.heightPercent, 0.8)}%`,
      }}
    />
  );
}

type UseEnvelopeCommentsOptions = {
  envelopeId?: string;
  recipientId: string;
  enabled?: boolean;
  writeEnabled?: boolean;
  getAuthHeaders?: () => Record<string, string> | undefined;
  authorName?: string;
};

export function useEnvelopeComments({
  envelopeId,
  recipientId,
  enabled = true,
  writeEnabled = true,
  getAuthHeaders,
  authorName = 'Signer',
}: UseEnvelopeCommentsOptions) {
  const [comments, setComments] = useState<EnvelopeComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingSelection, setPendingSelection] = useState<PendingCommentSelection | null>(null);
  const getAuthHeadersRef = useRef(getAuthHeaders);
  getAuthHeadersRef.current = getAuthHeaders;

  const openComments = useMemo(
    () => comments.filter((comment) => comment.status === 'open'),
    [comments],
  );

  const loadComments = useCallback(async (silent = false) => {
    if (!enabled || !envelopeId || !recipientId) return;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await fetchEnvelopeComments(
        envelopeId,
        recipientId,
        getAuthHeadersRef.current?.(),
      );
      setComments(data);
    } catch (err: any) {
      if (!silent) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load comments');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [enabled, envelopeId, recipientId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (!enabled || !envelopeId || !recipientId) return undefined;
    const interval = window.setInterval(() => {
      loadComments(true);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [enabled, envelopeId, recipientId, loadComments]);

  const beginSelectionFromMouseUp = useCallback((container: HTMLElement | null) => {
    if (!enabled || !writeEnabled || !container) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) return;

    const anchorNode = range.commonAncestorContainer;
    const element =
      anchorNode.nodeType === Node.ELEMENT_NODE
        ? (anchorNode as Element)
        : anchorNode.parentElement;
    const pageEl = element?.closest('[data-comment-page]') as HTMLElement | null;
    if (!pageEl || !container.contains(pageEl)) return;

    const page = Number(pageEl.dataset.commentPage);
    const docIndex = Number(pageEl.dataset.commentDocIndex);
    const documentId = pageEl.dataset.commentDocumentId || '';
    if (!page || !documentId) return;

    const pageRect = pageEl.getBoundingClientRect();
    const selRect = range.getBoundingClientRect();
    if (!pageRect.width || !pageRect.height) return;

    const anchor: EnvelopeCommentAnchor = {
      xPercent: ((selRect.left - pageRect.left) / pageRect.width) * 100,
      yPercent: ((selRect.top - pageRect.top) / pageRect.height) * 100,
      widthPercent: (selRect.width / pageRect.width) * 100,
      heightPercent: (selRect.height / pageRect.height) * 100,
    };

    setPendingSelection({
      documentId,
      docIndex,
      page,
      anchor,
      selectedText: text.slice(0, 5000),
      composerTop: selRect.bottom + 8,
      composerLeft: selRect.left,
    });
    selection.removeAllRanges();
  }, [enabled, writeEnabled]);

  const cancelPendingComment = useCallback(() => {
    setPendingSelection(null);
    setError('');
  }, []);

  const submitPendingComment = useCallback(
    async (message: string) => {
      if (!pendingSelection || !envelopeId || !recipientId) return;
      setSubmitting(true);
      setError('');
      try {
        const created = await createEnvelopeComment(
          envelopeId,
          recipientId,
          {
            documentId: pendingSelection.documentId,
            page: pendingSelection.page,
            anchor: pendingSelection.anchor,
            selectedText: pendingSelection.selectedText,
            message,
          },
          getAuthHeadersRef.current?.(),
        );
        setComments((prev) => [...prev, created]);
        setPendingSelection(null);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to save comment');
      } finally {
        setSubmitting(false);
      }
    },
    [pendingSelection, envelopeId, recipientId],
  );

  const resolveComment = useCallback(
    async (commentId: string) => {
      if (!envelopeId || !recipientId) return;
      try {
        const updated = await resolveEnvelopeComment(
          envelopeId,
          recipientId,
          commentId,
          getAuthHeadersRef.current?.(),
        );
        setComments((prev) =>
          prev.map((comment) => (comment._id === commentId ? updated : comment)),
        );
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to resolve comment');
      }
    },
    [envelopeId, recipientId],
  );

  const replyToComment = useCallback(
    async (commentId: string, message: string) => {
      if (!envelopeId || !recipientId) return;
      setSubmitting(true);
      setError('');
      try {
        const updated = await replyToRecipientEnvelopeComment(
          envelopeId,
          recipientId,
          commentId,
          message,
          getAuthHeadersRef.current?.(),
        );
        setComments((prev) =>
          prev.map((comment) => (comment._id === commentId ? updated : comment)),
        );
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to send reply');
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [envelopeId, recipientId],
  );

  return {
    comments,
    openComments,
    loading,
    submitting,
    error,
    pendingSelection,
    authorName,
    loadComments,
    beginSelectionFromMouseUp,
    cancelPendingComment,
    submitPendingComment,
    resolveComment,
    replyToComment,
  };
}

export function EnvelopeCommentsPanel({
  comments,
  writeEnabled = true,
  activeCommentId,
  onResolve,
  onJumpToComment,
  onReply,
}: {
  comments: EnvelopeComment[];
  writeEnabled?: boolean;
  activeCommentId?: string | null;
  onResolve: (commentId: string) => void;
  onJumpToComment?: (comment: EnvelopeComment) => void;
  onReply?: (commentId: string, message: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = comments.filter((comment) => {
    if (filter === 'open') return comment.status === 'open';
    if (filter === 'resolved') return comment.status === 'resolved';
    return true;
  });

  const handleReply = async (commentId: string) => {
    const message = (replyDrafts[commentId] || '').trim();
    if (!message || !onReply) return;
    setBusyId(commentId);
    try {
      await onReply(commentId, message);
      setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
    } finally {
      setBusyId(null);
    }
  };

  if (!filtered.length) {
    return (
      <div className="space-y-4">
        <CommentFilterTabs filter={filter} onChange={setFilter} counts={comments} />
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          <MessageSquare className="mx-auto mb-2 h-5 w-5 text-gray-400" />
          {filter === 'open'
            ? 'No open suggestions yet. Select text on the document to add a comment.'
            : 'No suggestions in this view.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CommentFilterTabs filter={filter} onChange={setFilter} counts={comments} />
      <div className="max-h-[min(70vh,32rem)] space-y-3 overflow-y-auto">
        {filtered.map((comment) => {
          const hasSenderReply = (comment.replies || []).some((r) => r.authorType === 'sender');
          return (
            <div
              key={comment._id}
              className={`rounded-lg border bg-white p-3 shadow-sm ${
                activeCommentId === comment._id
                  ? 'border-[#248567] ring-1 ring-[#248567]/30'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {comment.authorName || 'Signer'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onJumpToComment?.(comment)}
                    className="text-xs text-[#248567] hover:underline"
                  >
                    Page {comment.page}
                    {hasSenderReply ? ' · New reply' : ''}
                  </button>
                </div>
                {comment.status === 'open' && writeEnabled ? (
                  <button
                    type="button"
                    onClick={() => onResolve(comment._id)}
                    className="text-xs font-medium text-[#248567] hover:underline"
                  >
                    Resolve
                  </button>
                ) : comment.status === 'resolved' ? (
                  <span className="text-xs font-medium text-gray-400">Resolved</span>
                ) : null}
              </div>
              {comment.selectedText ? (
                <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-gray-700">
                  &ldquo;{comment.selectedText}&rdquo;
                </p>
              ) : null}
              <p className="mt-2 text-sm text-gray-700">{comment.message}</p>

              {(comment.replies || []).map((reply) => (
                <div
                  key={reply._id || `${comment._id}-${reply.createdAt}`}
                  className={`mt-3 rounded px-3 py-2 text-sm ${
                    reply.authorType === 'sender'
                      ? 'bg-sky-50 text-gray-800'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-500">
                    {reply.authorName || (reply.authorType === 'sender' ? 'Sender' : 'You')}
                  </p>
                  <p>{reply.message}</p>
                </div>
              ))}

              {writeEnabled && comment.status === 'open' && onReply ? (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={replyDrafts[comment._id] || ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [comment._id]: e.target.value }))
                    }
                    placeholder="Reply to sender..."
                    className="min-w-0 flex-1 rounded border border-gray-200 px-3 py-2 text-sm focus:border-[#248567] focus:outline-none focus:ring-1 focus:ring-[#248567]"
                  />
                  <button
                    type="button"
                    disabled={busyId === comment._id || !(replyDrafts[comment._id] || '').trim()}
                    onClick={() => handleReply(comment._id)}
                    className="rounded bg-[#248567] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1f7158] disabled:opacity-50"
                  >
                    Reply
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommentFilterTabs({
  filter,
  onChange,
  counts,
}: {
  filter: 'open' | 'resolved' | 'all';
  onChange: (value: 'open' | 'resolved' | 'all') => void;
  counts: EnvelopeComment[];
}) {
  const openCount = counts.filter((c) => c.status === 'open').length;
  const resolvedCount = counts.filter((c) => c.status === 'resolved').length;
  const tabs: Array<{ id: 'open' | 'resolved' | 'all'; label: string; count: number }> = [
    { id: 'open', label: 'Open', count: openCount },
    { id: 'resolved', label: 'Resolved', count: resolvedCount },
    { id: 'all', label: 'All', count: counts.length },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            filter === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}

export function EnvelopeCommentsSenderPanel({
  envelopeId,
}: {
  envelopeId: string;
}) {
  const [comments, setComments] = useState<EnvelopeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSenderEnvelopeComments(envelopeId);
      setComments(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [envelopeId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const data = await fetchSenderEnvelopeComments(envelopeId);
        setComments(data);
      } catch {
        // ignore background refresh errors
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [envelopeId]);

  const openComments = comments.filter((comment) => comment.status === 'open');

  const handleResolve = async (commentId: string) => {
    setBusyId(commentId);
    try {
      const updated = await resolveSenderEnvelopeComment(envelopeId, commentId);
      setComments((prev) => prev.map((c) => (c._id === commentId ? updated : c)));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to resolve suggestion');
    } finally {
      setBusyId(null);
    }
  };

  const handleReply = async (commentId: string) => {
    const message = (replyDrafts[commentId] || '').trim();
    if (!message) return;
    setBusyId(commentId);
    try {
      const updated = await replyToSenderEnvelopeComment(envelopeId, commentId, message);
      setComments((prev) => prev.map((c) => (c._id === commentId ? updated : c)));
      setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to send reply');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading document suggestions...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-gray-900">Document suggestions</h3>
          <p className="text-xs text-gray-500">
            {openComments.length} open suggestion{openComments.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="text-xs font-medium text-[#248567] hover:underline"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {openComments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No open suggestions from signers yet.
        </div>
      ) : (
        <div className="space-y-4">
          {openComments.map((comment) => (
            <div key={comment._id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {comment.authorName || comment.authorEmail || 'Signer'}
                  </p>
                  <p className="text-xs text-gray-500">Page {comment.page}</p>
                </div>
                <button
                  type="button"
                  disabled={busyId === comment._id}
                  onClick={() => handleResolve(comment._id)}
                  className="text-xs font-semibold text-[#248567] hover:underline disabled:opacity-50"
                >
                  Resolve
                </button>
              </div>

              {comment.selectedText ? (
                <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-gray-700">
                  &ldquo;{comment.selectedText}&rdquo;
                </p>
              ) : null}

              <p className="mt-2 text-sm text-gray-700">{comment.message}</p>

              {(comment.replies || []).map((reply) => (
                <div
                  key={reply._id || `${comment._id}-${reply.createdAt}`}
                  className="mt-3 rounded bg-gray-50 px-3 py-2 text-sm text-gray-700"
                >
                  <p className="text-xs font-semibold text-gray-500">
                    {reply.authorName || reply.authorType}
                  </p>
                  <p>{reply.message}</p>
                </div>
              ))}

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyDrafts[comment._id] || ''}
                  onChange={(e) =>
                    setReplyDrafts((prev) => ({ ...prev, [comment._id]: e.target.value }))
                  }
                  placeholder="Reply to signer..."
                  className="min-w-0 flex-1 rounded border border-gray-200 px-3 py-2 text-sm focus:border-[#248567] focus:outline-none focus:ring-1 focus:ring-[#248567]"
                />
                <button
                  type="button"
                  disabled={busyId === comment._id || !(replyDrafts[comment._id] || '').trim()}
                  onClick={() => handleReply(comment._id)}
                  className="rounded bg-[#248567] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1f7158] disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
