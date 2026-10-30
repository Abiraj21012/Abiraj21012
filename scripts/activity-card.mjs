// Renders a "contribution activity" line graph (last 30 days) as an SVG string, tokyonight style.
const C = { bg: "#1a1b27", border: "#e4e2e2", title: "#70a5fd", text: "#38bdae", icon: "#bf91f3", dim: "#9aa5b1", grid: "#2b2d3f" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const label = (iso) => { const [, m, d] = iso.split("-").map(Number); return `${MONTHS[m - 1]} ${d}`; };

export function renderActivityCard(days, username) {
  const last = days.slice(-30);
  const n = Math.max(last.length, 2);
  const W = 495, H = 290, L = 46, R = 26, T = 70, B = 48;
  const maxVal = Math.max(4, ...last.map((d) => d.count));
  const step = Math.ceil(maxVal / 4);
  const top = step * 4;
  const x = (i) => L + (i * (W - L - R)) / (n - 1);
  const y = (v) => H - B - (v / top) * (H - T - B);
  const pts = last.map((d, i) => [x(i), y(d.count)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${y(0)} L${pts[0][0].toFixed(1)} ${y(0)} Z`;
  const grid = [0, 1, 2, 3, 4].map((k) => {
    const v = k * step;
    return `<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" stroke="${C.grid}"/>
    <text x="${L - 10}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="${C.dim}">${v}</text>`;
  }).join("\n    ");
  const xl = last.map((d, i) => (i % 6 === 0 || i === last.length - 1)
    ? `<text x="${x(i)}" y="${H - B + 20}" text-anchor="middle" font-size="11" fill="${C.dim}">${label(d.date)}</text>` : "").join("\n    ");
  const dots = pts.map((p, i) => last[i].count > 0
    ? `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${C.icon}" stroke="${C.bg}" stroke-width="1.5"/>` : "").join("");
  const total = last.reduce((s, d) => s + d.count, 0);
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI',Ubuntu,'Helvetica Neue',Sans-Serif">
  <defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.title}" stop-opacity="0.45"/><stop offset="1" stop-color="${C.title}" stop-opacity="0.02"/></linearGradient></defs>
  <style>@keyframes fade{from{opacity:0}to{opacity:1}} .f{animation:fade .9s ease-in-out forwards}</style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
  <text x="25" y="35" font-size="18" font-weight="600" fill="${C.title}">${username}'s Contribution Graph</text>
  <text x="25" y="55" font-size="12" fill="${C.text}">${total} contributions in the last 30 days</text>
  <g>
    ${grid}
    ${xl}
  </g>
  <g class="f">
    <path d="${area}" fill="url(#a)"/>
    <path d="${line}" fill="none" stroke="${C.title}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
  </g>
</svg>`;
}
