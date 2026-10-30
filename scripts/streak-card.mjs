// Renders a GitHub streak card (tokyonight style) as an SVG string.
const C = { bg: "#1a1b27", border: "#e4e2e2", title: "#70a5fd", text: "#38bdae", icon: "#bf91f3", dim: "#9aa5b1" };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (iso, withYear) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}${withYear ? `, ${y}` : ""}`;
};
const range = (a, b, nowYear) => {
  if (!a) return "";
  const withYear = Number(a.slice(0, 4)) !== nowYear || (b && Number(b.slice(0, 4)) !== nowYear);
  return `${fmt(a, withYear)} - ${b ? fmt(b, withYear) : "Present"}`;
};

export function computeStreaks(days, createdAt) {
  // days: [{date: "YYYY-MM-DD", count: n}] sorted ascending, up to today
  const total = days.reduce((s, d) => s + d.count, 0);
  let longest = { len: 0, start: null, end: null };
  let run = { len: 0, start: null, end: null };
  for (const d of days) {
    if (d.count > 0) {
      if (run.len === 0) run = { len: 1, start: d.date, end: d.date };
      else run = { len: run.len + 1, start: run.start, end: d.date };
      if (run.len > longest.len) longest = { ...run };
    } else {
      run = { len: 0, start: null, end: null };
    }
  }
  // current streak: today may still be empty, so the streak can end yesterday
  let current = { len: 0, start: null, end: null };
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  while (i >= 0 && days[i].count > 0) {
    current = { len: current.len + 1, start: days[i].date, end: current.end || days[i].date };
    i--;
  }
  return { total, current, longest, since: createdAt.slice(0, 10) };
}

export function renderStreakCard({ total, current, longest, since }) {
  const nowYear = new Date().getUTCFullYear();
  const W = 495, H = 195;
  const col = (cx, big, label, sub, bigColor, labelColor) => `
    <text x="${cx}" y="88" text-anchor="middle" font-size="28" font-weight="700" fill="${bigColor}">${big}</text>
    <text x="${cx}" y="122" text-anchor="middle" font-size="14" fill="${labelColor}">${label}</text>
    <text x="${cx}" y="147" text-anchor="middle" font-size="12" fill="${C.dim}">${sub}</text>`;
  const cx = W / 2, cy = 80, r = 40;
  const circ = 2 * Math.PI * r;
  // ring with a small gap at the top for the flame
  const gap = 28;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI',Ubuntu,'Helvetica Neue',Sans-Serif">
  <style>
    @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
    @keyframes ring { from { stroke-dashoffset: ${circ - gap} } to { stroke-dashoffset: 0 } }
    .f { animation: fade 0.8s ease-in-out forwards }
    .r { animation: ring 1.2s ease-out forwards }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
  <line x1="${W / 3 + 8}" y1="30" x2="${W / 3 + 8}" y2="165" stroke="${C.border}" stroke-opacity="0.5"/>
  <line x1="${(2 * W) / 3 - 8}" y1="30" x2="${(2 * W) / 3 - 8}" y2="165" stroke="${C.border}" stroke-opacity="0.5"/>
  <g class="f">
  ${col(W / 6 + 4, total.toLocaleString("en-US"), "Total Contributions", range(since, null, nowYear), C.title, C.title)}
  ${col((5 * W) / 6 - 4, longest.len, "Longest Streak", range(longest.start, longest.end, nowYear), C.icon, C.title)}
  <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="28" font-weight="700" fill="${C.icon}">${current.len}</text>
  <text x="${cx}" y="143" text-anchor="middle" font-size="14" font-weight="700" fill="${C.icon}">Current Streak</text>
  <text x="${cx}" y="163" text-anchor="middle" font-size="12" fill="${C.dim}">${range(current.start, current.end, nowYear)}</text>
  </g>
  <g transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="none" stroke="${C.title}" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="${circ - gap} ${gap}" transform="rotate(${-90 + gap / 2 / r * 57.3 + 0}) " class="r"/>
    <g transform="translate(0 -${r}) scale(1.1)">
      <rect x="-12" y="-12" width="24" height="24" fill="${C.bg}"/>
      <path d="M0,-10 C4,-4 8,-1 8,4 C8,9 4,12 0,12 C-4,12 -8,9 -8,4 C-8,0 -5,-2 -4,-6 C-2,-4 -1,-6 0,-10Z" fill="none" stroke="${C.title}" stroke-width="2.5" stroke-linejoin="round"/>
    </g>
  </g>
</svg>`;
}
