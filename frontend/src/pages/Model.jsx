import { useApi } from '../api'
import { Card, Kpi, Grid, H, Table, Note, LineC, BarC, fmt } from '../components'
export default function Model() {
  const [d, el] = useApi('/model-performance'); if (el) return el
  const b = d.comparison.find(c => c.selected)
  const f = (v) => fmt(v)
  return <><H eyebrow="Model lab" sub={`Evaluated on a chronological hold-out: the last ${d.holdout_days} days of every product. No random split is used. Selected model: ${d.best}.`}>Model Performance</H>
    <Grid n={4}><Kpi label="MAE" value={f(b.mae) + ' units'} /><Kpi label="RMSE" value={f(b.rmse) + ' units'} /><Kpi label="MAPE" value={f(b.mape) + '%'} />
      <Kpi label="Derived accuracy" value={f(b.accuracy) + '%'} sub="100 − MAPE; not classification accuracy" tone="amber" /></Grid>
    <div className="mt-4 space-y-4"><Card title="Model comparison (mean across products)"><Table rows={d.comparison} cols={[['Model', 'model', (v, r) => v + (r.selected ? ' (selected)' : '')], ['MAE', 'mae', f], ['RMSE', 'rmse', f], ['MAPE %', 'mape', f], ['Accuracy %', 'accuracy', f]]} />
      <Note>The model with the lowest RMSE on the hold-out is selected, then refitted on all data. SeasonalNaive (repeat last week) is the baseline.</Note></Card>
      <Grid><Card title="Actual vs predicted (all products, daily total)"><LineC data={d.series} lines={[{ k: 'actual', name: 'Actual' }, { k: 'predicted', name: 'Predicted', dash: '5 4' }]} /></Card>
        <Card title="Residuals (actual − predicted)"><BarC data={d.series} x="date" y="residual" color="#f59e0b" /></Card>
        <Card title="Forecast error over time (daily APE %)"><LineC data={d.series} lines={[{ k: 'ape', name: 'APE %', color: '#ef4444' }]} /></Card>
        <Card title="Per-product accuracy"><Table rows={d.per_product} cols={[['Product', 'name'], ['MAE', 'mae', f], ['MAPE %', 'mape', f], ['Accuracy %', 'accuracy', f]]} /></Card></Grid>
      <Card title="How to explain this in your viva"><ul className="text-sm space-y-2 list-disc pl-5">
        <li><b>MAE</b>: on average, the forecast is off by this many units per day.</li><li><b>RMSE</b>: like MAE but punishes big misses more.</li>
        <li><b>MAPE</b>: average percentage error per day. Low-volume products have higher MAPE because small unit errors are large percentages.</li>
        <li><b>Derived accuracy</b>: 100 − MAPE. The project does not claim the 90% target unless the measured validation result reaches it.</li></ul></Card></div></>
}
