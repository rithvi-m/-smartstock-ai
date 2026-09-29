import numpy as np, pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from services.data import is_holiday

HOLD = 30  # chronological hold-out: last 30 days of every product
def feat_row(h, d, price, promo, hol):
    """h = history strictly BEFORE date d (no leakage). Lags and rolling means use only h."""
    return [d.dayofweek, d.day, d.month, (d.month - 1) // 3 + 1, d.year, int(d.isocalendar()[1]), int(d.dayofweek >= 5),
            h[-1], h[-7], h[-14], h[-30], h[-7:].mean(), h[-14:].mean(), h[-30:].mean(), price, promo, hol]
def candidates():
    return {"RandomForest": RandomForestRegressor(150, min_samples_leaf=2, random_state=0, n_jobs=-1),
            "GradientBoosting": GradientBoostingRegressor(n_estimators=200, max_depth=3, learning_rate=.05, random_state=0)}
def snaive(h, n): return np.resize(np.asarray(h[-7:], float), n)   # seasonal-naive baseline (repeat last week)
def recursive(model, hist, dates, price, promo, hol):
    h, out = list(hist), []
    for i, d in enumerate(dates):
        p = max(0., float(model.predict([feat_row(np.array(h), d, price[i], promo[i], hol[i])])[0])); h.append(p); out.append(p)
    return np.array(out)
def metrics(y, p):
    e = y - p; nz = y > 0
    mape = float((abs(e[nz]) / y[nz]).mean() * 100) if nz.any() else float("nan")
    return dict(mae=float(abs(e).mean()), rmse=float(np.sqrt((e ** 2).mean())), mape=mape, accuracy=max(0., 100 - mape))
def xy(g, end):
    s = g.sales.values
    X = [feat_row(s[:i], g.index[i], g.price.iloc[i], g.promotion.iloc[i], g.holiday.iloc[i]) for i in range(30, end)]
    return np.array(X), s[30:end]

