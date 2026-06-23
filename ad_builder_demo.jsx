import React, { useState, useMemo } from "react";
import {
  Check, ChevronRight, Layers, Target, MapPin, LayoutGrid, Users,
  DollarSign, Image as ImageIcon, Sparkles, Settings, RotateCcw,
  Send, Eye, Zap, Info, Plus, X, Lock, Pencil, Copy, AlertTriangle, Trash2,
} from "lucide-react";

/* ----------------------------- tokens ----------------------------- */
const BRAND = "#2E5A88";
const BRAND_DK = "#1F3D5C";
const SPLIT = "#B7791F";
const SPLIT_BG = "#FCEFCB";
const OK = "#0F766E";

/* ----------------------------- 連動規則 ----------------------------- */
/* 出價策略：鍵值 + 依 iOS14 切換顯示名稱 */
const BID = [
  { key: "max", off: "最高數量／消費金額", on: "最高數量" },
  { key: "cpa", off: "每次成果成本目標", on: "單次成效費用目標" },
  { key: "cap", off: "出價上限", on: "競價上限" },
  { key: "roas", off: "ROAS 目標", on: "廣告花費回報目標" },
];
const bidName = (key) => { const b = BID.find((x) => x.key === key); return b.off; };
const bidKeyFromName = (name) => { const b = BID.find((x) => x.on === name || x.off === name); return b ? b.key : "max"; };

const GOAL = { install: "應用安裝量最大化", event: "應用事件數量最大化", value: "轉化價值最大化", click: "鏈接點擊量最大化" };
function perfGoalOptions(ios14, bidKey) {
  if (!ios14) {
    if (bidKey === "max") return [GOAL.install, GOAL.event, GOAL.value, GOAL.click];
    if (bidKey === "cpa" || bidKey === "cap") return [GOAL.install, GOAL.event, GOAL.click];
    if (bidKey === "roas") return [GOAL.value];
  } else {
    if (bidKey === "max") return [GOAL.install, GOAL.event, GOAL.value];
    if (bidKey === "cpa" || bidKey === "cap") return [GOAL.install, GOAL.event];
    if (bidKey === "roas") return [GOAL.install, GOAL.value];
  }
  return [GOAL.install, GOAL.event];
}
const goalsForIos = (ios14) => ios14 ? [GOAL.install, GOAL.event, GOAL.value] : [GOAL.install, GOAL.event, GOAL.click, GOAL.value];
const bidStrategiesForGoal = (ios14, goal) => BID.filter((b) => perfGoalOptions(ios14, b.key).includes(goal)).map((b) => b.key);
function attributionOptions(ios14, goal) {
  if (goal === GOAL.click) return [];
  const install = goal === GOAL.install, ev = goal === GOAL.event || goal === GOAL.value;
  if (!ios14) {
    if (install) return ["點擊後 1 天內", "點擊後 1 天內，瀏覽後 1 天內"];
    if (ev) return ["點擊後 1 天內", "點擊後 7 天內"];
    return ["點擊後 1 天內"];
  } else {
    if (install) return ["點擊後 1 天內"];
    if (ev) return ["點擊後 1 天內", "點擊後 7 天內"];
    return ["點擊後 1 天內"];
  }
}

const STEPS = [
  { id: 1, t: "基礎設置", icon: Settings, stage: "Campaign" },
  { id: 2, t: "廣告系列", icon: Layers, stage: "Campaign" },
  { id: 3, t: "投放內容", icon: Target, stage: "Ad Set" },
  { id: 4, t: "地區組", icon: MapPin, stage: "Ad Set", module: "geo", cap: 30 },
  { id: 5, t: "版位", icon: LayoutGrid, stage: "Ad Set" },
  { id: 6, t: "定向包", icon: Users, stage: "Ad Set", module: "target", cap: 20 },
  { id: 7, t: "出價和預算", icon: DollarSign, stage: "Ad Set", module: "bid", cap: 20 },
  { id: 8, t: "創意設置", icon: ImageIcon, stage: "Ad" },
  { id: 9, t: "創意組", icon: Sparkles, stage: "Ad", module: "creative", cap: 30 },
];
const REGION_SUGGEST = ["亞洲 地區", "歐洲經濟區 (EEA)", "台灣", "香港", "新加坡", "馬來西亞", "日本", "Android 付費商店開放國家/地區"];
const mk = {
  geo: (n) => ({ name: `地區組${n}`, target: [], exclude: [] }),
  target: (n) => ({ name: `定向包${n}`, advantage: true, customAud: "不限", audTargeted: [], audExcluded: [], segItems: [], ageMin: "18", ageTo: "65+", gender: "不限", segment: "不限", lang: "", devIncl: ["iPhone", "iPad", "Android 智慧型手機"], devExcl: [], osMin: "2.0", osMax: "14.4", tag: "", wifi: false }),
  bid: (n) => ({ name: `出價和預算${n}`, perfGoal: GOAL.install, adsetBidKey: "max", valueRule: "", eventDist: "統一分配", appEvent: "", attribution: "", billing: "展示次數", deliveryType: "勻速", schedule: "現在開始", startDate: new Date().toISOString().slice(0, 10), startTime: "", endDate: "", endTime: "", budget: "", budgetType: "單日預算", splitGeoBudget: false, geoBudgets: [], splitGeoBid: false, geoBids: [], targetControl: "", spendLow: "", spendHigh: "" }),
  creative: (n) => ({ name: `創意組${n}`, dynamic: false, creativeType: ["創建廣告"], format: ["單圖片或視頻"], destination: "應用", setupBy: "按創意組", optimize: "全面優化(全選)", deepLink: "", productPage: "", videoCount: 1, imageCount: 0, bodyTexts: [], titles: [], cta: "", tag: "", multiLang: false, coopAd: false, existingPost: "" }),
};

