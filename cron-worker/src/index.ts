// RunIPS 数据采集 Worker
// 每日 Cron 触发：距上次更新 ≥5 天才重新采集
// 数据源：OpenAlex（引用数）+ Google CSE（搜索热度）
// 写入：Supabase professors 表

import { PROFESSORS } from './professors';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CSE_API_KEY: string;
  CSE_ID: string;
}

const UPDATE_INTERVAL_MS = 5 * 24 * 60 * 60 * 1000;

const worker = {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runCollection(env));
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === '/__run' || url.searchParams.has('manual')) {
      ctx.waitUntil(runCollection(env));
      return new Response('triggered', { status: 202 });
    }
    return new Response('RunIPS data collector. Use /__run?manual=1 to trigger.', { status: 200 });
  },
};

export default worker;

async function runCollection(env: Env) {
  const log: string[] = [];
  const started = new Date().toISOString();
  log.push(`[${started}] 采集开始`);

  try {
    // 检查上次更新时间（任意一条教授的 citations_updated_at）
    const latest = await getLastUpdate(env);
    if (latest && Date.now() - new Date(latest).getTime() < UPDATE_INTERVAL_MS) {
      log.push(`距上次更新不足 5 天（${latest}），跳过本次采集`);
      return;
    }

    const results = [];
    for (const p of PROFESSORS) {
      try {
        const citations = p.openalexId ? await fetchCitations(env, p) : null;
        const searchCount = await fetchSearchCount(env, p);
        results.push({ id: p.id, citations, searchCount });
        log.push(`${p.id} ${p.jaName}: 引用=${citations ?? '未定'} 搜索=${searchCount}`);
        await sleep(200);
      } catch (e) {
        log.push(`${p.id} ${p.jaName}: 失败 (${e})`);
      }
    }

    // 写回 Supabase
    for (const r of results) {
      try {
        await updateProfessor(env, r.id, r.citations, r.searchCount);
      } catch (e) {
        log.push(`写库失败 id=${r.id}: ${e}`);
      }
    }
    log.push('采集完成');
  } catch (e) {
    log.push(`整体失败: ${e}`);
  }

  console.log(log.join('\n'));
}

async function getLastUpdate(env: Env): Promise<string | null> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/professors?select=citations_updated_at&order=citations_updated_at.desc&limit=1`, {
    headers: authHeaders(env),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { citations_updated_at: string | null }[];
  return data[0]?.citations_updated_at ?? null;
}

async function fetchCitations(env: Env, p: (typeof PROFESSORS)[number]): Promise<number> {
  const res = await fetch(`https://api.openalex.org/authors/${p.openalexId}`, {
    headers: { 'User-Agent': 'runips-cron (student research project)' },
  });
  if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);
  const data = (await res.json()) as { cited_by_count?: number };
  return data.cited_by_count ?? 0;
}

async function fetchSearchCount(env: Env, p: (typeof PROFESSORS)[number]): Promise<number> {
  const keywords = [p.jaName, p.enName, p.jaLab].filter((k): k is string => !!k);
  let total = 0;
  for (const kw of keywords) {
    const url = `https://www.googleapis.com/customsearch/v1?key=${env.CSE_API_KEY}&cx=${env.CSE_ID}&q=${encodeURIComponent(kw)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`CSE HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { searchInformation?: { totalResults?: string } };
    total += parseInt(data.searchInformation?.totalResults ?? '0', 10) || 0;
    await sleep(150);
  }
  return total;
}

async function updateProfessor(env: Env, id: number, citations: number | null, searchCount: number) {
  const body: Record<string, unknown> = {
    scholar_citations: citations,
    search_count: searchCount,
    citations_updated_at: new Date().toISOString(),
  };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/professors?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(env), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}: ${await res.text()}`);
}

function authHeaders(env: Env): Record<string, string> {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
