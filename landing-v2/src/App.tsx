import React, { useEffect, useRef, useState } from 'react';
import { PRODUCT_HOME_URL, AVAILABLE_OCCASIONS, LEGAL_LINKS, SOCIAL_LINKS } from './config';
import logo from './art/logo.jpg';
import heroArt from './art/hero.jpg';
import mheroArt from './art/mhero.jpg';
import mmenuArt from './art/mmenu.jpg';
import noteArt from './art/note.jpg';
import storyR from './art/storyr.jpg';
import storyTop from './art/storytop.jpg';
import diffArt from './art/diff.jpg';
import cDates from './art/c_dates.jpg';
import cBday from './art/c_bday.jpg';
import cProp from './art/c_prop.jpg';
import cCel from './art/c_cel.jpg';
import cGrp from './art/c_grp.jpg';
import oDates from './art/o_dates.jpg';
import oBday from './art/o_bday.jpg';
import promiseArt from './art/promise.jpg';
import finalArt from './art/final.jpg';
import dates from './photos/dates.jpg';
import prep1 from './photos/prep1.jpg';
import prep2 from './photos/prep2.jpg';
import prep3 from './photos/prep3.jpg';
import proposals from './photos/proposals.jpg';
import finalPh from './photos/final.jpg';

/* Scroll to a section. Works top-level and inside the hosted viewer frame. */
function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const y = el.getBoundingClientRect().top + window.scrollY - 76;
  window.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  try { history.replaceState(null, '', '#' + id); } catch { /* sandboxed */ }
  const h = el.querySelector('h2');
  if (h) { h.classList.add('flash'); setTimeout(() => h.classList.remove('flash'), 1400); }
}
const nav = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); goTo(id); };

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a className={'logo' + (light ? ' light' : '')} href="#top" aria-label="milo, for moments that matter. Back to top"
      onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); try { history.replaceState(null, '', '#top'); } catch { /* */ } }}>
      <img src={logo} alt="milo. For moments that matter." />
    </a>
  );
}

const Arrow = () => <svg className="arr" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><path d="M1 6h15M11 1l5 5-5 5" /></svg>;

function CTA({ children = 'Plan a moment', where, className = '' }: { children?: React.ReactNode; where: string; className?: string }) {
  const [note, setNote] = useState(false);
  const pending = !PRODUCT_HOME_URL;
  return (
    <span className="cta-wrap">
      <a className={'cta ' + className} data-where={where} href={pending ? '#cta-pending' : PRODUCT_HOME_URL}
        onClick={(e) => { if (pending) { e.preventDefault(); setNote(true); setTimeout(() => setNote(false), 4000); } }}>
        <span>{children}</span><Arrow />
      </a>
      {note && <span className="cta-note" role="status">Product link not configured yet (PRODUCT_HOME_URL).</span>}
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 24); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  const links: [string, string][] = [['how-it-works', 'How it works'], ['moments', 'Moments'], ['our-promise', 'Our promise']];
  return (
    <header className={'hdr' + (scrolled ? ' scrolled' : '') + (open ? ' open' : '')}>
      <div className="wrap hdr-in">
        <Logo />
        <nav className="nav" aria-label="Main">{links.map(([id, l]) => <a key={id} href={'#' + id} onClick={nav(id)}>{l}</a>)}</nav>
        <div className="hdr-right">
          <span className="hdr-cta"><CTA where="header" className="sm">Plan a moment</CTA></span>
          <button className="burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">{open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 7h18M3 12h18M3 17h18" />}</svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="menu">
          {links.map(([id, l]) => <a key={id} href={'#' + id} onClick={(e) => { e.preventDefault(); setOpen(false); setTimeout(() => goTo(id), 60); }}>{l}</a>)}
          <CTA where="menu">Plan a moment</CTA>
          <img className="menu-art" src={mmenuArt} alt="" />
        </div>
      )}
    </header>
  );
}

const Play = () => <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15.5" fill="none" strokeWidth="1.4" /><path d="M14 11.5l9 5.5-9 5.5z" /></svg>;

