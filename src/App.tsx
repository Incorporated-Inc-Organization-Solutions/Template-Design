import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import voyageVistaLogo from './assets/voyagevista-logo.png';

// ── Dates (fictional today = 28 Sep 2150) ─────────────────────────────────────

const TODAY = new Date('2150-09-28');

function parseFlight(dateStr: string): Date {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mrt: 2, Apr: 3, Mei: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Okt: 9, Nov: 10, Dec: 11,
  };
  const [d, m, y] = dateStr.split(' ');
  return new Date(Number(y), months[m], Number(d));
}

function flightStatus(dateStr: string): { label: string; color: string; bg: string } {
  const d = parseFlight(dateStr);
  const diffMs = d.getTime() - TODAY.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      label: `Vertraagd: vertrek over ${overdue}d`,
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.08)',
    };
  }
  if (diffDays === 0) return { label: 'Boarding open', color: '#10B981', bg: 'rgba(16,185,129,0.08)' };
  if (diffDays === 1) return { label: 'In voorbereiding', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' };
  return { label: 'Inschrijving open', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' };
}

// ── Data ──────────────────────────────────────────────────────────────────────

// ── Chart data per filter period ─────────────────────────────────────────────

const planetDataSets: Record<string, { name: string; boekingen: number }[]> = {
  'Maand': [
    { name: 'Mars', boekingen: 4820 }, { name: 'Venus', boekingen: 3210 },
    { name: 'Saturnus', boekingen: 2940 }, { name: 'Pluto', boekingen: 1850 },
    { name: 'Jupiter', boekingen: 1200 }, { name: 'Neptunus', boekingen: 680 },
  ],
  'Kwartaal': [
    { name: 'Mars', boekingen: 13200 }, { name: 'Venus', boekingen: 9800 },
    { name: 'Saturnus', boekingen: 8100 }, { name: 'Pluto', boekingen: 5400 },
    { name: 'Jupiter', boekingen: 3700 }, { name: 'Neptunus', boekingen: 1900 },
  ],
  'Jaar': [
    { name: 'Mars', boekingen: 51000 }, { name: 'Venus', boekingen: 37500 },
    { name: 'Saturnus', boekingen: 31200 }, { name: 'Pluto', boekingen: 20800 },
    { name: 'Jupiter', boekingen: 14400 }, { name: 'Neptunus', boekingen: 7200 },
  ],
  'Vorig jaar': [
    { name: 'Mars', boekingen: 44000 }, { name: 'Venus', boekingen: 31000 },
    { name: 'Saturnus', boekingen: 27500 }, { name: 'Pluto', boekingen: 17200 },
    { name: 'Jupiter', boekingen: 11800 }, { name: 'Neptunus', boekingen: 5900 },
  ],
  'Altijd': [
    { name: 'Mars', boekingen: 198000 }, { name: 'Venus', boekingen: 142000 },
    { name: 'Saturnus', boekingen: 118000 }, { name: 'Pluto', boekingen: 74000 },
    { name: 'Jupiter', boekingen: 51000 }, { name: 'Neptunus', boekingen: 28000 },
  ],
};

const transportDataSets: Record<string, { name: string; value: number; color: string }[]> = {
  'Maand':     [{ name: 'Raket', value: 42, color: '#A78BFA' }, { name: 'Teleportatie', value: 28, color: '#6C4DFF' }, { name: 'Cruiseschip', value: 19, color: '#6D28D9' }, { name: 'VR Experience', value: 11, color: '#1E40AF' }],
  'Kwartaal':  [{ name: 'Raket', value: 38, color: '#A78BFA' }, { name: 'Teleportatie', value: 31, color: '#6C4DFF' }, { name: 'Cruiseschip', value: 21, color: '#6D28D9' }, { name: 'VR Experience', value: 10, color: '#1E40AF' }],
  'Jaar':      [{ name: 'Raket', value: 35, color: '#A78BFA' }, { name: 'Teleportatie', value: 33, color: '#6C4DFF' }, { name: 'Cruiseschip', value: 22, color: '#6D28D9' }, { name: 'VR Experience', value: 10, color: '#1E40AF' }],
  'Vorig jaar':[{ name: 'Raket', value: 51, color: '#A78BFA' }, { name: 'Teleportatie', value: 20, color: '#6C4DFF' }, { name: 'Cruiseschip', value: 23, color: '#6D28D9' }, { name: 'VR Experience', value: 6,  color: '#1E40AF' }],
  'Altijd':    [{ name: 'Raket', value: 44, color: '#A78BFA' }, { name: 'Teleportatie', value: 26, color: '#6C4DFF' }, { name: 'Cruiseschip', value: 21, color: '#6D28D9' }, { name: 'VR Experience', value: 9,  color: '#1E40AF' }],
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

function weeklyRevenueData(
  anchors: { month: string; revenue: number }[],
  monthsPerAnchor: number,
): { month: string; revenue: number }[] {
  return anchors.flatMap((anchor, anchorIndex) => {
    const nextRevenue = anchors[anchorIndex + 1]?.revenue ?? anchor.revenue;
    const year = anchor.month.match(/\d{4}$/)?.[0];
    const quarter = anchor.month.match(/^Q([1-4])/);
    const firstMonth = quarter ? (Number(quarter[1]) - 1) * 3 : 0;
    const steps = monthsPerAnchor * 4;

    return Array.from({ length: steps }, (_, step) => {
      const monthIndex = Math.floor(step / 4);
      const week = step % 4;
      const progress = step / steps;
      const trend = anchor.revenue + (nextRevenue - anchor.revenue) * progress;
      const amplitude = Math.max(0.15, anchor.revenue * 0.035);
      const weeklyWave = [-0.7, 0.8, -0.45, 1][week] * amplitude;
      const period = monthsPerAnchor === 1
        ? anchor.month
        : `${MONTH_LABELS[firstMonth + monthIndex]}${year ? ` ${year}` : ''}`;

      return {
        month: `${period} W${week + 1}`,
        revenue: Number(Math.max(0, trend + weeklyWave).toFixed(2)),
      };
    });
  });
}

const revenueDataSets: Record<string, { month: string; revenue: number }[]> = {
  'Maand': weeklyRevenueData([
    { month: 'Mrt', revenue: 2.4 }, { month: 'Apr', revenue: 3.1 },
    { month: 'Mei', revenue: 2.8 }, { month: 'Jun', revenue: 4.2 },
    { month: 'Jul', revenue: 3.9 }, { month: 'Aug', revenue: 5.1 },
    { month: 'Sep', revenue: 4.7 },
  ], 1),
  'Kwartaal': weeklyRevenueData([
    { month: 'Q1 2149', revenue: 6.2 }, { month: 'Q2 2149', revenue: 8.9 },
    { month: 'Q3 2149', revenue: 10.1 }, { month: 'Q4 2149', revenue: 12.4 },
    { month: 'Q1 2150', revenue: 9.8 }, { month: 'Q2 2150', revenue: 13.7 },
    { month: 'Q3 2150', revenue: 15.1 },
  ], 3),
  'Jaar': weeklyRevenueData([
    { month: '2144', revenue: 18.2 }, { month: '2145', revenue: 24.1 },
    { month: '2146', revenue: 29.8 }, { month: '2147', revenue: 35.4 },
    { month: '2148', revenue: 41.0 }, { month: '2149', revenue: 37.6 },
    { month: '2150', revenue: 51.2 },
  ], 12),
  'Vorig jaar': weeklyRevenueData([
    { month: 'Jan', revenue: 2.9 }, { month: 'Feb', revenue: 3.4 },
    { month: 'Mrt', revenue: 3.1 }, { month: 'Apr', revenue: 4.0 },
    { month: 'Mei', revenue: 3.6 }, { month: 'Jun', revenue: 4.8 },
    { month: 'Jul', revenue: 4.2 }, { month: 'Aug', revenue: 5.3 },
    { month: 'Sep', revenue: 4.9 }, { month: 'Okt', revenue: 5.6 },
    { month: 'Nov', revenue: 4.1 }, { month: 'Dec', revenue: 6.2 },
  ], 1),
  'Altijd': weeklyRevenueData([
    { month: '2145', revenue: 24.1 }, { month: '2146', revenue: 29.8 },
    { month: '2147', revenue: 35.4 }, { month: '2148', revenue: 41.0 },
    { month: '2149', revenue: 37.6 }, { month: '2150', revenue: 51.2 },
  ], 12),
};

const flights = [
  { id: 'TP-2887', dest: 'Venus', transport: 'Teleportatie', departure: '24 Sep 2150', seats: 24, capacity: 30 },
  { id: 'RK-2891', dest: 'Mars', transport: 'Raket', departure: '28 Sep 2150', seats: 142, capacity: 160 },
  { id: 'CS-2892', dest: 'Saturnus', transport: 'Cruiseschip', departure: '29 Sep 2150', seats: 380, capacity: 420 },
  { id: 'VR-2893', dest: 'Pluto', transport: 'VR Experience', departure: '03 Okt 2150', seats: 188, capacity: 200 },
  { id: 'RK-2894', dest: 'Jupiter', transport: 'Raket', departure: '19 Okt 2150', seats: 74, capacity: 120 },
];

const notifications = [
  { type: 'warning', title: 'RK-2891 onderhoud vereist', time: '8m', desc: 'Maintenance check vereist vóór vertrek 28 sep' },
  { type: 'success', title: 'Boeking #RK-9421 bevestigd', time: '23m', desc: 'Arjun Sharma — Mars Premium Package' },
  { type: 'error', title: 'Teleportatie node offline', time: '2u', desc: 'Gateway verbinding verbroken — IT onderzoekt' },
  { type: 'info', title: 'QuantumDrive contract getekend', time: '3u', desc: '3-jarig leverancierscontract actief' },
  { type: 'success', title: 'Campagne "Pluto 2150" live', time: '5u', desc: '14.800 impressies in eerste uur' },
];

const departments = [
  {
    label: 'Marketing',
    full: 'Marketing & Communicatie',
    subs: ['Campagnes', 'Klantsegmenten', 'Analytics', 'Content & Media'],
  },
  {
    label: 'Sales',
    full: 'Sales & Boekingen',
    subs: ['Actieve Boekingen', 'Offertes', 'Beschikbaarheid', 'Vertrekplanning'],
  },
  {
    label: 'Klantenservice',
    full: 'Klantenservice & Support',
    subs: ['Tickets', 'SLA Overzicht', 'Klantfeedback', 'Kennisbank'],
  },
  {
    label: 'Producten',
    full: 'Productontwikkeling & Inkoop',
    subs: ['Reisproducten', 'Leveranciers', 'Contracten', 'Pipeline'],
  },
  {
    label: 'Financiën',
    full: 'Financiën & Administratie',
    subs: ['Omzet', 'Facturen', 'Betalingen', 'Rapporten'],
  },
  {
    label: 'IT & Innovatie',
    full: 'IT & Innovatie',
    subs: ['API Status', 'Integraties', 'Monitoring', 'Projecten'],
  },
];

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        padding: Math.max(1, size * 0.04),
        borderRadius: Math.max(4, size * 0.24),
        background: '#fff',
        boxShadow: '0 1px 3px rgba(15,23,42,0.12)',
      }}
    >
      <img
        src={voyageVistaLogo}
        alt=""
        className="h-full w-full object-contain"
        style={{ transform: 'scale(1.32)' }}
      />
    </div>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────────

