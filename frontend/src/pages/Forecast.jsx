import { useState } from 'react'
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts'
import { useApi } from '../api'
import { Card, Kpi, Grid, H, Note, fmt } from '../components'
export default function Forecast() {
  const [pid, setPid] = useState('P001'), [h, setH] = useState(30)
  const [ps] = useApi('/products'); const [d, el] = useApi(`/forecast/${pid}?horizon=${h}`)
  let rows = []
  if (d) { rows = [...d.history.map(x => ({ date: x.date, actual: x.sales })), ...d.forecast.map(x => ({ date: x.date, predicted: x.predicted, band: [x.lower, x.upper] }))] }
  return <><H eyebrow="Demand prediction" sub="Recursive multi-step forecasting: each predicted day feeds the next day’s lag features. Use the result to plan inventory before demand arrives.">Forecasting</H>
    <div className="flex flex-wrap gap-3 mb-4"><select className="border rounded-lg px-3 py-2 text-sm bg-white" value={pid} onChange={e => setPid(e.target.value)}>{ps?.map(p => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}</select>
      {[7, 30, 90].map(x => <button key={x} onClick={() => setH(x)} className={`px-4 py-2 rounded-lg text-sm border ${h === x ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>{x} days</button>)}</div>
    {el || <div className="space-y-4"><Card title={`${d.product_name}: history vs forecast`} action={<span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">Model: {d.model}</span>}>
      <ResponsiveContainer width="100%" height={320}><ComposedChart data={rows}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} /><YAxis tick={{ fontSize: 11 }} width={45} /><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
        <Area dataKey="band" name="95% interval" stroke="none" fill="#a5b4fc" fillOpacity={.35} /><Line dataKey="actual" name="Actual" stroke="#4f46e5" dot={false} strokeWidth={2} />
        <Line dataKey="predicted" name="Predicted" stroke="#f59e0b" dot={false} strokeWidth={2} strokeDasharray="5 4" /><ReferenceLine x={d.forecast[0].date} stroke="#94a3b8" label={{ value: 'forecast starts', fontSize: 11, position: 'insideTopRight', fill: '#64748b' }} /></ComposedChart></ResponsiveContainer>
      <Note>The 95% interval is the prediction ± 1.96 × the standard deviation of hold-out errors for this product.</Note></Card>
      <Grid n={3}><Kpi label="Total predicted demand" value={fmt(d.summary.total) + ' units'} /><Kpi label="Average daily demand" value={fmt(d.summary.average_daily) + ' units'} />
        <Kpi label="Min / Max daily" value={`${fmt(d.summary.min)} / ${fmt(d.summary.max)}`} sub={`Period: ${d.summary.period}`} /></Grid></div>}</>
}
