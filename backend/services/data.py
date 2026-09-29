import numpy as np, pandas as pd
HOL = {(1, 1), (1, 26), (8, 15), (10, 2), (11, 1), (12, 25)}
REQUIRED = ["date", "product_id", "product_name", "category", "sales"]
def is_holiday(d): return int((d.month, d.day) in HOL)

# id, name, category, base daily demand, price, lead time (days), replenishment size (days of demand)
PRODUCTS = [("P001", "Espresso Beans 1kg", "Beverages", 60, 18, 5, 20), ("P002", "Green Tea Box", "Beverages", 35, 9, 4, 45),
            ("P003", "Winter Jacket", "Apparel", 14, 55, 10, 15), ("P004", "Cotton T-Shirt", "Apparel", 40, 12, 7, 20),
            ("P005", "Sunscreen SPF50", "Personal Care", 22, 11, 6, 12), ("P006", "Notebook Pack", "Stationery", 50, 6, 5, 60),
            ("P007", "Gift Hamper", "Gifts", 10, 40, 8, 10), ("P008", "Chocolate Box", "Gifts", 30, 14, 5, 14)]

SCENARIO = {"P001": 4, "P004": 5, "P002": 90, "P006": 80}   # last-day stock in days of base demand

def make_sample(seed=42):
    """Synthetic but realistic: yearly seasonality, weekly cycle, trend, promotions, holidays, Poisson noise, a few gaps/outliers."""
    rng = np.random.default_rng(seed)
    dates = pd.date_range("2025-09-01", "2026-08-31")
    doy, mon, dow = dates.dayofyear.values, dates.month.values, dates.dayofweek.values
    t = np.arange(len(dates)) / len(dates)
    cos = lambda peak, a: 1 + a * np.cos(2 * np.pi * (doy - peak) / 365)
    seas = {"P001": cos(355, .25), "P002": cos(10, .3), "P003": cos(360, .9), "P004": cos(180, .5), "P005": cos(135, .7),
            "P006": 1 + .6 * np.isin(mon, [6, 7, 1]), "P007": 1 + .9 * np.isin(mon, [11, 12]) + .4 * (mon == 2),
            "P008": 1 + .6 * np.isin(mon, [11, 12]) + .5 * (mon == 2)}
    wk = dict(P001=1.25, P002=1.1, P003=1.15, P004=1.3, P005=1.3, P006=.7, P007=1.4, P008=1.3)
    tr = dict(P001=.3, P002=-.3, P003=0, P004=.1, P005=0, P006=0, P007=.15, P008=0)
    hol = np.array([is_holiday(d) for d in dates])
    rows = []
    for pid, name, cat, base, price, lead, rq in PRODUCTS:
        promo = (rng.random(len(dates)) < .08).astype(int)
        mu = base * seas[pid] * np.where(dow >= 5, wk[pid], 1) * (1 + tr[pid] * t) * np.where(promo, 1.35, 1) * np.where(hol, 1.8 if cat == "Gifts" else 1.35, 1)
        s = rng.poisson(mu).astype(float)
        s[rng.random(len(s)) < .003] *= 4          # outliers
        stock, inv = base * 12, []
        for v in s:
            stock = max(stock - v, 0)
            if stock < base * lead: stock += base * rq
            inv.append(stock)
        inv[-1] = base * SCENARIO.get(pid, inv[-1] / base)   # demo scenarios: some products low, some overstocked
        s[rng.random(len(s)) < .005] = np.nan      # missing values
        for i, d in enumerate(dates):
            rows.append((d.date(), pid, name, cat, s[i], round(price * (.85 if promo[i] else 1), 2), round(inv[i]), promo[i], hol[i],
                         rng.choice(["sunny", "cloudy", "rainy"]), lead))
    cols = ["date", "product_id", "product_name", "category", "sales", "price", "inventory", "promotion", "holiday", "weather", "lead_time"]
    return pd.DataFrame(rows, columns=cols)

def clean(raw):
    """Validation -> dates -> missing values -> outliers. Returns (clean_df, n_outliers_capped)."""
    df = raw.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "product_id"])
    df["product_id"] = df["product_id"].astype(str)
    df["sales"] = pd.to_numeric(df["sales"], errors="coerce")
    for c, v in [("price", np.nan), ("promotion", 0), ("holiday", np.nan), ("inventory", np.nan), ("lead_time", 7)]:
        if c not in df: df[c] = v
    df = df.sort_values(["product_id", "date"]).drop_duplicates(["product_id", "date"])
    out, n_out = [], 0
    for pid, g in df.groupby("product_id"):
        g = g.set_index("date").asfreq("D")
        g["product_id"] = pid
        g["promotion"] = pd.to_numeric(g["promotion"], errors="coerce").fillna(0)
        g["holiday"] = pd.to_numeric(g["holiday"], errors="coerce")
        g["holiday"] = g["holiday"].fillna(pd.Series([is_holiday(d) for d in g.index], index=g.index))
        g = g.ffill().bfill()
        g["sales"] = pd.to_numeric(g["sales"], errors="coerce").interpolate(limit_direction="both").clip(lower=0)
        q1, q3 = g.sales.quantile([.25, .75]); cap = q3 + 3 * (q3 - q1)
        n_out += int((g.sales > cap).sum()); g["sales"] = g.sales.clip(upper=cap).round()
        g["price"] = pd.to_numeric(g["price"], errors="coerce").fillna(0)
        g["inventory"] = pd.to_numeric(g["inventory"], errors="coerce").fillna(g.sales.mean() * 14)
        g["lead_time"] = pd.to_numeric(g["lead_time"], errors="coerce").fillna(7)
        out.append(g.reset_index())
    return pd.concat(out, ignore_index=True), n_out
