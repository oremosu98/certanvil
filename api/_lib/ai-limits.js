// App-wide daily cap on proxied calls (generation + checker + teacher), sized to a
// $100/month Anthropic budget (spec 2026-10-30 section 1). AI_GLOBAL_DAILY_LIMIT overrides it.
// PROVISIONAL: the proxy logged no token usage before this change, so this comes from a
// conservative estimate, not measured data. Each call now writes one "ai_usage" log line;
// re-size from those once a week of real traffic exists.
// Arithmetic (final review, 2026-10-31). Prices from the claude-api skill, $ per 1M tokens in/out:
//   claude-haiku-5-5 0.10/0.50 (writer), claude-sonnet-4-6 3.00/15.00 (checker, teacher).
// Call structure since fast start: a 10-question quiz asks 13 (buffer), written as two Haiku
// batches (7 + 6); the checker takes 5 questions per Sonnet call per batch, so 7 -> 5+2 and
// 6 -> 5+1: 2 writer + 4 checker = 6 calls before top-ups. A 60-question SIM asks 78:
// 8 batches of ~10 -> 8 writer + 16 checker = 24 calls.
// Per call:
//   writer, ~6.5 questions: 8,000 in + 6,600 out (A/B ~1,020 out per question) = $0.0041
//   writer, top-up of ~5: 8,000 in + 5,100 out = $0.0034; SIM batch of ~10: 8,000 + 10,000 = $0.0058
//   checker, full chunk of 5: 3,625 in (~1,750 instructions + 375 a question) + 300 out
//     (one ~35-token verdict line a question, with slack) = $0.0154
//   checker, short chunk of 1-2: 2,313 in + 150 out = $0.0092
//   teacher: 2,500 in + 1,500 out = $0.0300
// Short quiz: 2 x 0.0041 + 2 x 0.0154 + 2 x 0.0092 = $0.0573 (6 calls)
//   + half a top-up round (writer + checker) = $0.0094 (1 call) + 0.3 teacher calls = $0.0090
//   = $0.0757 over 7.3 calls ($0.0104 a call).
// SIM: 8 x 0.0058 + 16 x 0.0154 = $0.2924 over 24 calls ($0.0122 a call).
// Mix of 9 short quizzes to 1 SIM: $0.9736 over 89.7 calls = $0.01085 a call.
// Budget $200 a month (founder, 31 Oct; was $100):
// 200 / 30 = $6.667 a day / $0.01085 = 614.4 -> 614 calls a day.
// That is ≈ 84 short quizzes a day app-wide at the default (614 / 7.3), or about 61 short
// quizzes plus 7 SIMs on the 9:1 mix. All short quizzes ≈ $192/month; all SIMs ≈ $225/month.
const GLOBAL_DAILY_LIMIT_DEFAULT = 614;
function globalDailyLimit() {
  const n = Number(process.env.AI_GLOBAL_DAILY_LIMIT);
  return Number.isInteger(n) && n > 0 && n <= 100000 ? n : GLOBAL_DAILY_LIMIT_DEFAULT;
}

module.exports = { GLOBAL_DAILY_LIMIT_DEFAULT, globalDailyLimit };
