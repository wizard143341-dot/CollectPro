"use client";

import { useState, useMemo, useEffect, useCallback, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase";

type Status       = "paid" | "pending" | "upcoming" | "overdue";
type BillingCycle = "monthly" | "weekly" | "quarterly" | "yearly";
type SortKey      = "name" | "amount" | "nextDueDate" | "status" | null;
type ModalType    = "add" | "edit" | "remind" | "history" | null;

interface Payment { id: string; date: string; amount: number; note: string; }
interface Customer {
  id: string; name: string; phone: string; amount: number;
  billingCycle: BillingCycle; lastPaymentDate: string | null;
  nextDueDate: string; status: Status; note: string; paymentHistory: Payment[];
  lastReminderSent: string | null;
}
type FormData = { name: string; phone: string; amount: string; billingCycle: BillingCycle; nextDueDate: string; note: string; };

const CYCLE_LABEL: Record<BillingCycle, string> = { weekly:"Weekly", monthly:"Monthly", quarterly:"Quarterly", yearly:"Yearly" };
const STATUS_CFG: Record<Status, { bg: string; color: string; label: string; border: string }> = {
  paid:     { bg:"rgba(200,245,90,.1)",   color:"#c8f55a", label:"Paid",     border:"rgba(200,245,90,.2)"   },
  pending:  { bg:"rgba(251,191,36,.1)",   color:"#fbbf24", label:"Pending",  border:"rgba(251,191,36,.2)"   },
  upcoming: { bg:"rgba(99,102,241,.12)",  color:"#818cf8", label:"Upcoming", border:"rgba(99,102,241,.25)"  },
  overdue:  { bg:"rgba(248,113,113,.1)",  color:"#f87171", label:"Overdue",  border:"rgba(248,113,113,.22)" },
};
const EMPTY: FormData = { name:"", phone:"", amount:"", billingCycle:"monthly", nextDueDate:"", note:"" };
const todayStr = () => new Date().toISOString().split("T")[0];
const uid     = () => Math.random().toString(36).slice(2, 9);
const fmt     = (n: number) => "₹" + n.toLocaleString("en-IN");
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"2-digit" });
const fmtDateTime = (d: string) => new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });

