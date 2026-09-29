import { useApi } from '../api'
import { Card, H } from '../components'
const icon = { trend: '📈', top: '🏆', down: '📉', up: '🚀', pattern: '📅', season: '🌦️', risk: '⚠️', over: '📦', model: '🤖' }
export default function Insights() {
  const [d, el] = useApi('/insights'); if (el) return el
  return <><H sub="Rule-based analysis of your data and forecasts. No external API needed.">AI Insights</H>
    <div className="space-y-3">{d.map((i, n) => <Card key={n}><p className="flex gap-3"><span>{icon[i.type]}</span><span>{i.text}</span></p></Card>)}</div></>
}