class Engine:
    ready = False
    def fit(self, df):
        self.df, self.cache = df, {}
        self.g = {p: x.sort_values("date").set_index("date") for p, x in df.groupby("product_id")}
        self.info = {p: dict(name=g.product_name.iloc[0], category=g.category.iloc[0]) for p, g in self.g.items()}
        self.lead = {p: int(g.lead_time.iloc[-1]) for p, g in self.g.items()}
        self.test = {}
        for pid, g in self.g.items():
            if len(g) < 100: raise ValueError(f"Product {pid} has only {len(g)} daily records; at least 100 are needed.")
            cut, s = len(g) - HOLD, g.sales.values
            X, y = xy(g, cut); dates = g.index[cut:]
            cov = (g.price.values[cut:], g.promotion.values[cut:], g.holiday.values[cut:])
            preds = {"SeasonalNaive": snaive(s[:cut], HOLD)}
            for n, m in candidates().items():
                preds[n] = recursive(m.fit(X, y), s[:cut], dates, *cov)
            self.test[pid] = dict(dates=dates, actual=s[cut:], preds=preds)
        names = list(next(iter(self.test.values()))["preds"])
        per = {n: [metrics(t["actual"], t["preds"][n]) for t in self.test.values()] for n in names}
        self.comparison = {n: {k: float(np.nanmean([m[k] for m in ms])) for k in ms[0]} for n, ms in per.items()}
        self.best = min(self.comparison, key=lambda n: self.comparison[n]["rmse"])   # selected on hold-out RMSE
        self.models, self.sd, self.pm = {}, {}, {}
        for pid, g in self.g.items():
            t = self.test[pid]; self.sd[pid] = float(np.std(t["actual"] - t["preds"][self.best]))
            self.pm[pid] = metrics(t["actual"], t["preds"][self.best])
            if self.best == "SeasonalNaive": self.models[pid] = None
            else:
                X, y = xy(g, len(g)); self.models[pid] = candidates()[self.best].fit(X, y)   # refit on all data
        self.ready = True

    def forecast(self, pid, h):
        if (pid, h) in self.cache: return self.cache[(pid, h)]
        g = self.g[pid]; dates = pd.date_range(g.index[-1] + pd.Timedelta(days=1), periods=h)
        m, s = self.models[pid], g.sales.values
        p = snaive(s, h) if m is None else recursive(m, s, dates, [g.price.iloc[-1]] * h, [0] * h, [is_holiday(d) for d in dates])
        sd = self.sd[pid]
        f = pd.DataFrame({"date": dates.strftime("%Y-%m-%d"), "predicted": p.round(1),
                          "lower": np.maximum(0, p - 1.96 * sd).round(1), "upper": (p + 1.96 * sd).round(1)})
        self.cache[(pid, h)] = f; return f

    def inventory(self):
        rows = []
        for pid, g in self.g.items():
            stock, avg, sd, lead = float(g.inventory.iloc[-1]), float(g.sales.tail(30).mean()), float(g.sales.tail(90).std()), self.lead[pid]
            fdem = float(self.forecast(pid, 30).predicted.sum()); fav = fdem / 30
            ss = 1.65 * sd * np.sqrt(lead)                      # 95% service level
            rop = fav * lead + ss; qty = max(0., fdem + ss - stock); cover = stock / fav if fav else 999
            so = "High" if stock < rop else "Medium" if stock < fdem else "Low"
            ov = "High" if stock > 1.5 * (fdem + ss) else "Medium" if stock > fdem + ss else "Low"
            status = "Stockout Risk" if so == "High" else "Overstock Risk" if ov == "High" else "Healthy"
            rec = (f"Reorder now – stock is below the reorder point ({rop:.0f} units)." if so == "High" else
                   "Reorder soon – predicted demand may exceed current stock." if qty > 0 else
                   "Consider reducing inventory – stock far exceeds expected demand." if ov == "High" else
                   "Inventory appears sufficient for the forecast period.")
            rows.append(dict(product_id=pid, name=self.info[pid]["name"], category=self.info[pid]["category"], current_stock=round(stock),
                             avg_daily_demand=round(avg, 1), forecast_demand=round(fdem), lead_time=lead, safety_stock=round(ss),
                             reorder_point=round(rop), order_qty=round(qty), days_of_cover=round(cover, 1), stockout_risk=so,
                             overstock_risk=ov, status=status, recommendation=rec))
        return rows

    def insights(self):
        df, out = self.df, []
        last = df.date.max()
        a, b = df[df.date > last - pd.Timedelta(days=30)], df[(df.date <= last - pd.Timedelta(days=30)) & (df.date > last - pd.Timedelta(days=60))]
        ch = (a.sales.sum() / b.sales.sum() - 1) * 100
        out.append(("trend", f"Total sales {'increased' if ch >= 0 else 'decreased'} by {abs(ch):.1f}% in the last 30 days compared with the previous 30 days."))
        tot = df.groupby("product_name").sales.sum()
        out.append(("top", f"{tot.idxmax()} has the highest demand ({tot.max():,.0f} units sold)."))
        pa, pb = a.groupby("product_name").sales.sum(), b.groupby("product_name").sales.sum()
        pc = ((pa / pb - 1) * 100).dropna().sort_values()
        if len(pc) and pc.iloc[0] < -5: out.append(("down", f"{pc.index[0]} shows declining demand ({pc.iloc[0]:.1f}% vs previous 30 days)."))
        if len(pc) and pc.iloc[-1] > 5: out.append(("up", f"{pc.index[-1]} shows growing demand (+{pc.iloc[-1]:.1f}% vs previous 30 days)."))
        we = df.groupby(df.date.dt.dayofweek >= 5).sales.mean()
        if len(we) == 2:
            d = (we[True] / we[False] - 1) * 100
            out.append(("pattern", f"Weekend demand is {abs(d):.1f}% {'higher' if d >= 0 else 'lower'} than weekday demand."))
        m = df.assign(m=df.date.dt.month).groupby(["category", "m"]).sales.sum().unstack()
        r = (m.max(axis=1) / m.replace(0, np.nan).min(axis=1)).sort_values()
        if len(r): out.append(("season", f"{r.index[-1]} has the strongest seasonal demand: its peak month (month {int(m.loc[r.index[-1]].idxmax())}) sells {r.iloc[-1]:.1f}x its lowest month."))
        for i in self.inventory():
            if i["status"] == "Stockout Risk":
                out.append(("risk", f"{i['name']} may face a stockout: stock {i['current_stock']} vs {i['forecast_demand']} forecast for 30 days (~{i['days_of_cover']} days of cover)."))
            elif i["status"] == "Overstock Risk":
                out.append(("over", f"{i['name']} looks overstocked: {i['current_stock']} units on hand vs {i['forecast_demand']} forecast for 30 days."))
        c = self.comparison[self.best]
        out.append(("model", f"Selected model {self.best} reached {c['accuracy']:.1f}% forecast accuracy (100 - MAPE) on the {HOLD}-day hold-out."))
        return [dict(type=t, text=x) for t, x in out]