const calcStatus = (nextDueDate: string): Status => {
  const diff = (new Date(nextDueDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000;
  if (diff < 0) return "overdue";
  if (diff <= 3) return "upcoming";
  return "pending";
};

const addCycleDays = (dateStr: string, cycle: BillingCycle): string => {
  const d = new Date(dateStr);
  if (cycle === "monthly" || cycle === "quarterly" || cycle === "yearly") {
    d.setMonth(d.getMonth() + (cycle === "monthly" ? 1 : cycle === "quarterly" ? 3 : 12));
  } else { d.setDate(d.getDate() + 7); }
  return d.toISOString().split("T")[0];
};

const daysFromNow = (dateStr: string): number =>
  Math.round((new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);

const buildReminderMsg = (c: Customer): string => {
  const diff = daysFromNow(c.nextDueDate);
  const name = c.name.split(" ")[0];
  const amt = fmt(c.amount);
  const date = fmtDate(c.nextDueDate);
  if (diff > 0) return `Hi ${name}, this is a friendly reminder that your payment of ${amt} is due on ${date}. Please pay on time. — CollectPro`;
  if (diff === 0) return `Hi ${name}, your payment of ${amt} is due TODAY. Please clear it at your earliest. — CollectPro`;
  return `Hi ${name}, your payment of ${amt} was due on ${date} and is now overdue by ${Math.abs(diff)} day${Math.abs(diff)>1?"s":""}. Kindly clear your dues immediately. — CollectPro`;
};

const waLink = (phone: string, msg: string) =>
  `https://wa.me/91${phone.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowToCustomer = (row: any): Customer => ({
  id: row.id, name: row.name, phone: row.phone, amount: Number(row.amount),
  billingCycle: row.billing_cycle as BillingCycle, lastPaymentDate: row.last_payment_date ?? null,
  nextDueDate: row.next_due_date, status: calcStatus(row.next_due_date),
  note: row.note ?? "", paymentHistory: Array.isArray(row.payment_history) ? row.payment_history : [],
  lastReminderSent: row.last_reminder_sent ?? null,
});

interface FieldProps {
  label: string; fieldKey: keyof FormData; type?: string; placeholder?: string;
  value: string; error?: string; onChange: (k: keyof FormData, v: string) => void; children?: React.ReactNode;
}

function FormField({ label, fieldKey, type="text", placeholder="", value, error, onChange, children }: FieldProps) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:11, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(236,236,236,.35)", marginBottom:7 }}>{label}</label>
      {children ?? (
        <input type={type} value={value} placeholder={placeholder}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(fieldKey, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "ArrowDown") {
              e.preventDefault();
              const inputs = document.querySelectorAll("input, select");
              const arr = Array.from(inputs);
              const idx = arr.indexOf(e.target as Element);
              if (idx < arr.length - 1) (arr[idx + 1] as HTMLElement).focus();
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const inputs = document.querySelectorAll("input, select");
              const arr = Array.from(inputs);
              const idx = arr.indexOf(e.target as Element);
              if (idx > 0) (arr[idx - 1] as HTMLElement).focus();
            }
          }}
          style={{ width:"100%", padding:"11px 13px", background:"rgba(255,255,255,.05)", border: error ? "1px solid #f87171" : "1px solid rgba(236,236,236,.1)", borderRadius:4, color:"#ececec", fontFamily:"'Inter',sans-serif", fontSize:14, outline:"none", transition:"border-color .2s" }}
          onFocus={e => { if (!error) e.target.style.borderColor="rgba(200,245,90,.45)"; }}
          onBlur={e  => { if (!error) e.target.style.borderColor="rgba(236,236,236,.1)"; }}
        />
      )}
      {error && <p style={{ fontSize:11, color:"#f87171", marginTop:5 }}>{error}</p>}
    </div>
  );
}

function SortArrow({ active, asc }: { active: boolean; asc: boolean }) {
  return <span style={{ marginLeft:4, fontSize:10, color: active ? "#c8f55a" : "rgba(236,236,236,.18)" }}>{active ? (asc?"↑":"↓") : "↕"}</span>;
}

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<Status | "all">("all");
  const [modal,     setModal]     = useState<ModalType>(null);
  const [active,    setActive]    = useState<Customer | null>(null);
  const [form,      setForm]      = useState<FormData>(EMPTY);
  const [errors,    setErrors]    = useState<Partial<FormData>>({});
  const [toast,     setToast]     = useState<{ msg:string; type:"success"|"error" } | null>(null);
  const [sortKey,   setSortKey]   = useState<SortKey>(null);
  const [sortAsc,   setSortAsc]   = useState(true);
  const [tab,       setTab]       = useState<"all"|"overdue"|"upcoming">("all");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    const supabase = createClient();
    supabase.from("customers").select("*").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error(error); setLoading(false); return; }
        setCustomers((data ?? []).map(rowToCustomer));
        setLoading(false);
      });
  }, [authChecked]);

  const refreshStatuses = useCallback(() => {
    setCustomers(prev => prev.map(c => c.status === "paid" ? c : { ...c, status: calcStatus(c.nextDueDate) }));
  }, []);

  useEffect(() => {
    refreshStatuses();
    const t = setInterval(refreshStatuses, 60_000);
    return () => clearInterval(t);
  }, [refreshStatuses]);

  const overdueList  = customers.filter(c => c.status === "overdue");
  const upcomingList = customers.filter(c => c.status === "upcoming");
  const paidList     = customers.filter(c => c.status === "paid");
  const unpaidList   = customers.filter(c => c.status !== "paid");
  const totalPend    = unpaidList.reduce((s,c) => s+c.amount, 0);
  const totalRecov   = paidList.reduce((s,c) => s+c.amount, 0);
  const totalAll     = customers.reduce((s,c) => s+c.amount, 0);
  const recovPct     = totalAll > 0 ? Math.round((totalRecov/totalAll)*100) : 0;

  const list = useMemo(() => {
    let arr = customers
      .filter(c => filter==="all" || c.status===filter)
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
    if (sortKey) {
      arr = [...arr].sort((a,b) => {
        const av = sortKey==="amount" ? a.amount : a[sortKey];
        const bv = sortKey==="amount" ? b.amount : b[sortKey];
        const r  = av<bv ? -1 : av>bv ? 1 : 0;
        return sortAsc ? r : -r;
      });
    }
    return arr;
  }, [customers, filter, search, sortKey, sortAsc]);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleFieldChange = (k: keyof FormData, v: string) => {
    setForm(p => ({ ...p, [k]:v }));
    setErrors(p => ({ ...p, [k]:undefined }));
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey===k) setSortAsc(a=>!a);
    else { setSortKey(k); setSortAsc(true); }
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\s/g,""))) e.phone = "Enter valid 10-digit number";
    if (!form.amount || isNaN(+form.amount) || +form.amount<=0) e.amount = "Enter a valid amount";
    if (!form.nextDueDate) e.nextDueDate = "Due date is required";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const closeModal = () => { setModal(null); setActive(null); setErrors({}); };
  const closeModalAndReset = () => { setModal(null); setActive(null); setForm(EMPTY); setErrors({}); };
  const openAdd = () => { setErrors({}); setModal("add"); };

  const handleAdd = async () => {
    if (!validate()) return;
    if (customers.some(c => c.phone===form.phone.trim())) {
      setErrors(p => ({ ...p, phone:"A customer with this number already exists" }));
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("customers").insert({
      user_id: user.id, name: form.name.trim(), phone: form.phone.trim(),
      amount: +form.amount, billing_cycle: form.billingCycle, last_payment_date: null,
      next_due_date: form.nextDueDate, status: calcStatus(form.nextDueDate),
      note: form.note.trim(), payment_history: [],
    }).select().single();
    if (error) { showToast("Failed to add customer", "error"); return; }
    setCustomers(prev => [rowToCustomer(data), ...prev]);
    closeModalAndReset();
    showToast("Customer added ✓");
  };

  const openEdit = (c: Customer) => {
    setActive(c);
    setForm({ name:c.name, phone:c.phone, amount:String(c.amount), billingCycle:c.billingCycle, nextDueDate:c.nextDueDate, note:c.note });
    setErrors({});
    setModal("edit");
  };

  const handleEdit = async () => {
    if (!validate() || !active) return;
    if (customers.some(c => c.phone===form.phone.trim() && c.id!==active.id)) {
      setErrors(p => ({ ...p, phone:"Another customer has this number" }));
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("customers").update({
      name: form.name.trim(), phone: form.phone.trim(), amount: +form.amount,
      billing_cycle: form.billingCycle, next_due_date: form.nextDueDate,
      note: form.note.trim(), status: active.status==="paid" ? "paid" : calcStatus(form.nextDueDate),
    }).eq("id", active.id);
    if (error) { showToast("Failed to update customer", "error"); return; }
    setCustomers(prev => prev.map(c => c.id!==active.id ? c : {
      ...c, name:form.name.trim(), phone:form.phone.trim(), amount:+form.amount,
      billingCycle:form.billingCycle, nextDueDate:form.nextDueDate, note:form.note.trim(),
      status: c.status==="paid" ? "paid" : calcStatus(form.nextDueDate),
    }));
    closeModalAndReset();
    showToast("Customer updated ✓");
  };

  const markPaid = async (id: string) => {
    const c = customers.find(x => x.id===id);
    if (!c) return;
    const today = todayStr();
    const nextDue = addCycleDays(today, c.billingCycle);
    const newPayment: Payment = { id:uid(), date:today, amount:c.amount, note:"" };
    const newHistory = [newPayment, ...c.paymentHistory];
    const supabase = createClient();
    const { error } = await supabase.from("customers").update({ status:"paid", last_payment_date:today, next_due_date:nextDue, payment_history:newHistory }).eq("id", id);
    if (error) { showToast("Failed to update", "error"); return; }
    setCustomers(prev => prev.map(x => x.id!==id ? x : { ...x, status:"paid", lastPaymentDate:today, nextDueDate:nextDue, paymentHistory:newHistory }));
    showToast("Marked as paid — next due date updated ✓");
  };

  const undoPaid = async (id: string) => {
    const c = customers.find(x => x.id===id);
    if (!c) return;
    const history = c.paymentHistory.slice(1);
    const prevDue = history.length > 0 ? addCycleDays(history[0].date, c.billingCycle) : c.nextDueDate;
    const newStatus = calcStatus(prevDue);
    const supabase = createClient();
    const { error } = await supabase.from("customers").update({ status:newStatus, last_payment_date: history.length>0?history[0].date:null, next_due_date:prevDue, payment_history:history }).eq("id", id);
    if (error) { showToast("Failed to undo", "error"); return; }
    setCustomers(prev => prev.map(x => x.id!==id ? x : { ...x, status:newStatus, lastPaymentDate:history.length>0?history[0].date:null, nextDueDate:prevDue, paymentHistory:history }));
    showToast("Payment undone ✓");
  };

  const deleteCustomer = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) { showToast("Failed to delete", "error"); return; }
    setCustomers(prev => prev.filter(c => c.id!==id));
    showToast("Customer removed");
  };

  const openRemind  = (c: Customer) => { setActive(c); setModal("remind"); };
  const openHistory = (c: Customer) => { setActive(c); setModal("history"); };

  if (!authChecked) return null;

  return (
    <main style={{ background:"#0a0a0a", color:"#ececec", minHeight:"100vh", fontFamily:"'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin    { to{transform:rotate(360deg)} }

        input::placeholder, textarea::placeholder { color:rgba(236,236,236,.22); }
        input:focus, textarea:focus, select:focus { outline:none; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(.5); cursor:pointer; }
        select option { background:#1a1a1a; color:#ececec; }

        .row { animation:fadeIn .28s ease both; }
        .row:hover { background:rgba(255,255,255,.03) !important; }

        .th-btn { background:none; border:none; cursor:pointer; padding:0; font-family:'Inter',sans-serif; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:rgba(236,236,236,.3); display:flex; align-items:center; transition:color .15s; }
        .th-btn:hover { color:rgba(236,236,236,.65); }

        .icon-btn { background:none; border:none; cursor:pointer; padding:6px 9px; border-radius:3px; font-size:12px; font-family:'Inter',sans-serif; transition:background .15s; }
        .icon-btn:hover { background:rgba(236,236,236,.07); }

        .filter-btn { padding:7px 14px; border-radius:2px; font-size:12px; font-family:'Inter',sans-serif; cursor:pointer; border:1px solid rgba(236,236,236,.1); transition:background .18s, color .18s, border-color .18s; }

        .tab-btn { padding:8px 16px; border-radius:2px; font-size:12px; font-weight:500; font-family:'Inter',sans-serif; cursor:pointer; border:none; transition:background .18s, color .18s; }

        .section-card { border:1px solid rgba(236,236,236,.07); background:rgba(255,255,255,.02); border-radius:4px; padding:20px 22px; margin-bottom:20px; }

        .pulse-dot { width:7px; height:7px; border-radius:50%; animation:pulse 2s ease-in-out infinite; flex-shrink:0; }

        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(236,236,236,.1); border-radius:2px; }

        @media (max-width:768px) {
          .dash-nav { padding:12px 16px !important; flex-wrap:wrap; gap:10px; }
          .dash-nav-left span:last-child { display:none; }
          .dash-nav-right { gap:6px !important; flex-wrap:wrap; }
          .auto-badge-text { display:none; }
          .dash-content { padding:20px 16px !important; }
          .stat-grid { grid-template-columns:1fr 1fr !important; gap:8px !important; }
          .auto-strip { flex-direction:column !important; align-items:flex-start !important; gap:8px !important; }
          .auto-strip-right { display:none; }
          .tab-row { gap:4px !important; }
          .tab-btn { padding:7px 10px !important; font-size:11px !important; }
          .table-header { display:none !important; }
          .mob-card { display:flex !important; }
          .desk-row { display:none !important; }
          .filter-row { flex-direction:column !important; }
          .filter-row input { min-width:unset !important; }
        }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav className="dash-nav" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 48px", borderBottom:"1px solid rgba(236,236,236,.07)", background:"rgba(10,10,10,.97)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100 }}>
        <div className="dash-nav-left" style={{ display:"flex", alignItems:"center", gap:20 }}>
          <a href="/" style={{ fontSize:16, fontWeight:600, letterSpacing:"-0.02em", color:"#ececec", textDecoration:"none" }}>
            Collect<span style={{ color:"#c8f55a" }}>Pro</span>
          </a>
          <span style={{ fontSize:11, color:"rgba(236,236,236,.2)", letterSpacing:".08em", textTransform:"uppercase" }}>Dashboard</span>
        </div>
        <div className="dash-nav-right" style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"rgba(200,245,90,.08)", border:"1px solid rgba(200,245,90,.15)", borderRadius:2, fontSize:12, color:"#c8f55a" }}>
            <div className="pulse-dot" style={{ background:"#c8f55a" }}/>
            <span className="auto-badge-text">Auto reminders on</span>
          </div>
          {overdueList.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.2)", borderRadius:2, fontSize:12, color:"#f87171" }}>
              <div className="pulse-dot" style={{ background:"#f87171" }}/>
              {overdueList.length} overdue
            </div>
          )}
          <button onClick={openAdd} style={{ background:"#c8f55a", color:"#0a0a0a", border:"none", padding:"10px 18px", borderRadius:2, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"background .18s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#b8e84a"} onMouseLeave={e=>e.currentTarget.style.background="#c8f55a"}>
            + Add
          </button>
          <button onClick={async () => { const supabase = createClient(); await supabase.auth.signOut(); router.push("/login"); }}
            style={{ background:"transparent", color:"#ececec", border:"1px solid rgba(236,236,236,.16)", padding:"10px 14px", borderRadius:2, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"background .18s" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(236,236,236,.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dash-content" style={{ maxWidth:1280, margin:"0 auto", padding:"32px 48px" }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, flexDirection:"column", gap:16 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", border:"2px solid rgba(200,245,90,.15)", borderTopColor:"#c8f55a", animation:"spin 0.8s linear infinite" }}/>
            <p style={{ fontSize:13, color:"rgba(236,236,236,.3)" }}>Loading customers...</p>
          </div>
        ) : (
          <>
            {/* ══ STAT CARDS ══ */}
            <div className="stat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
              {([
                { label:"Total Pending",   value:fmt(totalPend),              sub:`${unpaidList.length} customers`, accent:false, red:false, purple:false },
                { label:"Recovered",       value:fmt(totalRecov),             sub:"collected",                      accent:true,  red:false, purple:false },
                { label:"Overdue",         value:String(overdueList.length),  sub:"action needed",                  accent:false, red:true,  purple:false },
                { label:"Upcoming",        value:String(upcomingList.length), sub:"due within 3 days",              accent:false, red:false, purple:true  },
                { label:"Total Customers", value:String(customers.length),    sub:"in system",                      accent:false, red:false, purple:false },
              ] as const).map((s,i) => (
                <div key={i} style={{ padding:"16px", border: s.accent?"1px solid rgba(200,245,90,.18)":s.red?"1px solid rgba(248,113,113,.15)":s.purple?"1px solid rgba(99,102,241,.2)":"1px solid rgba(236,236,236,.07)", background: s.accent?"rgba(200,245,90,.04)":s.red?"rgba(248,113,113,.04)":s.purple?"rgba(99,102,241,.04)":"rgba(255,255,255,.02)", borderRadius:4, animation:`slideUp .4s ease ${i*.06}s both` }}>
                  <p style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.28)", marginBottom:8 }}>{s.label}</p>
                  <p style={{ fontSize:"clamp(20px,2.5vw,30px)", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1, marginBottom:4, color: s.accent?"#c8f55a":s.red?"#f87171":s.purple?"#818cf8":"#ececec" }}>{s.value}</p>
                  <p style={{ fontSize:10, color:"rgba(236,236,236,.22)" }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* ══ AUTOMATION STATUS ══ */}
            <div className="auto-strip" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"rgba(200,245,90,.04)", border:"1px solid rgba(200,245,90,.15)", borderRadius:4, marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div className="pulse-dot" style={{ background:"#c8f55a" }}/>
                <span style={{ fontSize:13, color:"#c8f55a", fontWeight:500 }}>Auto reminders active</span>
                <span style={{ fontSize:12, color:"rgba(236,236,236,.3)" }}>· Every morning 9:30 AM</span>
              </div>
              <div className="auto-strip-right" style={{ display:"flex", gap:16 }}>
                <span style={{ fontSize:12, color:"rgba(236,236,236,.35)" }}>Next run: <span style={{ color:"rgba(236,236,236,.6)" }}>Tomorrow 9:30 AM</span></span>
                <span style={{ fontSize:12, color:"rgba(236,236,236,.35)" }}>Watching: <span style={{ color:"rgba(236,236,236,.6)" }}>{customers.length} customers</span></span>
              </div>
            </div>

            {/* ══ RECOVERY BAR ══ */}
            <div className="section-card" style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <p style={{ fontSize:11, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(236,236,236,.28)" }}>Recovery Rate</p>
                <p style={{ fontSize:13, fontWeight:500, color:"#c8f55a" }}>{recovPct}%</p>
              </div>
              <div style={{ height:5, background:"rgba(236,236,236,.07)", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:3, background:"linear-gradient(90deg,#c8f55a,#a8e040)", width:`${recovPct}%`, transition:"width 1.2s cubic-bezier(.22,.61,.36,1)" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <p style={{ fontSize:11, color:"rgba(236,236,236,.2)" }}>{fmt(totalRecov)} collected</p>
                <p style={{ fontSize:11, color:"rgba(236,236,236,.2)" }}>{fmt(totalPend)} remaining</p>
              </div>
            </div>

            {/* ══ TABS ══ */}
            <div className="tab-row" style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
              {([
                { key:"all", label:"All Customers" },
                { key:"overdue", label:`🔴 Overdue (${overdueList.length})` },
                { key:"upcoming", label:`🟡 Upcoming (${upcomingList.length})` },
              ] as const).map(t => (
                <button key={t.key} className="tab-btn" onClick={()=>setTab(t.key)} style={{ background:tab===t.key?"rgba(200,245,90,.12)":"rgba(255,255,255,.03)", color:tab===t.key?"#c8f55a":"rgba(236,236,236,.45)", border:tab===t.key?"1px solid rgba(200,245,90,.22)":"1px solid rgba(236,236,236,.08)" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ══ OVERDUE PANEL ══ */}
            {tab==="overdue" && (
              <div className="section-card" style={{ borderColor:"rgba(248,113,113,.15)", background:"rgba(248,113,113,.025)" }}>
                <p style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(248,113,113,.7)", marginBottom:16 }}>Overdue Payments — Immediate Action Required</p>
                {overdueList.length===0
                  ? <p style={{ fontSize:13, color:"rgba(236,236,236,.3)", padding:"20px 0" }}>No overdue payments 🎉</p>
                  : overdueList.map(c => {
                      const d = Math.abs(daysFromNow(c.nextDueDate));
                      const msg = buildReminderMsg(c);
                      return (
                        <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"center", padding:"14px 0", borderBottom:"1px solid rgba(248,113,113,.08)" }}>
                          <div>
                            <p style={{ fontSize:14, fontWeight:500, marginBottom:2 }}>{c.name}</p>
                            <p style={{ fontSize:12, color:"#f87171" }}>{d} day{d!==1?"s":""} overdue · {fmt(c.amount)}</p>
                            {c.lastReminderSent && <p style={{ fontSize:10, color:"#c8f55a", marginTop:3 }}>✓ Auto reminder sent {fmtDateTime(c.lastReminderSent)}</p>}
                            {c.note && <p style={{ fontSize:11, color:"rgba(236,236,236,.28)", fontStyle:"italic" }}>{c.note}</p>}
                          </div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            <a href={waLink(c.phone, msg)} target="_blank" rel="noopener noreferrer" onClick={()=>showToast(`Reminder sent to ${c.name} ✓`)} style={{ padding:"8px 12px", background:"#25D366", color:"#fff", borderRadius:2, fontSize:12, fontWeight:500, textDecoration:"none", fontFamily:"'Inter',sans-serif" }}>WA</a>
                            <button onClick={()=>markPaid(c.id)} style={{ padding:"8px 12px", background:"rgba(200,245,90,.12)", color:"#c8f55a", border:"1px solid rgba(200,245,90,.2)", borderRadius:2, fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>✓ Paid</button>
                          </div>
                        </div>
                      );
                    })}
              </div>
            )}

            {/* ══ UPCOMING PANEL ══ */}
            {tab==="upcoming" && (
              <div className="section-card" style={{ borderColor:"rgba(99,102,241,.2)", background:"rgba(99,102,241,.025)" }}>
                <p style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(129,140,248,.7)", marginBottom:16 }}>Upcoming Payments — Due within 3 days</p>
                {upcomingList.length===0
                  ? <p style={{ fontSize:13, color:"rgba(236,236,236,.3)", padding:"20px 0" }}>No upcoming payments right now</p>
                  : upcomingList.map(c => {
                      const diff = daysFromNow(c.nextDueDate);
                      const msg = buildReminderMsg(c);
                      const label = diff===0 ? "Due today" : `Due in ${diff} day${diff!==1?"s":""}`;
                      return (
                        <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"center", padding:"14px 0", borderBottom:"1px solid rgba(99,102,241,.08)" }}>
                          <div>
                            <p style={{ fontSize:14, fontWeight:500, marginBottom:2 }}>{c.name}</p>
                            <p style={{ fontSize:12, color:"#818cf8" }}>{label} · {fmt(c.amount)}</p>
                            {c.lastReminderSent && <p style={{ fontSize:10, color:"#c8f55a", marginTop:3 }}>✓ Auto reminder sent {fmtDateTime(c.lastReminderSent)}</p>}
                            {c.note && <p style={{ fontSize:11, color:"rgba(236,236,236,.28)", fontStyle:"italic" }}>{c.note}</p>}
                          </div>
                          <div style={{ display:"flex", gap:6 }}>
                            <a href={waLink(c.phone, msg)} target="_blank" rel="noopener noreferrer" onClick={()=>showToast(`Reminder sent to ${c.name} ✓`)} style={{ padding:"8px 12px", background:"#25D366", color:"#fff", borderRadius:2, fontSize:12, fontWeight:500, textDecoration:"none", fontFamily:"'Inter',sans-serif" }}>WA</a>
                            <button onClick={()=>markPaid(c.id)} style={{ padding:"8px 12px", background:"rgba(200,245,90,.12)", color:"#c8f55a", border:"1px solid rgba(200,245,90,.2)", borderRadius:2, fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>✓ Paid</button>
                          </div>
                        </div>
                      );
                    })}
              </div>
            )}

            {/* ══ ALL CUSTOMERS ══ */}
            {tab==="all" && (
              <>
                <div className="filter-row" style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
                  <div style={{ position:"relative", flex:1, minWidth:160 }}>
                    <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"rgba(236,236,236,.25)", pointerEvents:"none" }}>⌕</span>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or phone..."
                      style={{ width:"100%", padding:"9px 13px 9px 32px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(236,236,236,.09)", borderRadius:4, color:"#ececec", fontFamily:"'Inter',sans-serif", fontSize:13, outline:"none" }}/>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {(["all","pending","upcoming","overdue","paid"] as const).map(f => (
                      <button key={f} className="filter-btn" onClick={()=>setFilter(f)} style={{ background:filter===f?"rgba(200,245,90,.1)":"transparent", color:filter===f?"#c8f55a":"rgba(236,236,236,.38)", borderColor:filter===f?"rgba(200,245,90,.22)":"rgba(236,236,236,.1)", textTransform:"capitalize" }}>
                        {f==="all"?`All (${customers.length})`:f==="pending"?`Pending (${customers.filter(c=>c.status==="pending").length})`:f==="upcoming"?`Up (${upcomingList.length})`:f==="overdue"?`Over (${overdueList.length})`:`Paid (${paidList.length})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ border:"1px solid rgba(236,236,236,.07)", borderRadius:4, overflow:"hidden" }}>
                  <div className="table-header" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.1fr 0.9fr 0.8fr 0.9fr 180px", padding:"10px 18px", background:"rgba(255,255,255,.025)", borderBottom:"1px solid rgba(236,236,236,.07)" }}>
                    <button className="th-btn" onClick={()=>toggleSort("name")}>Name <SortArrow active={sortKey==="name"} asc={sortAsc}/></button>
                    <button className="th-btn" onClick={()=>toggleSort("amount")}>Amount <SortArrow active={sortKey==="amount"} asc={sortAsc}/></button>
                    <span style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.3)" }}>Cycle</span>
                    <button className="th-btn" onClick={()=>toggleSort("nextDueDate")}>Next Due <SortArrow active={sortKey==="nextDueDate"} asc={sortAsc}/></button>
                    <span style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.3)" }}>Days</span>
                    <button className="th-btn" onClick={()=>toggleSort("status")}>Status <SortArrow active={sortKey==="status"} asc={sortAsc}/></button>
                    <span style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(236,236,236,.3)", textAlign:"right" }}>Actions</span>
                  </div>

                  {list.length===0 ? (
                    <div style={{ padding:"48px", textAlign:"center" }}>
                      <p style={{ fontSize:26, marginBottom:12 }}>📋</p>
                      <p style={{ fontSize:14, color:"rgba(236,236,236,.45)", marginBottom:6 }}>{search||filter!=="all"?"No customers match your filter":"No customers yet"}</p>
                      <p style={{ fontSize:12, color:"rgba(236,236,236,.22)", marginBottom:20 }}>{search||filter!=="all"?"Try clearing the search or filter":"Add your first customer to start tracking"}</p>
                      {!search && filter==="all" && (
                        <button onClick={openAdd} style={{ background:"#c8f55a", color:"#0a0a0a", border:"none", padding:"10px 26px", borderRadius:2, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>+ Add First Customer</button>
                      )}
                    </div>
                  ) : list.map((c,i) => {
                    const diff = daysFromNow(c.nextDueDate);
                    const ss = STATUS_CFG[c.status];
                    const daysLbl = c.status==="paid"?"—":diff>0?`${diff}d left`:diff<0?`${Math.abs(diff)}d late`:"today";
                    const msg = buildReminderMsg(c);
                    return (
                      <div key={c.id}>
                        {/* Desktop row */}
                        <div className="row desk-row" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.1fr 0.9fr 0.8fr 0.9fr 180px", padding:"14px 18px", alignItems:"center", borderBottom:i<list.length-1?"1px solid rgba(236,236,236,.05)":"none", background:"rgba(255,255,255,.01)", borderLeft:c.status==="overdue"?"2px solid rgba(248,113,113,.45)":c.status==="upcoming"?"2px solid rgba(99,102,241,.45)":"2px solid transparent", transition:"background .15s", animationDelay:`${i*.035}s` }}>
                          <div>
                            <p style={{ fontSize:14, fontWeight:400, marginBottom:2 }}>{c.name}</p>
                            <p style={{ fontSize:11, color:"rgba(236,236,236,.28)" }}>{c.phone}</p>
                            {c.lastReminderSent && <p style={{ fontSize:10, color:"#c8f55a", marginTop:2 }}>✓ Reminded {fmtDateTime(c.lastReminderSent)}</p>}
                            {c.note && <p style={{ fontSize:11, color:"rgba(236,236,236,.2)", fontStyle:"italic", marginTop:1 }}>{c.note}</p>}
                          </div>
                          <span style={{ fontSize:14, fontWeight:500 }}>{fmt(c.amount)}</span>
                          <span style={{ fontSize:12, color:"rgba(236,236,236,.4)" }}>{CYCLE_LABEL[c.billingCycle]}</span>
                          <span style={{ fontSize:12, color:"rgba(236,236,236,.45)" }}>{fmtDate(c.nextDueDate)}</span>
                          <span style={{ fontSize:12, fontWeight:500, color:c.status==="overdue"?"#f87171":c.status==="upcoming"?"#818cf8":c.status==="paid"?"rgba(236,236,236,.2)":"rgba(236,236,236,.4)" }}>{daysLbl}</span>
                          <span style={{ display:"inline-block", padding:"3px 9px", background:ss.bg, color:ss.color, border:`1px solid ${ss.border}`, fontSize:11, fontWeight:500, borderRadius:2, width:"fit-content" }}>{ss.label}</span>
                          <div style={{ display:"flex", gap:2, justifyContent:"flex-end" }}>
                            {c.status!=="paid" && (
                              <>
                                <button className="icon-btn" onClick={()=>markPaid(c.id)} style={{ color:"#c8f55a", fontSize:11, fontWeight:500 }}>✓ Paid</button>
                                <button className="icon-btn" onClick={()=>openRemind(c)} style={{ color:"rgba(236,236,236,.45)", fontSize:14 }}>✉</button>
                              </>
                            )}
                            {c.status==="paid" && <button className="icon-btn" onClick={()=>undoPaid(c.id)} style={{ color:"rgba(236,236,236,.3)", fontSize:11 }}>↩ Undo</button>}
                            <button className="icon-btn" onClick={()=>openHistory(c)} style={{ color:"rgba(236,236,236,.35)", fontSize:13 }}>≡</button>
                            <button className="icon-btn" onClick={()=>openEdit(c)} style={{ color:"rgba(236,236,236,.35)", fontSize:14 }}>✎</button>
                            <button className="icon-btn" onClick={()=>deleteCustomer(c.id)} style={{ color:"rgba(248,113,113,.4)", fontSize:13 }}>✕</button>
                          </div>
                        </div>

                        {/* Mobile card */}
                        <div className="mob-card" style={{ display:"none", flexDirection:"column", padding:"14px 16px", borderBottom:i<list.length-1?"1px solid rgba(236,236,236,.05)":"none", background:"rgba(255,255,255,.01)", borderLeft:c.status==="overdue"?"2px solid rgba(248,113,113,.45)":c.status==="upcoming"?"2px solid rgba(99,102,241,.45)":"2px solid transparent", gap:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                            <div>
                              <p style={{ fontSize:14, fontWeight:500, marginBottom:2 }}>{c.name}</p>
                              <p style={{ fontSize:11, color:"rgba(236,236,236,.28)" }}>{c.phone}</p>
                              {c.lastReminderSent && <p style={{ fontSize:10, color:"#c8f55a", marginTop:2 }}>✓ Reminded {fmtDateTime(c.lastReminderSent)}</p>}
                            </div>
                            <span style={{ display:"inline-block", padding:"3px 9px", background:ss.bg, color:ss.color, border:`1px solid ${ss.border}`, fontSize:11, fontWeight:500, borderRadius:2 }}>{ss.label}</span>
                          </div>
                          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                            <span style={{ fontSize:13, fontWeight:500 }}>{fmt(c.amount)}</span>
                            <span style={{ fontSize:12, color:"rgba(236,236,236,.4)" }}>{CYCLE_LABEL[c.billingCycle]}</span>
                            <span style={{ fontSize:12, color:"rgba(236,236,236,.45)" }}>{fmtDate(c.nextDueDate)}</span>
                            <span style={{ fontSize:12, fontWeight:500, color:c.status==="overdue"?"#f87171":c.status==="upcoming"?"#818cf8":"rgba(236,236,236,.4)" }}>{daysLbl}</span>
                          </div>
                          {c.note && <p style={{ fontSize:11, color:"rgba(236,236,236,.2)", fontStyle:"italic" }}>{c.note}</p>}
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {c.status!=="paid" && (
                              <>
                                <button onClick={()=>markPaid(c.id)} style={{ padding:"8px 14px", background:"rgba(200,245,90,.12)", color:"#c8f55a", border:"1px solid rgba(200,245,90,.2)", borderRadius:2, fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>✓ Mark Paid</button>
                                <a href={waLink(c.phone, msg)} target="_blank" rel="noopener noreferrer" onClick={()=>showToast(`Reminder sent ✓`)} style={{ padding:"8px 14px", background:"#25D366", color:"#fff", borderRadius:2, fontSize:12, fontWeight:500, textDecoration:"none", fontFamily:"'Inter',sans-serif" }}>WhatsApp</a>
                              </>
                            )}
                            {c.status==="paid" && <button onClick={()=>undoPaid(c.id)} style={{ padding:"8px 14px", background:"transparent", color:"rgba(236,236,236,.4)", border:"1px solid rgba(236,236,236,.1)", borderRadius:2, fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>↩ Undo</button>}
                            <button onClick={()=>openHistory(c)} style={{ padding:"8px 14px", background:"transparent", color:"rgba(236,236,236,.35)", border:"1px solid rgba(236,236,236,.1)", borderRadius:2, fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>History</button>
                            <button onClick={()=>openEdit(c)} style={{ padding:"8px 14px", background:"transparent", color:"rgba(236,236,236,.35)", border:"1px solid rgba(236,236,236,.1)", borderRadius:2, fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Edit</button>
                            <button onClick={()=>deleteCustomer(c.id)} style={{ padding:"8px 14px", background:"transparent", color:"rgba(248,113,113,.4)", border:"1px solid rgba(248,113,113,.15)", borderRadius:2, fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {list.length>0 && <p style={{ fontSize:11, color:"rgba(236,236,236,.18)", marginTop:10 }}>Showing {list.length} of {customers.length} customers</p>}
              </>
            )}
          </>
        )}
      </div>

      {/* ══ MODALS ══ */}
      {modal && (
        <div onClick={()=>setModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", backdropFilter:"blur(5px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          {(modal==="add"||modal==="edit") && (
            <div onClick={e=>e.stopPropagation()} style={{ background:"#111", border:"1px solid rgba(236,236,236,.1)", borderRadius:6, padding:"32px 28px", width:"100%", maxWidth:460, animation:"slideUp .22s ease", maxHeight:"90vh", overflowY:"auto" }}>
              <h2 style={{ fontSize:17, fontWeight:500, letterSpacing:"-0.02em", marginBottom:24 }}>{modal==="add"?"Add Customer":"Edit Customer"}</h2>
              <FormField label="Full Name" fieldKey="name" value={form.name} error={errors.name} placeholder="e.g. Raj Gym" onChange={handleFieldChange}/>
              <FormField label="Phone" fieldKey="phone" value={form.phone} error={errors.phone} placeholder="10-digit mobile number" onChange={handleFieldChange} type="tel"/>
              <FormField label="Amount (₹)" fieldKey="amount" value={form.amount} error={errors.amount} placeholder="e.g. 2500" onChange={handleFieldChange} type="number"/>
              <FormField label="Next Due Date" fieldKey="nextDueDate" value={form.nextDueDate} error={errors.nextDueDate} onChange={handleFieldChange} type="date"/>
              <FormField label="Billing Cycle" fieldKey="billingCycle" value={form.billingCycle} onChange={handleFieldChange}>
                <select value={form.billingCycle} onChange={e=>handleFieldChange("billingCycle", e.target.value as BillingCycle)} style={{ width:"100%", padding:"11px 13px", background:"rgba(255,255,255,.05)", border:"1px solid rgba(236,236,236,.1)", borderRadius:4, color:"#ececec", fontFamily:"'Inter',sans-serif", fontSize:14 }}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly (3 months)</option>
                  <option value="yearly">Yearly</option>
                </select>
              </FormField>
              <FormField label="Note (optional)" fieldKey="note" value={form.note} placeholder="e.g. Gym membership" onChange={handleFieldChange}/>
              <div style={{ display:"flex", gap:10, marginTop:6 }}>
                <button onClick={modal==="add"?handleAdd:handleEdit} style={{ flex:1, padding:"12px", background:"#c8f55a", color:"#0a0a0a", border:"none", borderRadius:2, fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#b8e84a"} onMouseLeave={e=>e.currentTarget.style.background="#c8f55a"}>
                  {modal==="add"?"Add Customer":"Save Changes"}
                </button>
                <button onClick={closeModalAndReset} style={{ padding:"12px 18px", background:"transparent", color:"rgba(236,236,236,.38)", border:"1px solid rgba(236,236,236,.1)", borderRadius:2, fontSize:14, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}

          {modal==="remind" && active && (() => {
            const msg = buildReminderMsg(active);
            const diff = daysFromNow(active.nextDueDate);
            return (
              <div onClick={e=>e.stopPropagation()} style={{ background:"#111", border:"1px solid rgba(236,236,236,.1)", borderRadius:6, padding:"32px 28px", width:"100%", maxWidth:420, animation:"slideUp .22s ease" }}>
                <h2 style={{ fontSize:17, fontWeight:500, marginBottom:4 }}>Send Reminder</h2>
                <p style={{ fontSize:13, color:"rgba(236,236,236,.3)", marginBottom:6 }}>to {active.name}</p>
                <p style={{ fontSize:12, color:diff<0?"#f87171":diff<=3?"#818cf8":"rgba(236,236,236,.4)", marginBottom:20 }}>{diff<0?`${Math.abs(diff)} days overdue`:diff===0?"Due today":`Due in ${diff} days`} · {fmt(active.amount)}</p>
                <div style={{ padding:"14px 16px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(236,236,236,.08)", borderRadius:4, marginBottom:20 }}>
                  <p style={{ fontSize:13, lineHeight:1.7, color:"rgba(236,236,236,.55)" }}>{msg}</p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <a href={waLink(active.phone, msg)} target="_blank" rel="noopener noreferrer" onClick={()=>{setModal(null);showToast(`Reminder sent to ${active.name} ✓`);}} style={{ flex:1, padding:"12px", background:"#25D366", color:"#fff", borderRadius:2, fontSize:14, fontWeight:500, textDecoration:"none", textAlign:"center", display:"block", fontFamily:"'Inter',sans-serif" }}>Send on WhatsApp</a>
                  <button onClick={()=>{navigator.clipboard?.writeText(msg);setModal(null);showToast("Message copied ✓");}} style={{ padding:"12px 16px", background:"transparent", color:"rgba(236,236,236,.4)", border:"1px solid rgba(236,236,236,.1)", borderRadius:2, fontSize:13, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Copy</button>
                </div>
              </div>
            );
          })()}

          {modal==="history" && active && (
            <div onClick={e=>e.stopPropagation()} style={{ background:"#111", border:"1px solid rgba(236,236,236,.1)", borderRadius:6, padding:"32px 28px", width:"100%", maxWidth:440, animation:"slideUp .22s ease", maxHeight:"80vh", overflowY:"auto" }}>
              <h2 style={{ fontSize:17, fontWeight:500, marginBottom:4 }}>Payment History</h2>
              <p style={{ fontSize:13, color:"rgba(236,236,236,.3)", marginBottom:6 }}>{active.name}</p>
              <p style={{ fontSize:12, color:"rgba(236,236,236,.35)", marginBottom:20 }}>{CYCLE_LABEL[active.billingCycle]} · {fmt(active.amount)} per cycle</p>
              <div style={{ padding:"12px 14px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(236,236,236,.07)", borderRadius:4, marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <p style={{ fontSize:12, color:"rgba(236,236,236,.4)" }}>Next due date</p>
                <p style={{ fontSize:13, fontWeight:500, color:STATUS_CFG[active.status].color }}>{fmtDate(active.nextDueDate)}</p>
              </div>
              {active.paymentHistory.length===0
                ? <p style={{ fontSize:13, color:"rgba(236,236,236,.3)", padding:"16px 0" }}>No payment history yet</p>
                : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {active.paymentHistory.map((p,i) => (
                      <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:i===0?"rgba(200,245,90,.04)":"rgba(255,255,255,.03)", border:`1px solid ${i===0?"rgba(200,245,90,.12)":"rgba(236,236,236,.06)"}`, borderRadius:4 }}>
                        <div>
                          <p style={{ fontSize:13, marginBottom:2 }}>{fmtDate(p.date)}</p>
                          {p.note && <p style={{ fontSize:11, color:"rgba(236,236,236,.3)", fontStyle:"italic" }}>{p.note}</p>}
                          {i===0 && <p style={{ fontSize:10, color:"#c8f55a", letterSpacing:".06em", textTransform:"uppercase", marginTop:2 }}>Latest</p>}
                        </div>
                        <p style={{ fontSize:14, fontWeight:500, color:i===0?"#c8f55a":"#ececec" }}>{fmt(p.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              <button onClick={closeModal} style={{ width:"100%", padding:"11px", marginTop:20, background:"transparent", color:"rgba(236,236,236,.38)", border:"1px solid rgba(236,236,236,.1)", borderRadius:2, fontSize:13, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Close</button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:500, background:"#161616", border:`1px solid ${toast.type==="error"?"rgba(248,113,113,.3)":"rgba(200,245,90,.22)"}`, color:toast.type==="error"?"#f87171":"#c8f55a", padding:"11px 18px", borderRadius:4, fontSize:13, animation:"toastIn .22s ease", boxShadow:"0 8px 28px rgba(0,0,0,.5)" }}>
          {toast.msg}
        </div>
      )}
    </main>
  );
}