/* ----------------------------- 小元件 ----------------------------- */
const Hint = ({ children }) => <p className="mt-1 text-xs text-slate-500 leading-relaxed">{children}</p>;
const LinkBadge = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: "#EAF1F8", color: BRAND }}><Zap size={11} />{children}</span>
);
const SplitTag = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: SPLIT_BG, color: SPLIT }}>{children}</span>
);
const FieldLabel = ({ children, req, badge }) => (
  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
    <label className="text-sm font-semibold text-slate-700">{children}</label>
    {req && <span className="text-rose-500 text-xs">*</span>}{badge}
  </div>
);
const Toggle = ({ checked, onChange }) => (
  <button onClick={() => onChange(!checked)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0" style={{ background: checked ? BRAND : "#CBD5E1" }} aria-pressed={checked}>
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);
const Segmented = ({ options, value, onChange, disabled = [] }) => (
  <div className="inline-flex flex-wrap gap-1.5">
    {options.map((o) => {
      const dis = disabled.includes(o), active = value === o;
      return (
        <button key={o} disabled={dis} onClick={() => onChange(o)} className={`px-3 py-1.5 rounded-md text-sm border transition-all ${dis ? "opacity-40 cursor-not-allowed" : ""}`}
          style={{ borderColor: active ? BRAND : "#D8DEE7", background: active ? BRAND : "#fff", color: active ? "#fff" : "#475569", fontWeight: active ? 600 : 400 }}>
          {dis && <Lock size={11} className="inline mr-1 -mt-0.5" />}{o}
        </button>
      );
    })}
  </div>
);
const MultiSeg = ({ options, values, onToggle }) => (
  <div className="inline-flex flex-wrap gap-1.5">
    {options.map((o) => {
      const active = values.includes(o);
      return (
        <button key={o} onClick={() => onToggle(o)} className="px-3 py-1.5 rounded-md text-sm border transition-all relative overflow-hidden"
          style={{ borderColor: active ? BRAND : "#D8DEE7", background: active ? "#EAF1F8" : "#fff", color: active ? BRAND : "#475569", fontWeight: active ? 600 : 400 }}>
          {active && <span className="absolute top-0 right-0" style={{ width: 0, height: 0, borderTop: `9px solid ${BRAND}`, borderLeft: "9px solid transparent" }} />}
          {o}
        </button>
      );
    })}
  </div>
);
const Select = ({ options, value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300">
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);
const Text = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300" />
);
const Amount = ({ value, onChange, placeholder }) => (
  <div className="flex">
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 rounded-l-md border border-slate-300 px-3 py-2 text-sm focus:outline-none" />
    <span className="rounded-r-md border border-l-0 border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">USD</span>
  </div>
);
const Block = ({ children }) => <div className="mb-5">{children}</div>;
const Tokens = ({ list }) => (
  <div className="flex flex-wrap gap-1.5 mt-2">{list.map((t) => <span key={t} className="text-xs rounded border border-slate-200 px-2 py-0.5 text-slate-500">{t}</span>)}<span className="text-xs" style={{ color: BRAND }}>展開</span></div>
);
function Counter({ value, onChange, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600 w-12">{label}</span>
      <button onClick={() => onChange(Math.max(0, value - 1))} className="h-8 w-8 rounded-md border border-slate-300 text-slate-600">−</button>
      <span className="w-8 text-center text-sm font-semibold" style={{ color: SPLIT }}>{value}</span>
      <button onClick={() => onChange(value + 1)} className="h-8 w-8 rounded-md border border-slate-300 text-slate-600">＋</button>
    </div>
  );
}
function TagAdder({ items, onAdd, onRemove, placeholder, suggestions = [], tone = SPLIT }) {
  const [v, setV] = useState("");
  const add = (val) => { const x = (val ?? v).trim(); if (x) { onAdd(x); setV(""); } };
  const bg = tone === SPLIT ? SPLIT_BG : tone === BRAND ? "#EAF1F8" : "#FEE2E2";
  return (
    <div>
      <div className="flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={placeholder} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        <button onClick={() => add()} className="rounded-md px-3 text-white text-sm flex items-center gap-1" style={{ background: BRAND }}><Plus size={14} />新增</button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">{suggestions.filter((x) => !items.includes(x)).map((x) => (
          <button key={x} onClick={() => add(x)} className="text-xs rounded-full border border-slate-200 px-2 py-0.5 text-slate-500 hover:border-slate-400">+ {x}</button>
        ))}</div>
      )}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">{items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: bg, color: tone }}>
            {it}<button onClick={() => onRemove(i)}><X size={12} /></button>
          </span>
        ))}</div>
      )}
    </div>
  );
}
function ModuleTabs({ groups, active, onSelect, onAdd, onRemove, cap }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 mb-4">
      <div className="flex items-end gap-1 flex-wrap">
        {groups.map((g, i) => {
          const on = i === active;
          return (
            <button key={i} onClick={() => onSelect(i)} className="group flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-md border-b-2 -mb-px" style={{ borderColor: on ? BRAND : "transparent", color: on ? BRAND : "#64748B", background: on ? "#F5F8FC" : "transparent", fontWeight: on ? 600 : 400 }}>
              {g.name}
              {groups.length > 1 && <span onClick={(e) => { e.stopPropagation(); onRemove(i); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500"><X size={12} /></span>}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 pb-2">
        <button onClick={onAdd} disabled={groups.length >= cap} className="flex items-center gap-1 text-sm disabled:opacity-40" style={{ color: BRAND }}><Plus size={14} />新增</button>
        <span className="text-xs text-slate-400">{groups.length}/{cap}</span>
      </div>
    </div>
  );
}
function RepeatRows({ items, onChange, min, max, maxLen, addLabel }) {
  const update = (i, v) => onChange(items.map((x, j) => (j === i ? v.slice(0, maxLen) : x)));
  const add = () => items.length < max && onChange([...items, ""]);
  const del = (i) => items.length > min && onChange(items.filter((_, j) => j !== i));
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input value={it} maxLength={maxLen} onChange={(e) => update(i, e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400">{it.length}/{maxLen}</span>
          </div>
          {items.length > min ? <button onClick={() => del(i)} className="text-slate-300 hover:text-rose-500 shrink-0"><Trash2 size={15} /></button> : <span className="w-[15px] shrink-0" />}
        </div>
      ))}
      {items.length < max && <button onClick={add} className="text-sm" style={{ color: BRAND }}>{addLabel}</button>}
    </div>
  );
}

const REGION_POOL = ["亞洲", "歐洲經濟區 (EEA)", "台灣", "中國台灣", "香港", "新加坡", "馬來西亞", "日本", "韓國", "美國", "加拿大", "英國", "德國", "法國", "澳洲", "印度", "印尼", "泰國", "越南", "菲律賓", "巴西", "墨西哥", "亞美尼亞", "阿富汗", "阿爾巴尼亞", "緬甸", "岡比亞", "斐濟群島", "哥斯大黎加", "薩爾瓦多", "iTunes App Store 開放國家/地區", "東盟自由貿易區", "Android 付費商店開放國家/地區", "Tucson, AZ 市場", "Fairbanks, AK 市場"];
function RegionPicker({ targeted, excluded, onChange }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("定向");
  const pool = REGION_POOL.filter((r) => r.includes(q));
  const addT = (r) => onChange(targeted.includes(r) ? targeted : [...targeted, r], excluded.filter((x) => x !== r));
  const addE = (r) => onChange(targeted.filter((x) => x !== r), excluded.includes(r) ? excluded : [...excluded, r]);
  const rm = (r) => tab === "定向" ? onChange(targeted.filter((x) => x !== r), excluded) : onChange(targeted, excluded.filter((x) => x !== r));
  const sel = tab === "定向" ? targeted : excluded;
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: 720 }}>
      <div className="rounded-md border border-slate-200">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 text-xs text-slate-500"><span>名稱</span><span>操作</span></div>
        <div className="p-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索..." className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /></div>
        <div className="overflow-y-auto" style={{ maxHeight: 176 }}>
          {pool.map((r) => (
            <div key={r} className="flex items-center justify-between px-3 py-1.5 text-sm hover:bg-slate-50">
              <span className="text-slate-600 truncate pr-2">{r}</span>
              <span className="flex gap-2 shrink-0"><button onClick={() => addT(r)} className="text-xs" style={{ color: targeted.includes(r) ? "#94A3B8" : BRAND }}>定向</button><button onClick={() => addE(r)} className="text-xs" style={{ color: excluded.includes(r) ? "#94A3B8" : BRAND }}>排除</button></span>
            </div>
          ))}
          {pool.length === 0 && <div className="px-3 py-4 text-xs text-slate-400 text-center">無相符地區</div>}
        </div>
      </div>
      <div className="rounded-md border border-slate-200">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100"><span className="text-xs text-slate-500">已選</span><span className="text-xs flex gap-2"><button style={{ color: BRAND }}>批量導入</button><button onClick={() => onChange([], [])} style={{ color: BRAND }}>清除</button></span></div>
        <div className="flex border-b border-slate-100 text-sm">
          {["定向", "排除"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5" style={{ color: tab === t ? BRAND : "#64748B", borderBottom: tab === t ? `2px solid ${BRAND}` : "2px solid transparent", fontWeight: tab === t ? 600 : 400 }}>{t}({t === "定向" ? targeted.length : excluded.length})</button>
          ))}
        </div>
        <div className="overflow-y-auto p-1" style={{ maxHeight: 176 }}>
          {sel.length === 0 && <div className="px-3 py-4 text-xs text-slate-400 text-center">尚未選擇</div>}
          {sel.map((r) => (
            <div key={r} className="flex items-center justify-between px-3 py-1.5 text-sm">
              <span className="text-slate-600 truncate pr-2">{r}</span>
              <button onClick={() => rm(r)} className="text-slate-400 hover:text-rose-500 shrink-0"><X size={13} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LANG_POOL = ["阿拉伯語", "孟加拉語", "保加利亞語", "加泰羅尼亞語", "中文(簡體)", "中文(繁體)", "克羅地亞語", "捷克語", "丹麥語", "荷蘭語", "英語", "愛沙尼亞語", "菲律賓語", "芬蘭語", "法語", "德語", "希臘語", "希伯來語", "印地語", "匈牙利語", "印尼語", "意大利語", "日語", "韓語", "馬來語", "波蘭語", "葡萄牙語", "羅馬尼亞語", "俄語", "西班牙語", "瑞典語", "泰語", "土耳其語", "越南語"];
function LangSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const pool = LANG_POOL.filter((l) => l.includes(q));
  const toggle = (l) => onChange(value.includes(l) ? value.filter((x) => x !== l) : [...value, l]);
  return (
    <div className="relative" style={{ maxWidth: 260 }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between rounded-md border border-slate-300 px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-slate-300">
        <span className={value.length ? "text-slate-700" : "text-slate-400"}>{value.length ? `已選 ${value.length} 個` : "請選擇"}</span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 rounded-md border border-slate-200 bg-white shadow-lg grid" style={{ gridTemplateColumns: "1fr 1fr", width: 500 }}>
          <div className="border-r border-slate-100">
            <div className="p-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="請輸入" className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /></div>
            <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
              {pool.map((l) => (
                <label key={l} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={value.includes(l)} onChange={() => toggle(l)} />{l}
                </label>
              ))}
              {pool.length === 0 && <div className="px-3 py-4 text-xs text-slate-400 text-center">無相符語言</div>}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between px-3 py-2 text-xs"><span className="text-slate-500">已選 {value.length} 個</span><button onClick={() => onChange([])} style={{ color: BRAND }}>清除</button></div>
            <div className="overflow-y-auto p-1" style={{ maxHeight: 220 }}>
              {value.length === 0 && <div className="px-3 py-6 text-xs text-slate-300 text-center">尚未選擇</div>}
              {value.map((l) => (
                <div key={l} className="flex items-center justify-between px-3 py-1.5 text-sm text-slate-600"><span>{l}</span><button onClick={() => toggle(l)} className="text-slate-400 hover:text-rose-500"><X size={12} /></button></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AUDIENCE_POOL = [
  { name: "202603-05_儲值超過100的玩家", cat: "自定義受眾" },
  { name: "202605_slot_5000", cat: "自定義受眾" },
  { name: "202605_slot超過 1000 次 Spin", cat: "自定義受眾" },
  { name: "202605_poker_5000", cat: "自定義受眾" },
  { name: "202605_全站活躍 7 日", cat: "自定義受眾" },
  { name: "類似-儲值玩家 1%", cat: "類似受眾" },
  { name: "類似-高活躍 2%", cat: "類似受眾" },
  { name: "類似-付費用戶 3%", cat: "類似受眾" },
];
function AudiencePicker({ targeted, excluded, onChange }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("全部受眾");
  const [tab, setTab] = useState("定向");
  const pool = AUDIENCE_POOL.filter((a) => (cat === "全部受眾" || a.cat === cat) && a.name.includes(q)).map((a) => a.name);
  const addT = (r) => onChange(targeted.includes(r) ? targeted : [...targeted, r], excluded.filter((x) => x !== r));
  const addE = (r) => onChange(targeted.filter((x) => x !== r), excluded.includes(r) ? excluded : [...excluded, r]);
  const rm = (r) => tab === "定向" ? onChange(targeted.filter((x) => x !== r), excluded) : onChange(targeted, excluded.filter((x) => x !== r));
  const sel = tab === "定向" ? targeted : excluded;
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: 720 }}>
      <div className="rounded-md border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100">
          <div className="flex">
            {["全部受眾", "類似受眾", "自定義受眾"].map((c) => (
              <button key={c} onClick={() => setCat(c)} className="px-3 py-2 text-xs" style={{ color: cat === c ? BRAND : "#64748B", borderBottom: cat === c ? `2px solid ${BRAND}` : "2px solid transparent", fontWeight: cat === c ? 600 : 400 }}>{c}</button>
            ))}
          </div>
          <span className="text-xs text-slate-400 pr-3">操作</span>
        </div>
        <div className="p-2 flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索..." className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          <button className="text-xs shrink-0" style={{ color: BRAND }}>同步</button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 176 }}>
          {pool.map((r) => (
            <div key={r} className="flex items-center justify-between px-3 py-1.5 text-sm hover:bg-slate-50">
              <span className="text-slate-600 truncate pr-2">{r}</span>
              <span className="flex gap-2 shrink-0"><button onClick={() => addT(r)} className="text-xs" style={{ color: targeted.includes(r) ? "#94A3B8" : BRAND }}>定向</button><button onClick={() => addE(r)} className="text-xs" style={{ color: excluded.includes(r) ? "#94A3B8" : BRAND }}>排除</button></span>
            </div>
          ))}
          {pool.length === 0 && <div className="px-3 py-4 text-xs text-slate-400 text-center">無相符受眾</div>}
        </div>
      </div>
      <div className="rounded-md border border-slate-200">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100"><span className="text-xs text-slate-500">已選</span><button onClick={() => onChange([], [])} className="text-xs" style={{ color: BRAND }}>清除</button></div>
        <div className="flex border-b border-slate-100 text-sm">
          {["定向", "排除"].map((t) => (<button key={t} onClick={() => setTab(t)} className="px-3 py-1.5" style={{ color: tab === t ? BRAND : "#64748B", borderBottom: tab === t ? `2px solid ${BRAND}` : "2px solid transparent", fontWeight: tab === t ? 600 : 400 }}>{t}({t === "定向" ? targeted.length : excluded.length})</button>))}
        </div>
        <div className="overflow-y-auto p-1" style={{ maxHeight: 176 }}>
          {sel.length === 0 && <div className="px-3 py-4 text-xs text-slate-400 text-center">尚未選擇</div>}
          {sel.map((r) => (<div key={r} className="flex items-center justify-between px-3 py-1.5 text-sm"><span className="text-slate-600 truncate pr-2">{r}</span><button onClick={() => rm(r)} className="text-slate-400 hover:text-rose-500 shrink-0"><X size={13} /></button></div>))}
        </div>
      </div>
    </div>
  );
}

const SEGMENT_TREE = [
  { cat: "人口統計資料", items: ["教育程度：大學", "感情狀況：單身", "工作職稱：軟體工程師", "世代：千禧世代"] },
  { cat: "行為", items: ["手機用戶：iOS", "手機用戶：Android", "數位活動：手遊玩家", "消費行為：付費玩家"] },
  { cat: "興趣", items: ["博弈遊戲", "麻將", "線上遊戲", "撲克"] },
];
const SEGMENT_SUGGEST = ["數位活動：手遊玩家", "博弈遊戲", "消費行為：付費玩家", "麻將"];
function SegmentPicker({ selected, onChange }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("瀏覽");
  const [open, setOpen] = useState({});
  const add = (it) => onChange(selected.includes(it) ? selected : [...selected, it]);
  const rm = (it) => onChange(selected.filter((x) => x !== it));
  const toggle = (c) => setOpen((o) => ({ ...o, [c]: !o[c] }));
  const matches = (s) => s.includes(q);
  return (
    <div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: 720 }}>
        <div className="rounded-md border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100">
            <div className="flex">{["瀏覽", "建議"].map((t) => (<button key={t} onClick={() => setTab(t)} className="px-3 py-2 text-xs" style={{ color: tab === t ? BRAND : "#64748B", borderBottom: tab === t ? `2px solid ${BRAND}` : "2px solid transparent", fontWeight: tab === t ? 600 : 400 }}>{t}</button>))}</div>
            <span className="text-xs text-slate-400 pr-3">操作</span>
          </div>
          <div className="p-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索..." className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /></div>
          <div className="overflow-y-auto" style={{ maxHeight: 176 }}>
            {tab === "建議"
              ? SEGMENT_SUGGEST.filter(matches).map((it) => (
                  <div key={it} className="flex items-center justify-between px-3 py-1.5 text-sm hover:bg-slate-50"><span className="text-slate-600">{it}</span><button onClick={() => add(it)} className="text-xs" style={{ color: selected.includes(it) ? "#94A3B8" : BRAND }}>定向</button></div>
                ))
              : SEGMENT_TREE.map(({ cat, items }) => {
                  const shown = items.filter(matches);
                  const isOpen = q ? shown.length > 0 : open[cat];
                  if (q && shown.length === 0) return null;
                  return (<div key={cat}>
                    <button onClick={() => toggle(cat)} className="w-full flex items-center gap-1 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"><ChevronRight size={13} style={{ transform: isOpen ? "rotate(90deg)" : "none" }} className="text-slate-400" />{cat}</button>
                    {isOpen && shown.map((it) => (
                      <div key={it} className="flex items-center justify-between pl-8 pr-3 py-1.5 text-sm hover:bg-slate-50"><span className="text-slate-600">{it}</span><button onClick={() => add(it)} className="text-xs" style={{ color: selected.includes(it) ? "#94A3B8" : BRAND }}>定向</button></div>
                    ))}
                  </div>);
                })}
          </div>
        </div>
        <div className="rounded-md border border-slate-200">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100"><span className="text-xs text-slate-500">已選 ({selected.length})</span><button onClick={() => onChange([])} className="text-xs" style={{ color: BRAND }}>清除</button></div>
          <div className="overflow-y-auto p-1" style={{ maxHeight: 208 }}>
            {selected.length === 0 && <div className="px-3 py-6 text-xs text-slate-400 text-center">尚未選擇</div>}
            {selected.map((it) => (<div key={it} className="flex items-center justify-between px-3 py-1.5 text-sm"><span className="text-slate-600 truncate pr-2">{it}</span><button onClick={() => rm(it)} className="text-slate-400 hover:text-rose-500 shrink-0"><X size={13} /></button></div>))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600">縮小受眾範圍</button>
        <button className="text-sm" style={{ color: BRAND }}>同步</button>
      </div>
    </div>
  );
}

const DEVICE_POOL = ["iPhone", "iPad", "iPod touch", "Android 智慧型手機", "Android 平板電腦", "功能手機"];
const IOS_VERS = ["2.0", "8.0", "10.0", "12.0", "13.0", "14.0", "14.4", "15.0", "16.0", "17.0", "18.0"];
const AND_VERS = ["4.0", "5.0", "6.0", "7.0", "8.0", "9.0", "10.0", "11.0", "12.0", "13.0", "14.0"];
function MultiSelect({ options, value, onChange, width = 240 }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const pool = options.filter((o) => o.includes(q));
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="relative" style={{ maxWidth: width }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between rounded-md border border-slate-300 px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-slate-300">
        <span className={value.length ? "text-slate-700" : "text-slate-400"}>{value.length ? <>已選 <b style={{ color: BRAND }}>{value.length}</b> 個</> : "請選擇"}</span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 rounded-md border border-slate-200 bg-white shadow-lg" style={{ width: Math.max(width, 260) }}>
          <div className="p-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="請輸入" className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /></div>
          <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
            {pool.map((o) => (<label key={o} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"><input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} />{o}</label>))}
            {pool.length === 0 && <div className="px-3 py-4 text-xs text-slate-400 text-center">無相符項目</div>}
          </div>
          {value.length > 0 && <div className="border-t border-slate-100 px-3 py-1.5 text-right"><button onClick={() => onChange([])} className="text-xs" style={{ color: BRAND }}>清除</button></div>}
        </div>
      )}
    </div>
  );
}

const PLACEMENTS = [
  { cat: "動態", items: ["Facebook 動態消息", "Facebook 主頁動態", "Facebook Marketplace", "發現 Facebook 商家", "Messenger 收件匣", "Instagram 動態", "Instagram 主頁動態", "Instagram 發現", "Instagram 發現首頁", "Threads 動態"] },
  { cat: "限時動態和 Reels", items: ["Facebook 限時動態", "Facebook Reels", "Messenger 限時動態", "Instagram 限時動態", "Instagram Reels", "Instagram 主頁 Reels"] },
  { cat: "影片和 Reels 插播廣告", items: ["Facebook 影片插播位", "Facebook Reels 內嵌廣告", "Instagram Reels 內嵌廣告"] },
  { cat: "搜尋結果", items: ["Facebook 搜尋結果", "Instagram 搜尋結果"] },
  { cat: "應用程式與網站", items: ["Audience Network 原生、橫幅與插頁式廣告", "Audience Network 獎勵式影片"] },
];
const ALL_PLACEMENTS = PLACEMENTS.flatMap((c) => c.items);
const PLATFORMS = ["Facebook", "Messenger", "Instagram", "Audience Network", "Threads"];
const platformOf = (name) => {
  if (name.startsWith("Instagram")) return "Instagram";
  if (name.startsWith("Messenger")) return "Messenger";
  if (name.startsWith("Audience Network")) return "Audience Network";
  if (name.startsWith("Threads")) return "Threads";
  return "Facebook";
};
function PlacementPicker({ selected, onChange }) {
  const [active, setActive] = useState(0);
  const itemsOf = (pf) => ALL_PLACEMENTS.filter((it) => platformOf(it) === pf);
  const platformOn = (pf) => itemsOf(pf).every((it) => selected.includes(it));
  const platformPartial = (pf) => itemsOf(pf).some((it) => selected.includes(it)) && !platformOn(pf);
  const togglePlatform = (pf) => {
    const on = platformOn(pf);
    let sel;
    if (on) {
      sel = selected.filter((it) => platformOf(it) !== pf);
      if (pf === "Instagram") sel = sel.filter((it) => platformOf(it) !== "Threads");
    } else {
      sel = [...new Set([...selected, ...itemsOf(pf)])];
      if (pf === "Threads") sel = [...new Set([...sel, ...itemsOf("Instagram")])];
    }
    onChange(sel);
  };
  const cat = PLACEMENTS[active];
  const catChecked = (c) => c.items.every((it) => selected.includes(it));
  const catPartial = (c) => c.items.some((it) => selected.includes(it)) && !catChecked(c);
  const toggleCat = (c) => onChange(catChecked(c) ? selected.filter((x) => !c.items.includes(x)) : [...new Set([...selected, ...c.items])]);
  const toggleItem = (it) => onChange(selected.includes(it) ? selected.filter((x) => x !== it) : [...selected, it]);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {PLATFORMS.map((pf) => { const on = platformOn(pf), part = platformPartial(pf); return (
          <button key={pf} onClick={() => togglePlatform(pf)} className="px-3 py-1.5 rounded-md text-sm border flex items-center gap-1.5" style={{ borderColor: (on || part) ? BRAND : "#D8DEE7", background: (on || part) ? "#EAF1F8" : "#fff", color: (on || part) ? BRAND : "#94A3B8" }}>{on && <Check size={13} />}{pf}</button>
        ); })}
      </div>
      <div className="text-[11px] text-slate-400 mb-3">投放 Threads 須連同 Instagram；取消 Instagram 會一併取消 Threads。</div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: 720 }}>
        <div className="rounded-md border border-slate-200 p-1">
          {PLACEMENTS.map((c, idx) => (
            <div key={c.cat} onClick={() => setActive(idx)} className="w-full flex items-center justify-between px-2 py-2 rounded-md text-sm cursor-pointer" style={{ background: idx === active ? "#F5F8FC" : "transparent" }}>
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={catChecked(c)} ref={(el) => { if (el) el.indeterminate = catPartial(c); }} onChange={() => toggleCat(c)} onClick={(e) => e.stopPropagation()} />
                <span style={{ fontWeight: idx === active ? 600 : 500, color: idx === active ? BRAND : "#334155" }}>{c.cat}</span>
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          ))}
        </div>
        <div className="rounded-md border border-slate-200 p-2 overflow-y-auto" style={{ maxHeight: 260 }}>
          {cat.items.map((it) => (
            <label key={it} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-slate-50 cursor-pointer rounded">
              <input type="checkbox" checked={selected.includes(it)} onChange={() => toggleItem(it)} />
              <span style={{ color: selected.includes(it) ? BRAND : "#334155", fontWeight: 500 }}>{it}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="text-xs text-slate-500 mt-2">已選擇 {selected.length} 個版位</div>
    </div>
  );
}

function MacroTags({ value, onChange, macros }) {
  const add = (m) => onChange((value || "") + `{${m}}`);
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {macros.map((m) => (
        <button key={m} onClick={() => add(m)} className="text-xs rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-500 hover:border-slate-300 hover:text-slate-700">{m}</button>
      ))}
    </div>
  );
}

/* ----------------------------- 主元件 ----------------------------- */
function MetaFlow({ setPlatform }) {
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState(false);
  const [rowStatus, setRowStatus] = useState({});
  const [previewList, setPreviewList] = useState([]);
  const [splitEdit, setSplitEdit] = useState(false);
  const [splitDraft, setSplitDraft] = useState(null);
  const init = {
    platform: "META", objective: "應用程式推廣", adAccount: "act_金好運TW",
    campaignName: "{賬戶名}_{賬戶備註名}", campaignStatus: true, specialCategory: "請選擇",
    ios14: true, cbo: true,
    budgetType: "單日預算", campaignBudget: "", campaignBidKey: "max", deliveryType: "標準", campaignSpendCap: "不限",
    store: "App Store", appName: "金好運娛樂城", adsetName: "{賬戶備註名}_{地區組名稱}_{系統用戶名}", adsetStatus: true,
    placement: "Advantage+ 版位（全平台）",
    split: { geo: "廣告系列", target: "廣告系列", bid: "廣告系列", creative: "廣告" }, adBatch: false,
    platforms: { Facebook: true, Instagram: true, Messenger: true, "Audience Network": true, Threads: true },
    placements: ALL_PLACEMENTS,
    adName: "{首個素材名稱}_{首個素材名稱（含格式）}", adStatus: false, fbPage: "", pageType: "全部主頁", usePublicPage: false, multiAdvertiser: true, websiteEvent: "",
    geo: [mk.geo(1), mk.geo(2)], target: [mk.target(1)], bid: [mk.bid(1)], creative: [mk.creative(1)],
  };
  const [s, setS] = useState(init);
  const [act, setAct] = useState({ geo: 0, target: 0, bid: 0, creative: 0 });
  const set = (patch) => setS((p) => ({ ...p, ...patch }));
  const openSplitEdit = () => { setSplitDraft({ ...s.split, adBatch: s.adBatch }); setSplitEdit(true); };
  const applySplit = () => { const { adBatch, ...lv } = splitDraft; set({ split: lv, adBatch }); setSplitEdit(false); };
  const addGroup = (key) => setS((p) => {
    const cap = STEPS.find((x) => x.module === key).cap;
    if (p[key].length >= cap) return p;
    const arr = [...p[key], mk[key](p[key].length + 1)];
    setAct((a) => ({ ...a, [key]: arr.length - 1 })); return { ...p, [key]: arr };
  });
  const removeGroup = (key, i) => setS((p) => {
    if (p[key].length <= 1) return p;
    const arr = p[key].filter((_, x) => x !== i);
    setAct((a) => ({ ...a, [key]: Math.min(a[key], arr.length - 1) })); return { ...p, [key]: arr };
  });
  const patchGroup = (key, i, patch) => setS((p) => ({ ...p, [key]: p[key].map((g, x) => x === i ? { ...g, ...patch } : g) }));

  const svMaterial = (g) => Math.max(g.videoCount + g.imageCount, 1);
  const adsOf = (g) => {
    const bodyN = Math.max(g.bodyTexts.length, 1);
    let ads = 0;
    if (g.creativeType.includes("創建廣告")) g.format.forEach((f) => {
      const titleN = f === "單圖片或視頻" ? Math.max(g.titles.length, 1) : 1;
      ads += (f === "單圖片或視頻" ? svMaterial(g) : 1) * bodyN * titleN;
    });
    if (g.creativeType.includes("使用已有帖子")) ads += 1;
    return Math.max(ads, 1);
  };
  const m = useMemo(() => {
    const R = s.geo.length, T = s.target.length, B = s.bid.length, C = s.creative.length;
    const cnt = { geo: R, target: T, bid: B, creative: C };
    const lv = s.split;
    const prod = (pred) => Object.keys(cnt).reduce((a, k) => (pred(lv[k]) ? a * cnt[k] : a), 1);
    const campaigns = prod((L) => L === "廣告系列");
    const adSets = prod((L) => L === "廣告系列" || L === "廣告組");
    const ads = R * T * B * s.creative.reduce((acc, g) => acc + adsOf(g), 0);
    return { R, T, B, C, campaigns, adSets, ads };
  }, [s.geo, s.target, s.bid, s.creative, s.split]);

  /* ---------------- 模組表單 ---------------- */
  function geoForm(g, i) {
    const eu = g.target.length > 0;
    return (<>
      <div className="text-sm text-slate-600 mb-2 flex items-center gap-2">綁定對象 <span className="text-slate-400">地區（全部）</span><Pencil size={13} className="text-slate-400" /></div>
      <button className="text-sm mb-4 flex items-center gap-1.5" style={{ color: BRAND }}><Copy size={13} />選擇已有地區組</button>
      <Block><FieldLabel req>地區</FieldLabel>
        <RegionPicker targeted={g.target} excluded={g.exclude} onChange={(t, e) => patchGroup("geo", i, { target: t, exclude: e })} />
      </Block>
      {eu && (<div className="rounded-md border-l-4 pl-4 py-3 mb-1" style={{ borderColor: BRAND, background: "#F5F8FC" }}>
        <div className="flex items-start gap-1.5 text-xs mb-3" style={{ color: BRAND }}><Info size={13} className="mt-0.5 shrink-0" /><span>對於任何定位歐盟地區受眾的廣告組，你需要指明廣告組的受益人或組織，以及廣告組的贊助方。</span></div>
        {[["台灣地區", "TW"], ["澳大利亞", "AU"], ["新加坡", "SG"], ["泰國或巴西", "THBR"], ["歐盟", "EU"]].map(([nm, k]) => (
          <React.Fragment key={k}>
            <Block><FieldLabel>受益方（{nm}）</FieldLabel><Select options={["請選擇", "IGS 鈊象電子股份有限公司"]} value={g["ben" + k] || "請選擇"} onChange={(v) => patchGroup("geo", i, { ["ben" + k]: v })} /></Block>
            <Block><FieldLabel>贊助方（{nm}）</FieldLabel><Select options={["請選擇", "IGS 鈊象電子股份有限公司"]} value={g["spo" + k] || "請選擇"} onChange={(v) => patchGroup("geo", i, { ["spo" + k]: v })} /></Block>
          </React.Fragment>
        ))}
      </div>)}
      <Block><FieldLabel req>地區組名稱</FieldLabel><Text value={g.name} onChange={(v) => patchGroup("geo", i, { name: v })} /><Hint>更名後會對應到此地區組的分頁名稱與預覽列。</Hint></Block>
    </>);
  }
  function targetForm(g, i) {
    return (<>
      <div className="text-sm text-slate-600 mb-3 flex items-center gap-2">綁定對象 <span className="text-slate-400">地區（全部）</span><Pencil size={13} className="text-slate-400" /></div>
      <Block><div className="flex items-center justify-between"><FieldLabel>進階賦能型受眾</FieldLabel><Toggle checked={g.advantage} onChange={(v) => patchGroup("target", i, { advantage: v })} /></div></Block>
      <Block><FieldLabel req>自訂受眾</FieldLabel><Segmented options={["不限", "自訂"]} value={g.customAud} onChange={(v) => patchGroup("target", i, { customAud: v })} />
        {g.customAud === "自訂" && <div className="mt-3"><AudiencePicker targeted={g.audTargeted} excluded={g.audExcluded} onChange={(t, e) => patchGroup("target", i, { audTargeted: t, audExcluded: e })} /></div>}</Block>
      <div className="grid grid-cols-2 gap-3">
        <Block><FieldLabel req>最低年齡限制</FieldLabel><Select options={["18", "20", "21", "25"]} value={g.ageMin} onChange={(v) => patchGroup("target", i, { ageMin: v })} /></Block>
        <Block><FieldLabel>年齡建議</FieldLabel><div className="flex items-center gap-2"><Select options={["18", "20", "25"]} value={g.ageMin} onChange={() => {}} /><span className="text-slate-400">~</span><Select options={["65+", "45", "55"]} value={g.ageTo} onChange={(v) => patchGroup("target", i, { ageTo: v })} /></div></Block>
      </div>
      <Block><FieldLabel>性別</FieldLabel><Segmented options={["不限", "男性", "女性"]} value={g.gender} onChange={(v) => patchGroup("target", i, { gender: v })} /></Block>
      <Block><FieldLabel>細分定位</FieldLabel><Segmented options={["不限", "自訂"]} value={g.segment} onChange={(v) => patchGroup("target", i, { segment: v })} />
        {g.segment === "自訂" && <div className="mt-3"><SegmentPicker selected={g.segItems} onChange={(arr) => patchGroup("target", i, { segItems: arr })} /></div>}</Block>
      <Block><FieldLabel>語言</FieldLabel><Select options={["請選擇", "繁體中文", "English", "所有語言"]} value={g.lang || "請選擇"} onChange={(v) => patchGroup("target", i, { lang: v })} /></Block>
      <Block><FieldLabel req>包含的設備</FieldLabel><MultiSelect options={DEVICE_POOL} value={g.devIncl} onChange={(v) => patchGroup("target", i, { devIncl: v })} /></Block>
      <Block><FieldLabel>排除的設備</FieldLabel><MultiSelect options={DEVICE_POOL} value={g.devExcl} onChange={(v) => patchGroup("target", i, { devExcl: v })} /></Block>
      <Block><FieldLabel req>操作系統版本</FieldLabel><div className="flex items-center gap-2">
        <Select options={s.store === "App Store" ? IOS_VERS : AND_VERS} value={g.osMin} onChange={(v) => patchGroup("target", i, { osMin: v })} />
        <span className="text-slate-400">-</span>
        <Select options={s.store === "App Store" ? IOS_VERS : AND_VERS} value={g.osMax} onChange={(v) => patchGroup("target", i, { osMax: v })} />
      </div><Hint>依步驟 3 商店（{s.store === "App Store" ? "iOS" : "Android"}）給出版本選單。</Hint></Block>
      <Block><FieldLabel req>定向包名稱</FieldLabel><Text value={g.name} onChange={(v) => patchGroup("target", i, { name: v })} /><Hint>更名後會對應到此定向包的分頁名稱。</Hint></Block>
      <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600">保存為定向包</button>
    </>);
  }
  function bidForm(g, i) {
    const goalOpts = s.cbo ? perfGoalOptions(s.ios14, s.campaignBidKey) : goalsForIos(s.ios14);
    const goal = goalOpts.includes(g.perfGoal) ? g.perfGoal : (goalOpts[0] || "");
    const adsetStratKeys = bidStrategiesForGoal(s.ios14, goal);
    const adsetBidKey = adsetStratKeys.includes(g.adsetBidKey) ? g.adsetBidKey : (adsetStratKeys[0] || "max");
    const bidKey = s.cbo ? s.campaignBidKey : adsetBidKey;
    const attrOpts = attributionOptions(s.ios14, goal);
    const isCpa = bidKey === "cpa", isCap = bidKey === "cap", isRoas = bidKey === "roas";
    const needControl = isCpa || isCap || isRoas;
    const controlLabel = isCpa ? "單次成效費用目標" : isCap ? "競價控制額" : "廣告花費回報目標";
    const showValueRule = bidKey === "max" && [GOAL.install, GOAL.event, GOAL.click].includes(goal);
    const billOptions = goal === GOAL.click ? (isCpa ? ["展示次數"] : ["展示次數", "鏈接點擊量（CPC）"]) : ["展示次數"];
    const deliveryOptions = isCap ? ["勻速", "加速"] : ["勻速"];
    const totalBudget = !s.cbo && (g.budgetType || "單日預算") === "總預算";
    return (<>
      <div className="text-sm text-slate-600 mb-3 flex items-center gap-2">綁定對象 <span className="text-slate-400">地區（全部）</span><Pencil size={13} className="text-slate-400" /></div>
      <Block><FieldLabel req badge={s.cbo ? <LinkBadge>受出價策略「{bidName(bidKey)}」連動</LinkBadge> : null}>成效目標</FieldLabel>
        <Segmented options={goalOpts} value={goal} onChange={(v) => patchGroup("bid", i, { perfGoal: v })} />
        <Hint>可選項依 iOS 14+（{s.ios14 ? "開" : "關"}）{s.cbo ? "與出價策略" : "；競價策略再依成效目標"}動態變化。</Hint></Block>
      {showValueRule && (<Block><FieldLabel badge={<LinkBadge>條件符合</LinkBadge>}>價值規則集</FieldLabel><Select options={["請選擇", "規則集 A", "規則集 B"]} value={g.valueRule || "請選擇"} onChange={(v) => patchGroup("bid", i, { valueRule: v })} /></Block>)}
      {goal === GOAL.event && (<>
        <Block><FieldLabel badge={<LinkBadge>因成效目標＝應用事件</LinkBadge>}>應用事件分配方式</FieldLabel><Segmented options={["統一分配", "按賬戶"]} value={g.eventDist} onChange={(v) => patchGroup("bid", i, { eventDist: v })} /></Block>
        <Block><FieldLabel req badge={<LinkBadge>因成效目標＝應用事件</LinkBadge>}>應用事件</FieldLabel><Select options={["請選擇推廣應用", "完成註冊", "加入購物車", "完成購買", "完成教學"]} value={g.appEvent || "請選擇推廣應用"} onChange={(v) => patchGroup("bid", i, { appEvent: v === "請選擇推廣應用" ? "" : v })} /></Block>
      </>)}
      {goal === GOAL.value && (<Block><FieldLabel req badge={<LinkBadge>因成效目標＝轉化價值</LinkBadge>}>轉化事件</FieldLabel><Select options={["購物"]} value="購物" onChange={() => {}} /><Hint>固定為「購物」。</Hint></Block>)}
      {!s.cbo && (<Block><FieldLabel req badge={<LinkBadge>依成效目標連動</LinkBadge>}>廣告組競價策略</FieldLabel>
        <Segmented options={adsetStratKeys.map((k) => bidName(k))} value={bidName(adsetBidKey)} onChange={(v) => patchGroup("bid", i, { adsetBidKey: bidKeyFromName(v) })} /></Block>)}
      {s.cbo && (<div className="text-xs rounded-md p-2.5 mb-4" style={{ background: "#F5F8FC", color: BRAND }}>CBO 已開啟：出價策略「{bidName(s.campaignBidKey)}」與預算設於步驟 2（Campaign 層），此處不重複。</div>)}
      {needControl && (<Block><FieldLabel req badge={<LinkBadge>因競價策略＝{bidName(bidKey)}</LinkBadge>}>{controlLabel}</FieldLabel>
        <div className="flex items-center gap-4"><Amount value={g.targetControl} onChange={(v) => patchGroup("bid", i, { targetControl: v })} placeholder="請輸入" /><label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={g.splitGeoBid} onChange={(e) => patchGroup("bid", i, { splitGeoBid: e.target.checked })} />分地區出價</label></div>
        {g.splitGeoBid && (<div className="mt-2 rounded-md border border-slate-200 overflow-hidden" style={{ maxWidth: 560 }}>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500">{s.geo.map((gg, gi) => <th key={gi} className="font-medium px-3 py-2 text-center border-r border-slate-100 last:border-r-0">{gg.name}</th>)}</tr></thead>
            <tbody><tr>{s.geo.map((gg, gi) => <td key={gi} className="px-2 py-1.5 border-r border-slate-100 last:border-r-0"><input value={(g.geoBids && g.geoBids[gi]) || ""} onChange={(e) => patchGroup("bid", i, { geoBids: Object.assign([], g.geoBids, { [gi]: e.target.value }) })} placeholder={g.targetControl || "0"} className="w-full text-center rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /></td>)}</tr></tbody>
          </table>
        </div>)}</Block>)}
      {s.ios14 && <Block><FieldLabel badge={<LinkBadge>因 iOS 14+ 開啟</LinkBadge>}>廣告歸因方法</FieldLabel><Select options={["全事件衡量"]} value="全事件衡量" onChange={() => {}} /></Block>}
      {goal !== GOAL.click ? (<Block><FieldLabel req>歸因設置</FieldLabel><Select options={attrOpts} value={attrOpts.includes(g.attribution) ? g.attribution : attrOpts[0]} onChange={(v) => patchGroup("bid", i, { attribution: v })} /></Block>) : <div className="text-xs text-slate-400 italic mb-4">＊成效目標為「鏈接點擊量最大化」時，歸因設置不出現。</div>}
      <Block><FieldLabel>計費方式</FieldLabel><Segmented options={billOptions} value={billOptions.includes(g.billing) ? g.billing : billOptions[0]} onChange={(v) => patchGroup("bid", i, { billing: v })} /></Block>
      {!s.cbo && <Block><FieldLabel>投放類型</FieldLabel><Segmented options={deliveryOptions} value={deliveryOptions.includes(g.deliveryType) ? g.deliveryType : deliveryOptions[0]} onChange={(v) => patchGroup("bid", i, { deliveryType: v })} /></Block>}
      {!s.cbo
        ? <Block><FieldLabel req badge={<LinkBadge>因 CBO 關閉</LinkBadge>}>廣告組預算</FieldLabel>
            <Segmented options={["單日預算", "總預算"]} value={g.budgetType || "單日預算"} onChange={(v) => patchGroup("bid", i, { budgetType: v, schedule: v === "總預算" ? "自訂" : g.schedule })} />
            <div className="mt-2 flex items-center gap-4"><Amount value={g.budget} onChange={(v) => patchGroup("bid", i, { budget: v })} placeholder="請輸入" /><label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={g.splitGeoBudget} onChange={(e) => patchGroup("bid", i, { splitGeoBudget: e.target.checked })} />分地區預算</label></div>
            {g.splitGeoBudget && (<div className="mt-2 rounded-md border border-slate-200 overflow-hidden" style={{ maxWidth: 560 }}>
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-slate-500">{s.geo.map((gg, gi) => <th key={gi} className="font-medium px-3 py-2 text-center border-r border-slate-100 last:border-r-0">{gg.name}</th>)}</tr></thead>
                <tbody><tr>{s.geo.map((gg, gi) => <td key={gi} className="px-2 py-1.5 border-r border-slate-100 last:border-r-0"><input value={(g.geoBudgets && g.geoBudgets[gi]) || ""} onChange={(e) => patchGroup("bid", i, { geoBudgets: Object.assign([], g.geoBudgets, { [gi]: e.target.value }) })} placeholder={g.budget || "0"} className="w-full text-center rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /></td>)}</tr></tbody>
              </table>
            </div>)}</Block>
        : <Block><FieldLabel badge={<LinkBadge>因 CBO 開啟</LinkBadge>}>廣告組花費限額</FieldLabel><div className="flex items-center gap-2">
            <Amount value={g.spendLow} onChange={(v) => patchGroup("bid", i, { spendLow: v })} placeholder="下限" /><span className="text-xs text-slate-400">~</span>
            <Amount value={g.spendHigh} onChange={(v) => patchGroup("bid", i, { spendHigh: v })} placeholder="上限" /></div></Block>}
      <Block><FieldLabel>排期</FieldLabel>
        {totalBudget
          ? <Segmented options={["自訂"]} value="自訂" onChange={() => {}} />
          : <Segmented options={["現在開始", "自訂"]} value={g.schedule} onChange={(v) => patchGroup("bid", i, { schedule: v })} />}
        {totalBudget && <Hint>選擇「總預算」時，排期固定為自訂，且開始與結束時間皆為必填。</Hint>}
        {(totalBudget || g.schedule === "自訂") && (<div className="mt-3 space-y-3 rounded-lg p-3" style={{ background: "#F5F8FC" }}>
          <div><div className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-2">開始時間 <span className="text-rose-500">*</span><LinkBadge>因排期＝自訂</LinkBadge></div>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={g.startDate} onChange={(e) => patchGroup("bid", i, { startDate: e.target.value })} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" />
              <input type="time" value={g.startTime} onChange={(e) => patchGroup("bid", i, { startTime: e.target.value })} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" />
              <span className="text-xs text-slate-400">Asia/Taipei</span>
            </div></div>
          <div><div className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-2">結束時間 {totalBudget && <span className="text-rose-500">*</span>}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={g.endDate} onChange={(e) => patchGroup("bid", i, { endDate: e.target.value })} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" />
              <input type="time" value={g.endTime} onChange={(e) => patchGroup("bid", i, { endTime: e.target.value })} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" />
              <span className="text-xs text-slate-400">Asia/Taipei</span>
            </div></div>
        </div>)}
      </Block>
      {!s.cbo && <Block><FieldLabel>投放時段</FieldLabel><Segmented options={["全天投放廣告"]} value="全天投放廣告" onChange={() => {}} /></Block>}
    </>);
  }
  function creativeForm(g, i) {
    const cset = (patch) => patchGroup("creative", i, patch);
    const ct = g.creativeType, fmts = g.format;
    const isCreate = ct.includes("創建廣告");
    const isPost = ct.includes("使用已有帖子");
    const hasFmt = fmts.length > 0;
    const showFlex = isCreate && fmts.includes("靈活");
    const showSV = isCreate && fmts.includes("單圖片或視頻");
    const showCarousel = isCreate && fmts.includes("輪播");
    const showTargetSetup = isCreate && showSV;
    const toggleArr = (key, v) => { const a = g[key]; cset({ [key]: a.includes(v) ? a.filter((x) => x !== v) : [...a, v] }); };
    const ads = adsOf(g);
    const DeepLink = (<Block><FieldLabel>延遲深度連結</FieldLabel><Text value={g.deepLink} onChange={(v) => cset({ deepLink: v })} placeholder="請輸入" />
      <div className="flex flex-wrap gap-1.5 mt-2">{["廣告系列名稱", "廣告組名稱", "廣告名稱"].map((t) => <span key={t} className="text-xs rounded border border-slate-200 px-2 py-0.5 text-slate-400">{t}</span>)}</div></Block>);
    const ProductPage = (<Block><FieldLabel>自定義商品頁面</FieldLabel><Text value={g.productPage} onChange={(v) => cset({ productPage: v })} placeholder="請輸入自定義商品頁面 ID" /></Block>);
    const Optimize = (label) => (<Block><div className="text-xs text-slate-600 mb-1 leading-tight">使用進階賦能型素材{label}</div><Select options={["全面優化(全選)", "部分優化", "不優化"]} value={g.optimize} onChange={(v) => cset({ optimize: v })} /></Block>);
    const UploadBtn = (label) => (<button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 flex items-center gap-1.5"><ImageIcon size={14} />{label}</button>);
    const CopyField = (key, label, opt = false) => {
      const items = g[key], n = Math.max(items.length, 1);
      return (<Block>
        <FieldLabel req={!opt} badge={<SplitTag>{label} ×{n}</SplitTag>}>{label}</FieldLabel>
        <div className="flex items-center gap-2 mb-1.5"><button className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600">選文案</button><button className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600">批量添加文案</button><span className="text-xs text-slate-400">({items.length}/5)</span></div>
        <TagAdder items={items} onAdd={(v) => items.length < 5 && cset({ [key]: [...items, v] })} onRemove={(x) => cset({ [key]: items.filter((_, y) => y !== x) })} placeholder={`請輸入${label}`} />
      </Block>);
    };
    return (<>
      <div className="rounded-md px-3 py-2 mb-3 text-xs flex items-center gap-1.5" style={{ background: "#EAF1F8", color: BRAND }}><Info size={13} />視頻、圖片、輪播、單個主頁的帖子、靈活格式創意共最多上傳 50 個，輪播多個素材也僅占用一個額度。本組目前產生 {ads} 則廣告。</div>
      <div className="text-sm text-slate-600 mb-2 flex items-center gap-2">綁定對象 <span className="text-slate-400">地區（全部）</span><Pencil size={13} className="text-slate-400" /></div>
      <button className="text-sm mb-4 flex items-center gap-1.5" style={{ color: BRAND }}><Copy size={13} />選擇已有創意組</button>
      <Block><div className="flex items-center justify-between"><FieldLabel>動態素材</FieldLabel><Toggle checked={g.dynamic} onChange={(v) => cset({ dynamic: v })} /></div></Block>
      <Block><FieldLabel req>創意類型</FieldLabel><MultiSeg options={["創建廣告"]} values={g.creativeType} onToggle={(v) => toggleArr("creativeType", v)} /><Hint>選定的格式會各自生成廣告並加總。</Hint></Block>

      {isCreate && (<>
        <Block><FieldLabel req>格式</FieldLabel><MultiSeg options={["靈活", "單圖片或視頻", "輪播"]} values={g.format} onToggle={(v) => toggleArr("format", v)} />
          {!hasFmt && <div className="text-xs text-rose-500 mt-1">請選擇格式</div>}</Block>

        {showFlex && (<>
          <Block><FieldLabel req>靈活格式創意</FieldLabel>{UploadBtn("批量添加素材")}<button className="block text-sm mt-2" style={{ color: BRAND }}>添加分組</button></Block>
          {Optimize("優化靈活格式創意")}
        </>)}

        {showTargetSetup && (<>
          <Block><FieldLabel>添加目標位置</FieldLabel><Segmented options={["應用", "試玩廣告來源"]} value={g.destination} onChange={(v) => cset({ destination: v })} /></Block>
          <Block><FieldLabel>設置方式</FieldLabel><Segmented options={["按創意組", "按素材"]} value={g.setupBy} onChange={(v) => cset({ setupBy: v })} /></Block>
        </>)}

        {(<>{DeepLink}{ProductPage}</>)}

        {showSV && (<>
          <Block><FieldLabel req>視頻</FieldLabel>{UploadBtn("添加素材")}</Block>
          {Optimize("優化視頻廣告")}
          <Block><FieldLabel req>圖片</FieldLabel>{UploadBtn("添加素材")}</Block>
          {Optimize("優化圖片廣告")}
        </>)}

        {showCarousel && (<>
          <Block><FieldLabel req>輪播</FieldLabel>{UploadBtn("添加素材")}<Hint>多卡片組成 1 則廣告，不依素材數拆分。</Hint></Block>
          {Optimize("優化輪播廣告")}
        </>)}

        {CopyField("bodyTexts", "正文")}
        {showSV && CopyField("titles", "標題", true)}
        <Block><FieldLabel req>行動號召</FieldLabel><Select options={["請選擇", "立即安裝", "立即使用", "立即下載", "立即玩", "立即觀看", "了解詳情", "註冊", "開始使用"]} value={g.cta || "請選擇"} onChange={(v) => cset({ cta: v === "請選擇" ? "" : v })} /></Block>
      </>)}

      <Block><FieldLabel req>創意組名稱</FieldLabel>
        <div className="relative"><input value={g.name} maxLength={100} onChange={(e) => cset({ name: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300" />
          <span className="absolute right-3 top-2.5 text-xs text-slate-400">{g.name.length}/100</span></div></Block>
    </>);
  }

  function renderStep() {
    const stp = STEPS.find((x) => x.id === step);
    if (stp.module) {
      const key = stp.module, groups = s[key], i = Math.min(act[key], groups.length - 1), g = groups[i];
      const forms = { geo: geoForm, target: targetForm, bid: bidForm, creative: creativeForm };
      return (<><ModuleTabs groups={groups} active={i} cap={stp.cap} onSelect={(x) => setAct((a) => ({ ...a, [key]: x }))} onAdd={() => addGroup(key)} onRemove={(x) => removeGroup(key, x)} />{forms[key](g, i)}</>);
    }
    switch (step) {
      case 1: return (<>
        <Block><FieldLabel req>投放平台</FieldLabel><Segmented options={["META", "Google", "TikTok", "ASA", "Applovin"]} value="META" onChange={(v) => { if (v === "Google") setPlatform("google"); }} disabled={["TikTok", "ASA", "Applovin"]} /><Hint>選「Google」切換為 Google 流程；TikTok／ASA／Applovin 後續實作。</Hint></Block>
        <Block><FieldLabel req>行銷活動目標</FieldLabel><Select options={["應用程式推廣"]} value={s.objective} onChange={(v) => set({ objective: v })} /></Block>
        <Block><FieldLabel req>廣告帳戶</FieldLabel><Select options={["act_金好運TW", "act_金猴爺"]} value={s.adAccount} onChange={(v) => set({ adAccount: v })} /></Block>
      </>);
      case 2: {
        const bidKey = s.campaignBidKey;
        return (<>
          <Block><FieldLabel req>廣告系列名稱</FieldLabel><Text value={s.campaignName} onChange={(v) => set({ campaignName: v })} /><MacroTags value={s.campaignName} onChange={(v) => set({ campaignName: v })} macros={["APP OS", "地區", "創建日期（yyyymmdd）", "語言"]} /></Block>
          <Block><div className="flex items-center justify-between"><FieldLabel>廣告系列狀態</FieldLabel><Toggle checked={s.campaignStatus} onChange={(v) => set({ campaignStatus: v })} /></div></Block>
          <Block><div className="flex items-center justify-between"><FieldLabel>iOS 14+ 廣告系列</FieldLabel><Toggle checked={s.ios14} onChange={(v) => set({ ios14: v, store: v ? "App Store" : s.store })} /></div><Hint>關鍵連動：影響商店、成效目標、歸因，並改變出價策略的顯示名稱。</Hint></Block>
          <Block><div className="flex items-center justify-between"><FieldLabel>賦能型廣告系列預算優化（CBO）</FieldLabel><Toggle checked={s.cbo} onChange={(v) => set({ cbo: v })} /></div><Hint>開啟→預算與出價設於此（Campaign 層）；關閉→設於每個出價組合（步驟 7）。</Hint></Block>
          {s.cbo && (<div className="rounded-lg border-l-4 pl-4 py-3" style={{ borderColor: BRAND, background: "#F5F8FC" }}>
            <Block><FieldLabel req badge={<LinkBadge>因 CBO 開啟</LinkBadge>}>廣告系列預算</FieldLabel>
              <Segmented options={["單日預算", "總預算"]} value={s.budgetType} onChange={(v) => set({ budgetType: v })} />
              <div className="mt-2"><Amount value={s.campaignBudget} onChange={(v) => set({ campaignBudget: v })} placeholder="請輸入" /></div></Block>
            <Block><FieldLabel req>廣告系列競價策略</FieldLabel>
              <Segmented options={BID.map((b) => bidName(b.key))} value={bidName(bidKey)} onChange={(v) => set({ campaignBidKey: bidKeyFromName(v) })} /></Block>
            <Block><FieldLabel>投放時段</FieldLabel><Segmented options={["全天投放廣告"]} value="全天投放廣告" onChange={() => {}} /></Block>
            <Block><FieldLabel badge={bidKey === "cap" ? <LinkBadge>因出價上限</LinkBadge> : null}>投放類型</FieldLabel>
              {bidKey === "cap" ? <Segmented options={["標準", "快速"]} value={s.deliveryType} onChange={(v) => set({ deliveryType: v })} /> : <Segmented options={["勻速"]} value="勻速" onChange={() => {}} />}</Block>
            <Block><FieldLabel>廣告系列花費限額</FieldLabel><Segmented options={["不限", "自訂"]} value={s.campaignSpendCap} onChange={(v) => set({ campaignSpendCap: v })} />
              {s.campaignSpendCap === "自訂" && <div className="mt-2"><Amount value="" onChange={() => {}} placeholder="花費上限金額" /></div>}</Block>
            <div className="flex items-start gap-1.5 text-xs" style={{ color: SPLIT }}><AlertTriangle size={13} className="mt-0.5 shrink-0" />花費限額不是預算；如需設置廣告系列預算，請開啟 CBO。</div>
          </div>)}
        </>);
      }
      case 3: return (<>
        <Block><FieldLabel req>廣告組名稱</FieldLabel><Text value={s.adsetName} onChange={(v) => set({ adsetName: v })} /><MacroTags value={s.adsetName} onChange={(v) => set({ adsetName: v })} macros={["APP OS", "地區", "創建日期（yyyymmdd）", "語言"]} /></Block>
        <Block><div className="flex items-center justify-between"><FieldLabel>廣告組狀態</FieldLabel><Toggle checked={s.adsetStatus} onChange={(v) => set({ adsetStatus: v })} /></div></Block>
        <Block><FieldLabel req badge={s.ios14 ? <LinkBadge>因 iOS 14+ 鎖 App Store</LinkBadge> : null}>移動應用商店</FieldLabel>
          {s.ios14
            ? <Segmented options={["App Store"]} value="App Store" onChange={() => {}} />
            : <Segmented options={["Google Play", "App Store"]} value={s.store} onChange={(v) => set({ store: v })} />}
        </Block>
        <Block><FieldLabel req>應用</FieldLabel>
          <div className="flex items-center justify-between rounded-md border border-slate-300 px-3 py-2" style={{ maxWidth: 360 }}>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-xs">App</div>
              <div><div className="text-sm text-slate-700">{s.appName || "金好運娛樂城"}</div><div className="text-xs text-slate-400">242649556152905</div></div>
            </div>
            <span className="text-xs text-slate-400">{s.store === "App Store" ? "iOS ▾" : "Android ▾"}</span>
          </div></Block>
        <Hint>商店與 App 為行銷活動共用設定；成效目標／歸因移至「出價和預算」步驟。</Hint>
      </>);
      case 5: return (<>
        <Block><FieldLabel>版位設置</FieldLabel><Segmented options={["Advantage+ 版位（全平台）", "手動編輯"]} value={s.placement} onChange={(v) => set({ placement: v })} /></Block>
        {s.placement === "手動編輯" && (<Block><FieldLabel req badge={<LinkBadge>因「手動編輯」</LinkBadge>}>平台和版位</FieldLabel>
          <PlacementPicker selected={s.placements} onChange={(v) => set({ placements: v })} /></Block>)}
      </>);
      case 8: {
        /* 與步驟5版位連動：版位含 Instagram／Threads 時才顯示對應身份欄位 */
        const manual = s.placement === "手動編輯";
        const advAll = !manual;                                  // Advantage+ 版位＝全平台
        const hasPF = (pf) => s.placements.some((it) => platformOf(it) === pf);
        const igOn = advAll || hasPF("Instagram");               // Threads 版位會連帶選入 IG 版位
        const threadsOn = advAll || hasPF("Threads");
        const src = manual ? "手動編輯·全選" : "Advantage+ 全平台";
        return (<>
        <Block><FieldLabel req>廣告名稱</FieldLabel><Text value={s.adName} onChange={(v) => set({ adName: v })} /><MacroTags value={s.adName} onChange={(v) => set({ adName: v })} macros={["素材名稱"]} /></Block>
        <Block><div className="flex items-center justify-between"><FieldLabel>廣告狀態</FieldLabel><Toggle checked={s.adStatus} onChange={(v) => set({ adStatus: v })} /></div></Block>
        <div className="flex items-start gap-1.5 mb-4 text-xs rounded-md p-2.5" style={{ background: "#FFF7ED", color: SPLIT }}>
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />若您的主頁沒有全部授權，可能導致無法找到所需主頁，建議授權現有和今後的所有主頁。
        </div>
        <Block><FieldLabel>主頁類型</FieldLabel><Segmented options={["全部主頁", "個人號主頁", "廣告賬戶主頁"]} value={s.pageType} onChange={(v) => set({ pageType: v })} /></Block>
        <Block><FieldLabel req>Facebook 公共主頁</FieldLabel>
          <div className="flex items-center gap-2">
            <div className="flex-1"><Select options={["請選擇", "金好運官方", "金猴爺娛樂城", "Golden HoYeah Slots (VN)"]} value={s.fbPage || "請選擇"} onChange={(v) => set({ fbPage: v === "請選擇" ? "" : v })} /></div>
            <button className="text-sm whitespace-nowrap" style={{ color: BRAND }}>找不到主頁?</button>
          </div></Block>
        <Block><div className="flex items-center justify-between gap-3"><FieldLabel>使用公共主頁而不是應用名稱作為廣告發布身份</FieldLabel><Toggle checked={s.usePublicPage} onChange={(v) => set({ usePublicPage: v })} /></div></Block>
        {igOn && <Block><FieldLabel req badge={<LinkBadge>因版位含 Instagram（{src}）</LinkBadge>}>Instagram 帳戶</FieldLabel>
          <Select options={["請選擇"]} value="請選擇" onChange={() => {}} /><Hint>※ 下拉選項由<b style={{ color: SPLIT }}>行銷提供</b>（待補）。</Hint></Block>}
        {threadsOn && <Block><FieldLabel req badge={<LinkBadge>因版位含 Threads（{src}）</LinkBadge>}>Threads 賬戶</FieldLabel>
          <Select options={["請選擇"]} value="請選擇" onChange={() => {}} /><Hint>※ 下拉選項由<b style={{ color: SPLIT }}>行銷提供</b>（待補）。</Hint></Block>}
        {manual && !igOn && !threadsOn && <div className="text-xs text-slate-400 italic mb-4">＊目前手動版位未含 Instagram／Threads，故不顯示對應身份欄位。</div>}
        <Block><div className="flex items-center justify-between"><FieldLabel>多廣告主廣告</FieldLabel><Toggle checked={s.multiAdvertiser} onChange={(v) => set({ multiAdvertiser: v })} /></div></Block>
        <Block><FieldLabel>網站事件追蹤</FieldLabel><Select options={["請選擇", "Pixel A", "Pixel B"]} value={s.websiteEvent || "請選擇"} onChange={(v) => set({ websiteEvent: v === "請選擇" ? "" : v })} /></Block>
      </>);
      }
      default: return null;
    }
  }

  const cur = STEPS.find((x) => x.id === step);
  const fmtBudget = (bd) => s.cbo ? `${s.budgetType}：${s.campaignBudget || "1.00"} USD` : `${bd.budgetType || "單日預算"}：${bd.budget || "1.00"} USD`;
  const fmtSchedule = (bd) => bd.schedule === "自訂" ? `自訂（${bd.startDate}${bd.startTime ? " " + bd.startTime : ""}）` : "現在開始";
  const openPreview = () => {
    const rows = []; let id = 0;
    s.geo.forEach((geo, gi) => s.target.forEach((tg, ti) => s.bid.forEach((bd, bi) => s.creative.forEach((cr, ci) => {
      rows.push({ id: id++, geoIdx: gi, label: `_${geo.name}_預覽`, geo, tg, bd, cr, ti, bi, ci });
    }))));
    setPreviewList(rows); setRowStatus({}); setPreview(true);
  };
  const nextId = (list) => list.reduce((mm, r) => Math.max(mm, r.id), 0) + 1;
  const copyRow = (id) => setPreviewList((list) => { const idx = list.findIndex((r) => r.id === id); if (idx < 0) return list; const c = { ...list[idx], id: nextId(list), label: list[idx].label + "_copy" }; const out = [...list]; out.splice(idx + 1, 0, c); return out; });
  const delRow = (id) => setPreviewList((list) => list.filter((r) => r.id !== id));
  const pvAdSets = previewList.length;
  const pvAds = previewList.reduce((a, r) => a + adsOf(r.cr), 0);
  const publish = () => { setPreview(false); setToast(`✅ 已發布（${pvAds} 則廣告），背景執行中`); setTimeout(() => setToast(""), 2800); };
  const splitRows = [["地區組", m.R, s.split.geo], ["定向包", m.T, s.split.target], ["出價和預算", m.B, s.split.bid], ["創意組", m.C, s.split.creative]];

  return (
    <div className="w-full" style={{ fontFamily: "'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 rounded-t-xl" style={{ background: BRAND_DK }}>
        <div className="flex items-center gap-2 text-white"><Layers size={18} /><span className="font-semibold">快速建立廣告 — 三欄式建立工作區</span><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,.15)" }}>互動 Demo</span></div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/70">iOS14+ {s.ios14 ? "開" : "關"}　CBO {s.cbo ? "開" : "關"}</span>
          <button onClick={() => { setS(init); setAct({ geo: 0, target: 0, bid: 0, creative: 0 }); setStep(1); }} className="flex items-center gap-1 text-white/80 text-sm hover:text-white"><RotateCcw size={14} />重設</button>
        </div>
      </div>

      <div className="grid border border-slate-200 rounded-b-xl overflow-hidden" style={{ gridTemplateColumns: "190px 1fr 300px", minHeight: 600, background: "#fff" }}>
        <div className="border-r border-slate-200 py-2" style={{ background: "#F8FAFC" }}>
          {["Campaign", "Ad Set", "Ad"].map((stage) => (
            <div key={stage}>
              <div className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-wider uppercase text-slate-400">{stage}</div>
              {STEPS.filter((x) => x.stage === stage).map((x) => {
                const Icon = x.icon, active = step === x.id, count = x.module ? s[x.module].length : null;
                return (
                  <button key={x.id} onClick={() => setStep(x.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors" style={{ background: active ? "#EAF1F8" : "transparent", color: active ? BRAND : "#475569", borderLeft: active ? `3px solid ${BRAND}` : "3px solid transparent", fontWeight: active ? 600 : 400 }}>
                    <span className="flex items-center justify-center h-6 w-6 rounded-full text-[11px] shrink-0" style={{ background: active ? BRAND : "#E2E8F0", color: active ? "#fff" : "#94A3B8" }}>{x.id}</span>
                    <Icon size={15} className="shrink-0" /><span className="text-left leading-tight flex-1">{x.t}</span>
                    {count !== null && <span className="text-[11px] px-1.5 rounded-full" style={{ background: count > 1 ? SPLIT_BG : "#E2E8F0", color: count > 1 ? SPLIT : "#94A3B8" }}>{count}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex flex-col" style={{ maxHeight: 600 }}>
          <div className="px-6 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <div><div className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: SPLIT }}>{cur.stage}　·　步驟 {cur.id} / 9</div>
              <h2 className="text-lg font-bold text-slate-800 mt-0.5 flex items-center gap-2"><cur.icon size={18} style={{ color: BRAND }} />{cur.t}</h2></div>
            {cur.module && <span className="text-xs text-slate-400">批量操作 ∨　清空</span>}
          </div>
          <div className="px-6 py-5 overflow-y-auto flex-1">{renderStep()}</div>
          <div className="px-6 py-3 border-t border-slate-100 flex justify-between">
            <button disabled={step === 1} onClick={() => setStep(step - 1)} className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 disabled:opacity-40">上一步</button>
            <button disabled={step === 9} onClick={() => setStep(step + 1)} className="px-4 py-2 text-sm rounded-md text-white flex items-center gap-1 disabled:opacity-40" style={{ background: BRAND }}>下一步 <ChevronRight size={15} /></button>
          </div>
        </div>

        <div className="border-l border-slate-200 p-4 flex flex-col" style={{ background: "#FAFBFD" }}>
          <div className="rounded-lg border border-slate-200 bg-white p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700"><span className="inline-flex h-5 w-5 items-center justify-center rounded text-white text-[10px]" style={{ background: "#1877F2" }}>∞</span>Meta</div>
              <button onClick={openSplitEdit} className="text-xs" style={{ color: BRAND }}>編輯</button>
            </div>
            <div className="text-xs text-slate-500 mb-2">已選帳戶數量：1</div>
            <table className="w-full text-xs"><thead><tr className="text-slate-500 border-b border-slate-100"><th className="text-left font-medium py-1.5">屬性</th><th className="text-center font-medium">數量</th><th className="text-right font-medium">拆分規則</th></tr></thead>
              <tbody>{splitRows.map(([name, n, lvl]) => (<tr key={name} className="border-b border-slate-50"><td className="py-2 text-slate-700">{name}</td><td className="text-center font-bold" style={{ color: n > 1 ? SPLIT : "#475569" }}>{n}</td><td className="text-right text-slate-500">{lvl}</td></tr>))}</tbody>
            </table>
          </div>
          <div className="flex-1" />
          <button onClick={() => { setToast(`✅ 建立任務已送出（${m.ads} 則廣告），背景執行中`); setTimeout(() => setToast(""), 2800); }} className="w-full py-2.5 rounded-md text-white text-sm font-semibold flex items-center justify-center gap-1.5 mb-2" style={{ background: BRAND }}><Send size={15} />確認發佈</button>
          <button onClick={openPreview} className="w-full py-2 rounded-md text-sm border border-slate-300 text-slate-600 flex items-center justify-center gap-1.5"><Eye size={14} />預覽</button>
        </div>
      </div>

      <div className="flex items-start gap-1.5 mt-3 text-xs text-slate-400">
        <Info size={13} className="mt-0.5 shrink-0" />
        <span>試試在步驟 2 切換 CBO：開啟時預算／競價策略／投放時段／投放類型／花費限額出現在 Campaign 層，步驟 7 改顯示「廣告組花費限額」；關閉時相反。再切 iOS 14+，步驟 7 的成效目標選項與歸因會跟著變（競價策略名稱固定不變）。</span>
      </div>

      {splitEdit && splitDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,.45)" }}>
          <div className="bg-white rounded-xl shadow-2xl w-[560px] max-w-[92vw]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <span className="text-base font-semibold text-slate-800">編輯拆分規則</span>
              <button onClick={() => setSplitEdit(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {[["地區組", "geo", ["廣告系列", "廣告組"]], ["定向包", "target", ["廣告系列", "廣告組"]], ["出價和預算", "bid", ["廣告系列", "廣告組"]], ["創意組", "creative", ["廣告系列", "廣告組", "廣告"]]].map(([label, key, opts]) => (
                <div key={key} className="flex items-center gap-6">
                  <div className="w-24 text-sm text-slate-600 shrink-0">{label}</div>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
                    {opts.map((o) => { const on = splitDraft[key] === o; return (
                      <button key={o} onClick={() => setSplitDraft((d) => ({ ...d, [key]: o }))} className="px-4 py-1.5 text-sm rounded-md" style={{ background: on ? "#EAF1F9" : "transparent", color: on ? BRAND : "#64748B", fontWeight: on ? 600 : 400 }}>{o}</button>
                    ); })}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-6">
                <div className="w-24 text-sm text-slate-600 shrink-0">廣告分批創建</div>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
                  {["關閉", "開啟"].map((o) => { const on = (splitDraft.adBatch ? "開啟" : "關閉") === o; return (
                    <button key={o} onClick={() => setSplitDraft((d) => ({ ...d, adBatch: o === "開啟" }))} className="px-4 py-1.5 text-sm rounded-md" style={{ background: on ? "#EAF1F9" : "transparent", color: on ? BRAND : "#64748B", fontWeight: on ? 600 : 400 }}>{o}</button>
                  ); })}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setSplitEdit(false)} className="px-5 py-2 rounded-md text-sm border border-slate-300 text-slate-600">取消</button>
              <button onClick={applySplit} className="px-5 py-2 rounded-md text-sm text-white" style={{ background: BRAND }}>確定</button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-40 overflow-auto" style={{ background: "#F4F6F9" }}>
          <div className="max-w-[1500px] mx-auto p-6">
            <div className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-4">{s.adAccount}　936065231376017</div>
            <div className="grid gap-y-1.5 text-sm mb-4" style={{ gridTemplateColumns: "90px 1fr", maxWidth: 480 }}>
              <span className="text-slate-500">廣告帳戶</span><span className="text-slate-700">{s.adAccount}（936065231376017）</span>
              <span className="text-slate-500">時區</span><span className="text-slate-700">Asia/Taipei</span>
              <span className="text-slate-500">推廣應用</span><span className="text-slate-700">{s.appName || "金好運娛樂城"}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <button className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-400">批量操作 ∨</button>
              <div className="text-sm font-semibold text-slate-700">廣告系列 <span style={{ color: BRAND }}>{m.campaigns}</span>　廣告組 <span style={{ color: BRAND }}>{m.adSets}</span>　廣告 <span style={{ color: OK }}>{pvAds}</span></div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-slate-500 text-left">
                  {["狀態", "廣告組", "所屬廣告系列", "操作", "地區", "出價與預算", "廣告"].map((h) => <th key={h} className="font-medium px-4 py-2.5 whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {previewList.slice(0, 200).map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3"><Toggle checked={rowStatus[r.id] ?? true} onChange={() => setRowStatus((p) => ({ ...p, [r.id]: !(p[r.id] ?? true) }))} /></td>
                      <td className="px-4 py-3 text-slate-700">{r.label}
                        {(s.target.length > 1 || s.bid.length > 1 || s.creative.length > 1) && <div className="text-[11px] text-slate-400 mt-0.5">{[s.target.length > 1 && r.tg.name, s.bid.length > 1 && r.bd.name, s.creative.length > 1 && r.cr.name].filter(Boolean).join(" · ")}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.campaignName || "IGS-02-金好運TW_"}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><button onClick={() => copyRow(r.id)} style={{ color: BRAND }}>複製</button>　<button onClick={() => delRow(r.id)} style={{ color: BRAND }}>刪除</button></td>
                      <td className="px-4 py-3 text-slate-600">{r.geo.target.length ? r.geo.target.join(", ") : "全部"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-[13px] leading-relaxed">
                        成效目標：{r.bd.perfGoal}<br />{fmtBudget(r.bd)}<br />排期：{fmtSchedule(r.bd)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[13px]">廣告數：（{adsOf(r.cr)}）<div className="text-slate-400 mt-0.5 max-w-xs break-all">{s.adName}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewList.length > 200 && <div className="text-xs text-slate-400 mt-2">僅顯示前 200 列，共 {previewList.length} 個廣告組。</div>}
            <div className="text-xs text-slate-400 mt-2">共 {pvAdSets} 條　·　20條/頁</div>
            <div className="flex justify-center gap-3 mt-6 pb-4">
              <button onClick={() => setPreview(false)} className="rounded-md border border-slate-300 px-6 py-2 text-sm text-slate-600">返回</button>
              <button onClick={publish} className="rounded-md border border-slate-300 px-6 py-2 text-sm text-slate-700">發布並繼續創建</button>
              <button onClick={publish} className="rounded-md px-8 py-2 text-sm text-white font-semibold" style={{ background: BRAND }}>發布</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg text-white text-sm shadow-lg z-50" style={{ background: OK }}>{toast}</div>}
    </div>
  );
}

/* ----------------------------- Google 流程 ----------------------------- */
function GoogleFlow({ setPlatform }) {
  const geoG = (n) => ({ name: `地區組${n}`, region: "不限", language: "不限", regions: [], excludes: [], languages: [], target: "所在地或興趣（推薦）", exclude: "所在地（推薦）", tag: "" });
  const creaG = (n) => ({ name: `創意組${n}`, videos: 0, images: 0, html5: 0, titles: ["123", "321"], descs: ["258"], deepLink: "", tag: "" });
  const init = {
    campaignType: "應用", campaignSubtype: "應用安裝", platform: "Android",
    adAccount: "明星3缺1_firebase", xmpProduct: "請選擇", appName: "麻將 明星3缺1-16張Mahjong", pkg: "com.igs.mjstar31",
    campaignName: "{創意組名稱}_{廣告系列子類型}",
    goal: "安裝量", installTracking: "請選擇", userType: "所有用戶", convAction: "請選擇",
    dailyBudget: "12", bidType: "目標每次操作費用", bidAmount: "22", troas: "",
    splitBudget: false, geoBudgets: [], splitRoas: false, geoRoas: [], splitBid: false, geoBids: [],
    startType: "現在開始", endType: "長期", startDate: "", endDate: "", adGroupName: "{創意組名稱}",
    geo: [geoG(1)], creative: [creaG(1)],
  };
  const [step, setStep] = useState(1);
  const [s, setS] = useState(init);
  const [act, setAct] = useState({ geo: 0, creative: 0 });
  const [preview, setPreview] = useState(false);
  const [toast, setToast] = useState("");
  const [rowStatus, setRowStatus] = useState({});
  const [previewList, setPreviewList] = useState([]);
  const set = (p) => setS((o) => ({ ...o, ...p }));
  const CAP = { geo: 100, creative: 50 }, FAC = { geo: geoG, creative: creaG };
  const addGroup = (k) => setS((o) => { if (o[k].length >= CAP[k]) return o; const arr = [...o[k], FAC[k](o[k].length + 1)]; setAct((a) => ({ ...a, [k]: arr.length - 1 })); return { ...o, [k]: arr }; });
  const removeGroup = (k, i) => setS((o) => { if (o[k].length <= 1) return o; const arr = o[k].filter((_, x) => x !== i); setAct((a) => ({ ...a, [k]: Math.min(a[k], arr.length - 1) })); return { ...o, [k]: arr }; });
  const patchGroup = (k, i, p) => setS((o) => ({ ...o, [k]: o[k].map((g, x) => x === i ? { ...g, ...p } : g) }));

  const C = s.geo.length, AG = s.creative.length, adGroups = C * AG;
  const STEPS = [
    { id: 1, t: "基礎設置", icon: Settings },
    { id: 2, t: "地區組", icon: MapPin, module: "geo", cap: 100 },
    { id: 3, t: "出價和預算", icon: DollarSign },
    { id: 4, t: "廣告組", icon: LayoutGrid },
    { id: 5, t: "創意組", icon: ImageIcon, module: "creative", cap: 50 },
  ];

  const Radio = ({ options, value, onChange }) => (
    <div className="space-y-2">{options.map((o) => (
      <button key={o} onClick={() => onChange(o)} className="flex items-start gap-2 text-left w-full">
        <span className="mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: value === o ? BRAND : "#CBD5E1" }}>{value === o && <span className="h-2 w-2 rounded-full" style={{ background: BRAND }} />}</span>
        <span className="text-sm" style={{ color: value === o ? BRAND : "#475569" }}>{o}</span>
      </button>
    ))}</div>
  );
  const UnitInput = ({ value, onChange, unit, ph }) => (
    <div className="flex" style={{ maxWidth: 260 }}><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} className="flex-1 rounded-l-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /><span className="rounded-r-md border border-l-0 border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">{unit}</span></div>
  );
  const appBox = (
    <div className="flex items-center justify-between rounded-md border border-slate-300 px-3 py-2" style={{ maxWidth: 380 }}>
      <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-xs">App</div>
        <div><div className="text-sm text-slate-700">{s.appName}</div><div className="text-xs text-slate-400">{s.pkg}</div></div></div>
      <span className="text-xs text-slate-400">{s.platform} ▾</span>
    </div>
  );
  const matBtn = (<button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 flex items-center gap-1.5"><ImageIcon size={14} />添加素材</button>);

  function geoForm(g, i) {
    const set2 = (p) => patchGroup("geo", i, p);
    return (<>
      <button className="text-sm mb-4 flex items-center gap-1.5" style={{ color: BRAND }}><Copy size={13} />選擇已有地區組</button>
      <Block><FieldLabel>地區</FieldLabel><Segmented options={["不限", "指定"]} value={g.region} onChange={(v) => set2({ region: v })} />
        {g.region === "指定" && <div className="mt-3"><RegionPicker targeted={g.regions} excluded={g.excludes} onChange={(t, e) => set2({ regions: t, excludes: e })} /></div>}</Block>
      <Block><FieldLabel>語言</FieldLabel><Segmented options={["不限", "指定"]} value={g.language} onChange={(v) => set2({ language: v })} />
        {g.language === "指定" && <div className="mt-2"><LangSelect value={g.languages} onChange={(arr) => set2({ languages: arr })} /></div>}</Block>
      <Block><FieldLabel>目標</FieldLabel><Radio options={["所在地或興趣（推薦）", "所在地"]} value={g.target} onChange={(v) => set2({ target: v })} /></Block>
      <Block><FieldLabel>排除</FieldLabel><Radio options={["所在地（推薦）", "所在地或興趣"]} value={g.exclude} onChange={(v) => set2({ exclude: v })} /></Block>
      <Block><FieldLabel req>地區組名稱</FieldLabel><div className="relative"><input value={g.name} maxLength={20} onChange={(e) => set2({ name: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /><span className="absolute right-3 top-2.5 text-xs text-slate-400">{g.name.length}/20</span></div></Block>
    </>);
  }
  function copyField(g, i, key, label, min, max, maxLen, addLabel) {
    const items = g[key];
    return (<Block><FieldLabel req>{label}</FieldLabel>
      <div className="flex items-center gap-2 mb-1.5"><button className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600">選文案</button><button className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600">系統推薦</button><span className="text-xs text-slate-400">({items.length}/{max})</span></div>
      <RepeatRows items={items} onChange={(arr) => patchGroup("creative", i, { [key]: arr })} min={min} max={max} maxLen={maxLen} addLabel={addLabel} /></Block>);
  }
  function creativeForm(g, i) {
    const set2 = (p) => patchGroup("creative", i, p);
    const matRow = (label, key) => (<Block><FieldLabel req>{label}</FieldLabel><div className="flex items-center gap-3">{matBtn}<span className="text-sm text-slate-400">({g[key]} / 20)</span></div></Block>);
    return (<>
      <div className="rounded-md px-3 py-2 mb-3 text-xs flex items-center gap-1.5" style={{ background: "#EAF1F8", color: BRAND }}><Info size={13} />視頻 / 圖片 / HTML5 各上限 20；標題 ≤5（每則 ≤30 字）、描述 ≤5（每則 ≤90 字）。</div>
      <button className="text-sm mb-4 flex items-center gap-1.5" style={{ color: BRAND }}><Copy size={13} />選擇已有創意組</button>
      {matRow("視頻", "videos")}{matRow("圖片", "images")}{matRow("HTML5", "html5")}
      {copyField(g, i, "titles", "標題", 2, 5, 30, "新增標題")}
      {copyField(g, i, "descs", "描述", 1, 5, 90, "新增描述")}
      <Block><FieldLabel>應用深層鏈接</FieldLabel><Select options={["請選擇", "深層連結 A", "深層連結 B"]} value={g.deepLink || "請選擇"} onChange={(v) => set2({ deepLink: v === "請選擇" ? "" : v })} /></Block>
      <Block><FieldLabel req>創意組名稱</FieldLabel><div className="relative"><input value={g.name} maxLength={100} onChange={(e) => set2({ name: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /><span className="absolute right-3 top-2.5 text-xs text-slate-400">{g.name.length}/100</span></div></Block>
    </>);
  }

  function renderStep() {
    switch (step) {
      case 1: return (<>
        <Block><FieldLabel req>投放平台</FieldLabel><Segmented options={["META", "Google", "TikTok", "ASA", "Applovin"]} value="Google" onChange={(v) => { if (v === "META") setPlatform("meta"); }} disabled={["TikTok", "ASA", "Applovin"]} /><Hint>選「META」切回 Meta 流程。</Hint></Block>
        <Block><FieldLabel req>廣告系列類型</FieldLabel><Segmented options={["應用"]} value={s.campaignType} onChange={() => {}} /></Block>
        <Block><FieldLabel req>廣告系列子類型</FieldLabel><Segmented options={["應用安裝", "應用互動", "預註冊"]} value={s.campaignSubtype} onChange={(v) => set({ campaignSubtype: v })} disabled={["應用互動", "預註冊"]} /></Block>
        <Block><FieldLabel req>系統平台</FieldLabel><Segmented options={["Android", "iOS"]} value={s.platform} onChange={(v) => set({ platform: v })} /></Block>
        <Block><FieldLabel req>廣告賬戶</FieldLabel><Select options={["明星3缺1_firebase", "其他帳戶"]} value={s.adAccount} onChange={(v) => set({ adAccount: v })} /></Block>
        <Block><FieldLabel req>應用</FieldLabel><div className="flex items-center gap-3">{appBox}<button className="text-sm" style={{ color: BRAND }}>創建應用</button></div></Block>
        <Block><FieldLabel req>廣告系列名稱</FieldLabel><Text value={s.campaignName} onChange={(v) => set({ campaignName: v })} /></Block>
      </>);
      case 2: return (<><ModuleTabs groups={s.geo} active={act.geo} onSelect={(i) => setAct((a) => ({ ...a, geo: i }))} onAdd={() => addGroup("geo")} onRemove={(i) => removeGroup("geo", i)} cap={100} />{geoForm(s.geo[act.geo], act.geo)}</>);
      case 3: return (<>
        <Block><FieldLabel req>您希望著重實現的目標是什麼</FieldLabel><Segmented options={["安裝量", "應用內操作次數", "應用內操作價值"]} value={s.goal} onChange={(v) => set({ goal: v })} /></Block>
        {s.goal === "安裝量"
          ? <Block><FieldLabel>您希望如何跟蹤安裝次數</FieldLabel><Select options={["請選擇", "Firebase 安裝", "Google Play 安裝"]} value={s.installTracking} onChange={(v) => set({ installTracking: v })} /></Block>
          : <Block><FieldLabel req>您希望如何跟蹤安裝次數</FieldLabel><Select options={["請選擇", "Firebase 安裝", "Google Play 安裝"]} value={s.installTracking} onChange={(v) => set({ installTracking: v })} /></Block>}
        {s.goal === "安裝量" && <Block><FieldLabel>您希望定位哪類用戶</FieldLabel><Select options={["所有用戶", "可能會採取應用程式內動作的使用者"]} value={s.userType} onChange={(v) => set({ userType: v })} /></Block>}
        {s.goal !== "安裝量" && <Block><FieldLabel req>哪些轉化操作對您最為重要</FieldLabel><Select options={["請選擇", "購買", "註冊", "加入購物車"]} value={s.convAction} onChange={(v) => set({ convAction: v })} /></Block>}
        <Block><FieldLabel req>日預算</FieldLabel>
          <div className="flex items-center gap-4"><UnitInput value={s.dailyBudget} onChange={(v) => set({ dailyBudget: v })} unit="TWD" /><label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={s.splitBudget} onChange={(e) => set({ splitBudget: e.target.checked })} />分地區預算</label></div>
          {s.splitBudget && geoTable("geoBudgets", s.dailyBudget || "0")}</Block>
        {s.goal === "安裝量" && <Block><FieldLabel req>出價</FieldLabel><Segmented options={["目標每次操作費用", "盡可能提高轉化次數"]} value={s.bidType} onChange={(v) => set({ bidType: v })} />{s.bidType === "目標每次操作費用" && <div className="mt-2"><div className="flex items-center gap-4"><UnitInput value={s.bidAmount} onChange={(v) => set({ bidAmount: v })} unit="TWD" /><label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={s.splitBid} onChange={(e) => set({ splitBid: e.target.checked })} />分地區出價</label></div>{s.splitBid && geoTable("geoBids", s.bidAmount || "0")}</div>}<Hint>選「盡可能提高轉化次數」時隱藏出價金額輸入框。</Hint></Block>}
        {s.goal === "應用內操作次數" && <Block><FieldLabel req>出價</FieldLabel><div className="flex items-center gap-4"><UnitInput value={s.bidAmount} onChange={(v) => set({ bidAmount: v })} unit="TWD" ph="請輸入" /><label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={s.splitBid} onChange={(e) => set({ splitBid: e.target.checked })} />分地區出價</label></div>{s.splitBid && geoTable("geoBids", s.bidAmount || "0")}</Block>}
        {s.goal === "應用內操作價值" && <Block><FieldLabel req>tROAS %</FieldLabel>
          <div className="flex items-center gap-4"><UnitInput value={s.troas} onChange={(v) => set({ troas: v })} unit="%" ph="請輸入" /><label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={s.splitRoas} onChange={(e) => set({ splitRoas: e.target.checked })} />分地區ROAS</label></div>
          {s.splitRoas && geoTable("geoRoas", s.troas || "0")}
          <Hint>成效目標＝應用內操作價值時，以 tROAS 取代出價。</Hint></Block>}
        <Block><FieldLabel req>開始時間</FieldLabel><Segmented options={["現在開始", "自定義"]} value={s.startType} onChange={(v) => set({ startType: v })} />{s.startType === "自定義" && <div className="mt-2"><input type="datetime-local" value={s.startDate} onChange={(e) => set({ startDate: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300" style={{ maxWidth: 260 }} /></div>}</Block>
        <Block><FieldLabel req>結束時間</FieldLabel><Segmented options={["長期", "自定義"]} value={s.endType} onChange={(v) => set({ endType: v })} />{s.endType === "自定義" && <div className="mt-2"><input type="datetime-local" value={s.endDate} onChange={(e) => set({ endDate: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300" style={{ maxWidth: 260 }} /></div>}</Block>
      </>);
      case 4: return (<>
        <Block><FieldLabel req>廣告組名稱</FieldLabel><Text value={s.adGroupName} onChange={(v) => set({ adGroupName: v })} /></Block>
      </>);
      case 5: return (<><ModuleTabs groups={s.creative} active={act.creative} onSelect={(i) => setAct((a) => ({ ...a, creative: i }))} onAdd={() => addGroup("creative")} onRemove={(i) => removeGroup("creative", i)} cap={50} />{creativeForm(s.creative[act.creative], act.creative)}</>);
      default: return null;
    }
  }

  const cur = STEPS.find((x) => x.id === step);
  const bidLine = s.goal === "應用內操作價值" ? `tROAS ${s.troas || "0"}%` : `${s.bidAmount || "0"} TWD`;
  const resolveCampaign = (cr, geo) => (s.campaignName || "{創意組名稱}_{廣告系列子類型}")
    .replace(/\{創意組名稱\}/g, cr.name).replace(/\{廣告系列子類型\}/g, s.campaignSubtype)
    .replace(/\{廣告系列類型\}/g, s.campaignType).replace(/\{應用名稱\}/g, s.appName).replace(/\{地區\}/g, geo.region);
  const setGeoArr = (key, i, v) => set({ [key]: Object.assign([], s[key], { [i]: v }) });
  const geoTable = (key, ph) => (
    <div className="mt-2 rounded-md border border-slate-200 overflow-hidden" style={{ maxWidth: 560 }}>
      <table className="w-full text-sm">
        <thead><tr className="bg-slate-50 text-slate-500">{s.geo.map((g, i) => <th key={i} className="font-medium px-3 py-2 text-center border-r border-slate-100 last:border-r-0">{g.name}</th>)}</tr></thead>
        <tbody><tr>{s.geo.map((g, i) => <td key={i} className="px-2 py-1.5 border-r border-slate-100 last:border-r-0"><input value={(s[key] && s[key][i]) || ""} onChange={(e) => setGeoArr(key, i, e.target.value)} placeholder={ph} className="w-full text-center rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /></td>)}</tr></tbody>
      </table>
    </div>
  );
  const openPreview = () => {
    const rows = []; let id = 0;
    s.geo.forEach((geo, gi) => s.creative.forEach((cr) => rows.push({ id: id++, geoIdx: gi, label: cr.name, geo, cr })));
    setPreviewList(rows); setRowStatus({}); setPreview(true);
  };
  const nextId = (list) => list.reduce((mm, r) => Math.max(mm, r.id), 0) + 1;
  const copyRow = (id) => setPreviewList((list) => { const idx = list.findIndex((r) => r.id === id); if (idx < 0) return list; const c = { ...list[idx], id: nextId(list), label: list[idx].label + "_copy" }; const out = [...list]; out.splice(idx + 1, 0, c); return out; });
  const delRow = (id) => setPreviewList((list) => list.filter((r) => r.id !== id));
  const pvCampaigns = new Set(previewList.map((r) => r.geoIdx)).size;
  const pvAdGroups = previewList.length;
  const publish = () => { setPreview(false); setToast(`✅ 已發布（${pvAdGroups} 個廣告組），背景執行中`); setTimeout(() => setToast(""), 2800); };
  const splitRows = [["地區組", C, "廣告系列"], ["創意組", AG, "廣告組"]];

  return (
    <div className="w-full" style={{ fontFamily: "'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 rounded-t-xl" style={{ background: BRAND_DK }}>
        <div className="flex items-center gap-2 text-white"><Layers size={18} /><span className="font-semibold">快速建立廣告 — Google 流程</span><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,.15)" }}>互動 Demo</span></div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/70">成效目標：{s.goal}</span>
          <button onClick={() => { setS(init); setAct({ geo: 0, creative: 0 }); setStep(1); }} className="flex items-center gap-1 text-white/80 text-sm hover:text-white"><RotateCcw size={14} />重設</button>
        </div>
      </div>

      <div className="grid border border-slate-200 rounded-b-xl overflow-hidden" style={{ gridTemplateColumns: "190px 1fr 300px", minHeight: 600, background: "#fff" }}>
        <div className="border-r border-slate-200 py-2" style={{ background: "#F8FAFC" }}>
          {STEPS.map((x) => {
            const Icon = x.icon, active = step === x.id, count = x.module ? s[x.module].length : null;
            return (
              <button key={x.id} onClick={() => setStep(x.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors" style={{ background: active ? "#EAF1F8" : "transparent", color: active ? BRAND : "#475569", borderLeft: active ? `3px solid ${BRAND}` : "3px solid transparent", fontWeight: active ? 600 : 400 }}>
                <span className="flex items-center justify-center h-6 w-6 rounded-full text-[11px] shrink-0" style={{ background: active ? BRAND : "#E2E8F0", color: active ? "#fff" : "#94A3B8" }}>{x.id}</span>
                <Icon size={15} className="shrink-0" /><span className="text-left leading-tight flex-1">{x.t}</span>
                {count !== null && <span className="text-[11px] px-1.5 rounded-full" style={{ background: count > 1 ? SPLIT_BG : "#E2E8F0", color: count > 1 ? SPLIT : "#94A3B8" }}>{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col" style={{ maxHeight: 600 }}>
          <div className="px-6 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <div><div className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: SPLIT }}>Google UAC　·　步驟 {cur.id} / 5</div>
              <h2 className="text-lg font-bold text-slate-800 mt-0.5 flex items-center gap-2"><cur.icon size={18} style={{ color: BRAND }} />{cur.t}</h2></div>
            {cur.module && <span className="text-xs text-slate-400">批量操作 ∨　清空</span>}
          </div>
          <div className="px-6 py-5 overflow-y-auto flex-1">{renderStep()}</div>
          <div className="px-6 py-3 border-t border-slate-100 flex justify-between">
            <button disabled={step === 1} onClick={() => setStep(step - 1)} className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 disabled:opacity-40">上一步</button>
            <button disabled={step === 5} onClick={() => setStep(step + 1)} className="px-4 py-2 text-sm rounded-md text-white flex items-center gap-1 disabled:opacity-40" style={{ background: BRAND }}>下一步 <ChevronRight size={15} /></button>
          </div>
        </div>

        <div className="border-l border-slate-200 p-4 flex flex-col" style={{ background: "#FAFBFD" }}>
          <div className="rounded-lg border border-slate-200 bg-white p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700"><span className="inline-flex h-5 w-5 items-center justify-center rounded text-white text-[11px] font-bold" style={{ background: "#4285F4" }}>G</span>Google</div>
              <button className="text-xs" style={{ color: BRAND }}>編輯</button>
            </div>
            <div className="text-xs text-slate-500 mb-2">已選帳戶數量：1</div>
            <table className="w-full text-xs"><thead><tr className="text-slate-500 border-b border-slate-100"><th className="text-left font-medium py-1.5">屬性</th><th className="text-center font-medium">數量</th><th className="text-right font-medium">拆分規則</th></tr></thead>
              <tbody>{splitRows.map(([name, n, lvl]) => (<tr key={name} className="border-b border-slate-50"><td className="py-2 text-slate-700">{name}</td><td className="text-center font-bold" style={{ color: n > 1 ? SPLIT : "#475569" }}>{n}</td><td className="text-right text-slate-500">{lvl}</td></tr>))}</tbody>
            </table>
          </div>
          <div className="flex-1" />
          <button onClick={() => { setToast(`✅ 建立任務已送出（${adGroups} 個廣告組），背景執行中`); setTimeout(() => setToast(""), 2800); }} className="w-full py-2.5 rounded-md text-white text-sm font-semibold flex items-center justify-center gap-1.5 mb-2" style={{ background: BRAND }}><Send size={15} />確認發佈</button>
          <button onClick={openPreview} className="w-full py-2 rounded-md text-sm border border-slate-300 text-slate-600 flex items-center justify-center gap-1.5"><Eye size={14} />預覽</button>
        </div>
      </div>

      <div className="flex items-start gap-1.5 mt-3 text-xs text-slate-400">
        <Info size={13} className="mt-0.5 shrink-0" />
        <span>Google 拆分規則與 Meta 不同：地區組拆分於「廣告系列」層（上限 100）、創意組拆分於「廣告組」層（上限 50）。廣告系列數＝地區組數；廣告組數＝地區組×創意組。在步驟 3 切換成效目標（安裝量／應用內操作次數／應用內操作價值）會連動下方欄位與出價（tROAS）。</span>
      </div>

      {preview && (
        <div className="fixed inset-0 z-40 overflow-auto" style={{ background: "#F4F6F9" }}>
          <div className="max-w-[1500px] mx-auto p-6">
            <div className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-4">{s.adAccount}</div>
            <div className="grid gap-y-1.5 text-sm mb-4" style={{ gridTemplateColumns: "90px 1fr", maxWidth: 480 }}>
              <span className="text-slate-500">廣告帳戶</span><span className="text-slate-700">{s.adAccount}</span>
              <span className="text-slate-500">系統平台</span><span className="text-slate-700">{s.platform}</span>
              <span className="text-slate-500">推廣應用</span><span className="text-slate-700">{s.appName}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <button className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-400">批量操作 ∨</button>
              <div className="text-sm font-semibold text-slate-700">廣告系列 <span style={{ color: BRAND }}>{pvCampaigns}</span>　廣告組 <span style={{ color: BRAND }}>{pvAdGroups}</span>　廣告 <span style={{ color: OK }}>{pvAdGroups}</span></div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-slate-500 text-left">{["狀態", "廣告組", "廣告系列", "操作", "地區", "語言", "出價與預算", "廣告"].map((h) => <th key={h} className="font-medium px-4 py-2.5 whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {previewList.slice(0, 200).map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3"><Toggle checked={rowStatus[r.id] ?? true} onChange={() => setRowStatus((p) => ({ ...p, [r.id]: !(p[r.id] ?? true) }))} /></td>
                      <td className="px-4 py-3 text-slate-700">{r.label}</td>
                      <td className="px-4 py-3 text-slate-600">{resolveCampaign(r.cr, r.geo)}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><button onClick={() => copyRow(r.id)} style={{ color: BRAND }}>複製</button>　<button onClick={() => delRow(r.id)} style={{ color: BRAND }}>刪除</button></td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-[13px] leading-relaxed">定向：{r.geo.region === "指定" && r.geo.regions.length ? r.geo.regions.join("、") : "不限"}<br />排除：{r.geo.excludes && r.geo.excludes.length ? r.geo.excludes.join("、") : "不限"}</td>
                      <td className="px-4 py-3 text-slate-600 text-[13px]">定向：{r.geo.language === "指定" && r.geo.languages && r.geo.languages.length ? r.geo.languages.join("、") : "不限"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-[13px] leading-relaxed">出價：{bidLine}<br />日預算：{s.dailyBudget} TWD</td>
                      <td className="px-4 py-3 text-slate-600 text-[13px]">1 個 ad</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewList.length > 200 && <div className="text-xs text-slate-400 mt-2">僅顯示前 200 列，共 {previewList.length} 個廣告組。</div>}
            <div className="text-xs text-slate-400 mt-2">共 {pvAdGroups} 條　·　20條/頁</div>
            <div className="flex justify-center gap-3 mt-6 pb-4">
              <button onClick={() => setPreview(false)} className="rounded-md border border-slate-300 px-6 py-2 text-sm text-slate-600">返回</button>
              <button onClick={publish} className="rounded-md border border-slate-300 px-6 py-2 text-sm text-slate-700">發布並繼續創建</button>
              <button onClick={publish} className="rounded-md px-8 py-2 text-sm text-white font-semibold" style={{ background: BRAND }}>發布</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg text-white text-sm shadow-lg z-50" style={{ background: OK }}>{toast}</div>}
    </div>
  );
}

/* ----------------------------- 外層：平台切換（於基礎設置 投放平台 選擇） ----------------------------- */
export default function AdBuilderDemo() {
  const [platform, setPlatform] = useState("meta");
  return platform === "meta" ? <MetaFlow setPlatform={setPlatform} /> : <GoogleFlow setPlatform={setPlatform} />;
}
