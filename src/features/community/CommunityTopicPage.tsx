'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/i18n/LanguageProvider';
import { getCommunityCopy, interpolateCommunityCopy } from './copy';
import CommunityFrame from './CommunityFrame';
import CommunityState from './CommunityState';
import CommunityStatusBadge from './CommunityStatusBadge';
import {
  COMMUNITY_LIMITS,
  CommunityModerationAction,
  CommunityReply,
  CommunityReplyModerationAction,
  CommunityReportTarget,
  CommunityTopic,
  CommunityTopicSnapshot,
  communityTopicHref,
  isTopicClosed,
} from './model';
import {
  communityAuthorLabel,
  communityCategoryName,
  formatCommunityDate,
} from './presentation';
import {
  createCommunityReply,
  getCommunityTopic,
  markCommunitySolution,
  moderateCommunityReply,
  moderateCommunityTopic,
  reportCommunityContent,
  setCommunitySubscription,
} from './repository';

const EMPTY_SNAPSHOT: CommunityTopicSnapshot = {
  topic: null,
  replies: [],
  available: true,
};

interface ReplyCardProps {
  reply: CommunityReply;
  topic: CommunityTopic;
  accepted: boolean;
  busyAction: string;
  onMarkSolution: (replyId: number) => void;
  onReport: (targetType: CommunityReportTarget, targetId: number) => void;
  onModerateReply: (replyId: number, action: CommunityReplyModerationAction) => void;
}

