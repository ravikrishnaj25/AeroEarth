"""
Air2Earth - AQI Impact Prediction using LSTM Models
Gradio interface for predicting environmental impact of trees, vertical gardens, and air purifiers.
Deploy on Hugging Face Spaces.
"""

import gradio as gr
import torch
import torch.nn as nn
import numpy as np
import json
import os

# =====================================================================
#                        MODEL DEFINITIONS
# =====================================================================

class TreeLSTM(nn.Module):
    """LSTM model for predicting tree plantation impact on air quality."""
    def __init__(self, input_dim=5, hidden_dim=64, output_dim=4, num_layers=2):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, output_dim)
        )

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])


class GardenLSTM(nn.Module):
    """LSTM model for predicting vertical garden impact on air quality."""
    def __init__(self, input_dim=5, hidden_dim=64, output_dim=5, num_layers=2):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, output_dim)
        )

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])


class PurifierLSTM(nn.Module):
    """LSTM model for predicting air purifier impact on air quality."""
    def __init__(self, input_dim=4, hidden_dim=64, output_dim=3, num_layers=2):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, output_dim)
        )

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])


# =====================================================================
#                     LOAD MODELS & SCALERS
# =====================================================================

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
SEQ_LEN = 24


def load_model_and_scaler(model_class, model_file, scaler_file, **kwargs):
    """Load a trained model and its normalization scaler."""
    model = model_class(**kwargs)
    model_path = os.path.join(MODEL_DIR, model_file)
    scaler_path = os.path.join(MODEL_DIR, scaler_file)

    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location="cpu", weights_only=True))
        model.eval()
        print(f"Loaded model: {model_file}")
    else:
        print(f"WARNING: {model_path} not found. Using untrained model.")

    scaler = {}
    if os.path.exists(scaler_path):
        with open(scaler_path, "r") as f:
            scaler = json.load(f)
        print(f"Loaded scaler: {scaler_file}")
    else:
        print(f"WARNING: {scaler_path} not found. Using default scaler.")

    return model, scaler


# Load all three models at startup
tree_model, tree_scaler = load_model_and_scaler(
    TreeLSTM, "tree_lstm.pth", "tree_scaler.json"
)
garden_model, garden_scaler = load_model_and_scaler(
    GardenLSTM, "garden_lstm.pth", "garden_scaler.json"
)
purifier_model, purifier_scaler = load_model_and_scaler(
    PurifierLSTM, "purifier_lstm.pth", "purifier_scaler.json"
)


# =====================================================================
#                      PREDICTION FUNCTIONS
# =====================================================================

def build_sequence(base_values, seq_len=SEQ_LEN, noise_scales=None):
    """Build a time-series input sequence with slight temporal variation."""
    if noise_scales is None:
        noise_scales = [0.02] * len(base_values)
    seq = []
    for t in range(seq_len):
        step = []
        for val, ns in zip(base_values, noise_scales):
            step.append(val * (1.0 + np.random.normal(0, ns)))
        seq.append(step)
    return np.array(seq, dtype=np.float32)


def normalize_sequence(seq, x_min, x_max):
    """Min-max normalize an input sequence."""
    x_min = np.array(x_min)
    x_max = np.array(x_max)
    return (seq - x_min) / (x_max - x_min + 1e-8)


def denormalize_output(pred, y_min, y_max):
    """Reverse min-max normalization on predictions."""
    y_min = np.array(y_min)
    y_max = np.array(y_max)
    return pred * (y_max - y_min) + y_min


# ----- Tree Impact Prediction -----

