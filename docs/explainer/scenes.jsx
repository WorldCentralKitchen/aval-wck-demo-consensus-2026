// scenes.jsx — Aval explainer animation (180s)
// Visual system: WCK brand. Warm paper bg, Wild Blueberry primary, Barlow type.

const {
  Easing, interpolate, animate, clamp,
  Sprite, useSprite, useTime, useTimeline,
} = window;

// ── Brand tokens (mirrored from design-system/colors_and_type.css) ──────────
const C = {
  ink:     '#131313',
  graphite:'#3a3a3a',
  slate:   '#5f6469',
  pebble:  '#8a8f93',
  cloud:   '#d7dadd',
  paper:   '#f4f2ee',
  white:   '#ffffff',
  divider: 'rgba(19,19,19,0.08)',

  blue:    '#1565ad', // primary — Wild Blueberry
  sky:     '#26a9e1',
  seafoam: '#d0ecf2',
  pea:     '#8cc540',
  corn:    '#fab818',
  papaya:  '#f68b22',
  saffron: '#e86027',
  fig:     '#9e2064',
};

const FONT = "'Barlow','Helvetica Neue',Arial,sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// ── Reusable bits ───────────────────────────────────────────────────────────

// Eyebrow tag — small uppercase callout above titles
function Eyebrow({ text, color = C.blue, x, y }) {
  const { localTime, duration } = useSprite();
  const op = clamp(localTime / 0.4, 0, 1) * (1 - clamp((localTime - (duration - 0.4)) / 0.4, 0, 1));
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontFamily: FONT, fontWeight: 700, fontSize: 18,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color, opacity: op,
    }}>{text}</div>
  );
}

// A bold sentence that types in word-by-word
function WordReveal({ words, x, y, size = 80, weight = 800, color = C.ink, lineHeight = 1.05, maxWidth = 1500, stagger = 0.08, delay = 0 }) {
  const { localTime, duration } = useSprite();
  return (
    <div style={{
      position: 'absolute', left: x, top: y, maxWidth,
      fontFamily: FONT, fontWeight: weight, fontSize: size,
      lineHeight, letterSpacing: '-0.02em', color,
      display: 'flex', flexWrap: 'wrap', gap: '0 0.32em',
    }}>
      {words.map((w, i) => {
        const start = delay + i * stagger;
        const t = clamp((localTime - start) / 0.45, 0, 1);
        const eased = Easing.easeOutCubic(t);
        const exit = clamp((localTime - (duration - 0.4)) / 0.4, 0, 1);
        return (
          <span key={i} style={{
            display: 'inline-block',
            opacity: eased * (1 - exit),
            transform: `translateY(${(1 - eased) * 24}px)`,
          }}>{w}</span>
        );
      })}
    </div>
  );
}

// A horizontally-drawn underline
function Underline({ x, y, w, color = C.saffron, thickness = 8, delay = 0, dur = 0.6 }) {
  const { localTime } = useSprite();
  const t = clamp((localTime - delay) / dur, 0, 1);
  const eased = Easing.easeOutCubic(t);
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: w * eased, height: thickness, background: color,
      borderRadius: thickness,
    }}/>
  );
}

// Small "monitor" frame to mock app screens
function Monitor({ x, y, w, h, label, children, accent = C.blue }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      background: C.white, borderRadius: 14,
      boxShadow: '0 24px 60px rgba(19,19,19,0.18), 0 4px 12px rgba(19,19,19,0.08)',
      overflow: 'hidden', border: `1px solid ${C.divider}`,
    }}>
      <div style={{
        height: 32, display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 14px', background: '#f7f6f2',
        borderBottom: `1px solid ${C.divider}`,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 10, background: '#e96a5b' }}/>
        <span style={{ width: 10, height: 10, borderRadius: 10, background: '#f3bd4f' }}/>
        <span style={{ width: 10, height: 10, borderRadius: 10, background: '#7ac96f' }}/>
        <div style={{ flex: 1 }}/>
        <div style={{
          fontFamily: MONO, fontSize: 11, color: C.slate,
          letterSpacing: '0.04em',
        }}>{label}</div>
      </div>
      <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 32px)' }}>{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 1 — Title (0–12s)
