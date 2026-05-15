import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Plus, LayoutDashboard, List, Check, X, Trash2, Wallet, Tag } from "lucide-react";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');`;

/* ── Colour tokens ── */
const C = {
  text:        "#FFFFFF",
  textSec:     "rgba(255,255,255,0.68)",
  textMuted:   "rgba(255,255,255,0.40)",
  accent:      "#C4B5FD",   /* violet-300 */
  accentDeep:  "#7C3AED",   /* violet-700 */
  pink:        "#F9A8D4",
  teal:        "#5EEAD4",
  yellow:      "#FDE68A",
  red:         "#FCA5A5",
  glass:       "rgba(255,255,255,0.07)",
  glassMed:    "rgba(255,255,255,0.11)",
  glassHigh:   "rgba(255,255,255,0.16)",
  border:      "rgba(255,255,255,0.16)",
  borderSoft:  "rgba(255,255,255,0.09)",
};

/* ── Glass style factory ── */
function gl(opacity, blur, radius) {
  return {
    background:              "rgba(255,255,255," + (opacity || 0.08) + ")",
    backdropFilter:          "blur(" + (blur || 24) + "px) saturate(180%)",
    WebkitBackdropFilter:    "blur(" + (blur || 24) + "px) saturate(180%)",
    border:                  "1px solid " + C.border,
    borderRadius:            radius || 20,
    boxShadow:               "inset 0 1px 0 rgba(255,255,255,0.20), 0 8px 32px rgba(0,0,0,0.25)",
  };
}

const PRESET_COLORS = [
  "#C084FC","#F472B6","#FB923C","#FBBF24","#34D399","#60A5FA",
  "#818CF8","#E879F9","#F87171","#38BDF8","#4ADE80","#A78BFA",
];

