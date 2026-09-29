import sqlite3, pathlib, pandas as pd
DB = pathlib.Path(__file__).resolve().parents[2] / "data" / "smartstock.db"

def write(name, df):
    DB.parent.mkdir(exist_ok=True)
    with sqlite3.connect(DB) as c:
        df.to_sql(name, c, if_exists="replace", index=False)

def read(name):
    with sqlite3.connect(DB) as c:
        return pd.read_sql(f"select * from {name}", c)
