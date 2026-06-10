---
title: Air2Earth Water Harvesting Predictor
emoji: 💧
colorFrom: blue
colorTo: indigo
sdk: gradio
sdk_version: "4.44.1"
python_version: "3.10"
app_file: app.py
pinned: false
---

# Air2Earth — Water Harvesting LSTM Prediction

Predicts **rainwater collection efficiency**, **liters/hour**, **liters/day**, and **harvesting potential** for building rooftops using a trained LSTM model, served via a Gradio interface (deployable on Hugging Face Spaces).

## Structure

```
water-model/
├── app.py                       # Gradio app (JSON response)
├── requirements.txt             # Python dependencies
├── water_lstm_train.ipynb       # Training notebook
├── models/                      # Saved model weights + scaler
│   ├── water_lstm.pth
│   └── water_scaler.json
└── README.md
```

## Inputs → Outputs

| Input | Description | Range |
|-------|-------------|-------|
| Rain Intensity | Rainfall multiplier | 0.1–2.0 |
| Rain Angle | Tilt angle (0=vertical) | −1.5 to 1.5 |
| Droplet Size | Size factor | 0.1–2.0 |
| Rain Speed | Fall speed | 10–100 |
| Roof Area (m²) | Total rooftop area | 20–800 |
| Roof Angle (°) | Roof slope | 0–45 |

| Output | Description |
|--------|-------------|
| `collection_efficiency_pct` | Overall collection efficiency (%) |
| `liters_per_hour` | Water collected per hour (L) |
| `liters_per_day` | Water collected per day (L) |
| `harvesting_potential_pct` | Harvesting potential score (%) |

## Setup

```bash
cd backend/water-model
pip install -r requirements.txt
```

## Training

1. Open `water_lstm_train.ipynb` → Run All
2. Saves `models/water_lstm.pth` + `models/water_scaler.json`

## Run

```bash
python app.py
```

Opens at `http://localhost:7860`

## Deploy to Hugging Face Spaces

1. Create a new Space (Gradio SDK)
2. Upload `app.py`, `requirements.txt`, and the `models/` folder
3. The Space will auto-launch the Gradio app
