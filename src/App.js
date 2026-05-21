/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Storage keys ──────────────────────────────────────────────────────────────
const SK = {
  skills:       'lrpg3_skills',
  xp:           'lrpg3_xp',
  history:      'lrpg3_history',
  today:        'lrpg3_today',
  achievements: 'lrpg3_achievements',
  goals:        'lrpg3_goals',
  reminder:     'lrpg3_reminder',
};

// ── Default activities ────────────────────────────────────────────────────────
const DEFAULT_SKILLS = [
  { id: 'postgrad',  emoji: '🎓', name: 'Pós-graduação',    isDefault: true },
  { id: 'languages', emoji: '🌐', name: 'Línguas',           isDefault: true },
  { id: 'reading',   emoji: '📖', name: 'Ler',               isDefault: true },
  { id: 'courses',   emoji: '💡', name: 'Cursos livres',     isDefault: true },
  { id: 'sports',    emoji: '⚡', name: 'Esportes',          isDefault: true },
  { id: 'study',     emoji: '🔭', name: 'Estudar algo novo', isDefault: true },
  { id: 'work',      emoji: '💼', name: 'Trabalho',          isDefault: true },
  { id: 'leisure',   emoji: '🎮', name: 'Lazer',             isDefault: true },
  { id: 'sleep',     emoji: '🌙', name: 'Dormir bem',        isDefault: true },
];

const XP_PER = 50;

// ── Moods ─────────────────────────────────────────────────────────────────────
const MOODS = [
  { value: 1, emoji: '😔', label: 'Péssimo' },
  { value: 2, emoji: '😕', label: 'Ruim'    },
  { value: 3, emoji: '😐', label: 'Neutro'  },
  { value: 4, emoji: '🙂', label: 'Bem'     },
  { value: 5, emoji: '😄', label: 'Ótimo'   },
];

// ── Achievements ──────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_check',  emoji: '🌟', name: 'Primeiro Passo',  desc: 'Marque sua primeira atividade'        },
  { id: 'streak_3',     emoji: '🔥', name: 'Trinca',           desc: '3 dias seguidos'                     },
  { id: 'streak_7',     emoji: '⚡', name: 'Semana de Fogo',   desc: '7 dias seguidos'                     },
  { id: 'streak_30',    emoji: '💎', name: 'Mês Invicto',      desc: '30 dias seguidos'                    },
  { id: 'level_5',      emoji: '⚔️', name: 'Veterano',         desc: 'Uma atividade chegou ao nível 5'     },
  { id: 'level_10',     emoji: '👑', name: 'Mestre',           desc: 'Uma atividade chegou ao nível 10'    },
  { id: 'perfect_day',  emoji: '✨', name: 'Dia Perfeito',     desc: 'Complete todas as atividades'        },
  { id: 'days_30',      emoji: '📅', name: 'Consistente',      desc: '30 dias ativos no total'             },
  { id: 'diary_7',      emoji: '📝', name: 'Introspecto',      desc: 'Escreva 7 entradas no diário'        },
  { id: 'custom_skill', emoji: '🔧', name: 'Criador',          desc: 'Adicione uma atividade personalizada'},
];

// ── Date helpers ──────────────────────────────────────────────────────────────
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const monthKey = (ds) => ds.substring(0, 7);

// ── Level helpers ─────────────────────────────────────────────────────────────
function calcLevel(xp) {
  let lvl = 1, rem = xp || 0, need = 120;
  while (rem >= need) { rem -= need; lvl++; need = lvl * 120; }
  return { lvl, rem, need };
}

