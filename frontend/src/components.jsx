import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from 'recharts'
export const fmt = n => n == null ? '–' : Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 })
export const Card = ({ title, children, className = '', action }) => (
  <section className={`bg-white rounded-2xl border border-slate-200 p-5 card-shadow min-w-0 ${className}`}>
    {(title || action) && <div className="flex items-center justify-between gap-3 mb-4"><h3 className="font-semibold text-slate-900">{title}</h3>{action}</div>}
    {children}
  </section>)
export const Kpi = ({ label, value, sub, tip, tone = 'default', icon }) => {
  const tones = { default: 'bg-slate-50 text-slate-700', indigo: 'bg-indigo-50 text-indigo-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700' }
  return <div className="bg-white rounded-2xl border border-slate-200 p-4 card-shadow" title={tip}>
    <div className="flex items-start justify-between gap-3"><p className="text-sm text-slate-500">{label}</p>{icon && <span className={`w-9 h-9 rounded-xl grid place-items-center ${tones[tone] || tones.default}`}>{icon}</span>}</div>
    <p className="text-2xl font-semibold mt-2 tracking-tight text-slate-900">{value}</p>{sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
}
const colors = { 'Stockout Risk': 'bg-red-100 text-red-700', 'Overstock Risk': 'bg-amber-100 text-amber-700', Healthy: 'bg-emerald-100 text-emerald-700', High: 'bg-red-100 text-red-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-emerald-100 text-emerald-700' }
export const Badge = ({ s }) => <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${colors[s] || 'bg-slate-100 text-slate-600'}`}>{s}</span>
export const Note = ({ children }) => <p className="text-sm text-slate-500 leading-relaxed">{children}</p>
export const Grid = ({ n = 2, children }) => <div className={`grid gap-4 ${n === 2 ? 'lg:grid-cols-2' : n === 3 ? 'md:grid-cols-3' : n === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2 xl:grid-cols-6'}`}>{children}</div>
export const H = ({ children, sub, eyebrow }) => <div className="mb-6"><div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">{eyebrow || 'SmartStock AI'}</div><h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">{children}</h1>{sub && <Note>{sub}</Note>}</div>
export function Table({ cols, rows }) { return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b bg-slate-50">{cols.map(c => <th key={c[0]} className="py-3 px-3 font-medium whitespace-nowrap">{c[0]}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-b last:border-0 hover:bg-slate-50/70">{cols.map(c => <td key={c[0]} className="py-3 px-3">{c[2] ? c[2](r[c[1]], r) : r[c[1]]}</td>)}</tr>)}</tbody></table></div> }
const P = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444']
export const LineC = ({ data, lines, x = 'date', h = 260 }) => <ResponsiveContainer width="100%" height={h}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey={x} tick={{ fontSize: 11 }} minTickGap={40} /><YAxis tick={{ fontSize: 11 }} width={45} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,.08)' }} />{lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}{lines.map((l, i) => <Line key={l.k} dataKey={l.k} name={l.name || l.k} stroke={l.color || P[i]} dot={false} strokeWidth={2} strokeDasharray={l.dash} connectNulls={false} />)}</LineChart></ResponsiveContainer>
export const BarC = ({ data, x = 'name', y = 'sales', h = 260, horizontal, color = '#4f46e5' }) => <ResponsiveContainer width="100%" height={h}><BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />{horizontal ? <><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey={x} width={120} tick={{ fontSize: 11 }} /></> : <><XAxis dataKey={x} tick={{ fontSize: 11 }} minTickGap={20} /><YAxis tick={{ fontSize: 11 }} width={45} /> </>}<Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} /><Bar dataKey={y} fill={color} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
