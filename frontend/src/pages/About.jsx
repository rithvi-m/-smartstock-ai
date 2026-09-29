import { useApi } from '../api'
import { Card, H, Grid, Kpi, Note, fmt } from '../components'
const S = [['Problem Statement', 'Inconsistent sales forecasts can create overstock or stockout situations, affecting revenue and customer satisfaction.'],
  ['Objectives', 'Forecast product sales, improve inventory planning, understand seasonality and trends, and turn predictions into reorder recommendations.'],
  ['Dataset', 'Synthetic daily retail data (8 products, 5 categories, 12 months) with seasonality, weekly cycles, promotions, holidays, gaps and outliers, or your own CSV.'],
  ['Preprocessing', 'Column validation, date parsing, missing dates filled, missing sales interpolated, outliers capped, and supporting fields forward-filled.'],
  ['Feature Engineering', 'Calendar features, lag 1/7/14/30, rolling means 7/14/30, price, promotion and holiday indicators. Lag and rolling features use only past information.'],
  ['Model', 'Random Forest and Gradient Boosting are compared with a seasonal-naive baseline. The selected model is the one with the lowest chronological hold-out RMSE.'],
  ['Evaluation', 'The last 30 days are held out for validation. MAE, RMSE and MAPE are reported. The dashboard also shows a derived indicator of 100 − MAPE; this is not classification accuracy.'],
  ['Forecasting', 'Recursive multi-step forecasting produces future demand estimates and an uncertainty interval based on hold-out residual variation.'],
  ['Inventory Optimization', 'Safety stock, reorder point, recommended order quantity and days of cover are calculated from demand and forecast information.'],
  ['Business Insights', 'Rule-based insights are generated from actual trends, product performance, seasonality, model results and inventory risk.']]
const F = ['Historical Data', 'Preprocessing', 'Feature Engineering', 'Model Training', 'Evaluation', 'Sales Forecast', 'Inventory Recommendation']
export default function About() {
  const [m] = useApi('/model-performance'); const best = m?.comparison.find(c => c.selected)
  return <><H eyebrow="Project methodology" sub="A presentation-ready summary of how SmartStock AI moves from raw sales data to an inventory decision.">About Project</H>
    <Grid n={4}><Kpi label="Forecast accuracy target" value="≥ 90%" sub="project goal, not a result" tone="indigo" /><Kpi label="Measured accuracy" value={best ? fmt(best.accuracy) + '%' : '…'} sub={best ? `${best.model}: 100 − MAPE on the hold-out` : 'loading'} tone={best && best.accuracy >= 90 ? 'green' : 'amber'} /><Kpi label="Validation" value="30 days" sub="chronological hold-out" /><Kpi label="Decision output" value="Reorder plan" sub="stockout + overstock risk" tone="green" /></Grid>
    <Card title="ML workflow" className="my-5"><div className="flex flex-wrap items-center gap-2 text-sm">{F.map((f, i) => <span key={f} className="flex items-center gap-2"><span className="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-medium">{f}</span>{i < F.length - 1 && <span className="text-slate-400">→</span>}</span>)}</div></Card>
    <Card title="Project scope vs measured results" className="mb-5"><div className="grid md:grid-cols-3 gap-4 text-sm"><div className="p-4 rounded-xl bg-slate-50"><p className="font-semibold">Forecast target</p><p className="text-slate-600 mt-1">90% is the project goal, not a guaranteed result. The app reports the measured validation metrics.</p></div><div className="p-4 rounded-xl bg-slate-50"><p className="font-semibold">Stockout reduction</p><p className="text-slate-600 mt-1">15% is a business goal. It requires before/after operational data to prove.</p></div><div className="p-4 rounded-xl bg-slate-50"><p className="font-semibold">Overstock reduction</p><p className="text-slate-600 mt-1">10% is a business goal. It also requires real inventory outcomes for validation.</p></div></div></Card>
    <div className="space-y-3">{S.map(([t, x]) => <Card key={t}><p className="font-medium text-slate-900">{t}</p><p className="text-sm text-slate-600 mt-1">{x}</p></Card>)}</div>
    <p className="text-xs text-slate-400 mt-5">Tip for presentation: explain the project as “predict demand, measure uncertainty, then recommend inventory action.”</p>
  </>
}
