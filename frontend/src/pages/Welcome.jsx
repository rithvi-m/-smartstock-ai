export default function Welcome({ onEnter }) {
  return <div className="min-h-screen grid place-items-center bg-slate-900 p-6"><div className="max-w-lg text-center">
    <div className="w-14 h-14 rounded-2xl bg-indigo-500 grid place-items-center text-white text-2xl font-bold mx-auto mb-6">S</div>
    <h1 className="text-4xl font-semibold text-white">SmartStock AI</h1>
    <p className="text-slate-300 mt-4">AI-powered sales forecasting and inventory optimization for smarter retail decisions.</p>
    <button onClick={onEnter} className="mt-8 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium">Enter Dashboard</button></div></div>
}