function Hero() {
  return (
    <section className="hero wrap" id="top">
      <div className="hero-text">
        <p className="label">FOR MOMENTS THAT MATTER.</p>
        <h1>You make<br />the memories.<br />We make<br />them happen.</h1>
        <p className="promise">We plan it. We book it. We make it happen.</p>
        <CTA where="hero" className="lg">Plan a moment</CTA>
        <a className="seehow" href="#how-it-works" onClick={nav('how-it-works')}><Play /><span>See how it works</span></a>
      </div>
      <div className="hero-art"><img src={heroArt} alt="A couple at a candlelit rooftop dinner at sunset, with a handwritten note and a snapshot" fetchPriority="high" /></div>
      <div className="hero-mart"><img src={mheroArt} alt="A couple at a candlelit dinner. Thoughtful details. Beautiful moments." /></div>
      <ul className="signals">
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27S4 20 4 11.5A6.2 6.2 0 0 1 16 9a6.2 6.2 0 0 1 12 2.5C28 20 16 27 16 27z" /></svg><span>Personalised<br />for you</span></li>
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="6" width="24" height="22" rx="3" /><path d="M4 13h24M11 3v6M21 3v6" /></svg><span>End-to-end<br />planning &amp; booking</span></li>
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="11" r="4.5" /><circle cx="23" cy="13" r="3.4" /><path d="M3 27c0-5 4-8 9-8s9 3 9 8M20 20c4 0 8 2 8 6" /></svg><span>Real people<br />on-ground support</span></li>
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="4.5" /><path d="M16 3v5M16 24v5M3 16h5M24 16h5M6.8 6.8l3.5 3.5M21.7 21.7l3.5 3.5M25.2 6.8l-3.5 3.5M10.3 21.7l-3.5 3.5" /></svg><span>Thoughtful<br />details</span></li>
      </ul>
    </section>
  );
}

const STAGES = [['Tell us', 'what matters'], ['We plan', 'your experience'], ['We make', 'the bookings'], ['We prepare', 'everything'], ['You enjoy', 'the moment']];
const STAGE_COPY: [string, string, string][] = [
  ['It starts with', 'what matters to you.', 'You share the occasion, your preferences and a few details. We take it from there.'],
  ['We shape it', 'into a plan.', 'A dinner, something creative, a personal touch. Pulled together into one simple sequence.'],
  ['We make', 'the bookings.', 'Venues, timings and details are arranged and kept in step, so you do not have to chase anything.'],
  ['We prepare it', 'on the ground.', 'People arrange, coordinate and run a final check, so everything is ready before you arrive.'],
  ['You enjoy', 'the moment.', 'You show up. The rest is already in place.'],
];

function StageArt({ s }: { s: number }) {
  if (s === 0) return <img className="note-art" src={noteArt} alt="A pinned note reading: Make our anniversary special." />;
  if (s === 1) return (<div className="s1"><div className="mini">Make our anniversary special.</div><div className="ph">{[dates, prep1, proposals].map((p, i) => <img key={i} src={p} alt="" style={{ animationDelay: i * 90 + 'ms' }} />)}</div><p className="tag">Sample itinerary · illustrative only</p></div>);
  if (s === 2) return (<div className="ticket"><p className="tiny">ILLUSTRATIVE SAMPLE · NOT A REAL BOOKING</p>{[['Venue', 'Sample venue'], ['Time', '7:30 pm'], ['Status', 'Confirmed (sample)'], ['Schedule', 'Dinner, then a short walk']].map(([a, b], i) => <p className="row" key={a} style={{ animationDelay: i * 120 + 'ms' }}><span className="ck">✓</span><span>{a}</span><b>{b}</b></p>)}<div className="progress"><i /></div></div>);
  if (s === 3) return (<div className="trio">{[[prep1, 'Arranging'], [prep3, 'Coordinating'], [prep2, 'Ready']].map(([p, l], i) => <figure key={l} style={{ animationDelay: i * 140 + 'ms' }}><img src={p} alt={l} /><figcaption>{l}</figcaption></figure>)}</div>);
  return (<div className="enjoy"><img src={finalPh} alt="A couple enjoying an evening on a rooftop" /><span>You enjoy the moment.</span></div>);
}

