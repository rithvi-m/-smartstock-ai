import { useState } from 'react'
import { useApi } from '../api'
import { Card, Grid, H, LineC, BarC, Note } from '../components'
export default function Sales() {
  const [f, setF] = useState({ product_id: '', category: '', start: '', end: '' })
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString()
  const [d, el] = useApi('/sales?' + qs); const [ps] = useApi('/products')
  const inp = 'border rounded-lg px-3 py-2 text-sm bg-white'
  return <><H>Sales Analysis</H>
    <div className="flex flex-wrap gap-3 mb-4">
      <select className={inp} value={f.product_id} onChange={e => setF({ ...f, product_id: e.target.value })}><option value="">All products</option>{ps?.filter(p => !f.category || p.category === f.category).map(p => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}</select>
      <select className={inp} value={f.category} onChange={e => setF({ ...f, category: e.target.value, product_id: '' })}><option value="">All categories</option>{d?.categories.map(c => <option key={c}>{c}</option>)}</select>
      <input type="date" className={inp} value={f.start} onChange={e => setF({ ...f, start: e.target.value })} /><input type="date" className={inp} value={f.end} onChange={e => setF({ ...f, end: e.target.value })} /></div>
    {el || <div className="space-y-4">
      <Card title="Key insights"><ul className="list-disc pl-5 space-y-1 text-sm">{d.insights.map(i => <li key={i}>{i}</li>)}</ul></Card>
      <Grid><Card title="Daily sales"><LineC data={d.daily} lines={[{ k: 'sales' }]} /></Card><Card title="Weekly sales"><LineC data={d.weekly} lines={[{ k: 'sales' }]} /></Card>
        <Card title="Monthly sales"><BarC data={d.monthly} x="date" /></Card><Card title="Category-wise sales"><BarC data={d.category} x="category" /></Card>
        <Card title="Product-wise sales"><BarC data={d.by_product} horizontal /></Card><Card title="Top 10 products"><BarC data={d.top10} horizontal color="#10b981" /></Card>
        <Card title="Bottom 10 products"><BarC data={d.bottom10} horizontal color="#ef4444" /></Card>
        <Card title="Weekly pattern (avg units/day)"><BarC data={d.weekday} /></Card>
        <Card title="Monthly pattern (avg units/day by calendar month)"><BarC data={d.month} /></Card></Grid></div>}</>
}
