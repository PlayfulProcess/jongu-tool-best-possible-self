Best Possible Self – Security & AI Cost Control Plan
===================================================

Objectives
----------
1. Stop abuse that could leak or tamper with user data (Supabase RLS, auth, storage).
2. Cap OpenAI costs at <$0.50 per journaling session (≈10–12 chat turns) while keeping UX smooth.
3. Provide observability so we know who is using tokens, when limits hit, and how to unblock legit users.

Assumptions (revise if these change)
------------------------------------
- Model: `gpt-4o-mini` (input $0.00015/token, output $0.0006/token) or cheaper. Current prompts average 800 tokens (journal + tarot question + system).
- Target session: ≤12 exchanges, ≤6k total tokens ⇒ ≈$0.36 per session today. We keep a 25% buffer so runaway sessions stop at 7.5k tokens (~$0.45).
- Supabase Postgres + RLS already in place, but quotas/logging not wired up.
- Only authenticated users can hit `/api/ai/chat`; anon sessions only journal locally (no AI).

Stage 1 – Immediate Controls (ship within 1 day)
------------------------------------------------
### 1. Enforce per-session AI guardrails
- Add `session_ai_cost` tracker in memory (React state) + Supabase `user_documents` entry metadata (no new tables): mutate `document_data.session_cost_usd`, `session_tokens_used`.
- Each `/api/ai/chat` call returns `{prompt_tokens, completion_tokens}` (OpenAI response). Server computes incremental USD cost using current pricing table.
- Stop replying when either condition hit:
  * `messages_in_session >= 12`
  * `usd_cost_session >= 0.45`
- Surface friendly UI notice (“You’ve reached today’s tarot guidance limit. Save + start a new entry.”).

### 2. Server-side quota check before AI request
- Extend existing `public.profiles.profile_data` JSON (or add lightweight table `public.user_ai_quotas` if JSON becomes messy). If we avoid new tables:
  * Add keys `ai_limits` and `ai_usage` inside `profile_data`.
  * Example patch:
    ```sql
    update public.profiles
    set profile_data = jsonb_set(
      jsonb_set(
        profile_data,
        '{ai_limits}',
        '{"usd_daily":2,"tokens_daily":12000,"sessions_daily":4}'::jsonb,
        true
      ),
      '{ai_usage}',
      '{"day_start":"2024-01-01","usd_spent":0,"tokens":0,"sessions":0}'::jsonb,
      true
    )
    where id = <user>;
    ```
- If JSON-only becomes unwieldy, fall back to small `public.user_ai_quotas` table (still minimal schema change).
  ```sql
  create table if not exists public.user_ai_quotas (
    user_id uuid primary key references auth.users(id) on delete cascade,
    day_start date not null default current_date,
    usd_spent_today numeric(8,4) not null default 0,
    tokens_input_today int not null default 0,
    tokens_output_today int not null default 0,
    sessions_today int not null default 0,
    hard_stop boolean not null default false,
    updated_at timestamptz not null default now()
  );
  ```
- Daily caps (free tier):
  * `usd_spent_today <= 2.00`
  * `sessions_today <= 4`
  * `tokens_input_today <= 12_000`
  * `tokens_output_today <= 8_000`
- Stored procedure `enforce_ai_quota(p_user_id, p_prompt_tokens, p_completion_tokens)`:
  * Resets row when `day_start < current_date`.
  * Computes projected cost `cost = prompt_tokens*0.00015 + completion_tokens*0.0006`.
  * If any cap exceeded or `cost > 0.50`, raise exception with user-readable message.
  * Otherwise update counters.
- `/api/ai/chat` calls `rpc('enforce_ai_quota', …)` before hitting OpenAI. This prevents expensive work even if frontend hacked.

### 3. Basic abuse logging
- Reuse `public.user_documents` for logging: create `document_type='security_event'` rows to avoid new tables. Example payload:
  * Quota exceeded
  * More than 3 sessions started inside 10 minutes
  * Anonymous user tries to call AI endpoint
- Add `supabase.functions.invoke('log-security-event', …)` fallback if Postgres unavailable.

### 4. Tighten API surface
- Only allow POST to `/api/ai/chat`; reject GET.
- Validate payload with Zod on server:
  ```ts
  const schema = z.object({
    message: z.string().max(2000),
    content: z.string().max(6000),
    tarotQuestion: z.string().max(500).optional()
  });
  ```
- Reject if `content` empty → tells frontend to block AI until there’s at least ~50 chars of journaling (prevents “hello” spam).

### 5. Journal data caps (prevent infinite storage)
- Short term: enforce per-entry limit (e.g. 6,000 chars) in frontend textarea + `/api/entries` route using Zod (`z.string().max(6000)`).
- Add per-user guard using `profiles.profile_data` counters:
  * Track `entries_today`, `entries_total`, `storage_bytes`.
  * When saving, compute `length(content)`; block if `storage_bytes + length(content) > 500_000` (≈0.5 MB) for free tier. Paid tiers get higher ceiling.
- Optional: create SQL check via `user_documents` trigger:
  ```sql
  create or replace function enforce_entry_quota()
  returns trigger language plpgsql security definer as $$
  declare bytes int := length(new.document_data->>'content');
  begin
    if bytes > 6000 then
      raise exception 'Entry exceeds 6k characters.';
    end if;
    -- sum recent usage (cheap for <1k users)
    if (
      select coalesce(sum(length(d.document_data->>'content')),0)
      from public.user_documents d
      where d.user_id = new.user_id
        and d.document_type = 'tool_session'
    ) > 500000
    then
      raise exception 'Storage quota reached. Please delete old entries or upgrade.';
    end if;
    return new;
  end;
  $$;

  create trigger enforce_entry_quota_trg
  before insert or update on public.user_documents
  for each row
  when (new.document_type = 'tool_session')
  execute function enforce_entry_quota();
  ```
