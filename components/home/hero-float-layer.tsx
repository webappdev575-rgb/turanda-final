'use client';

import { useEffect, useMemo, useState } from 'react';

type FloatKind = 'dandelion' | 'petal' | 'speck' | 'tuft';

interface FloatSpec {
  id: number;
  kind: FloatKind;
  top: number; // % from top of the header area
  size: number; // px
  opacity: number;
  driftDur: number; // full left-to-right loop, seconds
  driftDelay: number;
  gustDur: number; // drift-hold-drift breath, seconds
  gustDelay: number;
  driftLeg: number; // vw travelled per gust
  swayDur: number;
  swayDelay: number;
  swayAmp: number; // px
  spinDur: number;
  spinDelay: number;
  spinTurns: number; // signed total rotation per gust-ish cycle
  blur: number; // px, depth cue
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSpecs(seed: number, dandelions: number, petals: number, specks: number, tufts = 0): FloatSpec[] {
  const rand = mulberry32(seed);
  const specs: FloatSpec[] = [];
  let id = 0;

  const push = (kind: FloatKind) => {
    const depth = rand(); // 0 = far, 1 = near
    const size =
      kind === 'dandelion'
        ? 26 + depth * 30
        : kind === 'tuft'
          ? 20 + depth * 22
          : kind === 'petal'
            ? 10 + depth * 12
            : 3 + depth * 5;
    specs.push({
      id: id++,
      kind,
      top: 4 + rand() * 88,
      size,
      opacity: (0.16 + depth * 0.4) * (kind === 'speck' ? 0.9 : 1),
      driftDur: 40 + rand() * 34,
      driftDelay: -rand() * 60,
      gustDur: 8.5 + rand() * 5.5,
      gustDelay: -rand() * 14,
      driftLeg: (3.5 + rand() * 4.5) * (rand() > 0.75 ? -1 : 1),
      swayDur: 4.5 + rand() * 4,
      swayDelay: -rand() * 8,
      swayAmp: kind === 'petal' ? 9 + rand() * 8 : 5 + rand() * 7,
      spinDur: kind === 'petal' ? 2.6 + rand() * 3 : kind === 'tuft' ? 5 + rand() * 5 : 7 + rand() * 7,
      spinDelay: -rand() * 9,
      spinTurns:
        kind === 'petal'
          ? (rand() > 0.5 ? 1 : -1) * (0.6 + rand())
          : kind === 'tuft'
            ? (rand() - 0.5) * 0.5
            : (rand() - 0.5) * 0.3,
      blur: kind === 'speck' ? 1 + (1 - depth) * 2.5 : (1 - depth) * 1.6,
    });
  };

  for (let i = 0; i < dandelions; i++) push('dandelion');
  for (let i = 0; i < tufts; i++) push('tuft');
  for (let i = 0; i < petals; i++) push('petal');
  for (let i = 0; i < specks; i++) push('speck');

  return specs;
}

function Dandelion({ tint }: { tint: string }) {
  // Round fluffy head: thin filaments radiating from a tiny core, each
  // tipped with a small puff dot, like a real dandelion clock.
  const filaments = useMemo(() => {
    const rand = mulberry32(42);
    return Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2 + (rand() - 0.5) * 0.22;
      const len = 11 + rand() * 3.5;
      return { angle, len };
    });
  }, []);

  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <g stroke={tint} strokeWidth="0.7">
        {filaments.map(({ angle, len }, i) => {
          const x1 = 23 + Math.cos(angle) * 3.2;
          const y1 = 23 + Math.sin(angle) * 3.2;
          const x2 = 23 + Math.cos(angle) * len;
          const y2 = 23 + Math.sin(angle) * len;
          const tipX = 23 + Math.cos(angle) * (len + 2.6);
          const tipY = 23 + Math.sin(angle) * (len + 2.6);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              <circle cx={tipX} cy={tipY} r="1.6" fill={tint} stroke="none" opacity="0.85" />
            </g>
          );
        })}
      </g>
      <circle cx="23" cy="23" r="1.6" fill={tint} />
    </svg>
  );
}

function Petal({ tint }: { tint: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5C16.5 6.5 19 10.5 19 14.2C19 18.4 15.9 21.5 12 21.5C8.1 21.5 5 18.4 5 14.2C5 10.5 7.5 6.5 12 2.5Z"
        fill={tint}
      />
      <path d="M12 5.5V20" stroke="#0b1611" strokeOpacity="0.25" strokeWidth="0.8" />
    </svg>
  );
}