const BASE_CATS = [
  { name:"Food & Dining",     emoji:"🍜", color:"#FB7185" },
  { name:"Transport",         emoji:"🚗", color:"#60A5FA" },
  { name:"Shopping",          emoji:"🛍️", color:"#FBBF24" },
  { name:"Entertainment",     emoji:"🎬", color:"#C084FC" },
  { name:"Health",            emoji:"💊", color:"#34D399" },
  { name:"Bills & Utilities", emoji:"🧾", color:"#FB923C" },
  { name:"Other",             emoji:"📦", color:"#94A3B8" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];



const fmt    = function(n) { return "\u20B9" + n.toLocaleString("en-IN"); };
const getCat = function(name, cats) {
  return cats.find(function(c) { return c.name === name; }) || { name: name, emoji:"📦", color:"#94A3B8" };
};

const getBanner = function(spent, budget) {
  if (!budget || budget <= 0) return { tint:"rgba(196,181,253,0.18)", bar:C.accent,   badge:null,           pct:null };
  const pct = spent / budget;
  if (pct < 0.5)  return { tint:"rgba(52,211,153,0.18)",  bar:"#34D399", badge:"On track",     pct:pct };
  if (pct < 0.75) return { tint:"rgba(253,230,138,0.18)", bar:"#FDE68A", badge:"Watch spend",  pct:pct };
  if (pct < 1.0)  return { tint:"rgba(251,146,60,0.18)",  bar:"#FB923C", badge:"Almost there", pct:pct };
  return               { tint:"rgba(252,165,165,0.22)", bar:"#FCA5A5", badge:"Over budget!", pct:pct };
};

const inputGl = {
  background:           "rgba(255,255,255,0.07)",
  border:               "1px solid rgba(255,255,255,0.15)",
  borderRadius:         12,
  padding:              "12px 16px",
  color:                "#FFFFFF",
  fontSize:             14,
  width:                "100%",
  outline:              "none",
  fontFamily:           "'Plus Jakarta Sans', sans-serif",
};

const TITLES = {
  dashboard:  ["Overview",        "May 2026"],
  add:        ["Add Expense",     "New entry"],
  history:    ["Expenses",        "All time"],
  budget:     ["Budget",          "Monthly limits"],
  categories: ["Categories",      "Manage"],
};

/* ═══════════════════════════════════════ APP ═══════════════════════════════════════ */
export default function App() {
  const todayStr       = new Date().toISOString().slice(0, 10);
  const THIS           = new Date().toISOString().slice(0, 7);
  const thisMonthLabel = new Date().toLocaleString("en-IN", { month:"long", year:"numeric" });

  const [tab, setTab]               = useState("dashboard");
  const [expenses, setExpenses]     = useState([]);
  const [customCats, setCustomCats] = useState([]);
  const [budgets, setBudgets]       = useState({ overall: 0, categories: {} });
  const [form, setForm]             = useState({ category:"", amount:"", date:todayStr, note:"" });
  const [catModal, setCatModal]     = useState(false);

  const allCats = useMemo(function() { return BASE_CATS.concat(customCats); }, [customCats]);

  const curExp = useMemo(function() {
    return expenses.filter(function(e) { return e.date.startsWith(THIS); });
  }, [expenses]);

  const total  = useMemo(function() {
    return curExp.reduce(function(s, e) { return s + e.amount; }, 0);
  }, [curExp]);

  const banner = getBanner(total, budgets.overall);

  const catData = useMemo(function() {
    const map = {};
    curExp.forEach(function(e) { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(function(kv) {
      const cat = getCat(kv[0], allCats);
      return { name: kv[0], value: kv[1], emoji: cat.emoji, color: cat.color };
    }).sort(function(a, b) { return b.value - a.value; });
  }, [curExp, allCats]);

  const monthlyData = useMemo(function() {
    const result = [];
    const now = new Date();
    for (var i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const lbl = d.toLocaleString("en-IN", { month:"short" });
      const t = expenses.filter(function(e) { return e.date.startsWith(key); })
                        .reduce(function(s, e) { return s + e.amount; }, 0);
      result.push({ month: lbl, total: t });
    }
    return result;
  }, [expenses]);

  const sorted = useMemo(function() {
    return expenses.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  }, [expenses]);

  function addExp() {
    if (!form.category || !form.amount || isNaN(+form.amount) || +form.amount <= 0) return;
    setExpenses(function(p) {
      return [{ id:Date.now(), category:form.category, amount:+form.amount, date:form.date, note:form.note }].concat(p);
    });
    setForm({ category:"", amount:"", date:new Date().toISOString().slice(0,10), note:"" });
    setTab("dashboard");
  }

  function addCat(cat) { setCustomCats(function(p) { return p.concat([cat]); }); }
  function delCat(name){ setCustomCats(function(p) { return p.filter(function(c){ return c.name !== name; }); }); }
  function delExp(id)  { setExpenses(function(p)   { return p.filter(function(e){ return e.id !== id; }); }); }

  const ttlSub = TITLES[tab] || ["",""];
  const pageTitle = ttlSub[0];
  const pageSub   = tab === "dashboard" ? thisMonthLabel : ttlSub[1];

  return (
    <div>
      <style>{FONT + `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        .fade { animation: fu .25s ease; }
        @keyframes fu { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .erow { transition: background .12s; }
        .erow:hover { background: rgba(255,255,255,0.05); }
        .catbtn { transition: background .15s, border-color .15s, transform .12s; }
        .catbtn:active { transform: scale(0.95); }
        .nbtn { transition: background .15s; border-radius: 14px; }
        .nbtn:hover { background: rgba(255,255,255,0.08); }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: rgba(196,181,253,0.6) !important; outline: none; }
        @keyframes popIn { from { opacity:0; transform:scale(0.92) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
      `}</style>

      {/* ── Deep gradient background ── */}
      <div style={{ position:"fixed", inset:0, zIndex:0,
        background:"linear-gradient(145deg, #0D0822 0%, #1B1040 35%, #0E1A3A 65%, #130E2E 100%)" }}>
        {/* Ambient orbs */}
        <div style={{ position:"absolute", top:"-10%", right:"-5%", width:380, height:380,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(139,92,246,0.45) 0%, transparent 70%)",
          filter:"blur(40px)" }} />
        <div style={{ position:"absolute", top:"35%", left:"-10%", width:300, height:300,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(59,130,246,0.30) 0%, transparent 70%)",
          filter:"blur(50px)" }} />
        <div style={{ position:"absolute", bottom:"15%", right:"5%", width:260, height:260,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)",
          filter:"blur(45px)" }} />
        <div style={{ position:"absolute", bottom:"-5%", left:"20%", width:320, height:320,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(99,102,241,0.30) 0%, transparent 70%)",
          filter:"blur(55px)" }} />
      </div>

      {/* ── App shell ── */}
      <div style={{ position:"relative", zIndex:1, fontFamily:"'Plus Jakarta Sans',sans-serif",
        minHeight:"100vh", maxWidth:430, margin:"0 auto", color:C.text,
        display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={Object.assign({}, gl(0.06, 20, 0), {
          padding:"48px 22px 18px", flexShrink:0, zIndex:10,
          borderRadius:0, border:"none", borderBottom:"1px solid rgba(255,255,255,0.09)",
          boxShadow:"none" })}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted,
            letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:4 }}>
            {pageSub}
          </div>
          <div style={{ fontSize:26, fontWeight:800, color:C.text, letterSpacing:"-0.5px" }}>
            {pageTitle}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", paddingBottom:140 }}>
          {tab === "dashboard" && (
            <Dashboard total={total} catData={catData} monthlyData={monthlyData}
              recent={sorted.slice(0,5)} txCount={curExp.length}
              banner={banner} budgets={budgets} allCats={allCats}
              thisMonthLabel={thisMonthLabel} />
          )}
          {tab === "add" && (
            <AddForm form={form} setForm={setForm} onAdd={addExp}
              allCats={allCats} onOpenCatModal={function(){ setCatModal(true); }} />
          )}
          {tab === "history" && (
            <History sorted={sorted} allCats={allCats} onDelete={delExp} />
          )}
          {tab === "budget" && (
            <BudgetTab budgets={budgets} allCats={allCats} banner={banner} total={total}
              setOverallBudget={function(v){ setBudgets(function(b){ return Object.assign({},b,{overall:+v||0}); }); }}
              setCatBudget={function(n,v){
                setBudgets(function(b){
                  const cats = Object.assign({}, b.categories);
                  cats[n] = +v || 0;
                  return Object.assign({}, b, { categories: cats });
                });
              }} />
          )}
          {tab === "categories" && (
            <CategoriesTab allCats={allCats} customCats={customCats}
              onDeleteCat={delCat} onOpenModal={function(){ setCatModal(true); }} />
          )}
        </div>

        {/* ── Floating FAB — sits above the nav bar ── */}
        <button onClick={function(){ setTab(tab==="add"?"dashboard":"add"); }}
          style={{ position:"fixed", bottom:78, left:"50%", transform:"translateX(-50%)",
            width:58, height:58, borderRadius:20, border:"none", cursor:"pointer", zIndex:100,
            background: tab==="add"
              ? "rgba(255,255,255,0.18)"
              : "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
            boxShadow: tab==="add"
              ? "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(0,0,0,0.3)"
              : "0 0 28px rgba(168,85,247,0.65), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background .2s, box-shadow .2s" }}>
          {tab==="add"
            ? <X size={24} color="rgba(255,255,255,0.85)" />
            : <Plus size={28} color="#fff" strokeWidth={2.5} />}
        </button>

        {/* ── Floating glass nav bar — 4 tabs only ── */}
        <div style={Object.assign({}, gl(0.13, 30, 28), {
          position:"fixed", bottom:16, left:"50%", transform:"translateX(-50%)",
          width:"calc(100% - 32px)", maxWidth:398,
          padding:"8px 0 8px",
          display:"flex", justifyContent:"space-around", alignItems:"center",
          zIndex:99 })}>
          <NBtn icon={<LayoutDashboard size={20}/>} label="Overview"
            active={tab==="dashboard"} onClick={function(){ setTab("dashboard"); }} />
          <NBtn icon={<Wallet size={20}/>} label="Budget"
            active={tab==="budget"} onClick={function(){ setTab("budget"); }} />
          {/* empty centre slot so tabs flank the FAB naturally */}
          <div style={{ width:58 }} />
          <NBtn icon={<Tag size={20}/>} label="Categories"
            active={tab==="categories"} onClick={function(){ setTab("categories"); }} />
          <NBtn icon={<List size={20}/>} label="History"
            active={tab==="history"} onClick={function(){ setTab("history"); }} />
        </div>
      </div>

      {catModal && (
        <AddCategoryModal
          onClose={function(){ setCatModal(false); }}
          onSave={function(cat){ addCat(cat); setCatModal(false); }} />
      )}
    </div>
  );
}