function Story() {
  const [s, setS] = useState(0);
  const tx = useRef(0);
  const go = (n: number) => setS(Math.max(0, Math.min(4, n)));
  return (
    <section className="story" id="how-it-works" tabIndex={-1}>
      <img className="story-top" src={storyTop} alt="" aria-hidden="true" />
      <div className="wrap">
        <p className="label gray">HOW IT WORKS</p>
        <h2>From an idea to a moment you’ll remember.</h2>
        <p className="sub">You tell us what matters. We take care of the rest.</p>
        <ol className="stages" aria-label="Stages">
          {STAGES.map((t, i) => (
            <li key={t[0]}><button className={i === s ? 'on' : ''} aria-current={i === s ? 'step' : undefined} onClick={() => setS(i)}><span className="dot">{i + 1}</span><span className="st">{t[0]}<br />{t[1]}</span></button></li>
          ))}
        </ol>
        <div className="stage-body" onTouchStart={(e) => (tx.current = e.touches[0].clientX)} onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - tx.current; if (Math.abs(d) > 50) go(s + (d < 0 ? 1 : -1)); }}>
          <div className="stage-art" key={'a' + s}><StageArt s={s} /></div>
          <div className="stage-text" key={'t' + s}>
            <h3>{STAGE_COPY[s][0]}<br />{STAGE_COPY[s][1]}</h3>
            <p>{STAGE_COPY[s][2]}</p>
            <div className="arrows">
              <button aria-label="Previous stage" disabled={s === 0} onClick={() => go(s - 1)}>←</button>
              <span>{s + 1} / 5</span>
              <button aria-label="Next stage" disabled={s === 4} onClick={() => go(s + 1)}>→</button>
            </div>
          </div>
          <img className="stage-r" src={storyR} alt="" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

const OCC = [
  { id: 'dates', name: 'Dates & Anniversaries', short: 'Make time together feel special.', img: cDates, tag: 'DATES & ANNIVERSARIES', h: 'Make time together feel special.', p: 'Thoughtful experiences, from cozy evenings to once-in-a-kind adventures.' },
  { id: 'birthdays', name: 'Birthdays', short: 'Make their day feel like theirs.', img: cBday, tag: 'BIRTHDAYS', h: 'Make their day feel like theirs.', p: 'Thoughtful experiences designed around what they love.' },
  { id: 'proposals', name: 'Proposals', short: 'For the question they’ll always remember.', img: cProp, tag: 'PROPOSALS', h: 'For the question they’ll always remember.', p: 'A quiet, private setting made for one important question.' },
  { id: 'celebrations', name: 'Celebrations', short: 'Good times deserve great memories.', img: cCel, tag: 'CELEBRATIONS', h: 'Good times deserve great memories.', p: 'Small gatherings and big wins, taken care of.' },
  { id: 'groups', name: 'Group experiences', short: 'More people. More stories.', img: cGrp, tag: 'GROUP EXPERIENCES', h: 'More people. More stories.', p: 'Shared experiences for friends and family together.' },
];

function Moments() {
  const [open, setOpen] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const occ = OCC.find((o) => o.id === open);
  const live = (id: string) => AVAILABLE_OCCASIONS.includes(id);
  const step = (d: number) => { const n = Math.max(0, Math.min(OCC.length - 1, idx + d)); setIdx(n); const el = rail.current?.children[n] as HTMLElement | undefined; if (el && rail.current) rail.current.scrollTo({ left: el.offsetLeft - 8, behavior: 'smooth' }); };
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  const Pill = ({ id }: { id: string }) => live(id) ? <span className="pill live"><i />Available in Bengaluru</span> : <span className="pill soon">Coming soon</span>;
  return (
    <section className="moments" id="moments" tabIndex={-1}>
      <div className="wrap">
        {!occ ? (
          <div className="mo-grid">
            <div className="mo-left">
              <p className="label gray">MOMENTS</p>
              <h2>Every moment<br />has a story.</h2>
              <p className="sub">Big celebrations. Little surprises. Everything in between.</p>
              <img className="diff" src={diffArt} alt="Different moments. Same thoughtfulness." />
            </div>
            <div className="mo-right">
              <button className="rail-btn l" aria-label="Previous moment" onClick={() => step(-1)} disabled={idx === 0}>‹</button>
              <div className="rail" ref={rail}>
                {OCC.map((o, i) => (
                  <button key={o.id} className={'occ' + (i === idx ? ' on' : '')} style={{ ['--r' as any]: [-1.2, .8, -.6, 1, -.8][i] + 'deg' }} onClick={() => setOpen(o.id)} disabled={o.id === 'groups'} aria-label={o.id === 'groups' ? o.name + ', coming soon' : 'Open ' + o.name}>
                    <img src={o.img} alt="" />
                    <b>{o.name}</b><em>{o.short}</em><Pill id={o.id} />
                  </button>
                ))}
              </div>
              <button className="rail-btn r" aria-label="Next moment" onClick={() => step(1)} disabled={idx === OCC.length - 1}>›</button>
              <div className="dots">{OCC.map((o, i) => <i key={o.id} className={i === idx ? 'on' : ''} />)}</div>
            </div>
          </div>
        ) : (
          <div className={'detail ' + (occ.id === 'birthdays' ? 'flip' : '')} key={occ.id}>
            <div className="d-text">
              <p className="label coral">{occ.tag}</p>
              <h2>{occ.h}</h2>
              <p className="d-p">{occ.p}</p>
              <Pill id={occ.id} />
              <div className="d-actions">
                {live(occ.id) ? <CTA where="occasion">Plan a moment</CTA> : null}
                <button className={'back' + (live(occ.id) ? '' : ' outline')} onClick={() => setOpen(null)}>← Back to moments</button>
              </div>
            </div>
            <div className="d-art">
              {occ.id === 'dates' ? <img src={oDates} alt="Dates and anniversaries" /> : occ.id === 'birthdays' ? <img src={oBday} alt="Birthdays" /> : <div className="polaroid"><img src={occ.img} alt={occ.name} /></div>}
            </div>
            <button className="close" aria-label="Close" onClick={() => setOpen(null)}>✕</button>
          </div>
        )}
      </div>
    </section>
  );
}