// ────────────────────────────────────────────────────────────────────────────
function SceneTitle() {
  return (
    <Sprite start={0} end={12}>
      {({ localTime }) => {
        // Background warm tone
        const blueRise = Easing.easeOutCubic(clamp(localTime / 1.2, 0, 1));
        return (
          <>
            {/* Big "A" mark — geometric */}
            <div style={{
              position: 'absolute', left: 240, top: 220,
              width: 380, height: 480,
              opacity: blueRise,
              transform: `translateY(${(1 - blueRise) * 30}px)`,
            }}>
              <svg viewBox="0 0 380 480" width="380" height="480">
                <defs>
                  <clipPath id="aclip">
                    <path d="M190 30 L370 450 L290 450 L260 370 L120 370 L90 450 L10 450 Z M150 290 L230 290 L190 180 Z"/>
                  </clipPath>
                </defs>
                <rect x="0" y="0" width="380" height="480" fill={C.blue} clipPath="url(#aclip)"/>
                {/* horizontal scan stripes */}
                <g clipPath="url(#aclip)" opacity="0.18">
                  {[60,140,220,300,380].map((y, i) => (
                    <rect key={i} x="0" y={y} width="380" height="2" fill={C.white}/>
                  ))}
                </g>
              </svg>
            </div>

            {/* Wordmark */}
            <Sprite start={1.0} end={11.6}>
              <WordReveal
                words={['Aval']}
                x={680} y={300}
                size={260} weight={800} color={C.ink}
                stagger={0}
              />
            </Sprite>

            <Sprite start={2.0} end={11.6}>
              <Eyebrow text="An explainer · 3 min" color={C.saffron} x={684} y={262}/>
            </Sprite>

            <Sprite start={3.2} end={11.6}>
              <WordReveal
                words={['Identity,', 'credentials,', 'and', 'agent-native']}
                x={684} y={576}
                size={42} weight={500} color={C.graphite}
                stagger={0.06} maxWidth={900}
              />
            </Sprite>
            <Sprite start={4.0} end={11.6}>
              <WordReveal
                words={['infrastructure', 'for', 'humanitarian', 'response.']}
                x={684} y={628}
                size={42} weight={500} color={C.graphite}
                stagger={0.06} maxWidth={900}
              />
            </Sprite>

            <Sprite start={5.2} end={11.6}>
              <Underline x={684} y={696} w={420} color={C.saffron} thickness={6} dur={0.7}/>
            </Sprite>

            <Sprite start={6.0} end={11.6}>
              <div style={{
                position: 'absolute', left: 684, top: 720,
                fontFamily: FONT, fontSize: 22, fontWeight: 600, color: C.blue,
                letterSpacing: '0.04em',
              }}>
                World Central Kitchen × Consensus 2026
              </div>
            </Sprite>
          </>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 2 — The setting (12–28s)
// ────────────────────────────────────────────────────────────────────────────
function SceneSetting() {
  return (
    <Sprite start={12} end={28}>
      {({ localTime }) => (
        <>
          <Sprite start={12.1} end={27.8}>
            <Eyebrow text="The setting" x={120} y={120}/>
          </Sprite>
          <Sprite start={12.4} end={27.8}>
            <WordReveal
              words={['When', 'a', 'disaster', 'hits,']}
              x={120} y={170} size={84} stagger={0.07}
            />
          </Sprite>
          <Sprite start={13.5} end={27.8}>
            <WordReveal
              words={['WCK', 'pays', 'local', 'vendors']}
              x={120} y={278} size={84} stagger={0.07} color={C.blue} maxWidth={1700}
            />
          </Sprite>
          <Sprite start={15.0} end={27.8}>
            <WordReveal
              words={['—', 'restaurants,', 'food', 'shops,', 'water', 'suppliers', '—']}
              x={120} y={400} size={48} stagger={0.06} color={C.graphite} weight={500} maxWidth={1700}
            />
          </Sprite>
          <Sprite start={16.5} end={27.8}>
            <WordReveal
              words={['for', 'meals', 'served', 'to', 'affected', 'communities.']}
              x={120} y={464} size={48} stagger={0.06} color={C.graphite} weight={500} maxWidth={1700}
            />
          </Sprite>

          {/* A small map of meal flow on the right */}
          <Sprite start={17.8} end={27.8}>
            {({ localTime: lt, duration: d }) => {
              // Three nodes: WCK (treasury) → vendors → community
              const fade = clamp(lt / 0.6, 0, 1) * (1 - clamp((lt - (d - 0.4)) / 0.4, 0, 1));
              return (
                <div style={{
                  position: 'absolute', left: 120, top: 580, width: 1680, height: 360,
                  opacity: fade,
                }}>
                  {/* WCK node */}
                  <FlowNode x={40} y={120} label="WCK" sublabel="treasury · USDC" color={C.blue} size={120}/>
                  {/* Vendor nodes */}
                  {[
                    { x: 760, y: 20, label: 'Carlos Bakery', sub: 'meals · $6.67' },
                    { x: 760, y: 130, label: 'Aqua Pura', sub: 'water · $1.00' },
                    { x: 760, y: 240, label: 'Casa Verde', sub: 'snacks · $2.00' },
                  ].map((v, i) => (
                    <Sprite key={i} start={18.4 + i * 0.3} end={27.8}>
                      {({ localTime: lt2 }) => {
                        const t = clamp(lt2 / 0.5, 0, 1);
                        return (
                          <div style={{ opacity: Easing.easeOutCubic(t), transform: `translateX(${(1 - t) * -20}px)` }}>
                            <FlowNode x={v.x} y={v.y} label={v.label} sublabel={v.sub} color={C.papaya} size={84}/>
                            {/* connector */}
                            <Connector x1={170} y1={172} x2={v.x - 4} y2={v.y + 42} color={C.blue} dash/>
                          </div>
                        );
                      }}
                    </Sprite>
                  ))}
                  {/* Community */}
                  <Sprite start={19.8} end={27.8}>
                    {({ localTime: lt2 }) => {
                      const t = clamp(lt2 / 0.5, 0, 1);
                      return (
                        <div style={{ opacity: Easing.easeOutCubic(t) }}>
                          <FlowNode x={1480} y={120} label="Community" sublabel="recipients" color={C.pea} size={120}/>
                          {[20, 130, 240].map((y, i) => (
                            <Connector key={i} x1={904} y1={y + 42} x2={1480} y2={172} color={C.papaya} dash/>
                          ))}
                        </div>
                      );
                    }}
                  </Sprite>
                </div>
              );
            }}
          </Sprite>
        </>
      )}
    </Sprite>
  );
}

function FlowNode({ x, y, label, sublabel, color, size = 100 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 260, height: size + 4,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: size, height: size, borderRadius: size,
        background: color, color: C.white,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, fontSize: size * 0.42, fontWeight: 800,
        boxShadow: `0 8px 22px ${color}55`,
      }}>{label[0]}</div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.ink }}>{label}</div>
        <div style={{ fontFamily: MONO, fontSize: 13, color: C.slate, marginTop: 2 }}>{sublabel}</div>
      </div>
    </div>
  );
}

function Connector({ x1, y1, x2, y2, color, dash = false }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return (
    <div style={{
      position: 'absolute', left: x1, top: y1,
      width: len, height: 2,
      transform: `rotate(${angle}deg)`,
      transformOrigin: '0 50%',
      background: dash ? `repeating-linear-gradient(90deg, ${color} 0 8px, transparent 8px 14px)` : color,
      opacity: 0.7,
    }}/>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 3 — Three friction points (28–48s)
// ────────────────────────────────────────────────────────────────────────────
function SceneFriction() {
  const items = [
    {
      eyebrow: 'Friction 1',
      title: 'Vendors are unbanked',
      body: 'Onboarding requires business licenses, tax IDs, food safety certs, banking. A multi-day human review bottleneck — and an enormous PII custody burden for WCK.',
      color: C.saffron,
      icon: '📄',
    },
    {
      eyebrow: 'Friction 2',
      title: 'Recipients need uniqueness, not identity',
      body: 'One person, one meal — without WCK ever needing to know their name, age, or ID number.',
      color: C.papaya,
      icon: '👤',
    },
    {
      eyebrow: 'Friction 3',
      title: 'Responder credentials live in inboxes',
      body: 'Skill certifications earned at one disaster are invisible to peer NGOs at the next.',
      color: C.fig,
      icon: '🪪',
    },
  ];
  return (
    <Sprite start={28} end={48}>
      <Sprite start={28.1} end={47.8}>
        <Eyebrow text="Three friction points" x={120} y={120}/>
      </Sprite>
      <Sprite start={28.4} end={47.8}>
        <WordReveal
          words={['Every', 'activation', 'hits', 'the', 'same', 'walls.']}
          x={120} y={172} size={72} stagger={0.06}
        />
      </Sprite>

      {items.map((it, i) => (
        <Sprite key={i} start={29.5 + i * 1.4} end={47.8}>
          {({ localTime: lt, duration: d }) => {
            const t = clamp(lt / 0.55, 0, 1);
            const exit = clamp((lt - (d - 0.4)) / 0.4, 0, 1);
            const op = Easing.easeOutCubic(t) * (1 - exit);
            return (
              <div style={{
                position: 'absolute', left: 120 + i * 560, top: 320,
                width: 520, height: 480,
                background: C.white, borderRadius: 14,
                border: `1px solid ${C.divider}`,
                padding: '36px 36px 32px',
                boxShadow: '0 18px 40px rgba(19,19,19,0.08)',
                opacity: op,
                transform: `translateY(${(1 - Easing.easeOutCubic(t)) * 24}px)`,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: it.color, color: C.white,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, marginBottom: 20,
                }}>{it.icon}</div>
                <div style={{
                  fontFamily: FONT, fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: it.color, marginBottom: 12,
                }}>{it.eyebrow}</div>
                <div style={{
                  fontFamily: FONT, fontSize: 32, fontWeight: 700,
                  color: C.ink, lineHeight: 1.15, marginBottom: 18,
                  letterSpacing: '-0.01em',
                }}>{it.title}</div>
                <div style={{
                  fontFamily: FONT, fontSize: 19, fontWeight: 400,
                  color: C.graphite, lineHeight: 1.5,
                }}>{it.body}</div>
              </div>
            );
          }}
        </Sprite>
      ))}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 4 — Aval ships in 36 hours (48–62s)
// ────────────────────────────────────────────────────────────────────────────
function SceneShip() {
  return (
    <Sprite start={48} end={62}>
      <Sprite start={48.1} end={61.7}>
        <Eyebrow text="What Aval ships" x={120} y={140}/>
      </Sprite>
      <Sprite start={48.4} end={61.7}>
        <WordReveal
          words={['Five', 'moving', 'parts.']}
          x={120} y={200} size={120} stagger={0.08}
        />
      </Sprite>
      <Sprite start={49.4} end={61.7}>
        <WordReveal
          words={['Built', 'in', '36', 'hours.']}
          x={120} y={336} size={120} stagger={0.08} color={C.blue}
        />
      </Sprite>

      {/* Five tiles */}
      {[
        { label: 'Agentic vendor onboarding', sub: 'Bedrock + Textract', color: C.blue },
        { label: 'On-chain attestations', sub: 'EAS · Base Sepolia', color: C.sky },
        { label: 'Anonymous recipient matching', sub: 'Rekognition templates', color: C.pea },
        { label: 'USDC settlement', sub: 'CDP SDK', color: C.papaya },
        { label: 'x402 paywalled lookup', sub: '$0.01 USDC per call', color: C.fig },
      ].map((it, i) => (
        <Sprite key={i} start={50.5 + i * 0.45} end={61.7}>
          {({ localTime: lt, duration: d }) => {
            const t = clamp(lt / 0.5, 0, 1);
            const exit = clamp((lt - (d - 0.4)) / 0.4, 0, 1);
            const eased = Easing.easeOutBack(t);
            return (
              <div style={{
                position: 'absolute', left: 120 + i * 332, top: 540,
                width: 312, height: 220,
                background: C.white, borderRadius: 12,
                border: `1px solid ${C.divider}`,
                padding: 24,
                boxShadow: '0 12px 28px rgba(19,19,19,0.08)',
                opacity: clamp(t, 0, 1) * (1 - exit),
                transform: `translateY(${(1 - clamp(t,0,1)) * 28}px) scale(${0.92 + 0.08 * eased})`,
                transformOrigin: 'center bottom',
              }}>
                <div style={{
                  fontFamily: FONT, fontSize: 56, fontWeight: 900,
                  color: it.color, lineHeight: 1, marginBottom: 18,
                }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{
                  fontFamily: FONT, fontSize: 22, fontWeight: 700,
                  color: C.ink, lineHeight: 1.2, marginBottom: 8,
                }}>{it.label}</div>
                <div style={{
                  fontFamily: MONO, fontSize: 13, color: C.slate,
                  letterSpacing: '0.02em',
                }}>{it.sub}</div>
              </div>
            );
          }}
        </Sprite>
      ))}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 5 — Agentic onboarding (62–80s)
// ────────────────────────────────────────────────────────────────────────────
function SceneAgent() {
  return (
    <Sprite start={62} end={80}>
      <Sprite start={62.1} end={79.7}>
        <Eyebrow text="01 · Agentic vendor onboarding"/>
      </Sprite>
      <Sprite start={62.4} end={79.7}>
        <WordReveal
          words={['A', 'human', 'still', 'decides.']}
          x={120} y={170} size={80} stagger={0.06}
        />
      </Sprite>
      <Sprite start={63.6} end={79.7}>
        <WordReveal
          words={['The', 'agent', 'just', 'reads', 'first.']}
          x={120} y={266} size={80} stagger={0.06} color={C.blue}
        />
      </Sprite>

      {/* Documents stack on left */}
      <Sprite start={64.8} end={79.7}>
        {({ localTime: lt }) => {
          const docs = ['Business license', 'Tax ID', 'Food safety cert', 'Bank statement'];
          return (
            <div style={{ position: 'absolute', left: 120, top: 420, width: 420 }}>
              <div style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 14,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: C.slate, marginBottom: 16,
              }}>Submitted documents</div>
              {docs.map((d, i) => {
                const t = clamp((lt - i * 0.2) / 0.4, 0, 1);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 18px', marginBottom: 10,
                    background: C.white, borderRadius: 10,
                    border: `1px solid ${C.divider}`,
                    opacity: Easing.easeOutCubic(t),
                    transform: `translateX(${(1 - t) * -16}px)`,
                  }}>
                    <div style={{
                      width: 30, height: 36, borderRadius: 3,
                      background: C.cloud, position: 'relative',
                    }}>
                      <div style={{ position: 'absolute', top: 8, left: 6, right: 6, height: 2, background: C.pebble }}/>
                      <div style={{ position: 'absolute', top: 14, left: 6, right: 10, height: 2, background: C.pebble }}/>
                      <div style={{ position: 'absolute', top: 20, left: 6, right: 8, height: 2, background: C.pebble }}/>
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 500, color: C.ink }}>{d}</div>
                  </div>
                );
              })}
            </div>
          );
        }}
      </Sprite>

      {/* Bedrock agent in middle */}
      <Sprite start={66.5} end={79.7}>
        {({ localTime: lt }) => {
          const fade = clamp(lt / 0.5, 0, 1);
          return (
            <div style={{
              position: 'absolute', left: 700, top: 470, width: 280,
              opacity: fade,
            }}>
              <div style={{
                width: 280, height: 280, borderRadius: 28,
                background: `linear-gradient(135deg, ${C.blue}, ${C.sky})`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: C.white, gap: 12,
                boxShadow: `0 20px 50px ${C.blue}66`,
              }}>
                <div style={{
                  fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em',
                  textTransform: 'uppercase', opacity: 0.85,
                }}>amazon bedrock</div>
                <div style={{
                  fontFamily: FONT, fontSize: 36, fontWeight: 800,
                  letterSpacing: '-0.01em',
                }}>Reads ·<br/>Cross-checks ·<br/>Recommends</div>
              </div>
              {/* arrow into doc stack */}
              <div style={{
                position: 'absolute', left: -160, top: 130,
                width: 140, height: 2, background: C.blue,
              }}/>
              <div style={{
                position: 'absolute', left: -34, top: 124,
                width: 0, height: 0,
                borderLeft: `12px solid ${C.blue}`,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                transform: 'rotate(180deg) translate(-12px, 4px)',
              }}/>
            </div>
          );
        }}
      </Sprite>

      {/* KYC review packet on right */}
      <Sprite start={70.5} end={79.7}>
        {({ localTime: lt }) => {
          const t = clamp(lt / 0.6, 0, 1);
          return (
            <div style={{
              position: 'absolute', left: 1080, top: 380,
              width: 720, height: 480,
              opacity: Easing.easeOutCubic(t),
              transform: `translateX(${(1 - t) * 40}px)`,
            }}>
              <Monitor x={0} y={0} w={720} h={480} label="KYC Console — review packet">
                <div style={{ padding: 26 }}>
                  <div style={{
                    fontFamily: FONT, fontSize: 13, fontWeight: 700,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: C.blue, marginBottom: 8,
                  }}>Vendor 0xFa7C…7A58</div>
                  <div style={{
                    fontFamily: FONT, fontSize: 28, fontWeight: 700,
                    color: C.ink, marginBottom: 20,
                  }}>Carlos Bakery — Region 04</div>

                  {[
                    ['License', 'Verified · expires 2027'],
                    ['Tax ID', 'Matches submitted name'],
                    ['Food safety', 'Certified Class A'],
                    ['Bank match', 'Owner = applicant'],
                  ].map(([k, v], i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '12px 0', borderTop: `1px solid ${C.divider}`,
                      fontFamily: FONT,
                    }}>
                      <span style={{ color: C.slate, fontSize: 14, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</span>
                      <span style={{ color: C.ink, fontSize: 16, fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}

                  <Sprite start={74.5} end={79.7}>
                    {({ localTime: lt2 }) => {
                      const pulse = 1 + 0.04 * Math.sin(lt2 * 5);
                      return (
                        <div style={{
                          marginTop: 24, padding: '16px 24px',
                          background: C.pea, color: C.white,
                          fontFamily: FONT, fontSize: 18, fontWeight: 700,
                          borderRadius: 8, display: 'inline-block',
                          transform: `scale(${pulse})`,
                          boxShadow: `0 12px 24px ${C.pea}55`,
                        }}>
                          ✓ Approve & Issue Attestation
                        </div>
                      );
                    }}
                  </Sprite>
                </div>
              </Monitor>
            </div>
          );
        }}
      </Sprite>
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 6 — On-chain attestation (80–98s)
// ────────────────────────────────────────────────────────────────────────────
function SceneChain() {
  return (
    <Sprite start={80} end={98}>
      <Sprite start={80.1} end={97.7}>
        <Eyebrow text="02 · On-chain attestation" color={C.sky}/>
      </Sprite>
      <Sprite start={80.4} end={97.7}>
        <WordReveal
          words={['WCK', 'keeps', 'a', 'pointer', '—']}
          x={120} y={170} size={80} stagger={0.07}
        />
      </Sprite>
      <Sprite start={81.5} end={97.7}>
        <WordReveal
          words={['not', 'the', 'documents.']}
          x={120} y={266} size={80} stagger={0.07} color={C.sky}
        />
      </Sprite>

      {/* Pipeline: Approve → CDP wallet → EAS schema → attestation UID */}
      <Sprite start={83} end={97.7}>
        {() => {
          const stages = [
            { title: 'KYC Approve', sub: 'POST /attest/issue', color: C.blue },
            { title: 'CDP wallet', sub: 'MPC · base-sepolia', color: C.sky, addr: '0xFa7C…7A58' },
            { title: 'EAS schema', sub: 'WCK-Vendor', color: C.papaya },
            { title: 'Attestation UID', sub: '0x4a1c…f88e', color: C.pea },
          ];
          return (
            <div style={{ position: 'absolute', left: 120, top: 420, width: 1680 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 24,
              }}>
                {stages.map((s, i) => (
                  <Sprite key={i} start={83 + i * 0.7} end={97.7}>
                    {({ localTime: lt }) => {
                      const t = clamp(lt / 0.55, 0, 1);
                      return (
                        <div style={{
                          background: C.white, borderRadius: 14,
                          padding: 28, border: `1px solid ${C.divider}`,
                          boxShadow: '0 12px 28px rgba(19,19,19,0.08)',
                          opacity: Easing.easeOutCubic(t),
                          transform: `translateY(${(1 - t) * 30}px)`,
                          minHeight: 180,
                        }}>
                          <div style={{
                            fontFamily: MONO, fontSize: 12,
                            letterSpacing: '0.16em', textTransform: 'uppercase',
                            color: s.color, marginBottom: 12,
                          }}>Step {i + 1}</div>
                          <div style={{
                            fontFamily: FONT, fontSize: 30, fontWeight: 700,
                            color: C.ink, lineHeight: 1.1, marginBottom: 10,
                            letterSpacing: '-0.01em',
                          }}>{s.title}</div>
                          <div style={{
                            fontFamily: MONO, fontSize: 14, color: C.slate,
                          }}>{s.sub}</div>
                          {s.addr && (
                            <div style={{
                              marginTop: 14, padding: '8px 12px',
                              fontFamily: MONO, fontSize: 13,
                              background: C.seafoam, borderRadius: 6,
                              color: C.blue, fontWeight: 700,
                              display: 'inline-block',
                            }}>{s.addr}</div>
                          )}
                        </div>
                      );
                    }}
                  </Sprite>
                ))}
              </div>

              {/* Connector arrows */}
              {[0, 1, 2].map(i => (
                <Sprite key={`a${i}`} start={83.7 + i * 0.7} end={97.7}>
                  {({ localTime: lt }) => {
                    const t = clamp(lt / 0.4, 0, 1);
                    return (
                      <div style={{
                        position: 'absolute',
                        left: 384 + i * 414, top: 90,
                        fontFamily: FONT, fontSize: 28, color: C.papaya,
                        opacity: t, fontWeight: 800,
                      }}>→</div>
                    );
                  }}
                </Sprite>
              ))}
            </div>
          );
        }}
      </Sprite>

      {/* Tx receipt */}
      <Sprite start={89} end={97.7}>
        {({ localTime: lt }) => {
          const t = clamp(lt / 0.6, 0, 1);
          return (
            <div style={{
              position: 'absolute', left: 120, top: 700, width: 1680,
              background: C.ink, color: C.white, borderRadius: 12,
              padding: '20px 28px',
              opacity: Easing.easeOutCubic(t),
              transform: `translateY(${(1 - t) * 16}px)`,
              fontFamily: MONO, fontSize: 16,
              display: 'flex', alignItems: 'center', gap: 24,
              boxShadow: '0 16px 36px rgba(19,19,19,0.25)',
            }}>
              <span style={{ color: C.pea, fontWeight: 700 }}>✓ tx confirmed</span>
              <span style={{ color: C.cloud }}>schema:</span>
              <span style={{ color: C.corn }}>WCK-Vendor</span>
              <span style={{ color: C.cloud }}>recipient:</span>
              <span style={{ color: C.sky }}>0xFa7C…7A58</span>
              <span style={{ color: C.cloud }}>revocable:</span>
              <span style={{ color: C.pea }}>true</span>
              <div style={{ flex: 1 }}/>
              <span style={{ color: C.pebble }}>base-sepolia.easscan.org</span>
            </div>
          );
        }}
      </Sprite>
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 7 — Recipient privacy (98–116s)
// ────────────────────────────────────────────────────────────────────────────
function ScenePrivacy() {
  return (
    <Sprite start={98} end={116}>
      <Sprite start={98.1} end={115.7}>
        <Eyebrow text="03 · Anonymous recipient matching" color={C.pea}/>
      </Sprite>
      <Sprite start={98.4} end={115.7}>
        <WordReveal
          words={['One', 'person.', 'One', 'meal.']}
          x={120} y={170} size={88} stagger={0.08}
        />
      </Sprite>
      <Sprite start={99.6} end={115.7}>
        <WordReveal
          words={['No', 'name.', 'No', 'ID.']}
          x={120} y={278} size={88} stagger={0.08} color={C.pea}
        />
      </Sprite>

      {/* Face → template → match */}
      <Sprite start={101} end={115.7}>
        {({ localTime: lt }) => (
          <div style={{ position: 'absolute', left: 120, top: 470, width: 1680, height: 380 }}>
            {/* Step 1 — face capture */}
            <Sprite start={101} end={115.7}>
              {({ localTime: lt2 }) => {
                const t = clamp(lt2 / 0.6, 0, 1);
                return (
                  <div style={{
                    position: 'absolute', left: 0, top: 40,
                    opacity: Easing.easeOutCubic(t),
                    transform: `translateY(${(1 - t) * 20}px)`,
                  }}>
                    <div style={{
                      width: 280, height: 280, borderRadius: 20,
                      background: 'repeating-linear-gradient(135deg, #e9e6df 0 10px, #dcd8cf 10px 20px)',
                      position: 'relative', overflow: 'hidden',
                      border: `2px solid ${C.divider}`,
                    }}>
                      {/* face placeholder shape */}
                      <div style={{
                        position: 'absolute', left: 70, top: 60,
                        width: 140, height: 170, borderRadius: '50%',
                        background: C.cloud,
                      }}/>
                      {/* scan line */}
                      <div style={{
                        position: 'absolute', left: 0, right: 0,
                        height: 4, top: ((lt2 * 60) % 280),
                        background: `linear-gradient(90deg, transparent, ${C.pea}, transparent)`,
                      }}/>
                      <div style={{
                        position: 'absolute', left: 12, top: 12,
                        fontFamily: MONO, fontSize: 11, color: C.slate,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>field app · capture</div>
                    </div>
                    <div style={{
                      fontFamily: FONT, fontSize: 22, fontWeight: 700,
                      color: C.ink, marginTop: 16, textAlign: 'center', width: 280,
                    }}>Face captured</div>
                  </div>
                );
              }}
            </Sprite>

            {/* arrow */}
            <Sprite start={102.5} end={115.7}>
              {({ localTime: lt2 }) => (
                <div style={{
                  position: 'absolute', left: 320, top: 170,
                  fontFamily: FONT, fontSize: 36, color: C.pea, fontWeight: 800,
                  opacity: clamp(lt2 / 0.4, 0, 1),
                }}>→</div>
              )}
            </Sprite>

            {/* Step 2 — anonymous template */}
            <Sprite start={103} end={115.7}>
              {({ localTime: lt2 }) => {
                const t = clamp(lt2 / 0.6, 0, 1);
                const bytes = ['9F','3C','7E','41','B2','D0','55','8A','17','FF','2C','64','11','EE','79','08'];
                return (
                  <div style={{
                    position: 'absolute', left: 400, top: 40,
                    opacity: Easing.easeOutCubic(t),
                    transform: `translateY(${(1 - t) * 20}px)`,
                  }}>
                    <div style={{
                      width: 280, height: 280, borderRadius: 20,
                      background: C.ink, padding: 18,
                      fontFamily: MONO, fontSize: 13, color: C.pea,
                      lineHeight: 1.5,
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 6, alignContent: 'start',
                    }}>
                      {bytes.map((b, i) => {
                        const reveal = clamp((lt2 - i * 0.04) / 0.3, 0, 1);
                        return (
                          <span key={i} style={{
                            opacity: reveal,
                            color: i % 3 === 0 ? C.corn : C.pea,
                          }}>{b}</span>
                        );
                      })}
                      <div style={{
                        gridColumn: '1 / -1', marginTop: 12,
                        fontFamily: MONO, fontSize: 11, color: C.cloud,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>rekognition · template</div>
                    </div>
                    <div style={{
                      fontFamily: FONT, fontSize: 22, fontWeight: 700,
                      color: C.ink, marginTop: 16, textAlign: 'center', width: 280,
                    }}>No PII stored</div>
                  </div>
                );
              }}
            </Sprite>

            <Sprite start={104.5} end={115.7}>
              {({ localTime: lt2 }) => (
                <div style={{
                  position: 'absolute', left: 720, top: 170,
                  fontFamily: FONT, fontSize: 36, color: C.pea, fontWeight: 800,
                  opacity: clamp(lt2 / 0.4, 0, 1),
                }}>→</div>
              )}
            </Sprite>

            {/* Step 3 — POS match */}
            <Sprite start={105} end={115.7}>
              {({ localTime: lt2 }) => {
                const t = clamp(lt2 / 0.6, 0, 1);
                const matched = lt2 > 1.6;
                return (
                  <div style={{
                    position: 'absolute', left: 800, top: 0, width: 880,
                    opacity: Easing.easeOutCubic(t),
                    transform: `translateY(${(1 - t) * 20}px)`,
                  }}>
                    <Monitor x={0} y={0} w={880} h={340} label="Vendor POS — at the counter">
                      <div style={{ padding: 24, display: 'flex', gap: 24 }}>
                        <div style={{
                          width: 220, height: 240, borderRadius: 14,
                          background: 'repeating-linear-gradient(135deg, #e9e6df 0 8px, #dcd8cf 8px 16px)',
                          position: 'relative',
                          border: matched ? `4px solid ${C.pea}` : `2px solid ${C.divider}`,
                        }}>
                          <div style={{
                            position: 'absolute', left: 56, top: 50,
                            width: 108, height: 130, borderRadius: '50%',
                            background: C.cloud,
                          }}/>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: FONT, fontSize: 14, fontWeight: 700,
                            letterSpacing: '0.16em', textTransform: 'uppercase',
                            color: C.slate, marginBottom: 14,
                          }}>Match against Activation CRBN-2026-04</div>
                          <div style={{
                            fontFamily: FONT, fontSize: 38, fontWeight: 800,
                            color: matched ? C.pea : C.slate, marginBottom: 12,
                            transition: 'color 200ms',
                          }}>{matched ? '✓ MATCH · 99.4%' : 'Scanning...'}</div>
                          <div style={{
                            fontFamily: MONO, fontSize: 13, color: C.slate,
                          }}>recipient_id: anon_94f1c2…</div>
                          <div style={{
                            fontFamily: MONO, fontSize: 13, color: C.slate, marginTop: 4,
                          }}>daily_cap: 1 / 1 — meal logged</div>

                          {matched && (
                            <div style={{
                              marginTop: 18, padding: '10px 14px',
                              background: C.pea, color: C.white,
                              fontFamily: FONT, fontSize: 16, fontWeight: 700,
                              borderRadius: 8, display: 'inline-block',
                            }}>Meal served</div>
                          )}
                        </div>
                      </div>
                    </Monitor>
                  </div>
                );
              }}
            </Sprite>
          </div>
        )}
      </Sprite>
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 8 — USDC settlement (116–134s)
// ────────────────────────────────────────────────────────────────────────────
function SceneSettle() {
  return (
    <Sprite start={116} end={134}>
      <Sprite start={116.1} end={133.7}>
        <Eyebrow text="04 · USDC settlement" color={C.papaya}/>
      </Sprite>
      <Sprite start={116.4} end={133.7}>
        <WordReveal
          words={['Verified', 'redemptions', '→']}
          x={120} y={170} size={84} stagger={0.07}
        />
      </Sprite>
      <Sprite start={117.5} end={133.7}>
        <WordReveal
          words={['Verified', 'vendors.', 'In', 'USDC.']}
          x={120} y={278} size={84} stagger={0.07} color={C.papaya}
        />
      </Sprite>

      {/* Treasury → vendor wallets diagram */}
      <Sprite start={119} end={133.7}>
        {({ localTime: lt }) => {
          const settled = lt > 4;
          const txs = [
            { vendor: 'Carlos Bakery', wallet: '0xFa7C…7A58', meals: 142, usdc: 947.14 },
            { vendor: 'Aqua Pura',     wallet: '0x9B12…E041', meals: 88,  usdc: 88.00 },
            { vendor: 'Casa Verde',    wallet: '0xC4A8…112B', meals: 64,  usdc: 128.00 },
          ];
          return (
            <>
              {/* Treasury card */}
              <div style={{
                position: 'absolute', left: 120, top: 460,
                width: 360, height: 380,
                background: `linear-gradient(160deg, ${C.papaya}, ${C.saffron})`,
                color: C.white, borderRadius: 18,
                padding: 28,
                boxShadow: `0 22px 50px ${C.papaya}55`,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85 }}>CDP treasury wallet</div>
                <div style={{ fontFamily: FONT, fontSize: 38, fontWeight: 800, marginTop: 14, lineHeight: 1.1 }}>WCK Treasury</div>
                <div style={{ fontFamily: MONO, fontSize: 14, marginTop: 8, opacity: 0.9 }}>0xWCKT…0001</div>
                <div style={{
                  marginTop: 32,
                  fontFamily: FONT, fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85,
                }}>Outflow · day close</div>
                <div style={{
                  fontFamily: FONT, fontSize: 56, fontWeight: 900,
                  letterSpacing: '-0.02em', marginTop: 6,
                }}>$1,163.14</div>
                <div style={{ fontFamily: MONO, fontSize: 13, opacity: 0.85 }}>USDC · base-sepolia</div>
              </div>

              {/* TXs */}
              <div style={{
                position: 'absolute', left: 600, top: 460,
                width: 1200, display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                {txs.map((tx, i) => (
                  <Sprite key={i} start={120 + i * 0.7} end={133.7}>
                    {({ localTime: lt2 }) => {
                      const t = clamp(lt2 / 0.5, 0, 1);
                      return (
                        <div style={{
                          background: C.white, borderRadius: 12,
                          padding: '20px 24px',
                          border: `1px solid ${C.divider}`,
                          boxShadow: '0 12px 28px rgba(19,19,19,0.06)',
                          display: 'flex', alignItems: 'center', gap: 22,
                          opacity: Easing.easeOutCubic(t),
                          transform: `translateX(${(1 - t) * -40}px)`,
                        }}>
                          <div style={{
                            width: 54, height: 54, borderRadius: 54,
                            background: C.papaya, color: C.white,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: FONT, fontSize: 22, fontWeight: 800,
                          }}>{tx.vendor[0]}</div>
                          <div style={{ width: 220 }}>
                            <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: C.ink }}>{tx.vendor}</div>
                            <div style={{ fontFamily: MONO, fontSize: 13, color: C.slate, marginTop: 2 }}>{tx.wallet}</div>
                          </div>
                          <div style={{ width: 120, fontFamily: MONO, fontSize: 14, color: C.graphite }}>
                            <span style={{ color: C.slate }}>meals </span>
                            <span style={{ fontWeight: 700, color: C.ink }}>{tx.meals}</span>
                          </div>
                          <div style={{ flex: 1, fontFamily: FONT, fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em' }}>${tx.usdc.toFixed(2)}</div>
                          <div style={{
                            padding: '6px 12px', borderRadius: 999,
                            background: C.pea, color: C.white,
                            fontFamily: MONO, fontSize: 12, fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                          }}>tx confirmed</div>
                        </div>
                      );
                    }}
                  </Sprite>
                ))}
              </div>
            </>
          );
        }}
      </Sprite>
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 9 — x402 (134–154s)
// ────────────────────────────────────────────────────────────────────────────
function SceneX402() {
  return (
    <Sprite start={134} end={154}>
      <Sprite start={134.1} end={153.7}>
        <Eyebrow text="05 · x402 paywalled lookup" color={C.fig}/>
      </Sprite>
      <Sprite start={134.4} end={153.7}>
        <WordReveal
          words={['No', 'API', 'key.']}
          x={120} y={170} size={88} stagger={0.08}
        />
      </Sprite>
      <Sprite start={135.4} end={153.7}>
        <WordReveal
          words={['No', 'subscription.']}
          x={120} y={278} size={88} stagger={0.08} color={C.fig}
        />
      </Sprite>
      <Sprite start={136.6} end={153.7}>
        <WordReveal
          words={['Just', '$0.01', 'USDC', 'per', 'call.']}
          x={120} y={386} size={68} stagger={0.07} color={C.graphite} weight={500}
        />
      </Sprite>

      {/* HTTP exchange terminal */}
      <Sprite start={138} end={153.7}>
        {({ localTime: lt }) => {
          const lines = [
            { d: 0.0, c: C.cloud, t: '$ donor-agent → GET /credential/verify?vendor=0xFa7C…7A58' },
            { d: 1.0, c: C.corn, t: '← HTTP 402 Payment Required' },
            { d: 1.6, c: C.pebble, t: '   accepts: [{ scheme:"exact", network:"base-sepolia",' },
            { d: 1.9, c: C.pebble, t: '              maxAmountRequired:"10000", asset:USDC }]' },
            { d: 2.6, c: C.cloud, t: '$ sign ERC-3009 transferWithAuthorization' },
            { d: 3.4, c: C.cloud, t: '$ retry with X-Payment header (base64)' },
            { d: 4.2, c: C.sky,  t: '   → x402 Facilitator verifies payment' },
            { d: 4.9, c: C.sky,  t: '   → Lambda queries EAS for latest WCK-Vendor' },
            { d: 5.6, c: C.pea,  t: '✓ 200 OK · attestation chain returned' },
            { d: 6.2, c: C.pea,  t: '   uid: 0x4a1c…f88e · revocable:true · valid' },
          ];
          return (
            <div style={{
              position: 'absolute', left: 120, top: 500,
              width: 1680, height: 360,
              background: C.ink, borderRadius: 14,
              padding: '24px 28px',
              fontFamily: MONO, fontSize: 18, lineHeight: 1.7,
              boxShadow: '0 24px 50px rgba(19,19,19,0.3)',
            }}>
              <div style={{
                display: 'flex', gap: 8, marginBottom: 16,
                paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}>
                <span style={{ width: 12, height: 12, borderRadius: 12, background: '#e96a5b' }}/>
                <span style={{ width: 12, height: 12, borderRadius: 12, background: '#f3bd4f' }}/>
                <span style={{ width: 12, height: 12, borderRadius: 12, background: '#7ac96f' }}/>
                <div style={{ flex: 1 }}/>
                <span style={{ fontFamily: MONO, fontSize: 12, color: C.pebble }}>x402 Terminal</span>
              </div>
              {lines.map((l, i) => {
                const t = clamp((lt - l.d) / 0.3, 0, 1);
                return (
                  <div key={i} style={{
                    color: l.c, opacity: t,
                    transform: `translateX(${(1 - t) * -8}px)`,
                  }}>{l.t}</div>
                );
              })}
            </div>
          );
        }}
      </Sprite>
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 10 — Agent boundary (154–168s)
// ────────────────────────────────────────────────────────────────────────────
function SceneBoundary() {
  return (
    <Sprite start={154} end={168}>
      <Sprite start={154.1} end={167.7}>
        <Eyebrow text="The agent boundary" color={C.saffron}/>
      </Sprite>
      <Sprite start={154.4} end={167.7}>
        <WordReveal
          words={['Agents', 'read', 'and', 'recommend.']}
          x={120} y={170} size={84} stagger={0.06}
        />
      </Sprite>
      <Sprite start={155.6} end={167.7}>
        <WordReveal
          words={['Humans', 'sign', 'every', 'disbursement.']}
          x={120} y={278} size={84} stagger={0.06} color={C.saffron}
        />
      </Sprite>

      {/* Two columns: agents do / humans do */}
      <Sprite start={157} end={167.7}>
        {({ localTime: lt }) => {
          const t = clamp(lt / 0.6, 0, 1);
          const cols = [
            {
              title: 'Agents',
              subtitle: 'read-side · review-side',
              color: C.blue,
              items: [
                'Bedrock reads documents',
                'Cross-checks fields',
                'Surfaces a review packet',
                'Donor agents pay & query',
              ],
            },
            {
              title: 'Humans',
              subtitle: 'judgment · accountability',
              color: C.saffron,
              items: [
                'KYC officer approves',
                'Field staff enroll',
                'Counter staff authorize',
                'Ops Lead clicks Settle',
              ],
            },
          ];
          return (
            <div style={{
              position: 'absolute', left: 120, top: 460, width: 1680,
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28,
              opacity: Easing.easeOutCubic(t),
              transform: `translateY(${(1 - t) * 20}px)`,
            }}>
              {cols.map((c, ci) => (
                <div key={ci} style={{
                  background: C.white, borderRadius: 16,
                  border: `1px solid ${C.divider}`,
                  padding: 36,
                  boxShadow: '0 14px 32px rgba(19,19,19,0.08)',
                }}>
                  <div style={{
                    fontFamily: FONT, fontSize: 56, fontWeight: 900,
                    color: c.color, lineHeight: 1, letterSpacing: '-0.02em',
                  }}>{c.title}</div>
                  <div style={{
                    fontFamily: MONO, fontSize: 14, color: C.slate,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    marginTop: 8, marginBottom: 24,
                  }}>{c.subtitle}</div>
                  {c.items.map((item, i) => (
                    <Sprite key={i} start={158 + ci * 0.3 + i * 0.25} end={167.7}>
                      {({ localTime: lt2 }) => {
                        const tt = clamp(lt2 / 0.4, 0, 1);
                        return (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '10px 0',
                            opacity: tt,
                            transform: `translateX(${(1 - tt) * -16}px)`,
                          }}>
                            <span style={{
                              width: 10, height: 10, background: c.color,
                              borderRadius: 2,
                            }}/>
                            <span style={{
                              fontFamily: FONT, fontSize: 22, fontWeight: 500,
                              color: C.ink,
                            }}>{item}</span>
                          </div>
                        );
                      }}
                    </Sprite>
                  ))}
                </div>
              ))}
            </div>
          );
        }}
      </Sprite>
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCENE 11 — Closing (168–180s)
// ────────────────────────────────────────────────────────────────────────────
function SceneClose() {
  return (
    <Sprite start={168} end={180}>
      <Sprite start={168} end={179.7}>
        {({ localTime }) => {
          const fade = Easing.easeOutCubic(clamp(localTime / 1.0, 0, 1));
          return (
            <>
              {/* Stack of "layers" */}
              <div style={{
                position: 'absolute', left: 200, top: 200,
                width: 460, height: 480,
                opacity: fade,
                transform: `translateY(${(1 - fade) * 30}px)`,
              }}>
                {[
                  { c: C.fig,    label: 'x402', sub: 'paywalled lookup' },
                  { c: C.papaya, label: 'USDC', sub: 'CDP settlement' },
                  { c: C.pea,    label: 'AWS',  sub: 'Rekognition · Bedrock' },
                  { c: C.sky,    label: 'EAS',  sub: 'Base Sepolia' },
                  { c: C.blue,   label: 'WCK',  sub: 'human accountability' },
                ].map((l, i) => (
                  <Sprite key={i} start={168.4 + i * 0.25} end={179.7}>
                    {({ localTime: lt }) => {
                      const t = clamp(lt / 0.5, 0, 1);
                      return (
                        <div style={{
                          position: 'absolute', left: i * 8, top: i * 76,
                          width: 460, height: 80, borderRadius: 12,
                          background: l.c, color: C.white,
                          padding: '18px 26px',
                          display: 'flex', alignItems: 'center', gap: 20,
                          boxShadow: `0 12px 28px ${l.c}55`,
                          opacity: t,
                          transform: `translateX(${(1 - t) * -20}px)`,
                        }}>
                          <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 900, letterSpacing: '-0.01em', minWidth: 100 }}>{l.label}</div>
                          <div style={{ fontFamily: MONO, fontSize: 14, opacity: 0.85, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{l.sub}</div>
                        </div>
                      );
                    }}
                  </Sprite>
                ))}
              </div>
            </>
          );
        }}
      </Sprite>

      <Sprite start={170} end={179.7}>
        <Eyebrow text="Aval — built in 36 hours" x={780} y={220} color={C.saffron}/>
      </Sprite>
      <Sprite start={170.5} end={179.7}>
        <WordReveal
          words={['Identity,', 'credentials,']}
          x={780} y={260} size={84} stagger={0.08}
        />
      </Sprite>
      <Sprite start={171.5} end={179.7}>
        <WordReveal
          words={['and', 'agent-native']}
          x={780} y={364} size={84} stagger={0.08} color={C.blue}
        />
      </Sprite>
      <Sprite start={172.3} end={179.7}>
        <WordReveal
          words={['infrastructure', 'for']}
          x={780} y={468} size={84} stagger={0.08}
        />
      </Sprite>
      <Sprite start={173.0} end={179.7}>
        <WordReveal
          words={['humanitarian', 'response.']}
          x={780} y={572} size={84} stagger={0.08} color={C.saffron}
        />
      </Sprite>

      <Sprite start={175.5} end={179.7}>
        <Underline x={780} y={680} w={420} color={C.saffron} thickness={6} dur={0.7}/>
      </Sprite>

      <Sprite start={176.2} end={179.7}>
        <div style={{
          position: 'absolute', left: 780, top: 706,
          fontFamily: FONT, fontSize: 24, fontWeight: 600, color: C.blue,
        }}>World Central Kitchen · EasyA × Consensus Miami 2026</div>
      </Sprite>
      <Sprite start={177.0} end={179.7}>
        <div style={{
          position: 'absolute', left: 780, top: 746,
          fontFamily: MONO, fontSize: 16, color: C.slate, letterSpacing: '0.04em',
        }}>Coinbase + AWS track · github.com/WorldCentralKitchen/aval-wck-demo-consensus-2026</div>
      </Sprite>
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Chapter marker (overlay) — shows scene timeline at bottom
// ────────────────────────────────────────────────────────────────────────────
function ChapterMarker() {
  const time = useTime();
  const chapters = [
    { t: 0, label: 'Aval' },
    { t: 12, label: 'The setting' },
    { t: 28, label: 'Friction' },
    { t: 48, label: 'What ships' },
    { t: 62, label: 'Onboarding' },
    { t: 80, label: 'On-chain' },
    { t: 98, label: 'Privacy' },
    { t: 116, label: 'Settlement' },
    { t: 134, label: 'x402' },
    { t: 154, label: 'Boundary' },
    { t: 168, label: 'Aval' },
  ];
  const total = 180;

  return (
    <div style={{
      position: 'absolute', left: 60, right: 60, bottom: 36,
      height: 28,
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em',
      color: C.slate, textTransform: 'uppercase',
    }}>
      <div style={{ fontWeight: 700, color: C.ink }}>aval / 03:00</div>
      <div style={{ flex: 1, position: 'relative', height: 2, background: 'rgba(19,19,19,0.08)' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${(time / total) * 100}%`,
          background: C.saffron,
        }}/>
        {chapters.map((c, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${(c.t / total) * 100}%`, top: -3,
            width: 1, height: 8,
            background: time >= c.t ? C.saffron : 'rgba(19,19,19,0.15)',
          }}/>
        ))}
      </div>
      <div style={{ fontFamily: MONO, color: C.ink, fontWeight: 700 }}>
        {Math.floor(time / 60)}:{String(Math.floor(time % 60)).padStart(2, '0')}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Subtle background grid + watermark
// ────────────────────────────────────────────────────────────────────────────
function StagingChrome() {
  return (
    <>
      {/* faint grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          `linear-gradient(${C.divider} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${C.divider} 1px, transparent 1px)`,
        backgroundSize: '120px 120px',
        opacity: 0.5,
        pointerEvents: 'none',
      }}/>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Root
// ────────────────────────────────────────────────────────────────────────────
function AvalAnimation() {
  return (
    <>
      <StagingChrome/>
      <SceneTitle/>
      <SceneSetting/>
      <SceneFriction/>
      <SceneShip/>
      <SceneAgent/>
      <SceneChain/>
      <ScenePrivacy/>
      <SceneSettle/>
      <SceneX402/>
      <SceneBoundary/>
      <SceneClose/>
      <ChapterMarker/>
    </>
  );
}

Object.assign(window, { AvalAnimation });
