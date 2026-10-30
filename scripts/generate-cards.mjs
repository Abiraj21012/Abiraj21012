// Generates 3 profile cards (stats, streak, top languages) as SVG files.
// Requires: github-readme-stats checked out in ./grs, and env PAT_1 (a GitHub token).
import fs from "node:fs";
import { fetchStats } from "../grs/src/fetchers/stats.js";
import { fetchTopLanguages } from "../grs/src/fetchers/top-languages.js";
import { renderStatsCard } from "../grs/src/cards/stats.js";
import { renderTopLanguages } from "../grs/src/cards/top-languages.js";
import { computeStreaks, renderStreakCard } from "./streak-card.mjs";

const username = process.env.USERNAME_TO_USE;
const token = process.env.PAT_1;
if (!username || !token) throw new Error("USERNAME_TO_USE and PAT_1 must be set");

const OUT = "cards";
fs.mkdirSync(OUT, { recursive: true });

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function loadContributionDays() {
  const meta = await gql(
    `query($login:String!){user(login:$login){createdAt contributionsCollection{contributionYears}}}`,
    { login: username },
  );
  const years = meta.user.contributionsCollection.contributionYears.sort();
  const today = new Date().toISOString().slice(0, 10);
  const days = [];
  for (const y of years) {
    const data = await gql(
      `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`,
      { login: username, from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` },
    );
    for (const w of data.user.contributionsCollection.contributionCalendar.weeks)
      for (const d of w.contributionDays)
        if (d.date <= today) days.push({ date: d.date, count: d.contributionCount });
  }
  days.sort((a, b) => (a.date < b.date ? -1 : 1));
  return { days, createdAt: meta.user.createdAt };
}

const theme = "tokyonight";
const jobs = [
  ["stats.svg", async () => {
    const stats = await fetchStats(username, true, []);
    return renderStatsCard(stats, { show_icons: true, theme, include_all_commits: true, border_radius: 10, border_color: "e4e2e2" });
  }],
  ["top-langs.svg", async () => {
    const langs = await fetchTopLanguages(username, [], 1, 0);
    return renderTopLanguages(langs, { theme, langs_count: 6, border_radius: 10, border_color: "e4e2e2" });
  }],
  ["streak.svg", async () => {
    const { days, createdAt } = await loadContributionDays();
    return renderStreakCard(computeStreaks(days, createdAt));
  }],
];

let failed = 0;
for (const [file, build] of jobs) {
  try {
    fs.writeFileSync(`${OUT}/${file}`, await build());
    console.log("wrote", file);
  } catch (e) {
    failed++;
    console.error("FAILED", file, e.message);
  }
}
if (failed === jobs.length) process.exit(1);
