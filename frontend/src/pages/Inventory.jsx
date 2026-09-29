import { useApi } from '../api'
import { Card, H, Table, Badge, Note } from '../components'
export default function Inventory() {
  const [d, el] = useApi('/inventory'); if (el) return el
  return <><H eyebrow="Action center" sub="Turn the 30-day demand forecast into practical reorder and stock-risk decisions.">Inventory Optimization</H>
    <Card className="mb-4" title="How the numbers are calculated"><div className="text-sm space-y-1 font-mono text-slate-700">
      <p>Safety Stock = 1.65 × σ(daily sales, last 90 days) × √Lead Time &nbsp;(95% service level)</p>
      <p>Reorder Point = Forecast Avg Daily Demand × Lead Time + Safety Stock</p>
      <p>Recommended Order Qty = max(0, 30-day Forecast + Safety Stock − Current Stock)</p><p>Days of Cover = Current Stock ÷ Average Forecast Daily Demand</p>
      <p>Stockout risk: High if stock &lt; reorder point; Medium if stock &lt; 30-day forecast</p>
      <p>Overstock risk: High if stock &gt; 1.5 × (forecast + safety stock); Medium if above forecast + safety stock</p></div></Card>
    <Card><Table rows={d} cols={[['Product', 'name'], ['Stock', 'current_stock'], ['Avg daily', 'avg_daily_demand'], ['30d forecast', 'forecast_demand'], ['Lead (d)', 'lead_time'],
      ['Reorder pt', 'reorder_point'], ['Order qty', 'order_qty'], ['Stockout', 'stockout_risk', v => <Badge s={v} />], ['Overstock', 'overstock_risk', v => <Badge s={v} />], ['Recommendation', 'recommendation']]} /></Card></>
}
