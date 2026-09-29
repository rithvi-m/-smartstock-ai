import { useState } from 'react'
import { useApi } from './api'
import Welcome from './pages/Welcome'; import Dashboard from './pages/Dashboard'; import Sales from './pages/Sales'; import Forecast from './pages/Forecast'
import Inventory from './pages/Inventory'; import Model from './pages/Model'; import Data from './pages/Data'; import Insights from './pages/Insights'; import About from './pages/About'
const NAV = [['Dashboard','▦', Dashboard], ['Sales Analysis','↗', Sales], ['Forecasting','⌁', Forecast], ['Inventory','▣', Inventory], ['Model Performance','◔', Model], ['Data Management','⇧', Data], ['AI Insights','✦', Insights], ['About Project','ⓘ', About]]
export default function App() {
  const [entered, setEntered] = useState(false), [page, setPage] = useState(0), [ver, setVer] = useState(0)
  const [s] = useApi('/status?v=' + ver)
  if (!entered) return <Welcome onEnter={() => setEntered(true)} />
  const Page = NAV[page][2]
  return <div className="flex min-h-screen bg-slate-50">
    <aside className="w-64 shrink-0 bg-slate-950 text-slate-300 p-4 hidden md:flex md:flex-col sticky top-0 h-screen">
      <div className="px-2 py-2 mb-6"><p className="text-white font-bold text-xl tracking-tight">SmartStock <span className="text-indigo-400">AI</span></p><p className="text-xs text-slate-500 mt-1">Retail intelligence platform</p></div>
      <nav className="space-y-1 flex-1">{NAV.map(([n, ic], i) => <button key={n} onClick={() => setPage(i)} className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm transition ${i === page ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/30' : 'hover:bg-white/5 hover:text-white'}`}><span className="w-5 text-center">{ic}</span>{n}</button>)}</nav>
      <div className="rounded-xl bg-white/5 p-3 text-xs"><p className="text-slate-400">Dataset status</p><p className="text-white mt-1">● {s?.ready ? `${s.source || 'Dataset'} loaded` : 'No dataset'}</p></div>
    </aside>
    <div className="flex-1 min-w-0"><header className="h-16 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div><p className="text-xs text-slate-400">Retail forecasting workspace</p><p className="text-sm font-medium text-slate-700">{new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</p></div>
      <div className="flex items-center gap-3"><select aria-label="Navigation" className="md:hidden border border-slate-200 rounded-lg p-2 text-sm bg-white" value={page} onChange={e => setPage(+e.target.value)}>{NAV.map(([n], i) => <option key={n} value={i}>{n}</option>)}</select><span className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full ${s?.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>● {s?.ready ? 'Data ready' : 'No dataset'}</span><span className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">R</span></div></header>
      <main className="p-4 md:p-8 max-w-[1500px] mx-auto"><Page key={page + '-' + ver} onChange={() => setVer(v => v + 1)} /></main></div></div>
}
