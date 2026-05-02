"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "../lib/supabase";

const FEATURES = [
  {
    n:"01", title:"Automatic daily reminders",
    body:"Every morning at 9:30 AM, reminders go out automatically to every customer due today or in 2 days. You don't touch anything.",
    tag:"Fully automated",
    tagColor:"#c8f55a",
    tagBg:"rgba(200,245,90,.1)",
  },
  {
    n:"02", title:"Auto billing cycle tracking",
    body:"Mark a payment paid — next due date sets itself. Monthly, weekly, quarterly, yearly. Zero manual calculation.",
    tag:"Zero manual work",
    tagColor:"#818cf8",
    tagBg:"rgba(99,102,241,.1)",
  },
  {
    n:"03", title:"Smart message engine",
    body:"Different message before, on, and after due date. Polite reminder 2 days before. Firm notice when overdue. Always professional.",
    tag:"Context-aware",
    tagColor:"#fbbf24",
    tagBg:"rgba(251,191,36,.1)",
  },
  {
    n:"04", title:"Auto overdue detection",
    body:"The moment a due date passes, that customer moves to overdue automatically. No refresh needed. No manual status change.",
    tag:"Real-time",
    tagColor:"#f87171",
    tagBg:"rgba(248,113,113,.1)",
  },
  {
    n:"05", title:"Recovery rate tracking",
    body:"See exactly what percentage of dues you've collected. Updated live as payments come in. Know your numbers at a glance.",
    tag:"Live dashboard",
    tagColor:"#c8f55a",
    tagBg:"rgba(200,245,90,.1)",
  },
  {
    n:"06", title:"One-tap WhatsApp",
    body:"Need to send a manual reminder? One tap. Message pre-written, number pre-filled. You just press send.",
    tag:"1 tap",
    tagColor:"#818cf8",
    tagBg:"rgba(99,102,241,.1)",
  },
];

const AUTOMATION_FLOW = [
  { time:"9:30 AM", event:"System checks all customers", color:"#c8f55a", dot:"#c8f55a" },
  { time:"9:31 AM", event:"Finds customers due today or in 2 days", color:"#fbbf24", dot:"#fbbf24" },
  { time:"9:31 AM", event:"WhatsApp message auto-generated", color:"#818cf8", dot:"#818cf8" },
  { time:"9:32 AM", event:"Reminder sent to customer", color:"#c8f55a", dot:"#c8f55a" },
  { time:"Every day", event:"Repeats. You do nothing.", color:"#c8f55a", dot:"#c8f55a" },
];

const MESSAGES = [
  {
    timing:"2 days before",
    color:"#818cf8",
    bg:"rgba(99,102,241,.07)",
    border:"rgba(99,102,241,.18)",
    msg:"Hi Rahul, your payment of ₹6,500 is due on 18 Apr. Please pay on time. — CollectPro",
    auto:true,
  },
  {
    timing:"Due today",
    color:"#fbbf24",
    bg:"rgba(251,191,36,.07)",
    border:"rgba(251,191,36,.18)",
    msg:"Hi Rahul, your payment of ₹6,500 is due TODAY. Please clear it at your earliest. — CollectPro",
    auto:true,
  },
  {
    timing:"3 days overdue",
    color:"#f87171",
    bg:"rgba(248,113,113,.07)",
    border:"rgba(248,113,113,.18)",
    msg:"Hi Rahul, your payment of ₹6,500 is 3 days overdue. Kindly clear your dues immediately. — CollectPro",
    auto:true,
  },
];

const FAQS = [
  {
    q:"Do I need to do anything for reminders to go out?",
    a:"No. Once you add a customer, everything is automatic. Reminders go out every morning at 9:30 AM to customers who are due. You just log in to see the status.",
  },
  {
    q:"What happens when I mark a payment as paid?",
    a:"The next due date is automatically calculated based on the billing cycle. The customer resets to pending for the next cycle. Nothing manual.",
  },
  {
    q:"Can I still send reminders manually?",
    a:"Yes. If you want to send an extra reminder, one tap opens WhatsApp with the message pre-written and the number pre-filled. But mostly you won't need to.",
  },
  {
    q:"Do I need to install anything?",
    a:"No. CollectPro runs in your browser. Open the link, add your customers, and automation starts working. Setup takes under 5 minutes.",
  },
  {
    q:"Is my data safe?",
    a:"Yes. Your data is stored securely in the cloud. Each business sees only their own customers. We use bank-grade encryption.",
  },
];