function calcStreak(history) {
  const dates = new Set(history.filter(h => h.checks.length > 0).map(h => h.date));
  const d = new Date();
  if (!dates.has(todayStr())) d.setDate(d.getDate() - 1);
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (dates.has(ds)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}

// ── Week helpers ──────────────────────────────────────────────────────────────
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekChecksCount(history, skillId, todayChecks) {
  const ws  = getWeekStart();
  const tds = todayStr();
  const fromHist = history.filter(h => {
    const hd = new Date(h.date + 'T00:00:00');
    return hd >= ws && h.date !== tds && h.checks.includes(skillId);
  }).length;
  return fromHist + (todayChecks.includes(skillId) ? 1 : 0);
}

// ── Achievement checker ───────────────────────────────────────────────────────
function checkNewAchievements({ skills, xpMap, history, todayState, unlockedIds }) {
  const newIds = [];
  const check  = (id, cond) => { if (!unlockedIds.includes(id) && cond) newIds.push(id); };

  const allH = history.filter(h => h.date !== todayState.date);
  if (todayState.checks.length > 0 || todayState.diary) {
    allH.push({ ...todayState });
  }

  check('first_check',  allH.some(h => h.checks.length > 0));
  check('streak_3',     calcStreak(allH) >= 3);
  check('streak_7',     calcStreak(allH) >= 7);
  check('streak_30',    calcStreak(allH) >= 30);
  check('level_5',      Object.values(xpMap).some(xp => calcLevel(xp).lvl >= 5));
  check('level_10',     Object.values(xpMap).some(xp => calcLevel(xp).lvl >= 10));
  check('perfect_day',  skills.length > 0 && todayState.checks.length === skills.length);
  check('days_30',      allH.filter(h => h.checks.length > 0).length >= 30);
  check('diary_7',      allH.filter(h => h.diary).length >= 7);
  check('custom_skill', skills.some(s => !s.isDefault));
  return newIds;
}

// ── Export / Import ───────────────────────────────────────────────────────────
function makeExportCode() {
  const data = Object.fromEntries(Object.entries(SK).map(([, v]) => [v, localStorage.getItem(v)]));
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function applyImportCode(code) {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    Object.values(SK).forEach(k => { if (data[k]) localStorage.setItem(k, data[k]); });
    return true;
  } catch { return false; }
}

// ── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { background:#080808; color:#e0d5c0; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; min-height:100vh; overflow-x:hidden; }
  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.2); border-radius:2px; }

  @keyframes twinkle   { 0%,100%{opacity:.15} 50%{opacity:.9} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes fadeIn    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ripple    { from{transform:scale(0);opacity:.5} to{transform:scale(3);opacity:0} }
  @keyframes particle  { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0} }
  @keyframes levelUpIn { from{transform:scale(.7) translateY(16px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes perfectDay{ 0%{opacity:0;transform:scale(.9)} 100%{opacity:1;transform:scale(1)} }
  @keyframes achPop    { 0%{transform:scale(0) rotate(-15deg);opacity:0} 70%{transform:scale(1.15) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }

  .tab-panel { animation:fadeIn .28s cubic-bezier(.4,0,.2,1); }
  .card-item  { transition:all .28s cubic-bezier(.4,0,.2,1); }
  .card-item:hover { transform:translateY(-1px); }
  .golden { background:linear-gradient(135deg,#c9a84c,#f0d080,#d4af37); background-clip:text; -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .shimmer { background:linear-gradient(90deg,#c9a84c,#f0d080,#c9a84c,#f0d080); background-size:200% auto; background-clip:text; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 2.5s linear infinite; }
  .float { animation:float 3.5s ease-in-out infinite; }
  textarea:focus, input:focus { outline:none; }
  button { font-family:inherit; cursor:pointer; }
`;

// ── Particles ─────────────────────────────────────────────────────────────────
function spawnParticles(cx, cy) {
  for (let i = 0; i < 12; i++) {
    const el    = document.createElement('div');
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
    const dist  = 45 + Math.random() * 55;
    el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:5px;height:5px;border-radius:50%;background:#f0d080;pointer-events:none;z-index:9999;box-shadow:0 0 6px #f0d080;--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;animation:particle .85s cubic-bezier(.4,0,.2,1) forwards;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
}

// ── Canvas background ─────────────────────────────────────────────────────────
function CanvasBackground() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    let raf, scanY = 0, t = 0;
    const stars = Array.from({ length: 130 }, () => ({ x:Math.random(), y:Math.random(), r:Math.random()*1.1+.3, phase:Math.random()*Math.PI*2, spd:Math.random()*.018+.005 }));
    const orbs  = Array.from({ length: 5  }, () => ({ x:Math.random(), y:Math.random(), r:100+Math.random()*130, vx:(Math.random()-.5)*.00015, vy:(Math.random()-.5)*.00015 }));
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      orbs.forEach(o => {
        o.x = (o.x+o.vx+1)%1; o.y = (o.y+o.vy+1)%1;
        const g = ctx.createRadialGradient(o.x*W,o.y*H,0,o.x*W,o.y*H,o.r);
        g.addColorStop(0,'rgba(201,168,76,0.045)'); g.addColorStop(1,'rgba(201,168,76,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(o.x*W,o.y*H,o.r,0,Math.PI*2); ctx.fill();
      });
      stars.forEach(s => {
        const a = .12+.7*(.5+.5*Math.sin(t*s.spd+s.phase));
        ctx.fillStyle=`rgba(240,208,128,${a})`; ctx.beginPath(); ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2); ctx.fill();
      });
      scanY = (scanY+.35)%H;
      const sg = ctx.createLinearGradient(0,scanY-3,0,scanY+3);
      sg.addColorStop(0,'rgba(201,168,76,0)'); sg.addColorStop(.5,'rgba(201,168,76,0.035)'); sg.addColorStop(1,'rgba(201,168,76,0)');
      ctx.fillStyle=sg; ctx.fillRect(0,scanY-3,W,6);
      t++; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:0, pointerEvents:'none' }} />;
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ xpMap, history }) {
  const total = Object.values(xpMap).reduce((a, b) => a + b, 0);
  const { lvl, rem, need } = calcLevel(total);
  const streak = calcStreak(history);
  const pct    = Math.round((rem / need) * 100);
  return (
    <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(8,8,8,0.93)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'11px 20px' }}>
      <div style={{ maxWidth:700, margin:'0 auto', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ flexShrink:0 }}>
          <div className="golden" style={{ fontSize:19, fontWeight:700, letterSpacing:.5 }}>Jogui</div>
          <div style={{ fontSize:10, color:'#666', letterSpacing:.5 }}>NÍVEL {lvl}</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:11, color:'#555' }}>
            <span>{rem} / {need} XP</span><span>{pct}%</span>
          </div>
          <div style={{ height:3, background:'#181818', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#c9a84c,#f0d080)', borderRadius:2, transition:'width .6s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        </div>
        {streak > 0 && (
          <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:4, fontSize:13, color:'#c9a84c', fontWeight:600 }}>🔥 {streak}</div>
        )}
      </div>
    </header>
  );
}

// ── Mood thermometer ──────────────────────────────────────────────────────────
function MoodThermometer({ mood, onChange }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.025)', borderRadius:12, padding:'16px 18px', marginBottom:18, border:'1px solid rgba(255,255,255,0.055)' }}>
      <div style={{ fontSize:11, color:'#555', letterSpacing:.7, marginBottom:12 }}>COMO ESTOU HOJE</div>
      <div style={{ display:'flex', gap:6, marginBottom:10 }}>
        {MOODS.map(m => {
          const active = mood === m.value, filled = mood >= m.value;
          return (
            <button key={m.value} onClick={() => onChange(active ? null : m.value)} style={{ flex:1, padding:'10px 4px', borderRadius:9, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, background:filled?'rgba(201,168,76,0.1)':'rgba(255,255,255,0.025)', border:active?'1px solid rgba(201,168,76,0.55)':'1px solid rgba(255,255,255,0.055)', transition:'all .25s ease', transform:active?'scale(1.06)':'scale(1)' }}>
              <span style={{ fontSize:22, lineHeight:1 }}>{m.emoji}</span>
              <span style={{ fontSize:10, color:active?'#c9a84c':'#484848' }}>{m.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ height:4, background:'#111', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:mood?`${(mood/5)*100}%`:'0%', background:'linear-gradient(90deg,#8a6a20,#c9a84c,#f0d080)', borderRadius:2, transition:'width .45s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
}

// ── Activity card ─────────────────────────────────────────────────────────────
function ActivityCard({ skill, xp, checked, onToggle, onDelete, weekCount, weekGoal }) {
  const { lvl } = calcLevel(xp);
  const ref = useRef(null);
  const handleClick = (e) => {
    if (onDelete) return;
    const rect = ref.current.getBoundingClientRect();
    const rip  = document.createElement('div');
    rip.style.cssText = `position:absolute;left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px;width:8px;height:8px;margin:-4px;border-radius:50%;background:rgba(201,168,76,0.35);pointer-events:none;animation:ripple .55s ease-out forwards;`;
    ref.current.appendChild(rip);
    setTimeout(() => rip.remove(), 600);
    if (!checked) spawnParticles(e.clientX, e.clientY);
    onToggle(skill.id);
  };
  const goalPct = weekGoal ? Math.min((weekCount / weekGoal) * 100, 100) : 0;
  const goalMet = weekGoal && weekCount >= weekGoal;

  return (
    <div ref={ref} onClick={handleClick} className="card-item" style={{ position:'relative', overflow:'hidden', display:'flex', alignItems:'center', gap:14, padding:'13px 16px', borderRadius:10, cursor: onDelete ? 'default' : 'pointer', background:checked?'rgba(201,168,76,0.07)':'rgba(255,255,255,0.022)', border:`1px solid ${checked?'rgba(201,168,76,0.38)':'rgba(255,255,255,0.055)'}`, boxShadow:checked?'0 0 22px rgba(201,168,76,0.08)':'none' }}>
      <div style={{ width:42, height:42, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, transition:'all .28s ease', background:checked?'rgba(201,168,76,0.14)':'rgba(255,255,255,0.04)', border:`1px solid ${checked?'rgba(201,168,76,0.28)':'rgba(255,255,255,0.07)'}` }}>
        {skill.emoji}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:500, color:checked?'#f0d080':'#c8c0b0', transition:'color .28s' }}>{skill.name}</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
          <span style={{ fontSize:11, color:'#555' }}>Nível {lvl} · +{XP_PER} XP</span>
          {weekGoal > 0 && (
            <span style={{ fontSize:10, color: goalMet ? '#c9a84c' : '#555' }}>
              {goalMet ? '✓ ' : ''}{weekCount}/{weekGoal}× semana
            </span>
          )}
        </div>
        {weekGoal > 0 && (
          <div style={{ height:2, background:'#111', borderRadius:1, overflow:'hidden', marginTop:4 }}>
            <div style={{ height:'100%', width:`${goalPct}%`, background: goalMet ? 'linear-gradient(90deg,#c9a84c,#f0d080)' : 'rgba(201,168,76,0.3)', borderRadius:1, transition:'width .4s ease' }} />
          </div>
        )}
      </div>
      {onDelete ? (
        <button onClick={e => { e.stopPropagation(); onDelete(skill.id); }} style={{ background:'rgba(192,80,80,0.12)', border:'1px solid rgba(192,80,80,0.3)', borderRadius:6, color:'#c05050', fontSize:15, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, lineHeight:1, transition:'all .2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(192,80,80,0.25)'} onMouseOut={e => e.currentTarget.style.background='rgba(192,80,80,0.12)'}>×</button>
      ) : (
        <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, border:`1.5px solid ${checked?'#c9a84c':'#2a2a2a'}`, background:checked?'#c9a84c':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#080808', fontWeight:700, transition:'all .28s cubic-bezier(.4,0,.2,1)' }}>
          {checked && '✓'}
        </div>
      )}
    </div>
  );
}

// ── Today tab ─────────────────────────────────────────────────────────────────
function TodayTab({ skills, checks, xpMap, onToggle, diary, onDiaryChange, onAddActivity, onDeleteSkill, mood, onMoodChange, goals, history }) {
  const [editMode, setEditMode] = useState(false);
  const done = checks.length, total = skills.length;
  const pct  = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="tab-panel">
      <MoodThermometer mood={mood} onChange={onMoodChange} />
      <div style={{ background:'rgba(255,255,255,0.025)', borderRadius:12, padding:'16px 18px', marginBottom:18, border:'1px solid rgba(255,255,255,0.055)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:9, fontSize:13 }}>
          <span style={{ color:'#777' }}>Progresso do dia</span>
          <span style={{ color:'#c9a84c', fontWeight:600 }}>{done}/{total} · {pct}%</span>
        </div>
        <div style={{ height:5, background:'#131313', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#c9a84c,#f0d080)', borderRadius:3, transition:'width .5s cubic-bezier(.4,0,.2,1)' }} />
        </div>
        {done === total && total > 0 && (
          <div className="shimmer" style={{ marginTop:12, fontSize:14, fontWeight:700, textAlign:'center', animation:'perfectDay .5s ease forwards, shimmer 2.5s linear infinite' }}>✦ Dia perfeito! ✦</div>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:12 }}>
        {skills.map(s => (
          <ActivityCard key={s.id} skill={s} xp={xpMap[s.id]||0} checked={checks.includes(s.id)}
            onToggle={editMode ? ()=>{} : onToggle}
            onDelete={editMode ? onDeleteSkill : null}
            weekCount={weekChecksCount(history, s.id, checks)}
            weekGoal={goals[s.id] || 0}
          />
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:22 }}>
        <button onClick={onAddActivity} style={{ flex:1, padding:'11px', background:'transparent', border:'1px dashed rgba(201,168,76,0.25)', borderRadius:10, color:'rgba(201,168,76,0.5)', fontSize:13, transition:'all .25s ease' }} onMouseOver={e=>{e.currentTarget.style.borderColor='rgba(201,168,76,0.55)';e.currentTarget.style.color='#c9a84c';}} onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(201,168,76,0.25)';e.currentTarget.style.color='rgba(201,168,76,0.5)';}}>+ Nova atividade</button>
        <button onClick={() => setEditMode(v => !v)} style={{ padding:'11px 16px', background:editMode?'rgba(192,80,80,0.12)':'transparent', border:editMode?'1px solid rgba(192,80,80,0.35)':'1px dashed rgba(255,255,255,0.1)', borderRadius:10, color:editMode?'#c05050':'#484848', fontSize:13, transition:'all .25s ease' }}>{editMode ? 'Concluir' : '✎ Editar'}</button>
      </div>

      <div style={{ background:'rgba(255,255,255,0.022)', borderRadius:12, padding:'16px', border:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:11, color:'#555', letterSpacing:.7, marginBottom:10 }}>DIÁRIO DO DIA</div>
        <textarea value={diary} onChange={e => onDiaryChange(e.target.value)} placeholder="Como foi seu dia? Escreva livremente..." style={{ width:'100%', minHeight:110, background:'transparent', border:'none', color:'#b8b0a0', fontSize:14, lineHeight:1.65, resize:'vertical', fontFamily:'inherit' }} />
      </div>
    </div>
  );
}

// ── Export modal ──────────────────────────────────────────────────────────────
function ExportModal({ onClose }) {
  const code = makeExportCode();
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0d0d0d', border:'1px solid rgba(201,168,76,0.22)', borderRadius:14, padding:'26px 22px', width:'100%', maxWidth:420, animation:'levelUpIn .28s ease' }}>
        <div className="golden" style={{ fontSize:17, fontWeight:600, marginBottom:8 }}>Exportar dados</div>
        <div style={{ fontSize:13, color:'#666', marginBottom:16, lineHeight:1.5 }}>Copie o código abaixo e cole em outro navegador para transferir seu histórico.</div>
        <textarea readOnly value={code} style={{ width:'100%', height:100, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#777', fontSize:11, padding:'10px', resize:'none', fontFamily:'monospace', lineHeight:1.4 }} />
        <div style={{ display:'flex', gap:9, marginTop:12 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#555', fontSize:13 }}>Fechar</button>
          <button onClick={copy} style={{ flex:1, padding:'10px', borderRadius:8, fontSize:13, fontWeight:500, background:copied?'rgba(92,184,92,0.15)':'rgba(201,168,76,0.12)', border:copied?'1px solid rgba(92,184,92,0.4)':'1px solid rgba(201,168,76,0.35)', color:copied?'#5cb85c':'#c9a84c', transition:'all .25s ease' }}>{copied ? '✓ Copiado!' : 'Copiar código'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Import modal ──────────────────────────────────────────────────────────────
function ImportModal({ onClose }) {
  const [code, setCode]   = useState('');
  const [error, setError] = useState('');
  const apply = () => { if (!code.trim()) return; applyImportCode(code) ? window.location.reload() : setError('Código inválido. Verifique e tente de novo.'); };
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0d0d0d', border:'1px solid rgba(201,168,76,0.22)', borderRadius:14, padding:'26px 22px', width:'100%', maxWidth:420, animation:'levelUpIn .28s ease' }}>
        <div className="golden" style={{ fontSize:17, fontWeight:600, marginBottom:8 }}>Importar dados</div>
        <div style={{ fontSize:13, color:'#666', marginBottom:16, lineHeight:1.5 }}>Cole aqui o código exportado de outro navegador.</div>
        <textarea value={code} onChange={e => { setCode(e.target.value); setError(''); }} placeholder="Cole o código aqui..." style={{ width:'100%', height:100, background:'rgba(255,255,255,0.04)', border:`1px solid ${error?'rgba(192,80,80,0.4)':'rgba(255,255,255,0.08)'}`, borderRadius:8, color:'#ccc', fontSize:11, padding:'10px', resize:'none', fontFamily:'monospace', lineHeight:1.4 }} />
        {error && <div style={{ color:'#c05050', fontSize:12, marginTop:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:9, marginTop:12 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#555', fontSize:13 }}>Cancelar</button>
          <button onClick={apply} style={{ flex:1, padding:'10px', borderRadius:8, fontSize:13, fontWeight:500, background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.35)', color:'#c9a84c' }}>Importar</button>
        </div>
      </div>
    </div>
  );
}

// ── Panel tab ─────────────────────────────────────────────────────────────────
function PanelTab({ history, skills, xpMap, onDeleteSkill, onAddActivity, goals, onGoalChange, reminder, onReminderChange, achievements }) {
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const requestReminder = (enabled, hour) => {
    if (enabled && Notification.permission === 'default') {
      Notification.requestPermission().then(p => onReminderChange({ enabled: p === 'granted', hour }));
    } else {
      onReminderChange({ enabled, hour });
    }
  };

  const unlockedIds = achievements.map(a => a.id);

  return (
    <div className="tab-panel">
      {/* Achievements */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, color:'#555', letterSpacing:.7, marginBottom:14 }}>CONQUISTAS</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedIds.includes(a.id);
            const info     = unlocked ? achievements.find(x => x.id === a.id) : null;
            return (
              <div key={a.id} title={`${a.name} — ${a.desc}${info ? `\nDesbloqueado: ${info.unlockedAt}` : ''}`} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'10px 6px', borderRadius:10, background:unlocked?'rgba(201,168,76,0.09)':'rgba(255,255,255,0.02)', border:`1px solid ${unlocked?'rgba(201,168,76,0.3)':'rgba(255,255,255,0.04)'}`, opacity:unlocked?1:.4, transition:'all .3s ease', animation: unlocked ? 'achPop .4s ease' : 'none' }}>
                <span style={{ fontSize:22 }}>{a.emoji}</span>
                <span style={{ fontSize:9, color:unlocked?'#c9a84c':'#555', textAlign:'center', lineHeight:1.3 }}>{a.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, color:'#555', letterSpacing:.7, marginBottom:14 }}>HISTÓRICO</div>
        {history.length === 0 ? (
          <div style={{ textAlign:'center', color:'#383838', fontSize:14, padding:'36px 0' }}>Nenhum registro ainda.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {[...history].reverse().slice(0, 30).map((entry, i) => {
              const done = skills.filter(s => entry.checks.includes(s.id));
              const pct  = skills.length > 0 ? Math.round((entry.checks.length / skills.length) * 100) : 0;
              return (
                <div key={i} style={{ padding:'12px 15px', background:'rgba(255,255,255,0.022)', borderRadius:10, border:'1px solid rgba(255,255,255,0.048)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:12, color:'#666' }}>
                      {entry.date}
                      {entry.mood && <span style={{ marginLeft:8 }}>{MOODS.find(m => m.value === entry.mood)?.emoji}</span>}
                    </span>
                    <span style={{ fontSize:12, color:'#c9a84c' }}>+{entry.checks.length * XP_PER} XP · {pct}%</span>
                  </div>
                  <div style={{ fontSize:18, letterSpacing:2, marginBottom:entry.diary?6:0 }}>
                    {done.map(s => s.emoji).join(' ') || <span style={{ color:'#333', fontSize:13 }}>—</span>}
                  </div>
                  {entry.diary && <div style={{ fontSize:12, color:'#555', fontStyle:'italic', lineHeight:1.5 }}>"{entry.diary.length > 110 ? entry.diary.substring(0,110)+'…' : entry.diary}"</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Skills + goals */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:11, color:'#555', letterSpacing:.7 }}>ATIVIDADES E METAS SEMANAIS</div>
          <button onClick={onAddActivity} style={{ padding:'5px 13px', background:'transparent', border:'1px solid rgba(201,168,76,0.35)', borderRadius:6, color:'#c9a84c', fontSize:12 }}>+ Adicionar</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {skills.map(s => {
            const { lvl } = calcLevel(xpMap[s.id] || 0);
            const goal    = goals[s.id] || 0;
            return (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 13px', background:'rgba(255,255,255,0.018)', borderRadius:8, border:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize:17 }}>{s.emoji}</span>
                <span style={{ flex:1, fontSize:13, color:'#bbb' }}>{s.name}</span>
                <span style={{ fontSize:11, color:'#555' }}>Nv {lvl}</span>
                {/* Goal picker */}
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <button onClick={() => onGoalChange(s.id, Math.max(0, goal - 1))} style={{ width:20, height:20, borderRadius:4, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#666', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>−</button>
                  <span style={{ fontSize:12, color: goal>0?'#c9a84c':'#444', width:22, textAlign:'center' }}>{goal>0 ? `${goal}×` : '—'}</span>
                  <button onClick={() => onGoalChange(s.id, Math.min(7, goal + 1))} style={{ width:20, height:20, borderRadius:4, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#666', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>+</button>
                </div>
                <button onClick={() => onDeleteSkill(s.id)} style={{ background:'transparent', border:'none', color:'#383838', fontSize:18, padding:'2px 5px', lineHeight:1, transition:'color .2s' }} onMouseOver={e => e.currentTarget.style.color='#c05050'} onMouseOut={e => e.currentTarget.style.color='#383838'}>×</button>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize:11, color:'#444', marginTop:10 }}>← defina quantas vezes por semana quer praticar cada atividade</div>
      </div>

      {/* Reminder */}
      <div style={{ marginBottom:28, padding:'16px', background:'rgba(255,255,255,0.022)', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:11, color:'#555', letterSpacing:.7, marginBottom:14 }}>LEMBRETE DIÁRIO</div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <button
            onClick={() => requestReminder(!reminder.enabled, reminder.hour)}
            style={{ width:44, height:24, borderRadius:12, background:reminder.enabled?'rgba(201,168,76,0.3)':'rgba(255,255,255,0.06)', border:`1px solid ${reminder.enabled?'rgba(201,168,76,0.5)':'rgba(255,255,255,0.1)'}`, position:'relative', transition:'all .3s ease', flexShrink:0 }}
          >
            <div style={{ width:18, height:18, borderRadius:'50%', background:reminder.enabled?'#c9a84c':'#444', position:'absolute', top:2, left:reminder.enabled?22:2, transition:'all .3s ease' }} />
          </button>
          <span style={{ fontSize:13, color: reminder.enabled?'#bbb':'#555' }}>
            {reminder.enabled ? 'Ativado' : 'Desativado'}
          </span>
        </div>
        {reminder.enabled && (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:13, color:'#777' }}>Lembrar às</span>
            <select
              value={reminder.hour}
              onChange={e => onReminderChange({ ...reminder, hour: Number(e.target.value) })}
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#c9a84c', padding:'5px 10px', fontSize:13 }}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ fontSize:11, color:'#444', marginTop:10 }}>O lembrete aparece quando você abrir o app após o horário definido, se ainda não registrou nada.</div>
      </div>

      {/* Sync */}
      <div>
        <div style={{ fontSize:11, color:'#555', letterSpacing:.7, marginBottom:14 }}>SINCRONIZAR DADOS</div>
        <div style={{ fontSize:13, color:'#484848', marginBottom:14, lineHeight:1.5 }}>Para usar em outro navegador ou celular, exporte um código e importe lá.</div>
        <div style={{ display:'flex', gap:9 }}>
          <button onClick={() => setShowExport(true)} style={{ flex:1, padding:'11px', borderRadius:9, fontSize:13, fontWeight:500, background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#c9a84c', transition:'all .25s ease' }} onMouseOver={e => e.currentTarget.style.background='rgba(201,168,76,0.18)'} onMouseOut={e => e.currentTarget.style.background='rgba(201,168,76,0.1)'}>↑ Exportar</button>
          <button onClick={() => setShowImport(true)} style={{ flex:1, padding:'11px', borderRadius:9, fontSize:13, fontWeight:500, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#888', transition:'all .25s ease' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>↓ Importar</button>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <div style={{ width:80 }} />;
  const max = Math.max(...data, 1), W = 80, H = 28;
  const pts = data.map((v, i) => `${(i/(data.length-1))*W},${H-(v/max)*(H-5)-2}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:'block', flexShrink:0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Mood chart ────────────────────────────────────────────────────────────────
function MoodChart({ history }) {
  const d  = new Date();
  const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const daysInMonth = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  const moodByDay   = {};
  history.filter(h => h.date.startsWith(mk)).forEach(h => {
    if (h.mood) moodByDay[parseInt(h.date.split('-')[2], 10)] = h.mood;
  });
  const hasAny = Object.keys(moodByDay).length > 0;
  if (!hasAny) return null;

  const moodColors = { 1:'#c05050', 2:'#c07a30', 3:'#888', 4:'#6aaa6a', 5:'#c9a84c' };

  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontSize:11, color:'#555', letterSpacing:.7, marginBottom:14 }}>HUMOR DO MÊS</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day  = i + 1;
          const mood = moodByDay[day];
          const isToday = day === d.getDate();
          return (
            <div key={day} title={mood ? MOODS.find(m => m.value === mood)?.label : 'Sem registro'} style={{ width:30, height:30, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, background: mood ? `${moodColors[mood]}22` : 'rgba(255,255,255,0.025)', border: `1px solid ${isToday ? 'rgba(201,168,76,0.4)' : mood ? `${moodColors[mood]}55` : 'rgba(255,255,255,0.04)'}`, transition:'all .2s' }}>
              {mood ? MOODS.find(m => m.value === mood)?.emoji : <span style={{ fontSize:10, color:'#333' }}>{day}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Summary tab ───────────────────────────────────────────────────────────────
function SummaryTab({ history, skills }) {
  const [aiText,  setAiText]  = useState('');
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const d  = new Date();
  const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const monthH     = history.filter(h => (h.monthKey || h.date.substring(0,7)) === mk);
  const activeDays = monthH.length;
  const totalXp    = monthH.reduce((a, h) => a + h.checks.length * XP_PER, 0);
  const skillStats = skills.map(s => {
    const days = monthH.filter(h => h.checks.includes(s.id)).length;
    const pct  = activeDays > 0 ? Math.round((days / activeDays) * 100) : 0;
    const weeks = [0,1,2,3].map(w => monthH.filter(h => { const day = parseInt(h.date.split('-')[2],10); return day >= w*7+1 && day <= (w+1)*7; }).filter(h => h.checks.includes(s.id)).length);
    return { s, days, pct, weeks, trend: weeks[3] >= weeks[0] ? '#5cb85c' : '#c05050' };
  });
  const generate = async () => {
    setLoading(true); setAiError(''); setAiText('');
    try {
      const entries = monthH.filter(h => h.diary).map(h => h.diary).join('\n\n');
      if (!entries) { setAiError('Nenhuma entrada de diário este mês.'); setLoading(false); return; }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key':process.env.REACT_APP_ANTHROPIC_API_KEY||'', 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
        body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, messages:[{ role:'user', content:`Você é um coach pessoal empático. Com base nas entradas de diário abaixo, escreva um panorama em português de no máximo 4 frases, empático e direto, sem citar datas específicas.\n\n${entries}` }] }),
      });
      const json = await res.json();
      if (json.content?.[0]?.text) setAiText(json.content[0].text);
      else setAiError(json.error?.message || 'Resposta inesperada da API.');
    } catch { setAiError('Erro de conexão. Verifique sua chave de API em .env.local.'); }
    setLoading(false);
  };

  return (
    <div className="tab-panel">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:22 }}>
        {[{ value:activeDays, label:'Dias ativos' }, { value:totalXp, label:'XP total' }].map(({ value, label }) => (
          <div key={label} style={{ padding:'16px', borderRadius:10, textAlign:'center', background:'rgba(201,168,76,0.055)', border:'1px solid rgba(201,168,76,0.18)' }}>
            <div className="golden" style={{ fontSize:30, fontWeight:700 }}>{value}</div>
            <div style={{ fontSize:12, color:'#666', marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      <MoodChart history={history} />

      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:11, color:'#555', letterSpacing:.7, marginBottom:14 }}>POR ATIVIDADE</div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {skillStats.map(({ s, days, pct, weeks, trend }) => (
            <div key={s.id} style={{ padding:'12px 15px', background:'rgba(255,255,255,0.022)', borderRadius:10, border:'1px solid rgba(255,255,255,0.048)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:16 }}>{s.emoji}</span>
                <span style={{ flex:1, fontSize:13, color:'#bbb', minWidth:0 }}>{s.name}</span>
                <span style={{ fontSize:12, color:'#666', flexShrink:0 }}>{days}d · {pct}%</span>
                <Sparkline data={weeks} color={trend} />
              </div>
              <div style={{ height:3, background:'#111', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#c9a84c,#f0d080)', borderRadius:2, transition:'width .5s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'18px', borderRadius:12, background:'rgba(201,168,76,0.035)', border:'1px solid rgba(201,168,76,0.13)' }}>
        <div style={{ fontSize:11, color:'#555', letterSpacing:.7, marginBottom:14 }}>PANORAMA COM IA</div>
        <button onClick={generate} disabled={loading} style={{ width:'100%', padding:'11px', background:loading?'rgba(201,168,76,0.07)':'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.35)', borderRadius:8, color:'#c9a84c', fontSize:13, fontWeight:500, opacity:loading?.7:1, marginBottom:aiText||aiError?16:0, transition:'opacity .2s' }}>
          {loading ? '✦ Gerando panorama…' : '✦ Gerar panorama'}
        </button>
        {aiError && <div style={{ color:'#c05050', fontSize:13 }}>{aiError}</div>}
        {aiText && <div style={{ fontSize:14, color:'#bbb', lineHeight:1.72, fontStyle:'italic', borderLeft:'2px solid rgba(201,168,76,0.28)', paddingLeft:15, animation:'fadeIn .5s ease' }}>{aiText}</div>}
      </div>
    </div>
  );
}

// ── Add activity modal ────────────────────────────────────────────────────────
function AddModal({ onAdd, onClose }) {
  const [emoji, setEmoji] = useState('⭐');
  const [name,  setName]  = useState('');
  const submit = () => { if (!name.trim()) return; onAdd({ emoji: emoji.trim()||'⭐', name: name.trim() }); onClose(); };
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0d0d0d', border:'1px solid rgba(201,168,76,0.22)', borderRadius:14, padding:'26px 22px', width:'100%', maxWidth:340, animation:'levelUpIn .28s ease' }}>
        <div className="golden" style={{ fontSize:17, fontWeight:600, marginBottom:18 }}>Nova atividade</div>
        <div style={{ display:'flex', gap:9, marginBottom:12 }}>
          <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2} style={{ width:54, padding:'10px', borderRadius:8, textAlign:'center', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#fff', fontSize:20 }} />
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key==='Enter'&&submit()} placeholder="Nome da atividade" autoFocus style={{ flex:1, padding:'10px 13px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#ddd', fontSize:14, fontFamily:'inherit' }} />
        </div>
        <div style={{ display:'flex', gap:9 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#555', fontSize:13 }}>Cancelar</button>
          <button onClick={submit} style={{ flex:1, padding:'10px', borderRadius:8, background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.35)', color:'#c9a84c', fontSize:13, fontWeight:500 }}>Adicionar</button>
        </div>
      </div>
    </div>
  );
}

// ── Level-up modal ────────────────────────────────────────────────────────────
function LevelUpModal({ skill, onClose }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0d0d0d', border:'1px solid rgba(201,168,76,0.38)', borderRadius:16, padding:'36px 32px', textAlign:'center', animation:'levelUpIn .38s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 0 60px rgba(201,168,76,0.12)' }}>
        <div style={{ fontSize:52, marginBottom:10 }}>{skill.emoji}</div>
        <div className="shimmer" style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Nível Acima!</div>
        <div style={{ color:'#666', fontSize:14, marginBottom:24 }}>{skill.name}</div>
        <button onClick={onClose} style={{ padding:'10px 28px', borderRadius:8, background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.38)', color:'#c9a84c', fontSize:13, fontWeight:500 }}>Continuar ✦</button>
      </div>
    </div>
  );
}

// ── Achievement modal ─────────────────────────────────────────────────────────
function AchievementModal({ id, onClose }) {
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:310 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0d0d0d', border:'1px solid rgba(201,168,76,0.38)', borderRadius:16, padding:'36px 32px', textAlign:'center', animation:'levelUpIn .38s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 0 60px rgba(201,168,76,0.12)' }}>
        <div style={{ fontSize:12, color:'#666', letterSpacing:1, marginBottom:8 }}>CONQUISTA DESBLOQUEADA</div>
        <div style={{ fontSize:52, marginBottom:10, animation:'achPop .5s cubic-bezier(.34,1.56,.64,1)' }}>{ach.emoji}</div>
        <div className="shimmer" style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>{ach.name}</div>
        <div style={{ color:'#666', fontSize:13, marginBottom:24 }}>{ach.desc}</div>
        <button onClick={onClose} style={{ padding:'10px 28px', borderRadius:8, background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.38)', color:'#c9a84c', fontSize:13, fontWeight:500 }}>Continuar ✦</button>
      </div>
    </div>
  );
}

// ── Reminder banner ───────────────────────────────────────────────────────────
function ReminderBanner({ onDismiss }) {
  return (
    <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:150, background:'rgba(13,13,13,0.95)', border:'1px solid rgba(201,168,76,0.35)', borderRadius:12, padding:'14px 20px', display:'flex', alignItems:'center', gap:14, maxWidth:360, width:'calc(100% - 40px)', animation:'fadeIn .3s ease', boxShadow:'0 4px 30px rgba(0,0,0,0.5)' }}>
      <span style={{ fontSize:22 }}>🔔</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, color:'#ccc', fontWeight:500 }}>Lembrete do dia</div>
        <div style={{ fontSize:12, color:'#666', marginTop:2 }}>Não se esqueça de registrar suas atividades!</div>
      </div>
      <button onClick={onDismiss} style={{ background:'transparent', border:'none', color:'#555', fontSize:20, lineHeight:1, padding:'2px 6px' }}>×</button>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
const FLOAT_ICONS = ['✦','◆','◈','✧','✦','◆','◈','✧'];

export default function App() {
  const [skills, setSkills] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SK.skills)) || DEFAULT_SKILLS; } catch { return DEFAULT_SKILLS; }
  });
  const [xpMap, setXpMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SK.xp)) || {}; } catch { return {}; }
  });
  const [history, setHistory] = useState(() => {
    try { return (JSON.parse(localStorage.getItem(SK.history)) || []).map(h => ({ ...h, monthKey: h.monthKey || h.date.substring(0,7) })); } catch { return []; }
  });
  const [todayState, setTodayState] = useState(() => {
    const t = todayStr();
    try { const s = JSON.parse(localStorage.getItem(SK.today)); if (s?.date === t) return s; } catch {}
    return { date: t, checks: [], diary: '', mood: null };
  });
  const [achievements, setAchievements] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SK.achievements)) || []; } catch { return []; }
  });
  const [goals, setGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SK.goals)) || {}; } catch { return {}; }
  });
  const [reminder, setReminder] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SK.reminder)) || { enabled: false, hour: 21 }; } catch { return { enabled: false, hour: 21 }; }
  });

  const [tab,           setTab]          = useState('today');
  const [showAddModal,  setShowAddModal] = useState(false);
  const [levelUpSkill,  setLevelUpSkill] = useState(null);
  const [achQueue,      setAchQueue]     = useState([]);
  const [showReminder,  setShowReminder] = useState(false);

  // Auto-reset on new day
  useEffect(() => {
    if (todayState.date !== todayStr()) setTodayState({ date: todayStr(), checks: [], diary: '', mood: null });
  });

  // Persist
  useEffect(() => { localStorage.setItem(SK.skills,       JSON.stringify(skills));       }, [skills]);
  useEffect(() => { localStorage.setItem(SK.xp,           JSON.stringify(xpMap));        }, [xpMap]);
  useEffect(() => { localStorage.setItem(SK.today,        JSON.stringify(todayState));   }, [todayState]);
  useEffect(() => { localStorage.setItem(SK.history,      JSON.stringify(history));      }, [history]);
  useEffect(() => { localStorage.setItem(SK.achievements, JSON.stringify(achievements)); }, [achievements]);
  useEffect(() => { localStorage.setItem(SK.goals,        JSON.stringify(goals));        }, [goals]);
  useEffect(() => { localStorage.setItem(SK.reminder,     JSON.stringify(reminder));     }, [reminder]);

  // Sync today → history
  useEffect(() => {
    setHistory(prev => {
      const idx   = prev.findIndex(h => h.date === todayState.date);
      const empty = todayState.checks.length === 0 && !todayState.diary && !todayState.mood;
      if (empty && idx < 0)  return prev;
      if (empty && idx >= 0) return prev.filter((_, i) => i !== idx);
      const entry = { date: todayState.date, monthKey: monthKey(todayState.date), checks: [...todayState.checks], diary: todayState.diary, mood: todayState.mood };
      if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
      return [...prev, entry];
    });
  }, [todayState]);

  // Check achievements
  useEffect(() => {
    const newIds = checkNewAchievements({ skills, xpMap, history, todayState, unlockedIds: achievements.map(a => a.id) });
    if (newIds.length > 0) {
      setAchievements(prev => [...prev, ...newIds.map(id => ({ id, unlockedAt: todayStr() }))]);
      setAchQueue(prev => [...prev, ...newIds]);
    }
  }, [todayState, xpMap, skills]);

  // Reminder check on mount
  useEffect(() => {
    if (!reminder.enabled) return;
    const now = new Date();
    if (now.getHours() >= reminder.hour && todayState.checks.length === 0) {
      setShowReminder(true);
      if (Notification.permission === 'granted') {
        new Notification('Life Tracker 🎯', { body: 'Não esqueça de registrar seu dia!' });
      }
    }
  }, []);

  const handleToggle = useCallback((skillId) => {
    const wasChecked = todayState.checks.includes(skillId);
    setXpMap(prev => {
      const next = { ...prev };
      const oldXp = next[skillId] || 0;
      next[skillId] = Math.max(0, oldXp + (wasChecked ? -XP_PER : XP_PER));
      if (!wasChecked) {
        const oldLvl = calcLevel(oldXp).lvl, newLvl = calcLevel(next[skillId]).lvl;
        if (newLvl > oldLvl) { const sk = skills.find(s => s.id === skillId); if (sk) setTimeout(() => setLevelUpSkill(sk), 320); }
      }
      return next;
    });
    setTodayState(prev => ({ ...prev, checks: wasChecked ? prev.checks.filter(id => id !== skillId) : [...prev.checks, skillId] }));
  }, [todayState.checks, skills]);

  const handleDiaryChange = useCallback((text) => setTodayState(p => ({ ...p, diary: text })), []);
  const handleMoodChange  = useCallback((val)  => setTodayState(p => ({ ...p, mood: val })),  []);
  const handleGoalChange  = useCallback((id, val) => setGoals(p => ({ ...p, [id]: val })), []);
  const handleAddActivity = useCallback(({ emoji, name }) => setSkills(prev => [...prev, { id: `c_${Date.now()}`, emoji, name, isDefault: false }]), []);
  const handleDeleteSkill = useCallback((id) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    setXpMap(prev  => { const n = { ...prev }; delete n[id]; return n; });
    setGoals(prev  => { const n = { ...prev }; delete n[id]; return n; });
    setTodayState(prev => ({ ...prev, checks: prev.checks.filter(c => c !== id) }));
  }, []);

  const currentAch = achQueue[0];
  const dismissAch = () => setAchQueue(prev => prev.slice(1));

  const TABS = [{ key:'today', label:'Hoje' }, { key:'panel', label:'Painel' }, { key:'summary', label:'Resumo' }];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <CanvasBackground />
      <div style={{ position:'fixed', inset:0, zIndex:1, pointerEvents:'none', opacity:.18, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")` }} />
      {FLOAT_ICONS.map((ic, i) => (
        <div key={i} className="float" style={{ position:'fixed', left:`${8+i*12}%`, top:`${15+(i%4)*18}%`, color:'rgba(201,168,76,0.07)', fontSize:20+(i%3)*6, zIndex:1, pointerEvents:'none', animationDelay:`${i*.6}s`, animationDuration:`${3.2+i*.5}s` }}>{ic}</div>
      ))}

      <Header xpMap={xpMap} history={history} />

      <div style={{ position:'relative', zIndex:2, maxWidth:700, margin:'0 auto', padding:'80px 15px 32px' }}>
        <div style={{ display:'flex', gap:2, marginBottom:20, background:'rgba(255,255,255,0.025)', borderRadius:10, padding:3 }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex:1, padding:'9px 0', borderRadius:8, fontSize:13, fontWeight:tab===key?600:400, color:tab===key?'#c9a84c':'#4a4a4a', background:tab===key?'linear-gradient(135deg,rgba(201,168,76,0.13),rgba(212,175,55,0.07))':'transparent', border:tab===key?'1px solid rgba(201,168,76,0.22)':'1px solid transparent', transition:'all .25s ease' }}>{label}</button>
          ))}
        </div>

        {tab === 'today' && (
          <TodayTab skills={skills} checks={todayState.checks} xpMap={xpMap} onToggle={handleToggle}
            diary={todayState.diary} onDiaryChange={handleDiaryChange}
            onAddActivity={() => setShowAddModal(true)} onDeleteSkill={handleDeleteSkill}
            mood={todayState.mood} onMoodChange={handleMoodChange}
            goals={goals} history={history}
          />
        )}
        {tab === 'panel' && (
          <PanelTab history={history} skills={skills} xpMap={xpMap}
            onDeleteSkill={handleDeleteSkill} onAddActivity={() => setShowAddModal(true)}
            goals={goals} onGoalChange={handleGoalChange}
            reminder={reminder} onReminderChange={setReminder}
            achievements={achievements}
          />
        )}
        {tab === 'summary' && <SummaryTab history={history} skills={skills} />}
      </div>

      {showAddModal  && <AddModal onAdd={handleAddActivity} onClose={() => setShowAddModal(false)} />}
      {levelUpSkill  && <LevelUpModal skill={levelUpSkill} onClose={() => setLevelUpSkill(null)} />}
      {currentAch    && <AchievementModal id={currentAch} onClose={dismissAch} />}
      {showReminder  && <ReminderBanner onDismiss={() => setShowReminder(false)} />}
    </>
  );
}
