import io, json, pathlib
import numpy as np, pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import db
from services import data as D
from forecasting.engine import Engine, HOLD

app = FastAPI(title="SmartStock AI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
E, STATE = Engine(), {}
SAMPLE = pathlib.Path(__file__).resolve().parents[1] / "data" / "sample_sales.csv"
R = lambda df: json.loads(df.to_json(orient="records"))

def load(raw, source):
    missing = {c: int(v) for c, v in raw.isna().sum().items()}
    df, n_out = D.clean(raw)
    snapshot = dict(E.__dict__)          # a rejected dataset must not corrupt the model already loaded
    try:
        E.fit(df)
    except Exception:
        E.__dict__.clear(); E.__dict__.update(snapshot)
        raise
    db.write("products", pd.DataFrame([dict(product_id=p, name=i["name"], category=i["category"], lead_time=E.lead[p]) for p, i in E.info.items()]))
    db.write("sales", df[["date", "product_id", "sales", "price", "promotion", "holiday"]].astype({"date": str}))
    db.write("inventory", df[["date", "product_id", "inventory"]].astype({"date": str}))
    db.write("model_metrics", pd.DataFrame([dict(model=m, **v, selected=int(m == E.best)) for m, v in E.comparison.items()]))
    db.write("forecasts", pd.concat([E.forecast(p, 30).assign(product_id=p) for p in E.g]))
    STATE.update(source=source, rows_raw=len(raw), rows_clean=len(df), missing=missing, outliers_capped=n_out, products=len(E.g),
                 date_from=str(df.date.min().date()), date_to=str(df.date.max().date()),
                 preview=json.loads(raw.head(10).astype(str).to_json(orient="records")))

def need():
    if not E.ready: raise HTTPException(503, "No dataset loaded yet.")

@app.on_event("startup")
def startup():
    if not SAMPLE.exists(): D.make_sample().to_csv(SAMPLE, index=False)
    load(pd.read_csv(SAMPLE), "sample_sales.csv")

@app.get("/api/status")
def status(): return {**STATE, "ready": E.ready, "model": E.best if E.ready else None}

@app.get("/api/products")
def products(): need(); return [dict(product_id=p, **i) for p, i in E.info.items()]

@app.get("/api/dashboard")
def dashboard():
    need(); df = E.df; daily = df.groupby("date").sales.sum(); inv = E.inventory()
    fc_ = pd.concat([E.forecast(p, 30) for p in E.g]).groupby("date").predicted.sum()
    tot = df.groupby("product_id").sales.sum()
    return dict(
        kpis=dict(total_sales=float(df.sales.sum()), total_orders=int((df.sales > 0).sum()), avg_daily_sales=round(float(daily.mean()), 1),
                  products=len(E.g), forecast_accuracy=round(E.comparison[E.best]["accuracy"], 1), at_risk=sum(i["status"] == "Stockout Risk" for i in inv)),
        trend=[dict(date=d.strftime("%Y-%m-%d"), sales=float(v)) for d, v in daily.items()],
        overview=[dict(date=d.strftime("%Y-%m-%d"), actual=float(v)) for d, v in daily.tail(60).items()] + [dict(date=d, forecast=round(float(v))) for d, v in fc_.items()],
        category=R(df.groupby("category").sales.sum().reset_index()),
        risk={s: sum(i["status"] == s for i in inv) for s in ["Stockout Risk", "Overstock Risk", "Healthy"]},
        top=[dict(i, total_sales=float(tot[i["product_id"]])) for i in sorted(inv, key=lambda i: -tot[i["product_id"]])[:6]])

@app.get("/api/sales")
def sales(product_id: str = None, category: str = None, start: str = None, end: str = None):
    need(); df = E.df
    if product_id: df = df[df.product_id == product_id]
    if category: df = df[df.category == category]
    if start: df = df[df.date >= start]
    if end: df = df[df.date <= end]
    if df.empty: raise HTTPException(404, "No data for these filters.")
    daily = df.groupby("date").sales.sum()
    ts = lambda rule: [dict(date=d.strftime("%Y-%m-%d"), sales=float(v)) for d, v in daily.resample(rule).sum().items()]
    byp = df.groupby("product_name").sales.sum().sort_values(ascending=False)
    pl = lambda s: [dict(name=k, sales=float(v)) for k, v in s.items()]
    wd = daily.groupby(daily.index.dayofweek).mean()
    mo = daily.groupby(daily.index.month).mean()
    names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    ins = [f"Busiest weekday: {names[wd.idxmax()]} (avg {wd.max():,.0f} units); slowest: {names[wd.idxmin()]} (avg {wd.min():,.0f}).",
           f"Seasonal peak: month {mo.idxmax()} (avg {mo.max():,.0f}/day). Seasonal low: month {mo.idxmin()} (avg {mo.min():,.0f}/day).",
           f"The peak month runs {(mo.max() / mo.min() - 1) * 100:.0f}% above the lowest month."]
    return dict(daily=ts("D"), weekly=ts("W"), monthly=ts("MS"), category=R(df.groupby("category").sales.sum().reset_index()), by_product=pl(byp),
                top10=pl(byp.head(10)), bottom10=pl(byp.tail(10)[::-1]), weekday=[dict(name=names[i], sales=round(float(v), 1)) for i, v in wd.items()],
                month=[dict(name=str(i), sales=round(float(v), 1)) for i, v in mo.items()], insights=ins,
                categories=sorted(E.df.category.unique().tolist()))

def fc(pid, h):
    need()
    if pid not in E.g: raise HTTPException(404, f"Unknown product_id '{pid}'.")
    if not 1 <= h <= 180: raise HTTPException(422, "horizon must be between 1 and 180 days.")
    f = E.forecast(pid, h); hist = E.g[pid].sales.tail(90)
    return dict(product_id=pid, product_name=E.info[pid]["name"], horizon=h, model=E.best,
                history=[dict(date=d.strftime("%Y-%m-%d"), sales=float(v)) for d, v in hist.items()], forecast=R(f),
                summary=dict(average_daily=round(float(f.predicted.mean()), 1), total=round(float(f.predicted.sum())), min=float(f.predicted.min()),
                             max=float(f.predicted.max()), period=f"{f.date.iloc[0]} to {f.date.iloc[-1]}"))

@app.get("/api/forecast/{product_id}")
def forecast_get(product_id: str, horizon: int = 30): return fc(product_id, horizon)

class FReq(BaseModel):
    product_id: str
    horizon: int = 30

@app.post("/api/forecast")
def forecast_post(r: FReq): return fc(r.product_id, r.horizon)

@app.get("/api/inventory")
def inventory(): need(); return E.inventory()

@app.get("/api/model-performance")
def perf():
    need(); agg = {}
    for t in E.test.values():
        for d, a, p in zip(t["dates"], t["actual"], t["preds"][E.best]):
            x = agg.setdefault(d.strftime("%Y-%m-%d"), [0, 0]); x[0] += a; x[1] += p
    s = [dict(date=d, actual=float(a), predicted=round(float(p), 1), residual=round(float(a - p), 1), ape=round(abs(a - p) / a * 100, 2) if a else None) for d, (a, p) in agg.items()]
    return dict(best=E.best, holdout_days=HOLD, comparison=[dict(model=m, **v, selected=m == E.best) for m, v in E.comparison.items()],
                series=s, per_product=[dict(product_id=p, name=E.info[p]["name"], **m) for p, m in E.pm.items()])

@app.get("/api/insights")
def insights(): need(); return E.insights()

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"): raise HTTPException(400, "Please upload a .csv file.")
    try: raw = pd.read_csv(io.BytesIO(await file.read()))
    except Exception as e: raise HTTPException(400, f"Could not read the CSV: {e}")
    miss = [c for c in D.REQUIRED if c not in raw.columns]
    if miss: raise HTTPException(400, f"Missing required column(s): {', '.join(miss)}. Required: {', '.join(D.REQUIRED)}.")
    try: load(raw, file.filename)
    except ValueError as e: raise HTTPException(400, str(e))
    return status()

@app.post("/api/sample")
def use_sample(): load(pd.read_csv(SAMPLE), "sample_sales.csv"); return status()
