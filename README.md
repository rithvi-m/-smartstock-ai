# SmartStock AI — Retail Sales Forecasting & Inventory Optimization

A full-stack academic ML application that forecasts retail demand and converts forecasts into inventory recommendations.

## What is included
- FastAPI backend with data validation, preprocessing, feature engineering and model comparison.
- React + Vite + Tailwind frontend with Dashboard, Sales Analysis, Forecasting, Inventory, Model Performance, Data Management, AI Insights and About pages.
- Random Forest, Gradient Boosting and Seasonal Naive baseline.
- Chronological 30-day hold-out validation; no random time-series split.
- MAE, RMSE, MAPE and a clearly labelled derived `100 - MAPE` indicator.
- Forecast intervals based on hold-out residual variation.
- Safety stock, reorder point, recommended order quantity and days of cover.
- SQLite persistence and CSV upload validation.

## Run locally
### Backend
```bash
cd backend
pip install -r ../requirements.txt
uvicorn main:app --port 8000
```
The first start trains the models and may take 30–60 seconds.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## Important academic note
The project brief sets a 90% forecasting-accuracy target and goals of reducing stockouts by 15% and overstock by 10%. SmartStock AI does **not** fabricate those outcomes. Forecast performance shown in the app is calculated from the validation data. The inventory-reduction goals require real before/after operational data to demonstrate.

## Viva explanation
**Problem → Data → Preprocessing → Feature Engineering → Model Comparison → Time-based Evaluation → Future Forecast → Inventory Recommendation → Business Insight.**