function ReplyCard({
  reply,
  topic,
  accepted,
  busyAction,
  onMarkSolution,
  onReport,
  onModerateReply,
}: ReplyCardProps) {
  const { lang } = useI18n();
  const copy = getCommunityCopy(lang);
  const reportKey = `reply-${reply.id}`;
  const solutionKey = `solution-${reply.id}`;

  return (
    <article className={`rounded-xl border ${accepted ? 'border-emerald-500/35 bg-emerald-500/[0.04]' : 'border-rule bg-panel'}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-faint">
          <span className="font-semibold text-muted">
            {communityAuthorLabel(reply.authorLabel, lang, reply.isMine)}
          </span>
          {reply.isTopicAuthor && (
            <span className="rounded-full border border-violet/25 bg-violet/10 px-2 py-0.5 text-[9px] font-semibold text-violet-300">
              {copy.topic.author}
            </span>
          )}
          <span>{formatCommunityDate(reply.createdAt, lang)}</span>
          {reply.updatedAt !== reply.createdAt && <span>{copy.topic.edited}</span>}
        </div>
        {accepted && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-400">
            {copy.topic.acceptedAnswer}
          </span>
        )}
        {reply.status === 'hidden' && (
          <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-red-300">
            {copy.topic.replyHidden}
          </span>
        )}
      </header>
      <p className={`whitespace-pre-wrap break-words px-4 py-5 text-sm leading-7 sm:px-5 ${reply.status === 'deleted' ? 'italic text-faint' : 'text-muted'}`}>
        {reply.status === 'deleted' ? copy.topic.deletedReply : reply.body}
      </p>
      <footer className="flex flex-wrap items-center justify-end gap-4 border-t border-rule px-4 py-3 sm:px-5">
        {reply.status === 'published' && topic.canAcceptSolution && !accepted && (
          <button
            type="button"
            onClick={() => onMarkSolution(reply.id)}
            disabled={busyAction.length > 0}
            className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
          >
            {busyAction === solutionKey ? copy.actions.markingSolution : copy.actions.markSolution}
          </button>
        )}
        {reply.status === 'published' && !reply.isMine && (
          <button
            type="button"
            onClick={() => onReport('reply', reply.id)}
            disabled={busyAction.length > 0}
            className="text-[10px] text-faint hover:text-red-400 disabled:opacity-50"
          >
            {busyAction === reportKey ? copy.actions.reporting : copy.actions.report}
          </button>
        )}
        {reply.canModerate && reply.status !== 'deleted' && (
          <button
            type="button"
            onClick={() => onModerateReply(reply.id, reply.status === 'hidden' ? 'restore' : 'hide')}
            disabled={busyAction.length > 0}
            className="text-[10px] font-semibold text-amber-300 hover:text-amber-200 disabled:opacity-50"
          >
            {reply.status === 'hidden' ? copy.topic.restoreReply : copy.topic.hideReply}
          </button>
        )}
      </footer>
    </article>
  );
}

export default function CommunityTopicPage() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const copy = getCommunityCopy(lang);
  const [topicId, setTopicId] = useState<number | null | undefined>(undefined);
  const [snapshot, setSnapshot] = useState<CommunityTopicSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [notice, setNotice] = useState('');
  const [duplicateTarget, setDuplicateTarget] = useState('');

  useEffect(() => {
    const rawId = new URLSearchParams(window.location.search).get('id');
    const parsedId = Number(rawId);
    const timeout = window.setTimeout(() => {
      setTopicId(Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (topicId === undefined || topicId === null || authLoading) return;

    let active = true;
    getCommunityTopic(topicId)
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, reloadKey, topicId]);

  const acceptedReply = useMemo(() => {
    if (!snapshot.topic) return null;
    return snapshot.replies.find((reply) =>
      reply.id === snapshot.topic?.acceptedReplyId || reply.isAccepted) ?? null;
  }, [snapshot.replies, snapshot.topic]);

  const remainingReplies = useMemo(
    () => snapshot.replies.filter((reply) => reply.id !== acceptedReply?.id),
    [acceptedReply?.id, snapshot.replies],
  );

  const currentHref = topicId && topicId > 0 ? communityTopicHref(topicId) : '/community/';
  const loginHref = `/login/?next=${encodeURIComponent(currentHref)}`;

  const refreshTopic = () => setReloadKey((value) => value + 1);

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReplyError('');
    const body = replyBody.trim();
    if (body.length < 1 || body.length > COMMUNITY_LIMITS.reply) {
      setReplyError(copy.topic.replyValidation);
      return;
    }
    if (!topicId || !user) {
      window.location.assign(loginHref);
      return;
    }

    setReplying(true);
    try {
      await createCommunityReply(topicId, body);
      setReplyBody('');
      refreshTopic();
    } catch {
      setReplyError(copy.topic.replyFailed);
    } finally {
      setReplying(false);
    }
  };

  const handleReport = async (targetType: CommunityReportTarget, targetId: number) => {
    if (!user) {
      window.location.assign(loginHref);
      return;
    }
    if (!window.confirm(copy.topic.reportConfirm)) return;

    const actionKey = `${targetType}-${targetId}`;
    setBusyAction(actionKey);
    setNotice('');
    try {
      await reportCommunityContent(targetType, targetId);
      setNotice(copy.topic.reportSuccess);
    } catch {
      setNotice(copy.topic.reportFailed);
    } finally {
      setBusyAction('');
    }
  };

  const handleMarkSolution = async (replyId: number) => {
    if (!topicId) return;
    const actionKey = `solution-${replyId}`;
    setBusyAction(actionKey);
    setNotice('');
    try {
      await markCommunitySolution(topicId, replyId);
      setNotice(copy.topic.solutionSuccess);
      refreshTopic();
    } catch {
      setNotice(copy.topic.solutionFailed);
    } finally {
      setBusyAction('');
    }
  };

  const handleSubscription = async () => {
    if (!topicId || !snapshot.topic || !user) return;
    const subscribed = !snapshot.topic.isSubscribed;
    setBusyAction('subscription');
    setNotice('');
    try {
      const nextValue = await setCommunitySubscription(topicId, subscribed);
      setSnapshot((current) => ({
        ...current,
        topic: current.topic ? { ...current.topic, isSubscribed: nextValue } : null,
      }));
      setNotice(nextValue ? copy.topic.followSuccess : copy.topic.unfollowSuccess);
    } catch {
      setNotice(copy.topic.followFailed);
    } finally {
      setBusyAction('');
    }
  };

  const handleModeration = async (action: CommunityModerationAction) => {
    if (!topicId || !snapshot.topic?.canModerate) return;
    const duplicateOfTopicId = action === 'duplicate' ? Number(duplicateTarget) : null;
    if (
      action === 'duplicate' &&
      (
        duplicateOfTopicId === null ||
        !Number.isInteger(duplicateOfTopicId) ||
        duplicateOfTopicId <= 0 ||
        duplicateOfTopicId === topicId
      )
    ) {
      setNotice(copy.topic.moderationInvalidDuplicate);
      return;
    }
    if (!window.confirm(copy.topic.moderationConfirm)) return;

    setBusyAction(`moderate-${action}`);
    setNotice('');
    try {
      await moderateCommunityTopic(topicId, action, duplicateOfTopicId);
      setNotice(copy.topic.moderationSuccess);
      if (action === 'duplicate') setDuplicateTarget('');
      refreshTopic();
    } catch {
      setNotice(copy.topic.moderationFailed);
    } finally {
      setBusyAction('');
    }
  };

  const handleReplyModeration = async (
    replyId: number,
    action: CommunityReplyModerationAction,
  ) => {
    if (!window.confirm(copy.topic.replyModerationConfirm)) return;
    setBusyAction(`moderate-reply-${replyId}`);
    setNotice('');
    try {
      await moderateCommunityReply(replyId, action);
      setNotice(copy.topic.replyModerationSuccess);
      refreshTopic();
    } catch {
      setNotice(copy.topic.replyModerationFailed);
    } finally {
      setBusyAction('');
    }
  };

  const topic = snapshot.topic;

  return (
    <CommunityFrame active="browse" compactHeader>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/community/" className="text-xs font-semibold text-faint hover:text-foreground">
          {copy.actions.back}
        </Link>

        <div className="mt-5">
          {topicId === undefined || authLoading ? (
            <CommunityState kind="loading" />
          ) : topicId === null ? (
            <CommunityState
              kind="empty"
              title={copy.topic.invalidTitle}
              description={copy.topic.invalidDescription}
            />
          ) : loading ? (
            <CommunityState kind="loading" />
          ) : error ? (
            <CommunityState
              kind="error"
              action={(
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError(false);
                    refreshTopic();
                  }}
                  className="rounded-lg border border-rule px-4 py-2 text-sm font-semibold text-muted hover:bg-rule hover:text-foreground"
                >
                  {copy.actions.retry}
                </button>
              )}
            />
          ) : !snapshot.available ? (
            <CommunityState kind="unavailable" />
          ) : !topic ? (
            <CommunityState
              kind="empty"
              title={copy.topic.notFoundTitle}
              description={copy.topic.notFoundDescription}
            />
          ) : (
            <>
              {notice && (
                <div className="mb-5 rounded-lg border border-violet/30 bg-violet/10 px-4 py-3 text-sm text-violet-200" role="status">
                  {notice}
                </div>
              )}

              <article className="overflow-hidden rounded-xl border border-rule bg-panel">
                <header className="px-5 py-6 sm:px-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <CommunityStatusBadge status={topic.status} />
                    <span className="text-[10px] text-faint">{communityCategoryName(topic, lang)}</span>
                  </div>
                  <h1 className="mt-4 break-words text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
                    {topic.title}
                  </h1>
                  <p className="mt-3 text-[10px] text-faint">
                    {interpolateCommunityCopy(copy.topic.byline, {
                      author: communityAuthorLabel(topic.authorLabel, lang, topic.isMine),
                      date: formatCommunityDate(topic.createdAt, lang),
                    })}
                    {topic.updatedAt !== topic.createdAt ? ` · ${copy.topic.edited}` : ''}
                  </p>
                </header>

                {topic.duplicateOfTopicId && (
                  <div className="border-y border-amber-500/25 bg-amber-500/10 px-5 py-3 text-xs leading-6 text-amber-200 sm:px-7">
                    {copy.topic.duplicatePrefix}{' '}
                    <a
                      href={communityTopicHref(topic.duplicateOfTopicId)}
                      className="font-semibold underline underline-offset-2 hover:text-white"
                    >
                      {topic.duplicateOfTitle || copy.topic.canonicalTopic}
                    </a>
                    .
                  </div>
                )}

                <p className={`whitespace-pre-wrap break-words px-5 py-7 text-sm leading-8 sm:px-7 ${topic.body ? 'text-muted' : 'italic text-faint'}`}>
                  {topic.body || copy.topic.noDetails}
                </p>

                {topic.status !== 'deleted' && topic.status !== 'hidden' && (user || !topic.isMine) && (
                  <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-rule px-5 py-3 sm:px-7">
                    {user ? (
                      <button
                        type="button"
                        onClick={handleSubscription}
                        disabled={busyAction.length > 0}
                        aria-pressed={topic.isSubscribed === true}
                        className={`rounded-md border px-3 py-1.5 text-[10px] font-semibold disabled:opacity-50 ${
                          topic.isSubscribed
                            ? 'border-violet/40 bg-violet/10 text-violet-300'
                            : 'border-rule text-muted hover:bg-rule hover:text-foreground'
                        }`}
                      >
                        {busyAction === 'subscription'
                          ? copy.actions.updatingFollow
                          : topic.isSubscribed
                            ? copy.actions.following
                            : copy.actions.follow}
                      </button>
                    ) : <span />}
                    {!topic.isMine && (
                      <button
                        type="button"
                        onClick={() => handleReport('topic', topic.id)}
                        disabled={busyAction.length > 0}
                        className="text-[10px] text-faint hover:text-red-400 disabled:opacity-50"
                      >
                        {busyAction === `topic-${topic.id}` ? copy.actions.reporting : copy.actions.report}
                      </button>
                    )}
                  </footer>
                )}
              </article>

              {topic.canModerate && topic.status !== 'deleted' && (
                <section className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-4 sm:p-5" aria-labelledby="community-moderation-heading">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id="community-moderation-heading" className="text-xs font-bold uppercase tracking-wide text-amber-300">
                      {copy.topic.moderationTitle}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {topic.status === 'open' || topic.status === 'resolved' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleModeration('lock')}
                            disabled={busyAction.length > 0}
                            className="rounded-md border border-rule px-3 py-1.5 text-[10px] font-semibold text-muted hover:bg-rule hover:text-foreground disabled:opacity-50"
                          >
                            {copy.topic.moderationLock}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModeration('close')}
                            disabled={busyAction.length > 0}
                            className="rounded-md border border-rule px-3 py-1.5 text-[10px] font-semibold text-muted hover:bg-rule hover:text-foreground disabled:opacity-50"
                          >
                            {copy.topic.moderationClose}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleModeration('reopen')}
                          disabled={busyAction.length > 0}
                          className="rounded-md border border-rule px-3 py-1.5 text-[10px] font-semibold text-muted hover:bg-rule hover:text-foreground disabled:opacity-50"
                        >
                          {copy.topic.moderationReopen}
                        </button>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/community/moderation/"
                    className="mt-4 inline-flex text-[10px] font-semibold text-violet-300 hover:text-violet-200"
                  >
                    {copy.topic.moderationQueue}
                  </Link>

                  <form
                    className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleModeration('duplicate');
                    }}
                  >
                    <label className="flex-1 text-[10px] font-semibold text-muted">
                      {copy.topic.moderationDuplicateLabel}
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        value={duplicateTarget}
                        onChange={(event) => setDuplicateTarget(event.target.value)}
                        placeholder={copy.topic.moderationDuplicatePlaceholder}
                        className="mt-2 w-full rounded-lg border border-rule bg-background px-3 py-2 text-xs font-normal text-foreground outline-none placeholder:text-faint focus:border-violet focus:ring-1 focus:ring-violet"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={busyAction.length > 0}
                      className="rounded-lg border border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                    >
                      {copy.topic.moderationDuplicate}
                    </button>
                  </form>
                </section>
              )}

              {acceptedReply && (
                <section className="mt-6" aria-labelledby="accepted-answer-heading">
                  <h2 id="accepted-answer-heading" className="mb-3 text-xs font-bold uppercase tracking-wide text-emerald-400">
                    {copy.topic.acceptedAnswer}
                  </h2>
                  <ReplyCard
                    reply={acceptedReply}
                    topic={topic}
                    accepted
                    busyAction={busyAction}
                    onMarkSolution={handleMarkSolution}
                    onReport={handleReport}
                    onModerateReply={handleReplyModeration}
                  />
                </section>
              )}

              <section className="mt-8" aria-labelledby="community-replies-heading">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id="community-replies-heading" className="text-xl font-bold text-foreground">
                    {copy.topic.repliesTitle}
                  </h2>
                  <span className="text-xs tabular-nums text-faint">{snapshot.replies.length}</span>
                </div>

                {remainingReplies.length === 0 && !acceptedReply ? (
                  <div className="mt-4 rounded-xl border border-dashed border-rule bg-panel px-6 py-10 text-center">
                    <h3 className="text-sm font-semibold text-foreground">{copy.topic.noRepliesTitle}</h3>
                    <p className="mt-2 text-xs leading-6 text-faint">{copy.topic.noRepliesDescription}</p>
                  </div>
                ) : remainingReplies.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {remainingReplies.map((reply) => (
                      <ReplyCard
                        key={reply.id}
                        reply={reply}
                        topic={topic}
                        accepted={false}
                        busyAction={busyAction}
                        onMarkSolution={handleMarkSolution}
                        onReport={handleReport}
                        onModerateReply={handleReplyModeration}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-lg border border-rule bg-panel px-4 py-3 text-xs text-faint">
                    {copy.topic.acceptedOnly}
                  </p>
                )}
              </section>

              <section className="mt-8 rounded-xl border border-rule bg-panel p-5 sm:p-6" aria-labelledby="community-reply-form-heading">
                <h2 id="community-reply-form-heading" className="text-lg font-bold text-foreground">
                  {copy.topic.replyTitle}
                </h2>
                {isTopicClosed(topic.status) ? (
                  <p className="mt-3 text-sm text-faint">{copy.topic.replyClosed}</p>
                ) : !user ? (
                  <div className="mt-4">
                    <Link
                      href={loginHref}
                      className="gradient-button inline-flex rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                    >
                      {copy.topic.signInToReply}
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleReply} className="mt-4">
                    <label className="sr-only" htmlFor="community-reply-body">{copy.topic.replyTitle}</label>
                    <textarea
                      id="community-reply-body"
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      maxLength={COMMUNITY_LIMITS.reply}
                      rows={7}
                      required
                      placeholder={copy.topic.replyPlaceholder}
                      className="w-full resize-y rounded-lg border border-rule bg-background px-4 py-3 text-sm leading-7 text-foreground outline-none placeholder:text-faint focus:border-violet focus:ring-1 focus:ring-violet"
                    />
                    <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                      <p className="max-w-xl text-[10px] leading-5 text-faint">{copy.topic.replyHint}</p>
                      <span className="text-[10px] tabular-nums text-faint">
                        {replyBody.length}/{COMMUNITY_LIMITS.reply}
                      </span>
                    </div>
                    {replyError && <p className="mt-4 text-sm font-medium text-red-400" role="alert">{replyError}</p>}
                    <button
                      type="submit"
                      disabled={replying}
                      className="gradient-button mt-5 rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {replying ? copy.topic.replying : copy.topic.replySubmit}
                    </button>
                  </form>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </CommunityFrame>
  );
}
