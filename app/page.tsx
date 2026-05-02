"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ─── static data ────────────────────────────────────── */
const OVERDUE = [
  { name:"Sharma Medicals", amount:"₹18,000", days:14 },
  { name:"Ritu Coaching",   amount:"₹6,500",  days:8  },
  { name:"Patel Hardware",  amount:"₹31,200", days:22 },
  { name:"Arjun Traders",   amount:"₹9,800",  days:5  },
];

const TESTIMONIALS = [
  {
    quote:"We were losing track of at least ₹40,000 every month. CollectPro recovered it within the first two weeks.",
    name:"Deepak Nair", role:"Owner, Nair Auto Parts, Pune",
  },
  {
    quote:"My staff used to spend hours calling students for fees. Now reminders go automatically. Game changer.",
    name:"Sunita Agarwal", role:"Director, Bright Future Coaching, Nagpur",
  },
  {
    quote:"Simple, clean, works. I can see every pending payment in seconds. Worth every rupee.",
    name:"Ravi Bhatia", role:"Founder, Bhatia Dental Clinic, Mumbai",
  },
];

const USE_CASES = [
  { icon:"🏋️", label:"Gyms & Fitness" },
  { icon:"📚", label:"Coaching Classes" },
  { icon:"🦷", label:"Clinics" },
  { icon:"🏠", label:"Rent & PGs" },
  { icon:"🛒", label:"Suppliers" },
  { icon:"💈", label:"Salons" },
  { icon:"🏫", label:"Schools" },
  { icon:"⚙️", label:"Agencies" },
];

const FEATURES = [
  {
    n:"01", title:"Track every unpaid rupee",
    body:"One dashboard. Every customer, every amount, every due date. Nothing slips through ever again.",
  },
  {
    n:"02", title:"Recurring billing cycles",
    body:"Set weekly, monthly, quarterly or yearly cycles. Next due date auto-calculates the moment a payment is marked paid.",
  },
  {
    n:"03", title:"Automatic daily reminders",
    body:"Every morning, reminders go out automatically to customers due today or in 2 days. No manual work. Ever.",
  },
  {
    n:"04", title:"One-tap WhatsApp reminders",
    body:"Manual reminder? One tap. Automatic reminder? Already sent. Either way — customer gets the message.",
  },
  {
    n:"05", title:"Payment history per customer",
    body:"See every payment a customer has made, when they paid, and what's still outstanding.",
  },
  {
    n:"06", title:"Recovery rate dashboard",
    body:"Track what percentage of dues you've collected this month. Watch the number go up.",
  },
];

const REMINDER_STEPS = [
  {
    timing:"3 days before",
    color:"#818cf8",
    bg:"rgba(99,102,241,.08)",
    border:"rgba(99,102,241,.2)",
    msg:"Hi Rahul, your payment of ₹6,500 is due on 18 Apr. Please pay on time. — CollectPro",
  },
  {
    timing:"Due today",
    color:"#fbbf24",
    bg:"rgba(251,191,36,.08)",
    border:"rgba(251,191,36,.2)",
    msg:"Reminder: your payment of ₹6,500 is due TODAY. Please clear it at your earliest. — CollectPro",
  },
  {
    timing:"3 days overdue",
    color:"#f87171",
    bg:"rgba(248,113,113,.08)",
    border:"rgba(248,113,113,.2)",
    msg:"Your payment of ₹6,500 is 3 days overdue. Kindly clear your dues immediately. — CollectPro",
  },
];

const CYCLES = [
  { label:"Weekly",    sub:"Every 7 days",    color:"#818cf8", bg:"rgba(99,102,241,.08)",  border:"rgba(99,102,241,.18)"  },
  { label:"Monthly",   sub:"Every 30 days",   color:"#c8f55a", bg:"rgba(200,245,90,.06)",  border:"rgba(200,245,90,.2)"   },
  { label:"Quarterly", sub:"Every 3 months",  color:"#fbbf24", bg:"rgba(251,191,36,.07)",  border:"rgba(251,191,36,.18)"  },
  { label:"Yearly",    sub:"Every 12 months", color:"#f87171", bg:"rgba(248,113,113,.07)", border:"rgba(248,113,113,.18)" },
];

