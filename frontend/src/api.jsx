import { useEffect, useState } from 'react'
export const api = async (path, opts) => {
  const r = await fetch('/api' + path, opts)
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.detail || r.statusText)
  return j
}
// returns [data, statusElement]; statusElement is null once data is loaded
export function useApi(path) {
  const [d, setD] = useState(null), [e, setE] = useState(null)
  useEffect(() => { setD(null); setE(null); api(path).then(setD).catch(x => setE(x.message)) }, [path])
  const el = e ? <p className="text-red-600 p-4">Error: {e}. Is the backend running on port 8000?</p> : d ? null : <p className="text-slate-400 p-4">Loading…</p>
  return [d, el]
}