- Surface UI warning when user hits 80% of their storage allocation.

Stage 2 – Supabase-native Rate + Cost Enforcement (1–2 weeks)
-------------------------------------------------------------
1. **Quota tiers & migrations**
   - Table quota_limits (free/pro/unlimited). Store usd_daily, usd_monthly, 	okens_daily, sessions_daily.
   - Extend user_ai_quotas with 	ier FK.
2. **Trigger-based accounting**
   - Instead of RPC, add i_usage table capturing every chat turn (user_id, entry_id, prompt_tokens, completion_tokens, usd_cost, created_at).
   - Use fter insert trigger to roll up into user_ai_quotas.
3. **pg_cron resets**
   - Nightly job resets daily counters; first of month resets monthly.
4. **Edge function for burst rate limiting**
   - Deploy Supabase Edge Function i-rate-limit. It reads user_ai_quotas, ip, user_agent. Returns remaining quota + estimated USD left.
   - Frontend polls this before showing AI UI; if <.10 remaining, show warning banner.
5. **Response caching to avoid duplicate spend**
   - Create cached_ai_responses (or reuse user_documents with document_type='ai_cache') storing hash_key, 	emplate_id, 	arot_question, content_excerpt, 
esponse, usd_cost, created_at.
   - Hash key = sha256(lower(trim(coalesce(tarot_question,''))) || '::' || sha256(content)).
   - Before calling OpenAI, check cache for same hash in last 30 minutes; if hit, reuse response and log zero-cost usage.
   - Purge cache entries older than 14 days via cron to keep storage tight.

Stage 3 – Security Hardening & Monitoring (after quotas stable)
--------------------------------------------------------------
1. **Middleware protections**
   - Next.js middleware verifies Supabase session on every `/api` request.
   - Add lightweight IP bucket (Redis or Upstash) to limit 60 AI calls/hour/IP.
2. **Storage & RLS audit**
   - Review `user_documents` RLS policies to ensure only owner can `insert/update`.
   - Enable `supabase_walrus` to watch for policy regressions.
3. **Observability**
   - Ship `security_events` to Logflare/Sentry for alerting.
   - Dashboard: cost per user, top tarot sessions, automatic emails when `usd_spent_today > $1.50`.
4. **Incident response**
   - Playbook for “quota hit” vs “suspicious burst” (manual override table `user_overrides` that lifts limits temporarily).

Per-Session Cost Math (<$0.50 rule)
-----------------------------------
| Component                         | Tokens | Cost (USD) |
|----------------------------------|--------|------------|
| System prompt + tarot context    | 1,500  | $0.225     |
| User message (avg)               | 500    | $0.075     |
| Assistant reply (avg 400 tokens) | 400    | $0.240     |
| **Per exchange total**           | 2,400  | **$0.54**  |

To stay below $0.50 we:
1. Compress system prompt (reuse base prompt; include tarot question in <200 chars).
2. Enforce max assistant output length 250 tokens (≈$0.15).
3. Target 6k total tokens ⇒ `$0.36` per session.
4. Abort if projected cost >$0.45.

Implementation checklist
------------------------
- [ ] Add `user_ai_quotas`, `ai_usage`, `quota_limits` tables + RPC `enforce_ai_quota`.
- [ ] Update `/api/ai/chat` route to call RPC, compute USD cost, store usage row.
- [ ] Update frontend session state with `usdCost`, block send when >=0.45.
- [ ] Add `security_events` inserts + simple admin view (supabase Studio / SQL view).
- [ ] Document override process in README.
- [ ] Load test with seeded users to ensure quotas hit as expected.
- [ ] (Optional) Wallet + payments:
  * Table `public.user_ai_wallets (user_id pk, credits_usd numeric(8,2), bonus_credits numeric(8,2), updated_at timestamptz)`; nightly job resets bonus credits for free tier.
  * Ledger `public.payment_transactions` to keep Stripe history separate:
    ```sql
    create table public.payment_transactions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      stripe_payment_intent text not null,
      amount_usd numeric(8,2) not null,
      credits_added numeric(8,2) not null,
      type text not null check (type in ('purchase','refund','bonus')),
      status text not null check (status in ('pending','succeeded','failed','refunded')),
      metadata jsonb default '{}',
      created_at timestamptz not null default now()
    );
    create index payment_transactions_user_idx
      on public.payment_transactions (user_id, created_at desc);
    ```
  * Webhook flow: insert pending transaction → on success update wallet (`credits_usd += credits_added`) and mark transaction `succeeded`.

Status (Nov 2025)
-----------------
- ✅ `/api/ai/chat` now enforces `enforce_ai_quota`, records cached responses, and includes session USD metadata.
- ✅ `AIAssistant` shows session spend, stops at $0.45, sends tarot/template metadata, and surfaces quota errors.
- ✅ Journaling page persists `tarotQuestion`, `sessionUsd`, and restores them from localStorage; manual save snapshots include these fields.
- ⏳ Remaining Stage 1 items: storage trigger enforcement in-app UI (SQL trigger exists), logging UI for `security_event` documents, and quota dashboard/readme docs.

Open questions
--------------
1. Do paying users get higher limits automatically? If yes, connect Stripe customer metadata → `user_ai_quotas.tier`.
2. Should anonymous users get *any* AI access? Current plan says no.
3. Long-term: consider caching AI responses per template/question pair to reduce duplicate spend.