function Promise_() {
  const [zoom, setZoom] = useState(false);
  return (
    <section className="promise-sec" id="our-promise" tabIndex={-1}>
      <div className="wrap pr-grid">
        <div className="pr-text">
          <p className="label gray">OUR PROMISE</p>
          <h2>More than<br />just bookings.</h2>
          <p className="pr-p"><b>Real people help</b> make your special moments happen. We work with trusted venues and partners, coordinate every detail, and provide on-ground support to make sure it all comes together beautifully.</p>
          <a className="cta outline" href="#how-it-works" onClick={nav('how-it-works')}><span>See how it works</span><Arrow /></a>
        </div>
        <button className="pr-art" onClick={() => setZoom(!zoom)} aria-label={zoom ? 'Shrink image' : 'Enlarge image'} aria-pressed={zoom}>
          <img src={promiseArt} alt="Thoughtful preparation, careful coordination with our partners, real people on the ground" />
        </button>
      </div>
      {zoom && <div className="wrap"><div className="pr-zoom"><img src={promiseArt} alt="" /><button className="close" aria-label="Close" onClick={() => setZoom(false)}>✕</button></div></div>}
    </section>
  );
}

function Final() {
  return (
    <section className="final-sec">
      <div className="wrap">
        <div className="final">
          <img src={finalArt} alt="A couple watching the city lights come on from a rooftop" loading="lazy" />
          <div className="final-in">
            <h2>Your next special<br />moment starts here.</h2>
            <p>You bring the reason.<br />We’ll help make it memorable.</p>
            <CTA where="final" className="lg">Plan a moment</CTA>
          </div>
        </div>
      </div>
    </section>
  );
}

const Soc = ({ k }: { k: string }) => k === 'ig' ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" /></svg> : k === 'x' ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="3.5" /><path d="M10 9.5v5l4.5-2.5z" /></svg>;

function Footer() {
  return (
    <footer className="foot-sec">
      <div className="wrap">
        <div className="foot">
          <div className="foot-top">
            <Logo light />
            <nav className="fnav" aria-label="Footer">
              {[['how-it-works', 'How it works'], ['moments', 'Moments'], ['our-promise', 'Our promise']].map(([id, l]) => <a key={id} href={'#' + id} onClick={nav(id)}>{l}</a>)}
              <span className="soc">{['ig', 'x', 'yt'].map((k, i) => SOCIAL_LINKS[i] ? <a key={k} href={SOCIAL_LINKS[i].url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LINKS[i].label}><Soc k={k} /></a> : <span key={k} className="off" aria-hidden="true" title="Link not configured"><Soc k={k} /></span>)}</span>
            </nav>
          </div>
          <div className="foot-bot">
            <span>© 2026 <b>Milo</b>. All rights reserved.</span>
            <span className="legal">{LEGAL_LINKS.map((l) => l.url ? <a key={l.label} href={l.url}>{l.label}</a> : <span key={l.label} className="off" title="Policy page not configured yet">{l.label}</span>)}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function App() {
  return (<><a className="skip" href="#top" onClick={nav('top')}>Skip to content</a><Header /><main><Hero /><Story /><Moments /><Promise_ /><Final /></main><Footer /></>);
}