function DandelionTuft({ tint }: { tint: string }) {
  // A detached seed-head: off-centre puff of parachute filaments riding on a
  // thin curved stem, like a tuft torn loose from the dandelion clock.
  const seeds = useMemo(() => {
    const rand = mulberry32(7);
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + (rand() - 0.5) * 0.35;
      const len = 6.5 + rand() * 3.2;
      return { angle, len };
    });
  }, []);

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      {/* stem curving down-left from the puff's centre */}
      <path
        d="M25 18 C 23 26, 18 32, 9 40"
        stroke={tint}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <g stroke={tint} strokeWidth="0.75">
        {seeds.map(({ angle, len }, i) => {
          const cx = 27;
          const cy = 15;
          const x1 = cx + Math.cos(angle) * 1.6;
          const y1 = cy + Math.sin(angle) * 1.6;
          const x2 = cx + Math.cos(angle) * len;
          const y2 = cy + Math.sin(angle) * len;
          const tipX = cx + Math.cos(angle) * (len + 3.2);
          const tipY = cy + Math.sin(angle) * (len + 3.2);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              <path
                d={`M ${tipX} ${tipY} q 1.4 -1.4 2.6 -0.6 q -0.6 1.6 -2.6 0.6`}
                fill={tint}
                stroke="none"
                opacity="0.9"
              />
            </g>
          );
        })}
      </g>
      <circle cx="27" cy="15" r="1.5" fill={tint} />
    </svg>
  );
}

export function HeroFloatLayer() {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 640) setIsSmallScreen(true);
  }, []);

  const specs = useMemo(
    () => (isSmallScreen ? buildSpecs(7, 5, 7, 9, 6) : buildSpecs(7, 8, 11, 14, 9)),
    [isSmallScreen]
  );

  return (
    <div className="hero-float-layer" aria-hidden="true">
      {specs.map((spec) => {
        const tint =
          spec.kind === 'dandelion'
            ? '#e9f5d3'
            : spec.kind === 'tuft'
              ? '#b9c4d4'
              : spec.kind === 'petal'
                ? '#cfe3b0'
                : '#f4f0da';
        return (
          <div
            key={spec.id}
            className="hero-float-item"
            style={
              {
                '--top': `${spec.top}%`,
                '--drift-dur': `${spec.driftDur}s`,
                '--drift-delay': `${spec.driftDelay}s`,
              } as React.CSSProperties
            }
          >
            <div
              className="hero-float-bob"
              style={
                {
                  '--gust-dur': `${spec.gustDur}s`,
                  '--gust-delay': `${spec.gustDelay}s`,
                  '--drift-leg': `${spec.driftLeg}vw`,
                } as React.CSSProperties
              }
            >
              <div
                className="hero-float-sway"
                style={
                  {
                    '--sway-dur': `${spec.swayDur}s`,
                    '--sway-delay': `${spec.swayDelay}s`,
                    '--sway-amp': `${spec.swayAmp}px`,
                  } as React.CSSProperties
                }
              >
                <div
                  className="hero-float-spin"
                  style={
                    {
                      '--spin-dur': `${spec.spinDur}s`,
                      '--spin-delay': `${spec.spinDelay}s`,
                      '--spin-turns': `${spec.spinTurns}turn`,
                    } as React.CSSProperties
                  }
                >
                  <div
                    style={{
                      width: spec.size,
                      height: spec.size,
                      opacity: spec.opacity,
                      filter: spec.blur > 0.3 ? `blur(${spec.blur.toFixed(1)}px)` : undefined,
                    }}
                  >
                    {spec.kind === 'dandelion' ? (
                      <span className="block h-full w-full [&>svg]:h-full [&>svg]:w-full">
                        <Dandelion tint={tint} />
                      </span>
                    ) : spec.kind === 'tuft' ? (
                      <span className="block h-full w-full [&>svg]:h-full [&>svg]:w-full">
                        <DandelionTuft tint={tint} />
                      </span>
                    ) : spec.kind === 'petal' ? (
                      <span className="block h-full w-full [&>svg]:h-full [&>svg]:w-full">
                        <Petal tint={tint} />
                      </span>
                    ) : (
                      <span
                        className="block h-full w-full rounded-full"
                        style={{ background: 'radial-gradient(circle, #fff8e0 0%, #f4f0da66 55%, transparent 75%)' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