function NBtn(props) {
  return (
    <button className="nbtn" onClick={props.onClick}
      style={{ background:"none", border:"none", cursor:"pointer",
        display:"flex", flexDirection:"column", alignItems:"center", gap:4,
        padding:"8px 14px", color: props.active ? C.accent : C.textMuted }}>
      {props.icon}
      <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase" }}>
        {props.label}
      </span>
    </button>
  );
}

/* ═══════════════ DASHBOARD ═══════════════ */
function Dashboard(props) {
  const total       = props.total;
  const catData     = props.catData;
  const monthlyData = props.monthlyData;
  const recent      = props.recent;
  const txCount     = props.txCount;
  const banner      = props.banner;
  const budgets     = props.budgets;
  const allCats     = props.allCats;
  const thisMonthLabel = props.thisMonthLabel;
  const budgetPct   = banner.pct !== null ? Math.min(banner.pct, 1) : 0;

  return (
    <div className="fade" style={{ padding:"16px 16px 0" }}>

      {/* Hero spend card */}
      <div style={Object.assign({}, gl(0.10, 28, 24), {
        padding:"28px 24px", marginBottom:14,
        background: "rgba(255,255,255,0.07)",
        backgroundImage: "linear-gradient(135deg, " + banner.tint + " 0%, rgba(255,255,255,0.04) 100%)" })}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted,
          letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:8 }}>
          {"Spent this month · " + thisMonthLabel}
        </div>
        <div style={{ fontSize:46, fontWeight:800, color:C.text, letterSpacing:"-1.5px", lineHeight:1 }}>
          {fmt(total)}
        </div>

        {budgets.overall > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              fontSize:12, color:C.textSec, marginBottom:8, fontWeight:600 }}>
              <span>{"of " + fmt(budgets.overall)}</span>
              <span>{Math.round(budgetPct * 100) + "%" + (banner.pct >= 1 ? " 🚨" : "")}</span>
            </div>
            <div style={{ height:5, borderRadius:3,
              background:"rgba(255,255,255,0.12)", overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:3, background:banner.bar,
                width:(budgetPct * 100) + "%", transition:"width .6s ease",
                boxShadow:"0 0 8px " + banner.bar }} />
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:10, marginTop:16, flexWrap:"wrap" }}>
          <GlassChip label="Transactions" value={String(txCount)} />
          {catData.length > 0 && (
            <GlassChip label="Top category"
              value={catData[0].emoji + " " + catData[0].name.split(" ")[0]} />
          )}
          {banner.badge && <GlassChip label="Status" value={banner.badge} accent={true} />}
        </div>
      </div>

      {/* Spending by category */}
      <GlassCard title="Spending by category">
        {catData.length === 0 ? (
          <Empty text="No expenses this month" />
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:148, height:148, flexShrink:0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={44} outerRadius={68}
                    dataKey="value" strokeWidth={3} stroke="rgba(255,255,255,0.06)">
                    {catData.map(function(entry, i) { return <Cell key={i} fill={entry.color} />; })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1 }}>
              {catData.map(function(cat, i) {
                const catBudget = budgets.categories[cat.name] || 0;
                const barWidth  = catBudget > 0 ? Math.min(cat.value / catBudget, 1) * 100 : 0;
                return (
                  <div key={i} style={{ marginBottom:11 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:8, height:8, borderRadius:2,
                          background:cat.color, flexShrink:0,
                          boxShadow:"0 0 6px " + cat.color }} />
                        <span style={{ fontSize:12, color:C.textSec, fontWeight:500 }}>
                          {cat.emoji + " " + cat.name.split(" ")[0]}
                        </span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700 }}>{fmt(cat.value)}</span>
                    </div>
                    {catBudget > 0 && (
                      <div style={{ marginTop:5, height:3, borderRadius:2,
                        background:"rgba(255,255,255,0.10)", overflow:"hidden" }}>
                        <div style={{ height:"100%", borderRadius:2, background:cat.color,
                          width:barWidth + "%", transition:"width .5s ease" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Monthly trends */}
      <GlassCard title="Monthly trends">
        <div style={{ height:180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top:10, right:8, left:-24, bottom:0 }}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#A78BFA" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false}
                tick={{ fill:"rgba(255,255,255,0.45)", fontSize:12,
                  fontFamily:"Plus Jakarta Sans", fontWeight:600 }} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fill:"rgba(255,255,255,0.30)", fontSize:11,
                  fontFamily:"Plus Jakarta Sans" }}
                tickFormatter={function(v){ return "\u20B9" + (v/1000).toFixed(0) + "k"; }} />
              <Tooltip
                contentStyle={Object.assign({}, gl(0.20, 20, 12), {
                  color:C.text, fontFamily:"Plus Jakarta Sans", fontSize:13, padding:"10px 14px" })}
                formatter={function(v){ return [fmt(v), "Spent"]; }}
                cursor={{ stroke:"rgba(255,255,255,0.12)", strokeWidth:1 }} />
              <Area type="monotone" dataKey="total" stroke="#A78BFA" strokeWidth={2.5}
                fill="url(#ag)"
                dot={{ r:4, fill:"#A78BFA", strokeWidth:0 }}
                activeDot={{ r:6, fill:"#A78BFA", stroke:"rgba(255,255,255,0.3)", strokeWidth:2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Recent transactions */}
      <GlassCard title="Recent transactions" noPad={true}>
        {recent.length === 0 ? (
          <div style={{ padding:16 }}><Empty text="No transactions yet" /></div>
        ) : (
          <div>
            {recent.map(function(e, i) {
              return <ERow key={e.id} expense={e} allCats={allCats} divider={i !== recent.length - 1} />;
            })}
          </div>
        )}
      </GlassCard>

      <div style={{ height:8 }} />
    </div>
  );
}

/* ═══════════════ ADD FORM ═══════════════ */
function AddForm(props) {
  const form           = props.form;
  const setForm        = props.setForm;
  const onAdd          = props.onAdd;
  const allCats        = props.allCats;
  const onOpenCatModal = props.onOpenCatModal;
  const ready          = form.category && form.amount && +form.amount > 0;

  return (
    <div className="fade" style={{ padding:"16px 16px 0" }}>

      <div style={Object.assign({}, gl(0.09, 24, 22), { padding:"24px", marginBottom:14, textAlign:"center" })}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted,
          letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Amount</div>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:4 }}>
          <span style={{ fontSize:28, fontWeight:700, color:C.textMuted }}>₹</span>
          <input type="number" placeholder="0" value={form.amount}
            onChange={function(e){ setForm(function(f){ return Object.assign({},f,{amount:e.target.value}); }); }}
            style={Object.assign({}, inputGl, {
              fontSize:52, fontWeight:800, textAlign:"center", width:"auto", minWidth:0,
              color: form.amount ? C.accent : "rgba(255,255,255,0.25)",
              background:"none", border:"none", borderBottom:"2px solid " +
                (form.amount ? "rgba(196,181,253,0.6)" : "rgba(255,255,255,0.15)"),
              borderRadius:0, padding:"0 0 8px 8px" })} />
        </div>
      </div>

      <div style={Object.assign({}, gl(0.09, 24, 22), { padding:20, marginBottom:14 })}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted,
          letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:14 }}>Category</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {allCats.map(function(cat) {
            const sel = form.category === cat.name;
            return (
              <button key={cat.name} className="catbtn"
                onClick={function(){ setForm(function(f){ return Object.assign({},f,{category:cat.name}); }); }}
                style={{ background: sel ? cat.color + "30" : "rgba(255,255,255,0.06)",
                  border:"1.5px solid " + (sel ? cat.color : "rgba(255,255,255,0.10)"),
                  borderRadius:14, padding:"12px 4px", cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                  boxShadow: sel ? "0 0 12px " + cat.color + "55" : "none" }}>
                <span style={{ fontSize:22 }}>{cat.emoji}</span>
                <span style={{ fontSize:10, color: sel ? cat.color : C.textMuted,
                  fontWeight:600, textAlign:"center", lineHeight:1.2 }}>
                  {cat.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
          <button className="catbtn" onClick={onOpenCatModal}
            style={{ background:"rgba(196,181,253,0.10)",
              border:"1.5px solid rgba(196,181,253,0.25)",
              borderRadius:14, padding:"12px 4px", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:22 }}>＋</span>
            <span style={{ fontSize:10, color:C.accent, fontWeight:600,
              textAlign:"center" }}>New</span>
          </button>
        </div>
      </div>

      <div style={Object.assign({}, gl(0.09, 24, 22), { padding:20, marginBottom:22 })}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted,
          letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:14 }}>Date</div>
        <input type="date" value={form.date}
          onChange={function(e){ setForm(function(f){ return Object.assign({},f,{date:e.target.value}); }); }}
          style={{ background:"none", border:"none", borderBottom:"2px solid rgba(255,255,255,0.18)",
            borderRadius:0, padding:"6px 0 10px 0", color:C.text, fontSize:16, fontWeight:600,
            width:"100%", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif",
            colorScheme:"dark" }} />
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted,
          letterSpacing:"0.14em", textTransform:"uppercase", margin:"22px 0 14px" }}>Note</div>
        <input type="text" placeholder="What was this for?" value={form.note}
          onChange={function(e){ setForm(function(f){ return Object.assign({},f,{note:e.target.value}); }); }}
          style={{ background:"none", border:"none", borderBottom:"2px solid rgba(255,255,255,0.18)",
            borderRadius:0, padding:"6px 0 10px 0", color:C.text, fontSize:15,
            width:"100%", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif" }} />
      </div>

      <button onClick={onAdd} disabled={!ready}
        style={{ width:"100%", padding:"17px", borderRadius:18, border:"none",
          cursor: ready ? "pointer" : "default",
          background: ready
            ? "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)"
            : "rgba(255,255,255,0.08)",
          boxShadow: ready ? "0 0 24px rgba(168,85,247,0.45)" : "none",
          fontSize:15, fontWeight:700, color: ready ? "#fff" : C.textMuted,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          transition:"all .2s", letterSpacing:"0.02em",
          fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
        <Check size={18} />
        <span>Add Expense</span>
      </button>
      <div style={{ height:16 }} />
    </div>
  );
}

/* ═══════════════ HISTORY ═══════════════ */
function History(props) {
  const sorted   = props.sorted;
  const allCats  = props.allCats;
  const onDelete = props.onDelete;

  const grouped = useMemo(function() {
    const map = {};
    sorted.forEach(function(e) {
      const k = e.date.slice(0,7);
      if (!map[k]) map[k] = [];
      map[k].push(e);
    });
    return Object.entries(map).sort(function(a,b){ return b[0] > a[0] ? 1 : -1; });
  }, [sorted]);

  return (
    <div className="fade" style={{ padding:"16px 16px 0" }}>
      {grouped.map(function(group) {
        const month = group[0];
        const items = group[1];
        const parts = month.split("-");
        const tot   = items.reduce(function(s,e){ return s + e.amount; }, 0);
        return (
          <div key={month} style={{ marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              padding:"0 4px 10px", marginBottom:2 }}>
              <span style={{ fontSize:12, fontWeight:800, color:C.textMuted,
                letterSpacing:"0.12em", textTransform:"uppercase" }}>
                {MONTHS[+parts[1] - 1] + " " + parts[0]}
              </span>
              <span style={{ fontSize:13, fontWeight:700, color:C.accent }}>{fmt(tot)}</span>
            </div>
            <div style={gl(0.09, 22, 20)}>
              {items.map(function(e, i) {
                return (
                  <ERow key={e.id} expense={e} allCats={allCats}
                    divider={i !== items.length - 1} onDelete={onDelete} />
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ height:8 }} />
    </div>
  );
}

/* ═══════════════ BUDGET TAB ═══════════════ */
function BudgetTab(props) {
  const budgets          = props.budgets;
  const allCats          = props.allCats;
  const banner           = props.banner;
  const total            = props.total;
  const setOverallBudget = props.setOverallBudget;
  const setCatBudget     = props.setCatBudget;
  const budgetPct        = banner.pct !== null ? Math.min(banner.pct, 1) : 0;

  const legend = [
    { color:"#34D399", range:"Under 50%",  lbl:"Safe to spend" },
    { color:"#FDE68A", range:"50 – 75%",   lbl:"Watch your pace" },
    { color:"#FB923C", range:"75 – 100%",  lbl:"Almost there" },
    { color:"#FCA5A5", range:"Over 100%",  lbl:"Exceeded" },
  ];

  return (
    <div className="fade" style={{ padding:"16px 16px 0" }}>

      <div style={Object.assign({}, gl(0.09, 24, 22), { padding:20, marginBottom:14 })}>
        <SectionLabel text="Banner colour guide" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}>
          {legend.map(function(item) {
            return (
              <div key={item.color} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <div style={{ width:12, height:12, borderRadius:4, background:item.color,
                  flexShrink:0, marginTop:3, boxShadow:"0 0 6px " + item.color }} />
                <div>
                  <div style={{ fontSize:12, color:C.text, fontWeight:700 }}>{item.range}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{item.lbl}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={Object.assign({}, gl(0.09, 24, 22), { padding:20, marginBottom:14 })}>
        <SectionLabel text="Overall monthly budget" />
        <div style={{ display:"flex", alignItems:"baseline", gap:4, marginTop:12 }}>
          <span style={{ fontSize:22, fontWeight:700, color:C.textMuted }}>₹</span>
          <input type="number" placeholder="0 — no budget set"
            value={budgets.overall || ""}
            onChange={function(e){ setOverallBudget(e.target.value); }}
            style={Object.assign({}, inputGl, {
              fontSize:24, fontWeight:700, color:C.accent,
              background:"none", border:"none",
              borderBottom:"2px solid rgba(196,181,253,0.3)",
              borderRadius:0, padding:"0 0 6px 6px" })} />
        </div>
        {budgets.overall > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              fontSize:12, color:C.textSec, marginBottom:8, fontWeight:600 }}>
              <span>{fmt(total) + " spent"}</span>
              <span>{Math.round(budgetPct * 100) + "% used"}</span>
            </div>
            <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.10)" }}>
              <div style={{ height:"100%", borderRadius:3, background:banner.bar,
                width:(budgetPct * 100) + "%", transition:"width .5s",
                boxShadow:"0 0 8px " + banner.bar }} />
            </div>
          </div>
        )}
      </div>

      <div style={Object.assign({}, gl(0.09, 24, 22), { padding:20, marginBottom:16 })}>
        <SectionLabel text="Per-category budgets" />
        <div style={{ marginTop:14 }}>
          {allCats.map(function(cat, i) {
            const catBudget = budgets.categories[cat.name] || 0;
            return (
              <div key={cat.name}>
                {i > 0 && <div style={{ height:1, background:"rgba(255,255,255,0.08)", margin:"4px 0" }} />}
                <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0" }}>
                  <div style={{ width:38, height:38, borderRadius:12,
                    background:cat.color + "22", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:18, flexShrink:0,
                    border:"1px solid " + cat.color + "40" }}>
                    {cat.emoji}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, overflow:"hidden",
                      textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {cat.name}
                    </div>
                    {catBudget > 0 && (
                      <div style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>
                        {"Limit: " + fmt(catBudget)}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                    <span style={{ fontSize:12, color:C.textMuted }}>₹</span>
                    <input type="number" placeholder="—"
                      value={budgets.categories[cat.name] || ""}
                      onChange={function(e){ setCatBudget(cat.name, e.target.value); }}
                      style={Object.assign({}, inputGl, {
                        width:88, textAlign:"right", padding:"8px 10px", fontSize:13, fontWeight:600
                      })} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ CATEGORIES TAB ═══════════════ */
function CategoriesTab(props) {
  const allCats     = props.allCats;
  const customCats  = props.customCats;
  const onDeleteCat = props.onDeleteCat;
  const onOpenModal = props.onOpenModal;

  return (
    <div className="fade" style={{ padding:"16px 16px 0" }}>

      <button onClick={onOpenModal}
        style={Object.assign({}, gl(0.10, 20, 18), {
          width:"100%", padding:"15px 20px", cursor:"pointer", border:"none",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          color:C.accent, fontFamily:"'Plus Jakarta Sans',sans-serif",
          fontSize:13, fontWeight:700, textTransform:"uppercase",
          letterSpacing:"0.08em", marginBottom:16,
          background:"rgba(196,181,253,0.10)",
          border:"1px solid rgba(196,181,253,0.25)" })}>
        <Plus size={16} />
        <span>Add custom category</span>
      </button>

      <div style={Object.assign({}, gl(0.09, 22, 22), { marginBottom:14, overflow:"hidden" })}>
        <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <SectionLabel text={"Default (" + BASE_CATS.length + ")"} />
        </div>
        {BASE_CATS.map(function(cat, i) {
          return <CatRow key={cat.name} cat={cat} divider={i !== BASE_CATS.length - 1} onDelete={null} />;
        })}
      </div>

      <div style={Object.assign({}, gl(0.09, 22, 22), { marginBottom:16, overflow:"hidden" })}>
        <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <SectionLabel text={"Custom (" + customCats.length + ")"} />
        </div>
        {customCats.length === 0 ? (
          <div style={{ padding:20 }}><Empty text="No custom categories yet." /></div>
        ) : (
          <div>
            {customCats.map(function(cat, i) {
              return (
                <CatRow key={cat.name} cat={cat} divider={i !== customCats.length - 1}
                  onDelete={function(){ onDeleteCat(cat.name); }} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CatRow(props) {
  const cat      = props.cat;
  const divider  = props.divider;
  const onDelete = props.onDelete;
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"12px 18px",
      borderBottom: divider ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
      <div style={{ width:42, height:42, borderRadius:14,
        background:cat.color + "20", border:"1px solid " + cat.color + "40",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:20, flexShrink:0 }}>
        {cat.emoji}
      </div>
      <div style={{ flex:1, marginLeft:14 }}>
        <div style={{ fontSize:14, fontWeight:600 }}>{cat.name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:cat.color,
            boxShadow:"0 0 5px " + cat.color }} />
        </div>
      </div>
      {onDelete && (
        <button onClick={onDelete}
          style={{ background:"none", border:"none", cursor:"pointer",
            color:"rgba(252,165,165,0.7)", padding:8, lineHeight:0 }}>
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════ ADD CATEGORY MODAL ═══════════════ */
function AddCategoryModal(props) {
  const onClose = props.onClose;
  const onSave  = props.onSave;

  const [name,  setName]  = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const ready = name.trim() !== "" && emoji.trim() !== "";

  function handleSave() {
    if (!ready) return;
    onSave({ name: name.trim(), emoji: emoji.trim(), color: color });
  }

  return (
    <div onClick={onClose}
      style={{ position:"fixed", inset:0, zIndex:200, padding:"0 16px",
        background:"rgba(5,3,20,0.72)",
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter:"blur(12px)",
        display:"flex", alignItems:"center", justifyContent:"center" }}>

      <div onClick={function(e){ e.stopPropagation(); }}
        style={Object.assign({}, gl(0.16, 32, 28), {
          width:"100%", maxWidth:390,
          animation:"popIn .25s cubic-bezier(.34,1.56,.64,1)",
          background:"rgba(30,20,60,0.75)" })}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"22px 22px 0" }}>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.3px" }}>New category</div>
          <button onClick={onClose}
            style={Object.assign({}, gl(0.10, 10, 10), {
              width:36, height:36, border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" })}>
            <X size={16} color={C.textSec} />
          </button>
        </div>

        <div style={{ padding:"20px 22px 26px" }}>

          <SectionLabel text="Emoji & Name" />
          <div style={{ display:"flex", gap:10, margin:"10px 0 20px" }}>
            <input placeholder="😀" value={emoji} onChange={function(e){ setEmoji(e.target.value); }}
              style={Object.assign({}, inputGl, { width:58, textAlign:"center", fontSize:22, padding:"8px 4px" })} />
            <input placeholder="e.g. Rent, Gym, Travel…" value={name}
              onChange={function(e){ setName(e.target.value); }}
              style={Object.assign({}, inputGl, { flex:1 })} />
          </div>

          <SectionLabel text="Colour" />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, margin:"10px 0 20px" }}>
            {PRESET_COLORS.map(function(col) {
              const isSel = color === col;
              return (
                <button key={col} onClick={function(){ setColor(col); }}
                  style={{ width:"100%", aspectRatio:"1", background:col,
                    border:"none", cursor:"pointer", borderRadius:"50%",
                    outline: isSel ? "3px solid rgba(255,255,255,0.8)" : "3px solid transparent",
                    outlineOffset:2,
                    boxShadow: isSel ? "0 0 12px " + col : "none",
                    transform: isSel ? "scale(1.15)" : "scale(1)",
                    transition:"transform .12s, box-shadow .12s" }} />
              );
            })}
          </div>

          {(emoji || name) && (
            <div style={Object.assign({}, gl(0.08, 16, 14), {
              display:"flex", alignItems:"center", gap:14,
              padding:"14px 16px", marginBottom:22 })}>
              <div style={{ width:42, height:42, borderRadius:14, background:color + "28",
                border:"1px solid " + color + "50",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, flexShrink:0 }}>
                {emoji || "?"}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700 }}>{name || "Category name"}</div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                  <div style={{ width:9, height:9, borderRadius:3, background:color,
                    boxShadow:"0 0 5px " + color }} />
                  <span style={{ fontSize:11, color:C.textMuted }}>Preview</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose}
              style={Object.assign({}, gl(0.08, 10, 14), {
                flex:1, padding:14, border:"none", cursor:"pointer",
                color:C.textSec, fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:13, fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.06em" })}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={!ready}
              style={{ flex:2, padding:14, borderRadius:14, border:"none",
                cursor: ready ? "pointer" : "default",
                background: ready
                  ? "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)"
                  : "rgba(255,255,255,0.08)",
                boxShadow: ready ? "0 0 20px rgba(168,85,247,0.45)" : "none",
                fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:700,
                color: ready ? "#fff" : C.textMuted, textTransform:"uppercase",
                letterSpacing:"0.06em", transition:"all .15s" }}>
              Save Category
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ SHARED COMPONENTS ═══════════════ */
function GlassCard(props) {
  return (
    <div style={Object.assign({}, gl(0.09, 22, 22), { marginBottom:14 })}>
      <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <SectionLabel text={props.title} />
      </div>
      <div style={props.noPad ? {} : { padding:"16px 18px 18px" }}>
        {props.children}
      </div>
    </div>
  );
}

function GlassChip(props) {
  return (
    <div style={{ background: props.accent ? "rgba(196,181,253,0.18)" : "rgba(255,255,255,0.10)",
      border:"1px solid " + (props.accent ? "rgba(196,181,253,0.3)" : "rgba(255,255,255,0.12)"),
      borderRadius:10, padding:"7px 12px",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)" }}>
      <div style={{ fontSize:10, color:C.textMuted, fontWeight:700,
        letterSpacing:"0.08em", textTransform:"uppercase" }}>{props.label}</div>
      <div style={{ fontSize:14, fontWeight:700, color: props.accent ? C.accent : C.text,
        marginTop:1 }}>{props.value}</div>
    </div>
  );
}

function SectionLabel(props) {
  return (
    <div style={{ fontSize:10, fontWeight:800, color:C.textMuted,
      letterSpacing:"0.14em", textTransform:"uppercase" }}>
      {props.text}
    </div>
  );
}

function Empty(props) {
  return (
    <div style={{ textAlign:"center", padding:"14px 0",
      color:C.textMuted, fontSize:13, fontWeight:500 }}>
      {props.text}
    </div>
  );
}

function ERow(props) {
  const expense  = props.expense;
  const allCats  = props.allCats;
  const divider  = props.divider;
  const onDelete = props.onDelete;
  const cat      = getCat(expense.category, allCats);
  const dateStr  = expense.date.slice(5).replace("-", "/");

  return (
    <div className="erow" style={{ display:"flex", alignItems:"center", padding:"12px 18px",
      borderBottom: divider ? "1px solid rgba(255,255,255,0.07)" : "none",
      borderRadius: 0 }}>
      <div style={{ width:42, height:42, borderRadius:14,
        background:cat.color + "20", border:"1px solid " + cat.color + "40",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18, flexShrink:0, marginRight:14 }}>
        {cat.emoji}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, whiteSpace:"nowrap",
          overflow:"hidden", textOverflow:"ellipsis" }}>
          {expense.note || expense.category}
        </div>
        <div style={{ fontSize:12, color:C.textMuted, marginTop:2, fontWeight:500 }}>
          {expense.category + " · " + dateStr}
        </div>
      </div>
      <div style={{ fontSize:14, fontWeight:800, marginLeft:8 }}>
        {"-" + fmt(expense.amount)}
      </div>
      {onDelete && (
        <button onClick={function(){ onDelete(expense.id); }}
          style={{ background:"none", border:"none", cursor:"pointer",
            marginLeft:10, color:"rgba(252,165,165,0.6)", padding:4, lineHeight:0 }}>
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