const FAQS = [
  {
    q:"Do I need to install anything?",
    a:"No. CollectPro runs entirely in your browser. Open the link, add your customers, and you're live in under 5 minutes.",
  },
  {
    q:"How does the WhatsApp reminder work?",
    a:"When you click 'Send Reminder', CollectPro opens WhatsApp with the customer's number and a pre-written message already filled in. You just tap send.",
  },
  {
    q:"What happens when I mark a payment as paid?",
    a:"The next due date is automatically calculated based on the billing cycle you set. The customer moves back to 'Pending' for the next cycle. No manual work.",
  },
  {
    q:"Is my data safe?",
    a:"Your data is stored securely and never shared with third parties. We're building for Indian businesses and take privacy seriously.",
  },
];

/* ─── hooks ──────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return scrolled;
}

function useCountUp(target: number, duration = 1600) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      let s = 0;
      const step = (target / duration) * 16;
      const t = setInterval(() => {
        s = Math.min(s + step, target);
        setVal(Math.floor(s));
        if (s >= target) clearInterval(t);
      }, 16);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return { val, ref };
}

/* ─── component ──────────────────────────────────────── */
export default function Home() {
  const scrolled = useNavScroll();
  useScrollReveal();

  const [heroCount, setHeroCount] = useState(0);
  useEffect(() => {
    let s = 0; const step = (42 / 1800) * 16;
    const t = setInterval(() => {
      s = Math.min(s + step, 42); setHeroCount(Math.floor(s));
      if (s >= 42) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, []);

  const c1 = useCountUp(35);
  const c2 = useCountUp(10);
  const c3 = useCountUp(5);

  const spotRef = useRef<HTMLDivElement>(null);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotRef.current) {
      spotRef.current.style.left = e.clientX - 200 + "px";
      spotRef.current.style.top  = e.clientY - 200 + "px";
    }
  }, []);

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [openFaq,   setOpenFaq]   = useState<number | null>(null);

  return (
    <main
      onMouseMove={onMouseMove}
      style={{ background:"#0a0a0a", color:"#ececec", minHeight:"100vh", fontFamily:"'Inter',sans-serif", overflowX:"hidden", position:"relative" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        @keyframes ticker  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes rowIn   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes barGrow { from{transform:scaleY(0)} to{transform:scaleY(1)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }
        @keyframes menuIn  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes faqOpen { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

        .reveal {
          opacity:0; transform:translateY(32px);
          transition:opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1);
        }

        .nav-a { color:rgba(236,236,236,.35); text-decoration:none; font-size:14px; font-weight:400; letter-spacing:.02em; transition:color .2s; }
        .nav-a:hover { color:#ececec; }

        .btn-primary {
          position:relative; overflow:hidden;
          background:#c8f55a; color:#0a0a0a; border:none;
          padding:14px 34px; font-family:'Inter',sans-serif; font-size:14px; font-weight:500;
          letter-spacing:.01em; cursor:pointer; border-radius:2px;
          transition:background .18s, transform .12s;
        }
        .btn-primary::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.45) 50%,transparent 60%);
          background-size:200% auto; opacity:0; transition:opacity .2s;
        }
        .btn-primary:hover { background:#b8e84a; transform:translateY(-1px); }
        .btn-primary:hover::after { opacity:1; animation:shimmer .6s linear; }

        .btn-ghost {
          background:transparent; color:rgba(236,236,236,.4);
          border:1px solid rgba(236,236,236,.1); padding:14px 34px;
          font-family:'Inter',sans-serif; font-size:14px;
          cursor:pointer; border-radius:2px;
          transition:border-color .18s, color .18s;
        }
        .btn-ghost:hover { border-color:rgba(236,236,236,.25); color:#ececec; }

        .stat-card   { padding:32px 28px; border:1px solid rgba(236,236,236,.07); background:rgba(255,255,255,.02); transition:border-color .25s; }
        .stat-card:hover { border-color:rgba(236,236,236,.14); }
        .stat-card-g { padding:32px 28px; border:1px solid rgba(200,245,90,.14); background:rgba(200,245,90,.04); transition:border-color .25s; }
        .stat-card-g:hover { border-color:rgba(200,245,90,.26); }

        .overdue-row { display:flex; align-items:center; justify-content:space-between; padding:16px 0; border-bottom:1px solid rgba(236,236,236,.055); animation:rowIn .35s ease both; }
        .overdue-row:last-child { border-bottom:none; }

        .ticker-wrap  { overflow:hidden; border-top:1px solid rgba(236,236,236,.065); border-bottom:1px solid rgba(236,236,236,.065); padding:12px 0; }
        .ticker-track { display:flex; width:max-content; gap:60px; animation:ticker 28s linear infinite; }
        .ticker-item  { font-size:11px; font-weight:400; letter-spacing:.11em; text-transform:uppercase; color:rgba(236,236,236,.2); white-space:nowrap; }
        .t-dot        { display:inline-block; width:3px; height:3px; border-radius:50%; background:#c8f55a; margin:0 60px 1px 0; vertical-align:middle; }

        .feat-card { padding:44px 38px; border:1px solid rgba(236,236,236,.07); background:rgba(255,255,255,.018); transition:border-color .25s, background .25s; }
        .feat-card:hover { border-color:rgba(200,245,90,.18); background:rgba(200,245,90,.025); }

        .bar  { border-radius:2px; transform-origin:bottom; animation:barGrow .6s cubic-bezier(.22,.61,.36,1) both; }
        .live-dot { width:7px; height:7px; border-radius:50%; background:#c8f55a; animation:pulse 2s ease-in-out infinite; }

        .send-lnk { font-size:10px; letter-spacing:.07em; text-transform:uppercase; color:#c8f55a; background:none; border:none; font-family:'Inter',sans-serif; cursor:pointer; padding:0; margin-top:3px; transition:opacity .15s; }
        .send-lnk:hover { opacity:.6; }

        .price-row { display:flex; justify-content:space-between; align-items:center; padding:20px 0; border-bottom:1px solid rgba(236,236,236,.055); }
        .price-row:last-child { border-bottom:none; }

        .tcard { padding:40px 36px; border:1px solid rgba(236,236,236,.07); background:rgba(255,255,255,.018); transition:border-color .25s; }
        .tcard:hover { border-color:rgba(200,245,90,.15); }

        .use-chip {
          display:flex; align-items:center; gap:10px;
          padding:12px 20px;
          border:1px solid rgba(236,236,236,.08);
          background:rgba(255,255,255,.025);
          border-radius:2px; font-size:13px; font-weight:400;
          color:rgba(236,236,236,.6);
          transition:border-color .2s, color .2s, background .2s;
          white-space:nowrap;
        }
        .use-chip:hover { border-color:rgba(200,245,90,.2); color:#ececec; background:rgba(200,245,90,.03); }

        .faq-row {
          border-bottom:1px solid rgba(236,236,236,.07);
          cursor:pointer;
        }
        .faq-row:last-child { border-bottom:none; }
        .faq-answer { animation:faqOpen .2s ease; }

        .mob-menu { animation:menuIn .22s ease both; }

        @media (max-width:768px) {
          .desktop-nav { display:none !important; }
          .mob-toggle  { display:flex !important; }
          .hero-grid   { grid-template-columns:1fr !important; }
          .feat-grid   { grid-template-columns:1fr !important; }
          .feat-grid-2 { grid-template-columns:1fr !important; }
          .stats-grid  { grid-template-columns:1fr !important; }
          .how-grid    { grid-template-columns:1fr !important; gap:40px !important; }
          .cta-grid    { grid-template-columns:1fr !important; }
          .test-grid   { grid-template-columns:1fr !important; }
          .cycle-grid  { grid-template-columns:1fr 1fr !important; }
          .hero-right  { display:none !important; }
          .remind-grid { grid-template-columns:1fr !important; }
          section, nav, footer { padding-left:24px !important; padding-right:24px !important; }
        }
      `}</style>

      {/* spotlight */}
      <div ref={spotRef} style={{
        position:"fixed", width:400, height:400, borderRadius:"50%", pointerEvents:"none", zIndex:0,
        background:"radial-gradient(circle, rgba(200,245,90,.045) 0%, transparent 70%)",
        transition:"left .12s ease, top .12s ease",
      }}/>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"24px 64px",
        borderBottom: scrolled ? "1px solid rgba(236,236,236,.1)" : "1px solid rgba(236,236,236,.06)",
        position:"sticky", top:0,
        background: scrolled ? "rgba(10,10,10,.97)" : "rgba(10,10,10,.93)",
        backdropFilter:"blur(14px)", zIndex:200,
        transition:"border-color .3s, background .3s",
      }}>
        <span style={{ fontSize:20, fontWeight:600, letterSpacing:"-0.02em" }}>
          Collect<span style={{ color:"#c8f55a" }}>Pro</span>
        </span>
        <div className="desktop-nav" style={{ display:"flex", gap:40 }}>
          <a href="#features" className="nav-a">Features</a>
          <a href="#how"      className="nav-a">How it works</a>
          <a href="#pricing"  className="nav-a">Pricing</a>
          <a href="#faq"      className="nav-a">FAQ</a>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <a href="/dashboard" className="btn-ghost desktop-nav" style={{ padding:"10px 24px", fontSize:14, textDecoration:"none", display:"inline-block" }}>
            Login
          </a>
          <button className="mob-toggle" onClick={() => setMenuOpen(o=>!o)}
            style={{ display:"none", flexDirection:"column", gap:5, background:"none", border:"none", cursor:"pointer", padding:4 }}>
            {[0,1,2].map(i => <span key={i} style={{ display:"block", width:24, height:2, background:"rgba(236,236,236,.6)", borderRadius:2 }}/>)}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mob-menu" style={{
          position:"fixed", top:73, left:0, right:0, zIndex:199,
          background:"rgba(10,10,10,.97)", backdropFilter:"blur(14px)",
          borderBottom:"1px solid rgba(236,236,236,.08)",
          padding:"20px 24px", display:"flex", flexDirection:"column", gap:4,
        }}>
          {["Features","How it works","Pricing","FAQ"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`}
              onClick={() => setMenuOpen(false)}
              style={{ padding:"14px 0", fontSize:15, color:"rgba(236,236,236,.6)", textDecoration:"none", borderBottom:"1px solid rgba(236,236,236,.055)" }}>
              {l}
            </a>
          ))}
          <button className="btn-primary" style={{ marginTop:16 }}>Start free trial</button>
        </div>
      )}

      {/* ══ TICKER ══ */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {Array.from({length:2}).flatMap((_,g) =>
            ["Track unpaid dues","Auto WhatsApp reminders","Recurring billing","Recover faster","No awkward calls","Built for Indian businesses"].map((t,i) => (
              <span key={`${g}-${i}`} className="ticker-item">
                {(g*6+i)%3===0 && <span className="t-dot"/>}{t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══ HERO ══ */}
      <section className="hero-grid" style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        minHeight:"90vh", borderBottom:"1px solid rgba(236,236,236,.06)",
      }}>
        <div style={{
          padding:"96px 64px 80px",
          display:"flex", flexDirection:"column", justifyContent:"space-between",
          borderRight:"1px solid rgba(236,236,236,.06)",
        }}>
          <div>
            <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.28)", marginBottom:44 }}>
              Recurring payment recovery software
            </p>
            <h1 style={{ fontSize:"clamp(44px,4.8vw,70px)", fontWeight:300, lineHeight:1.06, letterSpacing:"-0.03em", marginBottom:28 }}>
              Your customers owe you.
              <br/>
              <span style={{ color:"rgba(236,236,236,.32)", fontWeight:300 }}>Collect it.</span>
            </h1>
            <p style={{ fontSize:16, lineHeight:1.76, color:"rgba(236,236,236,.38)", maxWidth:400, marginBottom:52, fontWeight:300 }}>
              Track recurring dues, send automatic WhatsApp reminders, and recover payments — before and after every due date. Built for Indian businesses.
            </p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <a href="/dashboard" className="btn-primary" style={{ textDecoration:"none" }}>Start free trial</a>
              <button className="btn-ghost">Watch demo</button>
            </div>
          </div>
          <p style={{ fontSize:12, color:"rgba(236,236,236,.16)", letterSpacing:".04em" }}>
            No credit card &nbsp;·&nbsp; 14-day trial &nbsp;·&nbsp; 5 min setup
          </p>
        </div>

        {/* hero right — live dashboard */}
        <div className="hero-right" style={{
          padding:"44px", display:"flex", flexDirection:"column", gap:14,
          background:"rgba(255,255,255,.012)", position:"relative", zIndex:1,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <div className="live-dot"/>
            <span style={{ fontSize:11, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(236,236,236,.28)" }}>Live dashboard</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div className="stat-card">
              <p style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.28)", marginBottom:14 }}>Pending today</p>
              <p style={{ fontSize:42, fontWeight:300, letterSpacing:"-0.04em", lineHeight:1 }}>₹{heroCount}k</p>
              <p style={{ fontSize:11, color:"#f87171", marginTop:10 }}>12 accounts overdue</p>
            </div>
            <div className="stat-card-g">
              <p style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(200,245,90,.45)", marginBottom:14 }}>Recovered</p>
              <p style={{ fontSize:42, fontWeight:300, letterSpacing:"-0.04em", lineHeight:1, color:"#c8f55a" }}>₹18k</p>
              <p style={{ fontSize:11, color:"rgba(200,245,90,.55)", marginTop:10 }}>this month · +27%</p>
            </div>
          </div>
          <div style={{ padding:"22px 22px 18px", border:"1px solid rgba(236,236,236,.07)", background:"rgba(255,255,255,.018)" }}>
            <p style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.25)", marginBottom:18 }}>Collections this week</p>
            <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:56 }}>
              {[.3,.5,.42,.7,.6,.85,1].map((h,i) => (
                <div key={i} className="bar" style={{
                  flex:1, height:`${h*100}%`,
                  background: i===6 ? "#c8f55a" : "rgba(200,245,90,.2)",
                  animationDelay:`${i*.07}s`,
                }}/>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:7 }}>
              {["M","T","W","T","F","S","S"].map((d,i) => (
                <span key={i} style={{ flex:1, textAlign:"center", fontSize:10, color:i===6?"#c8f55a":"rgba(236,236,236,.2)" }}>{d}</span>
              ))}
            </div>
          </div>
          <div style={{ padding:"20px 20px 12px", border:"1px solid rgba(236,236,236,.07)", background:"rgba(255,255,255,.018)", flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <p style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.25)" }}>Overdue accounts</p>
              <span style={{ fontSize:10, background:"rgba(248,113,113,.1)", color:"#f87171", padding:"3px 9px" }}>4 urgent</span>
            </div>
            {OVERDUE.map((row,i) => (
              <div key={row.name} className="overdue-row" style={{ animationDelay:`${i*.09}s` }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:400, marginBottom:2 }}>{row.name}</p>
                  <p style={{ fontSize:11, color:"rgba(236,236,236,.26)" }}>{row.days} days overdue</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontSize:13, fontWeight:500 }}>{row.amount}</p>
                  <button className="send-lnk">Remind →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ USE CASES STRIP ══ */}
      <section style={{ borderBottom:"1px solid rgba(236,236,236,.06)", padding:"48px 64px" }}>
        <div className="reveal" style={{ marginBottom:28, textAlign:"center" }}>
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)" }}>
            Built for every recurring payment business
          </p>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}>
          {USE_CASES.map(u => (
            <div key={u.label} className="use-chip">
              <span style={{ fontSize:18 }}>{u.icon}</span>
              {u.label}
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES — 6 cards ══ */}
      <section id="features" style={{ maxWidth:1200, margin:"0 auto", padding:"120px 64px", borderBottom:"1px solid rgba(236,236,236,.06)" }}>
        <div className="reveal" style={{ marginBottom:72 }}>
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)", marginBottom:16 }}>What it does</p>
          <h2 style={{ fontSize:"clamp(30px,3vw,44px)", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.1 }}>
            Everything you need.<br/>Nothing you don't.
          </h2>
        </div>
        <div className="feat-grid-2" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, border:"1px solid rgba(236,236,236,.07)" }}>
          {FEATURES.map((f,i) => (
            <div key={f.n} className="feat-card reveal" style={{
              transitionDelay:`${i*.08}s`,
              borderRight:   (i+1)%3!==0 ? "1px solid rgba(236,236,236,.07)" : "none",
              borderBottom:  i<3          ? "1px solid rgba(236,236,236,.07)" : "none",
            }}>
              <p style={{ fontSize:28, fontWeight:300, color:"rgba(200,245,90,.18)", letterSpacing:"-0.04em", marginBottom:24 }}>{f.n}</p>
              <h3 style={{ fontSize:17, fontWeight:400, letterSpacing:"-0.02em", marginBottom:12, lineHeight:1.25 }}>{f.title}</h3>
              <p style={{ fontSize:14, lineHeight:1.75, color:"rgba(236,236,236,.38)", fontWeight:300 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ BILLING CYCLES ══ */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 64px 120px", borderBottom:"1px solid rgba(236,236,236,.06)" }}>
        <div className="reveal" style={{ marginBottom:52 }}>
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)", marginBottom:16 }}>Billing cycles</p>
          <h2 style={{ fontSize:"clamp(28px,2.8vw,40px)", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.1, maxWidth:600 }}>
            Set it once. CollectPro tracks the rest — every cycle, automatically.
          </h2>
        </div>
        <div className="cycle-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {CYCLES.map((c,i) => (
            <div key={c.label} className="reveal" style={{
              padding:"28px 24px",
              border:`1px solid ${c.border}`,
              background:c.bg,
              borderRadius:4,
              transitionDelay:`${i*.08}s`,
            }}>
              <p style={{ fontSize:22, fontWeight:300, color:c.color, letterSpacing:"-0.03em", marginBottom:8 }}>{c.label}</p>
              <p style={{ fontSize:12, color:"rgba(236,236,236,.35)", marginBottom:20 }}>{c.sub}</p>
              <p style={{ fontSize:13, color:"rgba(236,236,236,.5)", lineHeight:1.65 }}>
                When payment is marked paid, next due date auto-sets to {c.sub.toLowerCase()} from today.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ REMINDER ENGINE TIMELINE ══ */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 64px 120px", borderBottom:"1px solid rgba(236,236,236,.06)" }}>
        <div className="reveal" style={{ marginBottom:52 }}>
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)", marginBottom:16 }}>Smart reminder engine</p>
          <h2 style={{ fontSize:"clamp(28px,2.8vw,40px)", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.1, maxWidth:600 }}>
            The right message at the right time. Automatically.
          </h2>
        </div>
        <div className="remind-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {REMINDER_STEPS.map((s,i) => (
            <div key={s.timing} className="reveal" style={{
              padding:"28px 28px",
              border:`1px solid ${s.border}`,
              background:s.bg,
              borderRadius:4,
              transitionDelay:`${i*.1}s`,
              position:"relative",
            }}>
              {/* connector line between cards */}
              {i < 2 && (
                <div style={{
                  position:"absolute", right:"-8%", top:"50%",
                  fontSize:16, color:"rgba(236,236,236,.15)",
                  transform:"translateY(-50%)",
                  display:"none", // hidden on mobile via CSS
                }}>→</div>
              )}
              <span style={{
                display:"inline-block", padding:"4px 10px", marginBottom:18,
                background:s.bg, border:`1px solid ${s.border}`,
                color:s.color, fontSize:11, fontWeight:500, letterSpacing:".06em",
                borderRadius:2,
              }}>
                {s.timing}
              </span>
              <div style={{
                padding:"14px 16px",
                background:"rgba(0,0,0,.2)",
                borderRadius:4,
                fontSize:13, lineHeight:1.7,
                color:"rgba(236,236,236,.55)",
                fontStyle:"italic",
                marginBottom:0,
              }}>
                "{s.msg}"
              </div>
            </div>
          ))}
        </div>
        <p className="reveal" style={{ fontSize:13, color:"rgba(236,236,236,.28)", marginTop:20, letterSpacing:".01em" }}>
          All messages open in WhatsApp with the customer's number pre-filled. One tap to send.
        </p>
      </section>

      {/* ══ ANIMATED STATS ══ */}
      <section className="stats-grid" style={{
        display:"grid", gridTemplateColumns:"repeat(3,1fr)",
        borderBottom:"1px solid rgba(236,236,236,.06)",
      }}>
        {[
          { ref:c1.ref, val:c1.val, suffix:"%",   label:"faster payment recovery on average" },
          { ref:c2.ref, val:c2.val, suffix:"L+",  label:"lakh in dues tracked",               prefix:"₹" },
          { ref:c3.ref, val:c3.val, suffix:" min", label:"average setup time" },
        ].map((s,i) => (
          <div key={i} ref={s.ref} className="reveal" style={{
            padding:"72px 64px", textAlign:"center",
            borderRight: i<2 ? "1px solid rgba(236,236,236,.06)" : "none",
            background:"rgba(255,255,255,.012)",
            transitionDelay:`${i*.1}s`,
          }}>
            <p style={{ fontSize:52, fontWeight:300, letterSpacing:"-0.04em", color:"#c8f55a", marginBottom:10 }}>
              {s.prefix}{s.val}{s.suffix}
            </p>
            <p style={{ fontSize:13, color:"rgba(236,236,236,.3)", fontWeight:300 }}>{s.label}</p>
          </div>
        ))}
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how" style={{ maxWidth:1200, margin:"0 auto", padding:"120px 64px", borderBottom:"1px solid rgba(236,236,236,.06)" }}>
        <div className="reveal" style={{ marginBottom:72 }}>
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)", marginBottom:16 }}>How it works</p>
          <h2 style={{ fontSize:"clamp(30px,3vw,44px)", fontWeight:300, letterSpacing:"-0.03em" }}>Up and running in minutes.</h2>
        </div>
        <div className="how-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:48 }}>
          {[
            { n:"1", title:"Add your customers",      body:"Name, phone, amount, billing cycle. Done in 30 seconds per customer." },
            { n:"2", title:"Set the billing cycle",   body:"Monthly, weekly, quarterly, or yearly. CollectPro tracks the next due date automatically." },
            { n:"3", title:"Reminders go out",        body:"Before, on, and after the due date. WhatsApp messages pre-written and ready to send." },
            { n:"4", title:"Mark paid. Repeat.",      body:"One tap to mark paid. Next cycle starts immediately. No manual work." },
          ].map((s,i) => (
            <div key={s.n} className="reveal" style={{ transitionDelay:`${i*.1}s` }}>
              <div style={{
                width:40, height:40, border:"1px solid rgba(236,236,236,.1)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:400, color:"rgba(236,236,236,.4)",
                marginBottom:24, borderRadius:2,
              }}>{s.n}</div>
              <h3 style={{ fontSize:16, fontWeight:400, letterSpacing:"-0.02em", marginBottom:10 }}>{s.title}</h3>
              <p style={{ fontSize:14, lineHeight:1.75, color:"rgba(236,236,236,.36)", fontWeight:300 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"120px 64px", borderBottom:"1px solid rgba(236,236,236,.06)" }}>
        <div className="reveal" style={{ marginBottom:72 }}>
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)", marginBottom:16 }}>What people say</p>
          <h2 style={{ fontSize:"clamp(30px,3vw,44px)", fontWeight:300, letterSpacing:"-0.03em" }}>Real businesses. Real results.</h2>
        </div>
        <div className="test-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
          {TESTIMONIALS.map((t,i) => (
            <div key={t.name} className="tcard reveal" style={{ transitionDelay:`${i*.1}s` }}>
              <p style={{ fontSize:40, fontWeight:300, color:"rgba(200,245,90,.2)", lineHeight:1, marginBottom:20 }}>"</p>
              <p style={{ fontSize:15, lineHeight:1.78, color:"rgba(236,236,236,.55)", fontWeight:300, marginBottom:28 }}>{t.quote}</p>
              <div style={{ borderTop:"1px solid rgba(236,236,236,.07)", paddingTop:20 }}>
                <p style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>{t.name}</p>
                <p style={{ fontSize:11, color:"rgba(236,236,236,.3)" }}>{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA + PRICING ══ */}
      <section id="pricing" className="cta-grid" style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        maxWidth:1200, margin:"0 auto",
        padding:"120px 64px", gap:80, alignItems:"start",
        borderBottom:"1px solid rgba(236,236,236,.06)",
      }}>
        <div className="reveal">
          <h2 style={{ fontSize:"clamp(32px,3.6vw,52px)", fontWeight:300, lineHeight:1.07, letterSpacing:"-0.03em", marginBottom:24 }}>
            Every day you wait is money sitting uncollected.
          </h2>
          <p style={{ fontSize:15, color:"rgba(236,236,236,.36)", lineHeight:1.75, fontWeight:300, marginBottom:40 }}>
            Start free. No credit card. If you're not collecting more in 14 days, you owe us nothing.
          </p>
          <a href="/dashboard" className="btn-primary" style={{ fontSize:15, padding:"15px 40px", textDecoration:"none", display:"inline-block" }}>
            Start free trial
          </a>
        </div>

        <div className="reveal" style={{
          padding:"40px", border:"1px solid rgba(236,236,236,.07)",
          background:"rgba(255,255,255,.018)", transitionDelay:".15s",
        }}>
          <p style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.25)", marginBottom:28 }}>Pricing</p>
          {[
            { plan:"Starter",  price:"Free",        note:"Up to 25 customers · Basic reminders" },
            { plan:"Pro",      price:"₹999 / mo",   note:"Unlimited customers · Auto reminders · All billing cycles", hi:true },
            { plan:"Business", price:"₹2,499 / mo", note:"Teams · WhatsApp API · Priority support" },
          ].map(p => (
            <div key={p.plan} className="price-row">
              <div>
                <p style={{ fontSize:15, fontWeight:p.hi?500:400, color:p.hi?"#c8f55a":"#ececec" }}>{p.plan}</p>
                <p style={{ fontSize:11, color:"rgba(236,236,236,.28)", marginTop:3 }}>{p.note}</p>
              </div>
              <p style={{ fontSize:15, fontWeight:400, color:p.hi?"#c8f55a":"rgba(236,236,236,.45)" }}>{p.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="faq" style={{ maxWidth:800, margin:"0 auto", padding:"120px 64px", borderBottom:"1px solid rgba(236,236,236,.06)" }}>
        <div className="reveal" style={{ marginBottom:56 }}>
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)", marginBottom:16 }}>FAQ</p>
          <h2 style={{ fontSize:"clamp(28px,2.8vw,40px)", fontWeight:300, letterSpacing:"-0.03em" }}>Questions you'll have.</h2>
        </div>
        <div style={{ border:"1px solid rgba(236,236,236,.07)", borderRadius:4, overflow:"hidden" }}>
          {FAQS.map((faq,i) => (
            <div
              key={i}
              className="faq-row reveal"
              style={{ transitionDelay:`${i*.07}s` }}
              onClick={() => setOpenFaq(openFaq===i ? null : i)}
            >
              <div style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"22px 28px",
                background: openFaq===i ? "rgba(200,245,90,.025)" : "transparent",
                transition:"background .2s",
              }}>
                <p style={{ fontSize:15, fontWeight:400, letterSpacing:"-0.01em", paddingRight:20 }}>{faq.q}</p>
                <span style={{
                  fontSize:18, color:"rgba(236,236,236,.35)", flexShrink:0,
                  transform: openFaq===i ? "rotate(45deg)" : "rotate(0)",
                  transition:"transform .2s",
                }}>+</span>
              </div>
              {openFaq===i && (
                <div className="faq-answer" style={{
                  padding:"0 28px 22px",
                  background:"rgba(200,245,90,.025)",
                }}>
                  <p style={{ fontSize:14, lineHeight:1.75, color:"rgba(236,236,236,.45)", fontWeight:300 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ padding:"52px 64px", borderTop:"1px solid rgba(236,236,236,.06)" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:48, marginBottom:48, maxWidth:1200, margin:"0 auto 48px" }}>
          {/* brand */}
          <div>
            <p style={{ fontSize:18, fontWeight:600, letterSpacing:"-0.02em", marginBottom:12 }}>
              Collect<span style={{ color:"#c8f55a" }}>Pro</span>
            </p>
            <p style={{ fontSize:13, color:"rgba(236,236,236,.3)", lineHeight:1.7, maxWidth:220, fontWeight:300 }}>
              Recurring payment tracking and automated reminder software for Indian businesses.
            </p>
          </div>

          {/* product */}
          <div>
            <p style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.25)", marginBottom:18 }}>Product</p>
            {["Features","How it works","Pricing","FAQ"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`} style={{
                display:"block", fontSize:13, color:"rgba(236,236,236,.35)",
                textDecoration:"none", marginBottom:10, transition:"color .18s",
              }}
                onMouseEnter={e=>e.currentTarget.style.color="rgba(236,236,236,.7)"}
                onMouseLeave={e=>e.currentTarget.style.color="rgba(236,236,236,.35)"}
              >{l}</a>
            ))}
          </div>

          {/* use cases */}
          <div>
            <p style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.25)", marginBottom:18 }}>Use cases</p>
            {["Gyms & Fitness","Coaching Classes","Clinics","Rent & PGs","Suppliers & Agencies"].map(l => (
              <p key={l} style={{ fontSize:13, color:"rgba(236,236,236,.3)", marginBottom:10 }}>{l}</p>
            ))}
          </div>
        </div>

        <div style={{ maxWidth:1200, margin:"0 auto", paddingTop:28, borderTop:"1px solid rgba(236,236,236,.055)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <p style={{ fontSize:11, color:"rgba(236,236,236,.16)", letterSpacing:".04em" }}>
            Built for Indian businesses · 2025
          </p>
          <div style={{ display:"flex", gap:28 }}>
            {["Privacy","Terms","Contact"].map(l => (
              <a key={l} href="#" style={{ fontSize:12, color:"rgba(236,236,236,.22)", textDecoration:"none", letterSpacing:".02em", transition:"color .2s" }}
                onMouseEnter={e=>e.currentTarget.style.color="rgba(236,236,236,.55)"}
                onMouseLeave={e=>e.currentTarget.style.color="rgba(236,236,236,.22)"}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}