def predict_tree_impact(current_aqi, current_pm25, temperature, humidity, wind_speed):
    """Predict the impact of planting a tree on air quality using LSTM."""
    try:
        base_values = [current_aqi, current_pm25, temperature, humidity, wind_speed]
        noise_scales = [0.03, 0.03, 0.02, 0.02, 0.05]
        raw_seq = build_sequence(base_values, noise_scales=noise_scales)

        x_min = tree_scaler.get("x_min", [0] * 5)
        x_max = tree_scaler.get("x_max", [1] * 5)
        y_min = tree_scaler.get("y_min", [0] * 4)
        y_max = tree_scaler.get("y_max", [1] * 4)

        seq_norm = normalize_sequence(raw_seq, x_min, x_max)
        input_tensor = torch.FloatTensor(seq_norm).unsqueeze(0)

        with torch.no_grad():
            pred_norm = tree_model(input_tensor).numpy()[0]

        pred = denormalize_output(pred_norm, y_min, y_max)

        result = {
            "type": "tree",
            "predictions": {
                "pm25_reduction_ugm3": round(float(max(pred[0], 0)), 4),
                "pm10_reduction_ugm3": round(float(max(pred[1], 0)), 4),
                "aqi_improvement_points": round(float(np.clip(pred[2], 0, 8)), 2),
                "co2_absorbed_kg_per_year": round(float(max(pred[3], 0)), 2),
            },
            "input_conditions": {
                "current_aqi": float(current_aqi),
                "current_pm25_ugm3": float(current_pm25),
                "temperature_c": float(temperature),
                "humidity_percent": float(humidity),
                "wind_speed_kmh": float(wind_speed),
            },
            "environment": "outdoor",
            "model": "LSTM",
            "sequence_length": SEQ_LEN,
        }
        return json.dumps(result, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)}, indent=2)


# ----- Vertical Garden Impact Prediction -----

def predict_garden_impact(current_aqi, current_pm25, area_m2, temperature, humidity):
    """Predict the impact of a vertical garden installation using LSTM."""
    try:
        base_values = [current_aqi, current_pm25, area_m2, temperature, humidity]
        noise_scales = [0.03, 0.03, 0.0, 0.02, 0.02]
        raw_seq = build_sequence(base_values, noise_scales=noise_scales)

        x_min = garden_scaler.get("x_min", [0] * 5)
        x_max = garden_scaler.get("x_max", [1] * 5)
        y_min = garden_scaler.get("y_min", [0] * 5)
        y_max = garden_scaler.get("y_max", [1] * 5)

        seq_norm = normalize_sequence(raw_seq, x_min, x_max)
        input_tensor = torch.FloatTensor(seq_norm).unsqueeze(0)

        with torch.no_grad():
            pred_norm = garden_model(input_tensor).numpy()[0]

        pred = denormalize_output(pred_norm, y_min, y_max)

        result = {
            "type": "vertical_garden",
            "predictions": {
                "pm25_reduction_ugm3": round(float(max(pred[0], 0)), 4),
                "pm10_reduction_ugm3": round(float(max(pred[1], 0)), 4),
                "aqi_improvement_points": round(float(np.clip(pred[2], 0, 20)), 2),
                "temperature_reduction_c": round(float(np.clip(pred[3], 0, 5)), 2),
                "noise_reduction_db": round(float(np.clip(pred[4], 0, 10)), 2),
            },
            "input_conditions": {
                "current_aqi": float(current_aqi),
                "current_pm25_ugm3": float(current_pm25),
                "garden_area_m2": float(area_m2),
                "temperature_c": float(temperature),
                "humidity_percent": float(humidity),
            },
            "environment": "outdoor",
            "model": "LSTM",
            "sequence_length": SEQ_LEN,
        }
        return json.dumps(result, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)}, indent=2)


# ----- Air Purifier Impact Prediction -----

def predict_purifier_impact(current_aqi, current_pm25, room_size_sqft, ventilation_rate):
    """Predict the impact of an air purifier using LSTM."""
    try:
        base_values = [current_aqi, current_pm25, room_size_sqft, ventilation_rate]
        noise_scales = [0.03, 0.03, 0.0, 0.02]
        raw_seq = build_sequence(base_values, noise_scales=noise_scales)

        x_min = purifier_scaler.get("x_min", [0] * 4)
        x_max = purifier_scaler.get("x_max", [1] * 4)
        y_min = purifier_scaler.get("y_min", [0] * 3)
        y_max = purifier_scaler.get("y_max", [1] * 3)

        seq_norm = normalize_sequence(raw_seq, x_min, x_max)
        input_tensor = torch.FloatTensor(seq_norm).unsqueeze(0)

        with torch.no_grad():
            pred_norm = purifier_model(input_tensor).numpy()[0]

        pred = denormalize_output(pred_norm, y_min, y_max)

        result = {
            "type": "air_purifier",
            "predictions": {
                "pm25_reduction_percent": round(float(np.clip(pred[0], 0, 99)), 2),
                "cadr_m3_per_hr": round(float(max(pred[1], 0)), 2),
                "effective_coverage_sqft": round(float(max(pred[2], 0)), 2),
            },
            "input_conditions": {
                "current_aqi": float(current_aqi),
                "current_pm25_ugm3": float(current_pm25),
                "room_size_sqft": float(room_size_sqft),
                "ventilation_rate_ach": float(ventilation_rate),
            },
            "environment": "indoor",
            "model": "LSTM",
            "sequence_length": SEQ_LEN,
        }
        return json.dumps(result, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)}, indent=2)


