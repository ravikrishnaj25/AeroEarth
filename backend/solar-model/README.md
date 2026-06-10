---
title: Air2Earth Solar Potential Predictor
emoji: ☀️
colorFrom: yellow
colorTo: red
sdk: gradio
sdk_version: "4.44.1"
python_version: "3.10"
app_file: app.py
pinned: false
---

# Air2Earth — Solar Potential LSTM Prediction

Predicts **solar energy yield**, **system sizing**, and **financial savings** for building rooftops using a trained LSTM model, served via a Gradio interface (deployable on Hugging Face Spaces).

## Structure

```
solar-model/
├── app.py                       # Gradio app (JSON response)
├── requirements.txt             # Python dependencies
├── solar_lstm_train.ipynb       # Training notebook
├── models/                      # Saved model weights + scaler
│   ├── solar_lstm.pth
│   └── solar_scaler.json
└── README.md
```

## Inputs → Outputs

| Input | Description | Range |
|-------|-------------|-------|
| Peak Sun Hours | Daily peak sun hours | 1–8 hrs |
| Shadow Coverage | Roof shadow fraction | 0–0.8 |
| Temperature (°C) | Ambient temp | 5–50 |
| Cloud Cover | Cloud fraction | 0–1 |
| Roof Area (m²) | Total rooftop area | 10–1000 |
| Tariff (₹/kWh) | Electricity rate | 2–15 |

| Output | Description |
|--------|-------------|
| `system_size_kw` | Estimated solar system capacity (kW) |
| `energy_month_kwh` | Monthly energy generation (kWh) |
| `savings_month_inr` | Monthly savings (₹) |
| `effective_sun_hours` | Sun hours after shadow/cloud loss |
| `usable_roof_area_m2` | Usable area for panels (m²) |

## Setup

```bash
cd backend/solar-model
pip install -r requirements.txt
```

## Training

1. Open `solar_lstm_train.ipynb` → Run All
2. Saves `models/solar_lstm.pth` + `models/solar_scaler.json`

## Run

```bash
python app.py
```

Opens at `http://localhost:7860`

## Deploy to Hugging Face Spaces

1. Create a new Space (Gradio SDK)
2. Upload `app.py`, `requirements.txt`, and the `models/` folder
3. The Space will auto-launch the Gradio app
