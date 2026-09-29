import { useApi } from '../api'
import { Card, Kpi, Grid, H, Table, Badge, LineC, BarC, fmt, Note } from '../components'
export default function Dashboard() {
  const [d, el] = useApi('/dashboard'); if (el) return el
  const k = d.kpis
  return <><H eyebrow="Decision center" sub="A live view of demand, forecast performance and inventory risk calculated from the loaded dataset.">Dashboard</H>
    <Grid n={6}><Kpi label="Total Sales" value={fmt(k.total_sales)} sub="units" icon="Σ" tone="indigo" /><Kpi label="Total Orders" value={fmt(k.total_orders)} sub="product-days with sales" icon="↗" /><Kpi label="Avg Daily Sales" value={fmt(k.avg_daily_sales)} sub="units / day" icon="◷" /><Kpi label="Products Tracked" value={k.products} sub="active products" icon="▦" /><Kpi label="Forecast Accuracy" value={k.forecast_accuracy + '%'} sub="100 − MAPE, hold-out" icon="◔" tone="amber" /><Kpi label="Stockout Risk" value={k.at_risk} sub="products" icon="!" tone="red" /></Grid>
    <div className="mt-5 space-y-5"><Grid><Card title="Sales trend" action={<span className="text-xs text-slate-400">Historical</span>}><LineC data={d.trend} lines={[{ k: 'sales', name: 'Daily sales' }]} /></Card>
      <Card title="Forecast overview" action={<span className="text-xs text-slate-400">Last 60 days + next 30</span>}><LineC data={d.overview} lines={[{ k: 'actual', name: 'Actual' }, { k: 'forecast', name: 'Forecast', dash: '5 4' }]} /></Card>
      <Card title="Category performance"><BarC data={d.category} x="category" /></Card>
      <Card title="Inventory risk"><div className="space-y-4 pt-1">{Object.entries(d.risk).map(([s, n]) => <div key={s} className="flex items-center justify-between p-3 rounded-xl bg-slate-50"><Badge s={s} /><span className="text-2xl font-semibold text-slate-900">{n}</span></div>)}<Note>Risk is calculated from forecast demand, safety stock and current inventory.</Note></div></Card></Grid>
      <Card title="Priority products" action={<span className="text-xs text-slate-400">Sorted by lifetime sales</span>}><Table rows={d.top} cols={[['Product', 'name'], ['Total sales', 'total_sales', v => fmt(v)], ['Avg demand', 'avg_daily_demand', v => fmt(v)], ['Stock', 'current_stock', v => fmt(v)], ['30d forecast', 'forecast_demand', v => fmt(v)], ['Risk', 'status', v => <Badge s={v} />]]} /></Card></div></>
}