# =====================================================================
#                       GRADIO INTERFACE
# =====================================================================

with gr.Blocks(
    title="Air2Earth - AQI Impact Predictor",
    theme=gr.themes.Soft(),
) as app:

    gr.Markdown(
        "# 🌍 Air2Earth — AQI Impact Prediction (LSTM)\n"
        "Predict the environmental impact of **trees**, **vertical gardens**, and **air purifiers** "
        "using trained LSTM deep-learning models. Returns structured JSON responses."
    )

    # ---- Tab 1: Tree ----
    with gr.Tab("🌳 Tree Impact"):
        gr.Markdown("### Predict impact of planting a tree near an AQI monitoring station")
        with gr.Row():
            with gr.Column():
                tree_aqi = gr.Number(label="Current AQI", value=150, minimum=0, maximum=500)
                tree_pm25 = gr.Number(label="Current PM2.5 (µg/m³)", value=75, minimum=0, maximum=500)
                tree_temp = gr.Number(label="Temperature (°C)", value=30, minimum=-10, maximum=55)
                tree_humidity = gr.Number(label="Humidity (%)", value=60, minimum=0, maximum=100)
                tree_wind = gr.Number(label="Wind Speed (km/h)", value=5, minimum=0, maximum=50)
                tree_btn = gr.Button("Predict Tree Impact", variant="primary")
            with gr.Column():
                tree_output = gr.JSON(label="Prediction Result")

        tree_btn.click(
            predict_tree_impact,
            inputs=[tree_aqi, tree_pm25, tree_temp, tree_humidity, tree_wind],
            outputs=tree_output,
        )

    # ---- Tab 2: Vertical Garden ----
    with gr.Tab("🌿 Vertical Garden Impact"):
        gr.Markdown("### Predict impact of a vertical garden installation")
        with gr.Row():
            with gr.Column():
                garden_aqi = gr.Number(label="Current AQI", value=150, minimum=0, maximum=500)
                garden_pm25 = gr.Number(label="Current PM2.5 (µg/m³)", value=75, minimum=0, maximum=500)
                garden_area = gr.Number(label="Garden Area (m²)", value=10, minimum=1, maximum=200)
                garden_temp = gr.Number(label="Temperature (°C)", value=30, minimum=-10, maximum=55)
                garden_humidity = gr.Number(label="Humidity (%)", value=60, minimum=0, maximum=100)
                garden_btn = gr.Button("Predict Garden Impact", variant="primary")
            with gr.Column():
                garden_output = gr.JSON(label="Prediction Result")

        garden_btn.click(
            predict_garden_impact,
            inputs=[garden_aqi, garden_pm25, garden_area, garden_temp, garden_humidity],
            outputs=garden_output,
        )

    # ---- Tab 3: Air Purifier ----
    with gr.Tab("💨 Air Purifier Impact"):
        gr.Markdown("### Predict impact of an air purifier placement")
        with gr.Row():
            with gr.Column():
                purifier_aqi = gr.Number(label="Current AQI", value=150, minimum=0, maximum=500)
                purifier_pm25 = gr.Number(label="Current PM2.5 (µg/m³)", value=75, minimum=0, maximum=500)
                purifier_room = gr.Number(label="Room Size (sq ft)", value=400, minimum=50, maximum=2000)
                purifier_vent = gr.Number(label="Ventilation Rate (ACH)", value=2.0, minimum=0.5, maximum=10.0)
                purifier_btn = gr.Button("Predict Purifier Impact", variant="primary")
            with gr.Column():
                purifier_output = gr.JSON(label="Prediction Result")

        purifier_btn.click(
            predict_purifier_impact,
            inputs=[purifier_aqi, purifier_pm25, purifier_room, purifier_vent],
            outputs=purifier_output,
        )

    gr.Markdown(
        "---\n"
        "*Models trained on synthetic data derived from Air2Earth AQI impact formulas. "
        "Sequence length = 24 time-steps.*"
    )

# =====================================================================
#                          LAUNCH
# =====================================================================

if __name__ == "__main__":
    app.launch(server_name="0.0.0.0", server_port=7860)
