import { useState } from 'react'
import { api, useApi } from '../api'
import { Card, Kpi, Grid, H, Table, Note } from '../components'
export default function Data({ onChange }) {
  const [s, el] = useApi('/status'); const [msg, setMsg] = useState(null), [busy, setBusy] = useState(false)
  const run = async fn => { setBusy(true); setMsg(null); try { await fn(); onChange() } catch (e) { setMsg(e.message) } setBusy(false) }
  const upload = e => { const f = e.target.files[0]; if (!f) return; const fd = new FormData(); fd.append('file', f); run(() => api('/upload', { method: 'POST', body: fd })); e.target.value = '' }
  return <><H sub="Required columns: date, product_id, product_name, category, sales. Optional: price, inventory, promotion, holiday, weather, lead_time.">Data Management</H>
    <Card className="mb-4"><div className="flex flex-wrap items-center gap-3">
      <label className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm cursor-pointer">Upload CSV<input type="file" accept=".csv" className="hidden" onChange={upload} disabled={busy} /></label>
      <button className="px-4 py-2 rounded-lg border text-sm" disabled={busy} onClick={() => run(() => api('/sample', { method: 'POST' }))}>Use sample dataset</button>
      {busy && <span className="text-sm text-slate-500">Cleaning data and training models…</span>}</div>
      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}</Card>
    {el || <div className="space-y-4"><Grid n={3}><Kpi label="Dataset" value={s.source} sub={`${s.date_from} to ${s.date_to}`} /><Kpi label="Rows (raw → after cleaning)" value={`${s.rows_raw} → ${s.rows_clean}`} />
      <Kpi label="Outliers capped" value={s.outliers_capped} sub="sales above Q3 + 3×IQR" /></Grid>
      <Card title="Missing values (raw file)"><Table rows={Object.entries(s.missing).map(([c, n]) => ({ c, n }))} cols={[['Column', 'c'], ['Missing', 'n']]} />
        <Note>Preprocessing (automatic on load): fill date gaps, interpolate missing sales, cap outliers, forward-fill price/inventory, derive holiday flag when absent.</Note></Card>
      <Card title="Preview (first 10 raw rows)"><Table rows={s.preview} cols={Object.keys(s.preview[0]).map(k => [k, k])} /></Card></div>}</>
}