function StarField() {
  const stars = Array.from({ length: 150 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.8 + 0.3,
    delay: Math.random() * 6,
    dur: Math.random() * 3 + 1.5,
    bright: Math.random() > 0.6,
  }));
  const glows = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1.5,
    color: i % 3 === 0 ? '#38BDF8' : i % 3 === 1 ? '#A78BFA' : '#ffffff',
    delay: Math.random() * 5,
    dur: Math.random() * 2 + 2,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(s => (
        <div key={s.id} className="absolute rounded-full" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          background: '#fff',
          opacity: s.bright ? 0.8 : 0.3,
          animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
      {glows.map(s => (
        <div key={`g${s.id}`} className="absolute rounded-full" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          background: s.color,
          boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
          opacity: 0.85,
          animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
      <div className="absolute" style={{
        top: '30%', left: '-5%', width: '110%', height: 45,
        background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.1) 30%, rgba(56,189,248,0.12) 55%, rgba(30,64,175,0.09) 80%, transparent)',
        transform: 'rotate(-5deg)', filter: 'blur(10px)',
      }} />

      {/* Extra twinkling stars scattered across the hero */}
      {[
        { x: '8%',  y: '12%', r: 2.2, delay: 0.3,  dur: 3.1, glow: 'rgba(255,255,255,0.9)' },
        { x: '18%', y: '28%', r: 1.5, delay: 1.1,  dur: 4.2, glow: 'rgba(196,181,253,0.9)' },
        { x: '25%', y: '8%',  r: 1.8, delay: 2.0,  dur: 3.8, glow: 'rgba(255,255,255,0.8)' },
        { x: '33%', y: '42%', r: 1.2, delay: 0.7,  dur: 5.0, glow: 'rgba(255,255,255,0.7)' },
        { x: '42%', y: '18%', r: 2.5, delay: 1.5,  dur: 3.4, glow: 'rgba(167,139,250,1)'   },
        { x: '50%', y: '35%', r: 1.4, delay: 3.2,  dur: 4.6, glow: 'rgba(255,255,255,0.8)' },
        { x: '57%', y: '10%', r: 2.0, delay: 0.9,  dur: 3.7, glow: 'rgba(56,189,248,1)'    },
        { x: '64%', y: '48%', r: 1.3, delay: 2.4,  dur: 5.1, glow: 'rgba(255,255,255,0.7)' },
        { x: '71%', y: '22%', r: 1.9, delay: 1.8,  dur: 3.9, glow: 'rgba(196,181,253,0.9)' },
        { x: '78%', y: '38%', r: 1.1, delay: 0.5,  dur: 4.3, glow: 'rgba(255,255,255,0.8)' },
        { x: '84%', y: '14%', r: 2.3, delay: 2.9,  dur: 3.5, glow: 'rgba(255,255,255,0.9)' },
        { x: '91%', y: '30%', r: 1.6, delay: 1.3,  dur: 4.8, glow: 'rgba(167,139,250,1)'   },
        { x: '14%', y: '55%', r: 1.4, delay: 3.6,  dur: 4.0, glow: 'rgba(255,255,255,0.6)' },
        { x: '47%', y: '60%', r: 1.7, delay: 0.2,  dur: 3.2, glow: 'rgba(255,255,255,0.7)' },
        { x: '68%', y: '62%', r: 1.2, delay: 2.1,  dur: 5.3, glow: 'rgba(56,189,248,0.9)'  },
        { x: '88%', y: '58%', r: 1.5, delay: 1.0,  dur: 4.1, glow: 'rgba(255,255,255,0.8)' },
      ].map((s, i) => (
        <div key={`extra${i}`} className="absolute pointer-events-none rounded-full" style={{
          left: s.x, top: s.y,
          width: s.r * 2, height: s.r * 2,
          background: s.glow,
          boxShadow: `0 0 ${s.r * 3}px ${s.glow}`,
          animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

function PlanetsScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large purple planet right */}
      <div className="absolute animate-float" style={{ right: 72, top: 30, width: 90, height: 90 }}>
        <div className="w-full h-full rounded-full" style={{
          background: 'radial-gradient(circle at 35% 30%, #7C3AED, #1E1B4B 70%)',
          boxShadow: '0 0 55px rgba(108,77,255,0.5), 0 0 110px rgba(108,77,255,0.15), inset 0 0 30px rgba(108,77,255,0.22)',
        }} />
        <div className="absolute rounded-full" style={{ top: '30%', left: '10%', right: '10%', height: 5, background: 'rgba(255,255,255,0.05)', filter: 'blur(2px)' }} />
        <div className="absolute" style={{ top: 22, left: -24, width: 138, height: 36, border: '1.5px solid rgba(56,189,248,0.3)', borderRadius: '50%', transform: 'rotateX(70deg)' }} />
        <div className="absolute w-4 h-4 rounded-full" style={{ right: -20, top: 14, background: 'radial-gradient(circle at 40% 35%, #CBD5E1, #64748B)', boxShadow: '0 0 8px rgba(203,213,225,0.5)' }} />
      </div>
      {/* Saturn mid-right */}
      <div className="absolute animate-float" style={{ right: 218, top: 50, width: 42, height: 42, animationDelay: '1.2s' }}>
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle at 38% 35%, #FDE68A, #B45309)', boxShadow: '0 0 18px rgba(251,191,36,0.4)' }} />
        <div className="absolute" style={{ top: 7, left: -19, width: 80, height: 28, border: '2px solid rgba(251,191,36,0.42)', borderRadius: '50%', transform: 'rotateX(72deg)' }} />
        <div className="absolute" style={{ top: 13, left: -13, width: 68, height: 16, border: '1px solid rgba(251,191,36,0.22)', borderRadius: '50%', transform: 'rotateX(72deg)' }} />
      </div>
      {/* Cyan small planet */}
      <div className="absolute animate-float-delay" style={{ left: '42%', top: 18, width: 28, height: 28 }}>
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #67E8F9, #0891B2)', boxShadow: '0 0 18px rgba(56,189,248,0.65)' }} />
        <div className="absolute" style={{ top: 7, left: -10, width: 48, height: 12, border: '1px solid rgba(56,189,248,0.45)', borderRadius: '50%', transform: 'rotateX(65deg)' }} />
      </div>
      {/* Tiny red planet */}
      <div className="absolute" style={{ left: '63%', top: 42, width: 14, height: 14, animation: 'float 8s 1s ease-in-out infinite' }}>
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #FCA5A5, #DC2626)', boxShadow: '0 0 12px rgba(239,68,68,0.55)' }} />
      </div>
      {/* Tiny purple planet left */}
      <div className="absolute" style={{ left: '18%', top: 32, width: 12, height: 12, animation: 'float 10s 3s ease-in-out infinite' }}>
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #C4B5FD, #6C4DFF)', boxShadow: '0 0 10px rgba(167,139,250,0.65)' }} />
      </div>
      {/* Nebula glow */}
      <div className="absolute" style={{ left: '41%', top: -20, width: 240, height: 120, background: 'radial-gradient(ellipse, rgba(30,64,175,0.2) 0%, rgba(56,189,248,0.09) 55%, transparent 70%)', filter: 'blur(18px)' }} />
      {/* Extra planets */}
      {/* Small green planet */}
      <div className="absolute" style={{ left: '30%', top: 60, width: 18, height: 18, animation: 'float 9s 2s ease-in-out infinite' }}>
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #6EE7B7, #059669)', boxShadow: '0 0 14px rgba(110,231,183,0.6)' }} />
      </div>
      {/* Small ice planet */}
      <div className="absolute" style={{ left: '75%', top: 25, width: 20, height: 20, animation: 'float 7s 0.5s ease-in-out infinite' }}>
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #BAE6FD, #0369A1)', boxShadow: '0 0 14px rgba(186,230,253,0.6)' }} />
      </div>
      {/* Tiny orange planet */}
      <div className="absolute" style={{ left: '50%', top: 18, width: 10, height: 10, animation: 'float 11s 4s ease-in-out infinite' }}>
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #FED7AA, #EA580C)', boxShadow: '0 0 8px rgba(251,146,60,0.7)' }} />
      </div>
      {/* Tiny teal planet */}
      <div className="absolute" style={{ left: '86%', top: 65, width: 13, height: 13, animation: 'float 8.5s 1.5s ease-in-out infinite' }}>
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #99F6E4, #0F766E)', boxShadow: '0 0 10px rgba(153,246,228,0.65)' }} />
      </div>
      {/* Accent dots */}
      {[
        { x: '13%', y: 55, c: '#A78BFA', s: 5 }, { x: '26%', y: 16, c: '#38BDF8', s: 4 },
        { x: '74%', y: 20, c: '#fff', s: 3 },     { x: '84%', y: 60, c: '#A78BFA', s: 4 },
        { x: '54%', y: 55, c: '#67E8F9', s: 3 },  { x: '92%', y: 30, c: '#38BDF8', s: 5 },
        { x: '8%',  y: 24, c: '#fff',   s: 2 },   { x: '35%', y: 80, c: '#C4B5FD', s: 3 },
        { x: '67%', y: 70, c: '#67E8F9', s: 4 },
      ].map((d, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: d.x, top: d.y, width: d.s, height: d.s,
          background: d.c, boxShadow: `0 0 ${d.s * 3}px ${d.c}`,
          animation: `twinkle ${2 + i * 0.4}s ${i * 0.7}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, darkMode }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: darkMode ? '#1E293B' : 'rgba(255,255,255,0.97)',
      border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(59,130,246,0.16)',
      borderRadius: 10, padding: '7px 13px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(59,130,246,0.1)',
      fontFamily: 'Outfit, sans-serif', fontSize: 12,
    }}>
      <p style={{ color: darkMode ? '#64748B' : '#94A3B8', marginBottom: 3 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#3B82F6', fontWeight: 700 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ── Notification item ─────────────────────────────────────────────────────────

function NotifRow({ type, title, time, desc }: { type: string; title: string; time: string; desc: string }) {
  const map: Record<string, [string, string]> = {
    warning: ['#F59E0B', '⚠'],
    success: ['#10B981', '✓'],
    error:   ['#EF4444', '✕'],
    info:    ['#38BDF8', 'ℹ'],
  };
  const [c, icon] = map[type] || ['#3B82F6', '·'];
  return (
    <div className="flex gap-2.5 py-2.5" style={{ borderBottom: '1px solid rgba(139,156,182,0.1)' }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
        style={{ background: `${c}18`, color: c }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-xs font-semibold text-slate-700 truncate">{title}</p>
          <span className="text-xs flex-shrink-0" style={{ color: '#94A3B8', fontFamily: 'Outfit, sans-serif' }}>{time}</span>
        </div>
        <p className="text-xs line-clamp-1" style={{ color: '#94A3B8' }}>{desc}</p>
      </div>
    </div>
  );
}

// ── Illustrated icons for stat tiles ─────────────────────────────────────────

function IconRocket({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 3C14 3 20 9 20 16L17 18.5H11L8 16C8 9 14 3 14 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}25`} />
      <circle cx="14" cy="13" r="2.5" stroke={color} strokeWidth="1.6" />
      <path d="M11 18.5L9.5 24L14 21.5L18.5 24L17 18.5" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={`${color}20`} />
      <path d="M8 16L5 17.5L6 21L11 18.5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M20 16L23 17.5L22 21L17 18.5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconPersons({ color }: { color: string }) {
  // Two clearly distinct people side by side
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      {/* Person 1 — left */}
      <circle cx="10" cy="10" r="4" stroke={color} strokeWidth="2" fill={`${color}25`} />
      <path d="M2 27C2 21.477 5.582 17 10 17C14.418 17 18 21.477 18 27"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill={`${color}15`} />
      {/* Person 2 — right */}
      <circle cx="22" cy="10" r="4" stroke={color} strokeWidth="2" fill={`${color}20`} />
      <path d="M14 27C14 21.477 17.582 17 22 17C26.418 17 30 21.477 30 27"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill={`${color}10`} />
    </svg>
  );
}

function IconCoin({ color }: { color: string }) {
  // Euro sign in a circle
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill={`${color}15`} />
      {/* € symbol */}
      <path d="M20 11C18.5 9.8 16.5 9.5 14.5 10.3C12.5 11.1 11 13 10.5 15.5"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M20 21C18.5 22.2 16.5 22.5 14.5 21.7C12.5 20.9 11 19 10.5 16.5"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M9 14.5H15.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 17.5H15.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="7" width="20" height="17" rx="3" stroke={color} strokeWidth="1.8" fill={`${color}15`} />
      <path d="M4 12H24" stroke={color} strokeWidth="1.5" />
      <path d="M9 5V9M19 5V9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="17" r="1.3" fill={color} />
      <circle cx="14" cy="17" r="1.3" fill={color} />
      <circle cx="19" cy="17" r="1.3" fill={color} opacity="0.5" />
      <circle cx="9" cy="21" r="1.3" fill={color} opacity="0.5" />
      <circle cx="14" cy="21" r="1.3" fill={color} opacity="0.5" />
    </svg>
  );
}

// ── Quick-action illustrated icons ────────────────────────────────────────────

function QIconBooking({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Rocket body */}
      <path d="M12 3 C12 3 7 8 7 14 L12 18 L17 14 C17 8 12 3 12 3Z" fill={`${color}28`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Nose cone */}
      <circle cx="12" cy="6" r="1.5" fill={color} />
      {/* Side fins */}
      <path d="M7 14 L5 17 L8 16" fill={`${color}50`} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M17 14 L19 17 L16 16" fill={`${color}50`} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      {/* Flame */}
      <path d="M10 18 Q12 22 14 18" fill={`${color}60`} stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function QIconCampaign({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Dish */}
      <path d="M4 14 Q4 6 12 4 Q20 6 20 14" fill={`${color}20`} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Dish inner arc */}
      <path d="M7 13 Q7 8 12 7 Q17 8 17 13" fill={`${color}15`} stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Center dot + pole */}
      <circle cx="12" cy="14" r="1.8" fill={color} />
      <path d="M12 15.8 L12 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Waves */}
      <path d="M15 5.5 Q18 4 19 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <path d="M16 3 Q20 1.5 22 4" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

function QIconSupport({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Headphone arch */}
      <path d="M5 12 A7 7 0 0 1 19 12" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Left ear cup */}
      <rect x="3" y="12" width="4" height="6" rx="2" fill={`${color}28`} stroke={color} strokeWidth="1.5" />
      {/* Right ear cup */}
      <rect x="17" y="12" width="4" height="6" rx="2" fill={`${color}28`} stroke={color} strokeWidth="1.5" />
      {/* Mic arm */}
      <path d="M17 18 Q17 21 14 21 L13 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function QIconDestination({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Planet */}
      <circle cx="12" cy="12" r="6.5" fill={`${color}20`} stroke={color} strokeWidth="1.5" />
      {/* Orbit ring */}
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke={color} strokeWidth="1.2" opacity="0.7" />
      {/* Plus symbol (add) */}
      <path d="M12 9 L12 15 M9 12 L15 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function QIconReport({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Paper */}
      <rect x="4" y="2" width="13" height="18" rx="2" fill={`${color}18`} stroke={color} strokeWidth="1.5" />
      {/* Bars */}
      <rect x="7" y="14" width="2.5" height="4" rx="1" fill={color} />
      <rect x="10.75" y="11" width="2.5" height="7" rx="1" fill={color} opacity="0.75" />
      <rect x="14.5" y="12.5" width="2.5" height="5.5" rx="1" fill={color} opacity="0.5" />
      {/* Lines */}
      <path d="M7 8 L17 8" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M7 10.5 L14 10.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      {/* Folded corner */}
      <path d="M14 2 L17 5 L14 5 Z" fill={`${color}30`} stroke={color} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({ label, value, sub, color, iconEl }: { label: string; value: string; sub?: string; color: string; iconEl: React.ReactNode }) {
  return (
    <div className="rounded-xl px-3 py-3 flex items-center gap-3"
      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
      {/* Icon — no border box, just the icon itself */}
      <div className="flex-shrink-0">{iconEl}</div>
      <div>
        <p className="text-xl font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color, letterSpacing: '-0.01em' }}>{value}</p>
        <p className="font-semibold mt-0.5" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.01em' }}>{label}</p>
        {sub && <p className="font-medium" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit, sans-serif' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

const silverLight = {
  text: '#8B9CB6',
  textLight: '#B0BCCE',
  textStrong: '#4A5568',
  border: 'rgba(139,156,182,0.16)',
  surface: 'rgba(139,156,182,0.07)',
};

const systemStatuses = [
  { name: 'Boekingssysteem',       status: 'Operationeel', uptime: '99.99%', color: '#10B981' },
  { name: 'Betalingsgateway',       status: 'Operationeel', uptime: '99.97%', color: '#10B981' },
  { name: 'Teleportatie Node',      status: 'Offline',      uptime: '81.2%',  color: '#EF4444' },
  { name: 'Raket Fleet Control',    status: 'Operationeel', uptime: '99.91%', color: '#10B981' },
  { name: 'Cruiseschip Nav API',    status: 'Degraded',     uptime: '97.3%',  color: '#F59E0B' },
  { name: 'VR Render Cluster',      status: 'Operationeel', uptime: '99.88%', color: '#10B981' },
  { name: 'Klantportaal',           status: 'Operationeel', uptime: '99.96%', color: '#10B981' },
  { name: 'Meldingsdienst',         status: 'Operationeel', uptime: '99.93%', color: '#10B981' },
  { name: 'Data Warehouse',         status: 'Onderhoud',    uptime: '—',      color: '#3B82F6' },
];

const PLANET_PERIODS  = ['Maand', 'Kwartaal', 'Jaar', 'Vorig jaar', 'Altijd'] as const;
const TRANSPORT_PERIODS = ['Maand', 'Kwartaal', 'Jaar', 'Vorig jaar', 'Altijd'] as const;
const REVENUE_PERIODS = ['Maand', 'Kwartaal', 'Jaar', 'Vorig jaar', 'Altijd'] as const;
const REVENUE_TICK_INTERVALS: Record<typeof REVENUE_PERIODS[number], number> = {
  'Maand': 3,
  'Kwartaal': 11,
  'Jaar': 47,
  'Vorig jaar': 3,
  'Altijd': 47,
};

export default function App() {
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [planetPeriod, setPlanetPeriod] = useState<typeof PLANET_PERIODS[number]>('Maand');
  const [transportPeriod, setTransportPeriod] = useState<typeof TRANSPORT_PERIODS[number]>('Maand');
  const [revenuePeriod, setRevenuePeriod] = useState<typeof REVENUE_PERIODS[number]>('Maand');

  const planetData = planetDataSets[planetPeriod];
  const transportData = transportDataSets[transportPeriod];
  const revenueData = revenueDataSets[revenuePeriod];

  const silver = darkMode ? {
    text: '#94A3B8',
    textLight: '#64748B',
    textStrong: '#CBD5E1',
    border: 'rgba(255,255,255,0.08)',
    surface: 'rgba(255,255,255,0.05)',
  } : silverLight;

  const th = {
    bg:         darkMode ? '#0F172A' : '#F0F4FA',
    surface:    darkMode ? '#1E293B' : '#fff',
    surfaceAlt: darkMode ? '#263348' : '#F8FAFC',
    headerBg:   darkMode ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.92)',
    textPrimary:   darkMode ? '#E2E8F0' : '#1E293B',
    textSecondary: darkMode ? '#CBD5E1' : '#334155',
    textMuted:     darkMode ? '#64748B' : '#94A3B8',
    shadow:     darkMode ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(15,23,42,0.04)',
    shadowLg:   darkMode ? '0 16px 48px rgba(0,0,0,0.5)' : '0 16px 48px rgba(15,23,42,0.12)',
    inputBg:    darkMode ? '#263348' : '#fff',
  };

  return (
    <div className="min-h-screen" style={{ background: th.bg, fontFamily: 'Outfit, sans-serif', overflowY: 'scroll', transition: 'background 0.3s ease, color 0.3s ease' }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50"
        style={{
          background: th.headerBg,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${silver.border}`,
          boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
          transition: 'background 0.3s ease',
        }}>
        {/* Three-column: logo | centered-nav | right-controls */}
        <div className="flex items-center px-5 py-2.5">

          {/* LEFT — Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0" style={{ minWidth: 172 }}>
            <Logo size={34} />
            <div>
              <span className="block font-bold leading-tight"
                style={{ fontSize: 15, color: th.textPrimary, letterSpacing: '-0.02em', transition: 'color 0.3s' }}>
                VoyageVista
              </span>
              <span className="block" style={{ fontSize: 8, color: silver.text, letterSpacing: '0.1em' }}>
                INTERPLANETARY
              </span>
            </div>
          </div>

          {/* CENTER — Nav (truly centred with flex-1 + justify-center) */}
          <div className="flex-1 flex items-center justify-center gap-0.5">
            <button className="px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ fontSize: 13, letterSpacing: '0.01em', background: 'rgba(59,130,246,0.09)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.18)' }}>
              Dashboard
            </button>

            {departments.map(dept => (
              <div key={dept.label} className="relative"
                onMouseEnter={() => setHoveredDept(dept.label)}
                onMouseLeave={() => setHoveredDept(null)}>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all"
                  style={{
                    fontSize: 13, letterSpacing: '0.01em',
                    background: hoveredDept === dept.label ? silver.surface : 'transparent',
                    color: hoveredDept === dept.label ? silver.textStrong : silver.text,
                    border: '1px solid transparent',
                  }}>
                  {dept.label}
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"
                    style={{ opacity: 0.4, transition: 'transform 0.2s', transform: hoveredDept === dept.label ? 'rotate(180deg)' : 'none' }}>
                    <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>

                {hoveredDept === dept.label && (
                  <div className="absolute top-full left-0 mt-1 py-1.5 rounded-xl z-50 min-w-max"
                    style={{ background: th.surface, border: `1px solid ${silver.border}`, boxShadow: th.shadowLg }}>
                    <p className="px-3 py-1 font-semibold"
                      style={{ fontSize: 10, color: silver.textLight, letterSpacing: '0.07em' }}>
                      {dept.full.toUpperCase()}
                    </p>
                    <div style={{ height: 1, background: silver.border, margin: '3px 0' }} />
                    {dept.subs.map(sub => (
                      <button key={sub} className="w-full text-left px-4 py-2 transition-all"
                        style={{ fontSize: 13, color: silver.textStrong }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = silver.surface}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT — Search + notif + profile */}
          <div className="flex items-center gap-2.5 flex-shrink-0" style={{ minWidth: 172, justifyContent: 'flex-end' }}>

          {/* Search */}
          <div className="relative flex items-center"
            style={{ width: searchFocused ? 210 : 165, transition: 'width 0.3s ease' }}>
            <svg className="absolute left-3 w-3.5 h-3.5" style={{ color: silver.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Zoeken..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none transition-all"
              style={{
                background: searchFocused ? th.inputBg : silver.surface,
                border: `1px solid ${searchFocused ? 'rgba(59,130,246,0.35)' : silver.border}`,
                color: th.textPrimary,
                boxShadow: searchFocused ? '0 0 0 3px rgba(59,130,246,0.07)' : 'none',
              }} />
          </div>

          {/* System status */}
          <div className="relative">
            <button onClick={() => { setStatusOpen(v => !v); setNotifOpen(false); }}
              className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              title="Systeemstatus"
              style={{
                background: statusOpen ? 'rgba(59,130,246,0.1)' : silver.surface,
                border: `1px solid ${statusOpen ? 'rgba(59,130,246,0.22)' : silver.border}`,
              }}>
              {/* Heartbeat / vitals icon */}
              <svg className="w-4 h-4" style={{ color: silver.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12h3l2-7 4 14 3-9 2 5h4" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{ background: '#EF4444' }} />
            </button>

            {statusOpen && (
              <div className="absolute right-0 top-10 w-80 rounded-2xl p-4 z-50"
                style={{ background: th.surface, border: `1px solid ${silver.border}`, boxShadow: th.shadowLg }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold" style={{ color: th.textPrimary }}>Systeemstatus</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>1 storing</span>
                </div>
                <div className="space-y-2">
                  {systemStatuses.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0"
                      style={{ borderColor: silver.border }}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: s.color, boxShadow: `0 0 5px ${s.color}80` }} />
                        <span style={{ fontSize: 12, color: th.textSecondary }}>{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, color: silver.text }}>{s.uptime}</span>
                        <span className="px-1.5 py-0.5 rounded-md text-xs font-medium"
                          style={{ background: `${s.color}15`, color: s.color, fontSize: 10 }}>{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setNotifOpen(v => !v); setStatusOpen(false); }}
              className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: notifOpen ? 'rgba(59,130,246,0.1)' : silver.surface,
                border: `1px solid ${notifOpen ? 'rgba(59,130,246,0.22)' : silver.border}`,
              }}>
              <svg className="w-4 h-4" style={{ color: silver.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: '#EF4444', fontSize: 9, fontFamily: 'Outfit, sans-serif' }}>3</span>
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-10 w-80 rounded-2xl p-4 z-50"
                style={{ background: th.surface, border: `1px solid ${silver.border}`, boxShadow: th.shadowLg }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold" style={{ color: th.textPrimary }}>Meldingen</h4>
                  <button className="text-xs text-blue-700 hover:text-blue-900 font-medium">Alles gelezen</button>
                </div>
                {notifications.map((n, i) => <NotifRow key={i} {...n} />)}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <div className="flex items-center gap-0.5 rounded-xl p-0.5" style={{ background: silver.surface, border: `1px solid ${silver.border}` }}>
            <button onClick={() => setDarkMode(false)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: !darkMode ? '#fff' : 'transparent',
                color: !darkMode ? '#3B82F6' : silver.text,
                boxShadow: !darkMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              {/* Sun */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
            <button onClick={() => setDarkMode(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: darkMode ? '#1E293B' : 'transparent',
                color: darkMode ? '#60A5FA' : silver.text,
                boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              }}>
              {/* Moon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            </button>
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #38BDF8)' }}>
            SK
          </div>
          </div>
        </div>
      </header>

      {/* ── HERO + QUICK ACTIONS ────────────────────────────────────── */}
      <section className="relative overflow-hidden"
        style={{ minHeight: 310, background: 'linear-gradient(140deg, #0B1739 0%, #142D63 45%, #0C3B63 100%)' }}>
        <StarField />
        <PlanetsScene />

        {/* ── Transport vehicles — scattered across the right half ── */}

        {/* Raket — moved down + left, away from red planet */}
        <div className="absolute pointer-events-none z-10 flex flex-col items-center gap-1 animate-float"
          style={{ right: '38%', top: 68, animationDuration: '7s', animationDelay: '0s' }}>
          <svg width="52" height="52" viewBox="0 0 54 54" fill="none" style={{ transform: 'rotate(-18deg)', filter: 'drop-shadow(0 0 10px rgba(196,181,253,0.7))' }}>
            <path d="M27 6 C27 6 16 19 16 33 L27 43 L38 33 C38 19 27 6 27 6Z" fill="rgba(196,181,253,0.2)" stroke="#C4B5FD" strokeWidth="1.9" strokeLinejoin="round" />
            <circle cx="27" cy="17" r="4.5" fill="rgba(196,181,253,0.25)" stroke="#C4B5FD" strokeWidth="1.4" />
            <circle cx="27" cy="17" r="2" fill="rgba(255,255,255,0.6)" />
            <path d="M16 33 L10 39 L17 37" fill="rgba(196,181,253,0.3)" stroke="#C4B5FD" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M38 33 L44 39 L37 37" fill="rgba(196,181,253,0.3)" stroke="#C4B5FD" strokeWidth="1.4" strokeLinejoin="round" />
            <ellipse cx="27" cy="44" rx="5" ry="3" fill="rgba(251,191,36,0.5)" />
            <ellipse cx="27" cy="46.5" rx="3" ry="2" fill="rgba(251,191,36,0.75)" />
            <path d="M19 27 Q27 25 35 27" stroke="rgba(196,181,253,0.5)" strokeWidth="1.1" strokeLinecap="round" fill="none" />
          </svg>
          <span style={{ fontSize: 9, color: 'rgba(196,181,253,0.75)', letterSpacing: '0.1em' }}>RAKET</span>
        </div>

        {/* Cruiseschip */}
        <div className="absolute pointer-events-none z-10 flex flex-col items-center gap-1 animate-float"
          style={{ right: '26%', bottom: 110, animationDuration: '10s', animationDelay: '2s' }}>
          <svg width="100" height="48" viewBox="0 0 100 48" fill="none" style={{ filter: 'drop-shadow(0 0 11px rgba(110,231,183,0.55))' }}>
            <path d="M8 32 Q8 18 50 14 Q92 18 92 32 L87 41 Q50 45 13 41 Z" fill="rgba(110,231,183,0.13)" stroke="#6EE7B7" strokeWidth="1.7" strokeLinejoin="round" />
            <rect x="19" y="21" width="62" height="8" rx="2.5" fill="rgba(110,231,183,0.15)" stroke="#6EE7B7" strokeWidth="1.2" />
            <rect x="27" y="13" width="46" height="8" rx="2.5" fill="rgba(110,231,183,0.12)" stroke="#6EE7B7" strokeWidth="1.1" />
            <rect x="37" y="7" width="26" height="6" rx="2" fill="rgba(110,231,183,0.18)" stroke="#6EE7B7" strokeWidth="1.1" />
            <path d="M50 7 L50 3" stroke="#6EE7B7" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="50" cy="2" r="1.4" fill="#6EE7B7" opacity="0.8" />
            {[24,33,42,51,60,69,76].map(x => (
              <circle key={x} cx={x} cy="25" r="1.8" fill="rgba(110,231,183,0.7)" stroke="#6EE7B7" strokeWidth="0.7" />
            ))}
            {[31,42,53,64,69].map(x => (
              <circle key={x} cx={x} cy="17" r="1.4" fill="rgba(110,231,183,0.5)" />
            ))}
            <ellipse cx="50" cy="41" rx="16" ry="2" fill="rgba(110,231,183,0.3)" />
          </svg>
          <span style={{ fontSize: 9, color: 'rgba(110,231,183,0.75)', letterSpacing: '0.1em' }}>CRUISESCHIP</span>
        </div>

        {/* Teleportatie portal */}
        <div className="absolute pointer-events-none z-10 flex flex-col items-center gap-1"
          style={{ right: 145, top: 115 }}>
          <svg width="62" height="62" viewBox="0 0 58 58" fill="none"
            style={{ filter: 'drop-shadow(0 0 18px rgba(103,232,249,0.95)) drop-shadow(0 0 6px rgba(103,232,249,1))' }}>
            <circle cx="29" cy="29" r="25" fill="none" stroke="#67E8F9" strokeWidth="1.3" strokeDasharray="4.5 3.5" opacity="0.6" />
            <circle cx="29" cy="29" r="18" fill="rgba(103,232,249,0.1)" stroke="#67E8F9" strokeWidth="2" />
            <circle cx="29" cy="29" r="12" fill="rgba(103,232,249,0.2)" stroke="#67E8F9" strokeWidth="2.2" />
            <circle cx="29" cy="29" r="6.5" fill="rgba(103,232,249,0.55)" stroke="#67E8F9" strokeWidth="1.8" />
            <circle cx="29" cy="29" r="3" fill="#67E8F9" />
            <line x1="29" y1="4"  x2="29" y2="13" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
            <line x1="29" y1="45" x2="29" y2="54" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
            <line x1="4"  y1="29" x2="13" y2="29" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
            <line x1="45" y1="29" x2="54" y2="29" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
            <path d="M11 11 L18 18" stroke="#67E8F9" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
            <path d="M40 40 L47 47" stroke="#67E8F9" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
            <path d="M47 11 L40 18" stroke="#67E8F9" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
            <path d="M11 47 L18 40" stroke="#67E8F9" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
          </svg>
          <span style={{ fontSize: 9, color: 'rgba(103,232,249,0.85)', letterSpacing: '0.1em' }}>TELEPORTATIE</span>
        </div>

        {/* VR Headset — far right, lower, staggered below cruiseschip */}
        <div className="absolute pointer-events-none z-10 flex flex-col items-center gap-1 animate-float"
          style={{ right: 25, bottom: 44, animationDuration: '8.5s', animationDelay: '1s' }}>
          <svg width="80" height="50" viewBox="0 0 80 50" fill="none" style={{ filter: 'drop-shadow(0 0 10px rgba(253,230,138,0.65))' }}>
            <rect x="5" y="12" width="70" height="28" rx="10" fill="rgba(253,230,138,0.12)" stroke="#FDE68A" strokeWidth="1.8" />
            <circle cx="23" cy="26" r="9.5" fill="rgba(253,230,138,0.17)" stroke="#FDE68A" strokeWidth="1.5" />
            <circle cx="57" cy="26" r="9.5" fill="rgba(253,230,138,0.17)" stroke="#FDE68A" strokeWidth="1.5" />
            <path d="M32.5 26 L47.5 26" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="23" cy="26" r="4.5" fill="rgba(253,230,138,0.32)" />
            <circle cx="57" cy="26" r="4.5" fill="rgba(253,230,138,0.32)" />
            <circle cx="21" cy="24" r="1.3" fill="#FDE68A" opacity="0.9" />
            <circle cx="25.5" cy="28" r="0.9" fill="#FDE68A" opacity="0.55" />
            <circle cx="55" cy="24" r="1.3" fill="#FDE68A" opacity="0.9" />
            <circle cx="59.5" cy="28" r="0.9" fill="#FDE68A" opacity="0.55" />
            <path d="M5 19 Q1 19 1 26 Q1 33 5 33" stroke="#FDE68A" strokeWidth="1.3" fill="none" opacity="0.55" strokeLinecap="round" />
            <path d="M75 19 Q79 19 79 26 Q79 33 75 33" stroke="#FDE68A" strokeWidth="1.3" fill="none" opacity="0.55" strokeLinecap="round" />
            <circle cx="40" cy="12" r="2.8" fill="rgba(253,230,138,0.4)" stroke="#FDE68A" strokeWidth="1" />
          </svg>
          <span style={{ fontSize: 9, color: 'rgba(253,230,138,0.8)', letterSpacing: '0.1em' }}>VR EXPERIENCE</span>
        </div>
        <div className="absolute top-0 left-1/4 w-96 h-96 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(30,64,175,0.26) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute bottom-0 right-1/3 w-72 h-72 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />

        <div className="relative z-10 px-8 pt-7 pb-7">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full text-xs"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'status-pulse 2s infinite' }} />
            SYSTEEM OPERATIONEEL · 99.98% UPTIME
          </div>

          <h1 className="text-4xl font-bold text-white mb-2"
            style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
            Welkom bij <span className="shimmer-text">VoyageVista</span>
          </h1>
          <p className="mb-5" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, maxWidth: 460, lineHeight: 1.7, letterSpacing: '0.015em' }}>
            Het centrale platform voor interplanetaire reisoperaties — vluchten, klanten en omzet op één plek.
          </p>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" style={{ maxWidth: 860 }}>
            <StatTile label="Actieve boekingen" value="2.891" sub="↑ 12% vs vorige maand" color="#DDD6FE" iconEl={<IconRocket color="#DDD6FE" />} />
            <StatTile label="Klanten vandaag" value="384" sub="28 nieuwe inschrijvingen" color="#A5B4FC" iconEl={<IconPersons color="#A5B4FC" />} />
            <StatTile label="Omzet (MTD)" value="€5.1M" sub="↑ 18% vs Q3 target" color="#7DD3FC" iconEl={<IconCoin color="#7DD3FC" />} />
            <StatTile label="Vertrekken (7d)" value="38" sub="4 bestemmingen" color="#93C5FD" iconEl={<IconCalendar color="#93C5FD" />} />
          </div>

          {/* Quick actions inside hero */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2.5"
              style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.12em' }}>Snelle Acties</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Nieuwe boeking',     bg: 'rgba(255,255,255,0.18)', border: 'rgba(255,255,255,0.35)', icon: <QIconBooking /> },
                { label: 'Nieuwe campagne',    bg: 'rgba(255,255,255,0.13)', border: 'rgba(255,255,255,0.25)', icon: <QIconCampaign /> },
                { label: 'Supportticket',      bg: 'rgba(255,255,255,0.13)', border: 'rgba(255,255,255,0.25)', icon: <QIconSupport /> },
                { label: 'Bestemming toevoegen', bg: 'rgba(255,255,255,0.13)', border: 'rgba(255,255,255,0.25)', icon: <QIconDestination /> },
                { label: 'Rapport genereren',  bg: 'rgba(255,255,255,0.13)', border: 'rgba(255,255,255,0.25)', icon: <QIconReport /> },
              ].map((a, i) => (
                <button key={i}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: a.bg, border: `1px solid ${a.border}`, color: '#fff', backdropFilter: 'blur(8px)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.26)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = a.bg}>
                  {a.icon}{a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN ───────────────────────────────────────────────────── */}
      <main className="px-6 py-6 space-y-5 max-w-screen-xl mx-auto">

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div className="lg:col-span-2 rounded-2xl p-5"
            style={{ background: th.surface, border: `1px solid ${silver.border}`, boxShadow: th.shadow, transition: 'background 0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: th.textPrimary }}>Populairste Bestemmingen</h3>
                <p className="text-xs" style={{ color: silver.text }}>Boekingen per planeet</p>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {PLANET_PERIODS.map(p => (
                  <button key={p} onClick={() => setPlanetPeriod(p)}
                    className="text-xs px-2.5 py-1 rounded-lg transition-all"
                    style={{
                      background: planetPeriod === p ? 'rgba(59,130,246,0.09)' : 'transparent',
                      color: planetPeriod === p ? '#3B82F6' : silver.text,
                      border: planetPeriod === p ? '1px solid rgba(59,130,246,0.18)' : '1px solid transparent',
                    }}>{p}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={planetData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: th.textMuted, fontSize: 11, fontFamily: 'Outfit, sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: th.textMuted, fontSize: 11, fontFamily: 'Outfit, sans-serif' }} axisLine={false} tickLine={false} width={42} />
                <Tooltip content={<ChartTooltip darkMode={darkMode} />} cursor={{ fill: 'rgba(59,130,246,0.04)' }} />
                <Bar dataKey="boekingen" name="Boekingen" radius={[6, 6, 0, 0]}>
                  {planetData.map((_, i) => (
                    <Cell key={i} fill={['#A78BFA', '#6C4DFF', '#6D28D9', '#1E40AF', '#3B82F6', '#0EA5E9'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-5"
            style={{ background: th.surface, border: `1px solid ${silver.border}`, boxShadow: th.shadow, transition: 'background 0.3s' }}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-sm font-semibold" style={{ color: th.textPrimary }}>Transportvormen</h3>
            </div>
            <p className="text-xs mb-2" style={{ color: silver.text }}>Gebruik per type</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {TRANSPORT_PERIODS.map(p => (
                <button key={p} onClick={() => setTransportPeriod(p)}
                  className="text-xs px-2 py-0.5 rounded-lg transition-all"
                  style={{
                    background: transportPeriod === p ? 'rgba(59,130,246,0.09)' : 'transparent',
                    color: transportPeriod === p ? '#3B82F6' : silver.text,
                    border: transportPeriod === p ? '1px solid rgba(59,130,246,0.18)' : '1px solid transparent',
                    fontSize: 11,
                  }}>{p}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={transportData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value" stroke="none">
                  {transportData.map((t, i) => <Cell key={i} fill={t.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltip darkMode={darkMode} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-1">
              {transportData.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                    <span className="text-xs" style={{ color: silver.textStrong }}>{t.name}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: t.color, fontFamily: 'Outfit, sans-serif' }}>{t.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Revenue */}
        <section className="rounded-2xl p-5"
          style={{ background: th.surface, border: `1px solid ${silver.border}`, boxShadow: th.shadow, transition: 'background 0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: th.textPrimary }}>Omzet Trend</h3>
              <p className="text-xs" style={{ color: silver.text }}>Omzet in miljoenen EUR</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {REVENUE_PERIODS.map(p => (
                <button key={p} onClick={() => setRevenuePeriod(p)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: revenuePeriod === p ? 'rgba(59,130,246,0.09)' : 'transparent',
                    color: revenuePeriod === p ? '#3B82F6' : silver.text,
                    border: revenuePeriod === p ? '1px solid rgba(59,130,246,0.18)' : '1px solid transparent',
                  }}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.14} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                interval={REVENUE_TICK_INTERVALS[revenuePeriod]}
                tickFormatter={value => typeof value === 'string' && value.includes(' W') ? value.split(' W')[0] : value}
                tick={{ fill: th.textMuted, fontSize: 11, fontFamily: 'Outfit, sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: th.textMuted, fontSize: 11, fontFamily: 'Outfit, sans-serif' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<ChartTooltip darkMode={darkMode} />} />
              {revenueData.map(point => (
                <ReferenceLine
                  key={point.month}
                  x={point.month}
                  stroke={darkMode ? '#94A3B8' : '#CBD5E1'}
                  strokeOpacity={darkMode ? 0.16 : 0.28}
                  strokeWidth={0.6}
                />
              ))}
              <Area type="monotone" dataKey="revenue" name="Omzet (M€)" stroke="#3B82F6" strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={{ fill: '#3B82F6', r: revenueData.length > 100 ? 1.25 : 2.5, strokeWidth: 0 }}
                activeDot={{ fill: '#3B82F6', r: 5, strokeWidth: 2, stroke: 'white' }} />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {/* Upcoming journeys */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: silver.text, fontFamily: 'Outfit, sans-serif' }}>Aankomende Reizen</p>
            <span className="text-xs" style={{ color: silver.text, fontFamily: 'Outfit, sans-serif' }}>
              Vandaag: 28 Sep 2150
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: th.surface, border: `1px solid ${silver.border}`, boxShadow: th.shadow, transition: 'background 0.3s' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${silver.border}`, background: silver.surface }}>
                  {['Vlucht ID', 'Bestemming', 'Transport', 'Vertrekdatum', 'Bezetting', 'Status'].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left font-semibold"
                      style={{ color: silver.text, letterSpacing: '0.03em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flights.map((j, i) => {
                  const dc: Record<string, string> = { Mars: '#EF4444', Venus: '#F97316', Saturnus: '#7C3AED', Pluto: '#0284C7', Jupiter: '#059669' };
                  const dotColor = dc[j.dest] || '#3B82F6';
                  const st = flightStatus(j.departure);
                  const pct = Math.round((j.seats / j.capacity) * 100);
                  return (
                    <tr key={i} style={{ borderBottom: i < flights.length - 1 ? `1px solid ${silver.border}` : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = silver.surface}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>{j.id}</td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor, boxShadow: `0 0 5px ${dotColor}80` }} />
                          <span className="font-semibold" style={{ color: th.textSecondary }}>{j.dest}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: silver.textStrong }}>{j.transport}</td>
                      <td className="px-5 py-3.5" style={{ color: silver.text, fontFamily: 'Outfit, sans-serif' }}>{j.departure}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(139,156,182,0.15)' }}>
                            <div className="h-1.5 rounded-full"
                              style={{ width: `${pct}%`, background: pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#10B981' }} />
                          </div>
                          <span style={{ color: silver.text, fontFamily: 'Outfit, sans-serif' }}>{j.seats}/{j.capacity}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="px-6 py-4 mt-2 flex items-center justify-between"
        style={{ borderTop: `1px solid ${silver.border}` }}>
        <div className="flex items-center gap-2">
          <Logo size={16} />
          <span className="text-xs" style={{ color: silver.text, fontFamily: 'Outfit, sans-serif' }}>
            VoyageVista v4.2.1 · © 2150 VoyageVista Corp.
          </span>
        </div>
        <div className="flex items-center gap-4">
          {['Privacybeleid', 'Gebruiksvoorwaarden', 'Support'].map((l, i) => (
            <a key={i} href="#" className="text-xs transition-colors" style={{ color: silver.text }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#3B82F6'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = silver.text}>{l}</a>
          ))}
        </div>
      </footer>

    </div>
  );
}