const USE_CASES = [
  { icon:"🏋️", label:"Gyms" },
  { icon:"📚", label:"Coaching" },
  { icon:"🦷", label:"Clinics" },
  { icon:"🏠", label:"PGs & Rent" },
  { icon:"🛒", label:"Suppliers" },
  { icon:"💈", label:"Salons" },
  { icon:"🏫", label:"Schools" },
  { icon:"⚙️", label:"Agencies" },
];

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return scrolled;
}

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

export default function Home() {
  const scrolled = useNavScroll();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  useScrollReveal();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const spotRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotRef.current) {
      spotRef.current.style.left = e.clientX - 200 + "px";
      spotRef.current.style.top  = e.clientY - 200 + "px";
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveStep(s => (s + 1) % AUTOMATION_FLOW.length);
    }, 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <main
      onMouseMove={onMouseMove}
      style={{ background:"#0a0a0a", color:"#ececec", minHeight:"100vh", fontFamily:"'Inter',sans-serif", overflowX:"hidden", position:"relative" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }
        @keyframes ticker  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes stepIn  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }

        .reveal {
          opacity:0; transform:translateY(28px);
          transition:opacity .65s cubic-bezier(.22,.61,.36,1), transform .65s cubic-bezier(.22,.61,.36,1);
        }

        .nav-a {
          color:rgba(236,236,236,.35); text-decoration:none;
          font-size:14px; font-weight:400; letter-spacing:.02em;
          transition:color .2s;
        }
        .nav-a:hover { color:#ececec; }

        .btn-primary {
          position:relative; overflow:hidden;
          background:#c8f55a; color:#0a0a0a; border:none;
          padding:14px 34px; font-family:'Inter',sans-serif;
          font-size:14px; font-weight:500; letter-spacing:.01em;
          cursor:pointer; border-radius:2px;
          transition:background .18s, transform .12s;
        }
        .btn-primary:hover { background:#b8e84a; transform:translateY(-1px); }

        .btn-ghost {
          background:transparent; color:rgba(236,236,236,.4);
          border:1px solid rgba(236,236,236,.1); padding:14px 34px;
          font-family:'Inter',sans-serif; font-size:14px;
          cursor:pointer; border-radius:2px;
          transition:border-color .18s, color .18s;
          text-decoration:none; display:inline-block;
        }
        .btn-ghost:hover { border-color:rgba(236,236,236,.25); color:#ececec; }

        .feat-card {
          padding:40px 36px;
          border:1px solid rgba(236,236,236,.07);
          background:rgba(255,255,255,.018);
          transition:border-color .25s, background .25s;
        }
        .feat-card:hover { border-color:rgba(200,245,90,.2); background:rgba(200,245,90,.02); }

        .use-chip {
          display:flex; align-items:center; gap:10px;
          padding:12px 20px;
          border:1px solid rgba(236,236,236,.08);
          background:rgba(255,255,255,.025);
          font-size:13px; color:rgba(236,236,236,.6);
          transition:border-color .2s, color .2s;
          white-space:nowrap;
        }
        .use-chip:hover { border-color:rgba(200,245,90,.2); color:#ececec; }

        .ticker-wrap  { overflow:hidden; border-top:1px solid rgba(236,236,236,.065); border-bottom:1px solid rgba(236,236,236,.065); padding:12px 0; }
        .ticker-track { display:flex; width:max-content; gap:60px; animation:ticker 28s linear infinite; }
        .ticker-item  { font-size:11px; font-weight:400; letter-spacing:.11em; text-transform:uppercase; color:rgba(236,236,236,.2); white-space:nowrap; }

        .live-dot { width:7px; height:7px; border-radius:50%; background:#c8f55a; animation:pulse 2s ease-in-out infinite; }

        .faq-row { border-bottom:1px solid rgba(236,236,236,.07); cursor:pointer; }
        .faq-row:last-child { border-bottom:none; }

        .price-row { display:flex; justify-content:space-between; align-items:center; padding:20px 0; border-bottom:1px solid rgba(236,236,236,.055); }
        .price-row:last-child { border-bottom:none; }

        @media (max-width:768px) {
          .desktop-nav { display:none !important; }
          .mob-toggle  { display:flex !important; }
          .hero-grid   { grid-template-columns:1fr !important; }
          .feat-grid   { grid-template-columns:1fr !important; }
          .how-grid    { grid-template-columns:1fr 1fr !important; gap:32px !important; }
          .cta-grid    { grid-template-columns:1fr !important; }
          .msg-grid    { grid-template-columns:1fr !important; }
          .hero-right  { display:none !important; }
          section, nav, footer { padding-left:24px !important; padding-right:24px !important; }
        }
      `}</style>

      {/* spotlight */}
      <div ref={spotRef} style={{
        position:"fixed", width:400, height:400, borderRadius:"50%",
        pointerEvents:"none", zIndex:0,
        background:"radial-gradient(circle, rgba(200,245,90,.04) 0%, transparent 70%)",
        transition:"left .12s ease, top .12s ease",
      }}/>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"22px 64px",
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
          <a href="#how-it-works" className="nav-a">How it works</a>
          <a href="#features"     className="nav-a">Features</a>
          <a href="#pricing"      className="nav-a">Pricing</a>
          <a href="#faq"          className="nav-a">FAQ</a>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <a href="/dashboard" className="btn-ghost desktop-nav" style={{ padding:"10px 24px", fontSize:13 }}>
            Login
          </a>
          {isLoggedIn ? (
            <a href="/dashboard" className="btn-primary" style={{ padding:"10px 24px", fontSize:13, textDecoration:"none" }}>
              Go to Dashboard
            </a>
          ) : (
            <a href="/login" className="btn-primary" style={{ padding:"10px 24px", fontSize:13, textDecoration:"none" }}>
              Start free
            </a>
          )}
          <button className="mob-toggle" onClick={() => setMenuOpen(o=>!o)}
            style={{ display:"none", flexDirection:"column", gap:5, background:"none", border:"none", cursor:"pointer", padding:4 }}>
            {[0,1,2].map(i => <span key={i} style={{ display:"block", width:24, height:2, background:"rgba(236,236,236,.6)", borderRadius:2 }}/>)}
          </button>
        </div>
      </nav>

      {/* ══ TICKER ══ */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {Array.from({length:2}).flatMap((_,g) =>
            ["Runs every morning automatically","Zero manual reminders","Auto billing cycles","Overdue detection in real-time","WhatsApp integration","Built for Indian businesses"].map((t,i) => (
              <span key={`${g}-${i}`} className="ticker-item">
                {(g*6+i)%2===0 && <span style={{ display:"inline-block", width:4, height:4, borderRadius:"50%", background:"#c8f55a", margin:"0 60px 1px 0", verticalAlign:"middle" }}/>}
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══ HERO ══ */}
      <section className="hero-grid" style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        minHeight:"88vh", borderBottom:"1px solid rgba(236,236,236,.06)",
      }}>
        <div style={{
          padding:"96px 64px 80px",
          display:"flex", flexDirection:"column", justifyContent:"space-between",
          borderRight:"1px solid rgba(236,236,236,.06)",
        }}>
          <div>
            {/* auto badge */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              padding:"6px 14px",
              background:"rgba(200,245,90,.08)", border:"1px solid rgba(200,245,90,.2)",
              borderRadius:2, marginBottom:40,
            }}>
              <div className="live-dot"/>
              <span style={{ fontSize:11, letterSpacing:".08em", textTransform:"uppercase", color:"#c8f55a" }}>
                Reminders run automatically every morning
              </span>
            </div>

            <h1 style={{ fontSize:"clamp(40px,4.4vw,66px)", fontWeight:300, lineHeight:1.06, letterSpacing:"-0.03em", marginBottom:28 }}>
              Stop chasing payments.
              <br/>
              <span style={{ color:"rgba(236,236,236,.28)" }}>Let it run itself.</span>
            </h1>
            <p style={{ fontSize:16, lineHeight:1.76, color:"rgba(236,236,236,.38)", maxWidth:420, marginBottom:52, fontWeight:300 }}>
              CollectPro automatically sends WhatsApp reminders to your customers before and after every due date. Add customers once — automation handles the rest.
            </p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {isLoggedIn ? (
                <a href="/dashboard" className="btn-primary" style={{ textDecoration:"none", fontSize:15, padding:"15px 36px" }}>
                  Go to Dashboard →
                </a>
              ) : (
                <a href="/login" className="btn-primary" style={{ textDecoration:"none", fontSize:15, padding:"15px 36px" }}>
                  Start free — 5 min setup
                </a>
              )}
            </div>
          </div>
          <p style={{ fontSize:12, color:"rgba(236,236,236,.16)", letterSpacing:".04em" }}>
            No credit card &nbsp;·&nbsp; Free to start &nbsp;·&nbsp; Works on any device
          </p>
        </div>

        {/* hero right — automation flow */}
        <div className="hero-right" style={{
          padding:"56px 48px",
          background:"rgba(255,255,255,.012)",
          display:"flex", flexDirection:"column", gap:20,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div className="live-dot"/>
            <span style={{ fontSize:11, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(236,236,236,.3)" }}>
              Demo preview
            </span>
          </div>

          {/* automation flow */}
          <div style={{
            padding:"28px", border:"1px solid rgba(236,236,236,.07)",
            background:"rgba(255,255,255,.02)", borderRadius:4,
          }}>
            <p style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.25)", marginBottom:20 }}>
              Demo · Your real data appears after login
            </p>
            {AUTOMATION_FLOW.map((step, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"flex-start", gap:14,
                padding:"10px 0",
                borderBottom: i < AUTOMATION_FLOW.length - 1 ? "1px solid rgba(236,236,236,.05)" : "none",
                opacity: i <= activeStep ? 1 : 0.2,
                transition:"opacity .4s ease",
                animation: i === activeStep ? "stepIn .35s ease" : "none",
              }}>
                <div style={{
                  width:7, height:7, borderRadius:"50%",
                  background: i <= activeStep ? step.dot : "rgba(236,236,236,.1)",
                  marginTop:5, flexShrink:0,
                  transition:"background .4s",
                  ...(i === activeStep ? { animation:"pulse 1s ease-in-out infinite" } : {}),
                }}/>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:10, color:"rgba(236,236,236,.25)", letterSpacing:".06em", display:"block", marginBottom:3 }}>
                    {step.time}
                  </span>
                  <span style={{ fontSize:13, color: i <= activeStep ? step.color : "rgba(236,236,236,.3)" }}>
                    {step.event}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            {[
              { label:"Reminders sent today", value:"12", color:"#c8f55a" },
              { label:"Customers due soon",   value:"5",  color:"#fbbf24" },
              { label:"Overdue accounts",     value:"3",  color:"#f87171" },
            ].map((s,i) => (
              <div key={i} style={{
                padding:"18px 16px",
                border:"1px solid rgba(236,236,236,.07)",
                background:"rgba(255,255,255,.02)",
                borderRadius:4,
              }}>
                <p style={{ fontSize:28, fontWeight:300, letterSpacing:"-0.04em", color:s.color, marginBottom:6 }}>{s.value}</p>
                <p style={{ fontSize:10, color:"rgba(236,236,236,.28)", lineHeight:1.4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* recovery bar */}
          <div style={{ padding:"20px", border:"1px solid rgba(236,236,236,.07)", background:"rgba(255,255,255,.02)", borderRadius:4 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <p style={{ fontSize:11, letterSpacing:".06em", textTransform:"uppercase", color:"rgba(236,236,236,.28)" }}>Recovery rate this month</p>
              <p style={{ fontSize:13, fontWeight:500, color:"#c8f55a" }}>78%</p>
            </div>
            <div style={{ height:4, background:"rgba(236,236,236,.07)", borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:"78%", background:"linear-gradient(90deg,#c8f55a,#a8e040)", borderRadius:2 }}/>
            </div>
          </div>
        </div>
      </section>

      {/* ══ USE CASES ══ */}
      <section style={{ borderBottom:"1px solid rgba(236,236,236,.06)", padding:"44px 64px" }}>
        <div className="reveal" style={{ marginBottom:24, textAlign:"center" }}>
          <p style={{ fontSize:11, letterSpacing:".12em", textTransform:"uppercase", color:"rgba(236,236,236,.22)" }}>
            Works for any recurring payment business
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

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" style={{ maxWidth:1200, margin:"0 auto", padding:"120px 64px", borderBottom:"1px solid rgba(236,236,236,.06)" }}>
        <div className="reveal" style={{ marginBottom:72 }}>
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)", marginBottom:16 }}>How it works</p>
          <h2 style={{ fontSize:"clamp(30px,3vw,46px)", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.1 }}>
            Add customers once.<br/>
            <span style={{ color:"rgba(236,236,236,.3)" }}>Everything else is automatic.</span>
          </h2>
        </div>
        <div className="how-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:40 }}>
          {[
            { n:"1", title:"Add your customers", body:"Name, phone, amount, billing cycle. Done in 30 seconds per customer.", auto:true },
            { n:"2", title:"System takes over", body:"Every morning at 9:30 AM, CollectPro automatically checks who is due.", auto:true },
            { n:"3", title:"Reminders go out", body:"WhatsApp messages sent automatically — before due date and when overdue.", auto:true },
            { n:"4", title:"Mark paid. Repeat.", body:"Next cycle starts automatically. Due date resets. System keeps running.", auto:true },
          ].map((s,i) => (
            <div key={s.n} className="reveal" style={{ transitionDelay:`${i*.1}s` }}>
              <div style={{
                width:40, height:40,
                border: s.auto ? "1px solid rgba(200,245,90,.3)" : "1px solid rgba(236,236,236,.1)",
                background: s.auto ? "rgba(200,245,90,.06)" : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:400,
                color: s.auto ? "#c8f55a" : "rgba(236,236,236,.4)",
                marginBottom:20, borderRadius:2,
              }}>{s.n}</div>
              {s.auto && (
                <span style={{
                  display:"inline-block", fontSize:10, letterSpacing:".07em",
                  textTransform:"uppercase", color:"#c8f55a",
                  background:"rgba(200,245,90,.08)", border:"1px solid rgba(200,245,90,.18)",
                  padding:"3px 8px", borderRadius:2, marginBottom:12,
                }}>
                  Auto
                </span>
              )}
              <h3 style={{ fontSize:16, fontWeight:400, letterSpacing:"-0.02em", marginBottom:10 }}>{s.title}</h3>
              <p style={{ fontSize:14, lineHeight:1.75, color:"rgba(236,236,236,.36)", fontWeight:300 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ AUTO MESSAGES ══ */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 64px 120px", borderBottom:"1px solid rgba(236,236,236,.06)" }}>
        <div className="reveal" style={{ marginBottom:52 }}>
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)", marginBottom:16 }}>Automatic messages</p>
          <h2 style={{ fontSize:"clamp(28px,2.8vw,42px)", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.1, maxWidth:560 }}>
            Right message. Right time. Sent automatically.
          </h2>
        </div>
        <div className="msg-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {MESSAGES.map((m,i) => (
            <div key={m.timing} className="reveal" style={{
              padding:"28px",
              border:`1px solid ${m.border}`,
              background:m.bg,
              borderRadius:4,
              transitionDelay:`${i*.1}s`,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <span style={{
                  display:"inline-block", padding:"4px 10px",
                  background:m.bg, border:`1px solid ${m.border}`,
                  color:m.color, fontSize:11, fontWeight:500, letterSpacing:".06em",
                  borderRadius:2,
                }}>
                  {m.timing}
                </span>
                <span style={{
                  fontSize:10, letterSpacing:".07em", textTransform:"uppercase",
                  color:"#c8f55a", background:"rgba(200,245,90,.08)",
                  border:"1px solid rgba(200,245,90,.18)", padding:"3px 8px", borderRadius:2,
                }}>
                  Auto
                </span>
              </div>
              <div style={{
                padding:"14px 16px",
                background:"rgba(0,0,0,.25)",
                borderRadius:4,
                fontSize:13, lineHeight:1.7,
                color:"rgba(236,236,236,.5)",
                fontStyle:"italic",
              }}>
                "{m.msg}"
              </div>
            </div>
          ))}
        </div>
        <p className="reveal" style={{ fontSize:13, color:"rgba(236,236,236,.25)", marginTop:18 }}>
          All sent automatically via WhatsApp. No action needed from you.
        </p>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" style={{ maxWidth:1200, margin:"0 auto", padding:"120px 64px", borderBottom:"1px solid rgba(236,236,236,.06)" }}>
        <div className="reveal" style={{ marginBottom:72 }}>
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)", marginBottom:16 }}>Features</p>
          <h2 style={{ fontSize:"clamp(30px,3vw,46px)", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.1 }}>
            Built to run without you.
          </h2>
        </div>
        <div className="feat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, border:"1px solid rgba(236,236,236,.07)" }}>
          {FEATURES.map((f,i) => (
            <div key={f.n} className="feat-card reveal" style={{
              transitionDelay:`${i*.08}s`,
              borderRight:  (i+1)%3!==0 ? "1px solid rgba(236,236,236,.07)" : "none",
              borderBottom: i<3          ? "1px solid rgba(236,236,236,.07)" : "none",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <p style={{ fontSize:26, fontWeight:300, color:"rgba(200,245,90,.18)", letterSpacing:"-0.04em" }}>{f.n}</p>
                <span style={{
                  fontSize:10, letterSpacing:".07em", textTransform:"uppercase",
                  color:f.tagColor, background:f.tagBg,
                  padding:"3px 9px", borderRadius:2,
                }}>
                  {f.tag}
                </span>
              </div>
              <h3 style={{ fontSize:17, fontWeight:400, letterSpacing:"-0.02em", marginBottom:10, lineHeight:1.25 }}>{f.title}</h3>
              <p style={{ fontSize:14, lineHeight:1.75, color:"rgba(236,236,236,.38)", fontWeight:300 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        maxWidth:1200, margin:"0 auto",
        padding:"120px 64px", gap:80, alignItems:"start",
        borderBottom:"1px solid rgba(236,236,236,.06)",
      }}>
        <div className="reveal cta-grid">
          <p style={{ fontSize:11, letterSpacing:".13em", textTransform:"uppercase", color:"rgba(236,236,236,.22)", marginBottom:20 }}>Pricing</p>
          <h2 style={{ fontSize:"clamp(30px,3.2vw,48px)", fontWeight:300, lineHeight:1.07, letterSpacing:"-0.03em", marginBottom:20 }}>
            Start free.<br/>
            <span style={{ color:"rgba(236,236,236,.3)" }}>Scale when you're ready.</span>
          </h2>
          <p style={{ fontSize:15, color:"rgba(236,236,236,.35)", lineHeight:1.75, fontWeight:300, marginBottom:40, maxWidth:380 }}>
            No credit card needed. Add your customers, see automation work, then decide.
          </p>
          <a href="/dashboard" className="btn-primary" style={{ fontSize:15, padding:"15px 40px", textDecoration:"none", display:"inline-block" }}>
            Start free now
          </a>
        </div>

        <div className="reveal" style={{
          padding:"40px", border:"1px solid rgba(236,236,236,.07)",
          background:"rgba(255,255,255,.018)", transitionDelay:".15s",
        }}>
          <p style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.25)", marginBottom:28 }}>Plans</p>
          {[
            { plan:"Starter",  price:"Free",        note:"Up to 25 customers · Auto reminders", hi:false },
            { plan:"Pro",      price:"₹999 / mo",   note:"Unlimited customers · Full automation · All cycles", hi:true },
            { plan:"Business", price:"₹2,499 / mo", note:"Teams · Priority support · Custom setup", hi:false },
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
            <div key={i} className="faq-row reveal" style={{ transitionDelay:`${i*.07}s` }}
              onClick={() => setOpenFaq(openFaq===i ? null : i)}>
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
                <div style={{ padding:"0 28px 22px", background:"rgba(200,245,90,.025)" }}>
                  <p style={{ fontSize:14, lineHeight:1.75, color:"rgba(236,236,236,.45)", fontWeight:300 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ padding:"52px 64px", borderTop:"1px solid rgba(236,236,236,.06)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:48, marginBottom:48 }}>
          <div>
            <p style={{ fontSize:18, fontWeight:600, letterSpacing:"-0.02em", marginBottom:12 }}>
              Collect<span style={{ color:"#c8f55a" }}>Pro</span>
            </p>
            <p style={{ fontSize:13, color:"rgba(236,236,236,.3)", lineHeight:1.7, maxWidth:220, fontWeight:300 }}>
              Automated recurring payment tracking and WhatsApp reminders for Indian businesses.
            </p>
          </div>
          <div>
            <p style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.25)", marginBottom:18 }}>Product</p>
            {["How it works","Features","Pricing","FAQ"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`} style={{
                display:"block", fontSize:13, color:"rgba(236,236,236,.35)",
                textDecoration:"none", marginBottom:10, transition:"color .18s",
              }}
                onMouseEnter={e=>e.currentTarget.style.color="rgba(236,236,236,.7)"}
                onMouseLeave={e=>e.currentTarget.style.color="rgba(236,236,236,.35)"}
              >{l}</a>
            ))}
          </div>
          <div>
            <p style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.25)", marginBottom:18 }}>Use cases</p>
            {["Gyms & Fitness","Coaching Classes","Clinics","Rent & PGs","Suppliers & Agencies"].map(l => (
              <p key={l} style={{ fontSize:13, color:"rgba(236,236,236,.3)", marginBottom:10 }}>{l}</p>
            ))}
          </div>
        </div>
        <div style={{ maxWidth:1200, margin:"0 auto", paddingTop:28, borderTop:"1px solid rgba(236,236,236,.055)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <p style={{ fontSize:11, color:"rgba(236,236,236,.16)", letterSpacing:".04em" }}>
            CollectPro · Built for Indian businesses · 2026
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