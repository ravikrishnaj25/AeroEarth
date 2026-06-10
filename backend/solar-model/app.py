"""
Air2Earth - Solar Potential Prediction using LSTM
Gradio interface for predicting solar energy yield, system size, and savings.
Deploy on Hugging Face Spaces.
"""

import gradio as gr
import torch
import torch.nn as nn
import numpy as np
import json
import os

# =====================================================================
#                        MODEL DEFINITION
# =====================================================================

class SolarLSTM(nn.Module):
    """LSTM model for predicting solar energy potential."""
    def __init__(self, input_dim=6, hidden_dim=64, output_dim=5, num_layers=2):
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
#                     LOAD MODEL & SCALER
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


solar_model, solar_scaler = load_model_and_scaler(
    SolarLSTM, "solar_lstm.pth", "solar_scaler.json"
)


# =====================================================================
#                      PREDICTION FUNCTIONS
# =====================================================================

def build_sequence(base_values, seq_len=SEQ_LEN, noise_scales=None):
    """Build a time-series input sequence with diurnal variation."""
    if noise_scales is None:
        noise_scales = [0.02] * len(base_values)
    seq = []
    for t in range(seq_len):
        step = []
        hour_factor = max(0, np.sin((t - 6) * np.pi / 12))  # 0 at 6am/6pm, 1 at noon
        for i, (val, ns) in enumerate(zip(base_values, noise_scales)):
            if i == 0:  # sun_hours — diurnal
                v = val * (0.8 + 0.4 * hour_factor) + np.random.normal(0, ns * val)
            elif i == 2:  # temperature — diurnal
                v = val + np.random.normal(0, 2) + np.sin(t * np.pi / 12) * 5
            elif i == 3:  # cloud cover — slight variation
                v = val + np.random.normal(0, 0.05)
                v = np.clip(v, 0, 1)
            else:
                v = val * (1.0 + np.random.normal(0, ns))
            step.append(v)
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


def predict_solar_potential(peak_sun_hours, shadow_coverage, temperature, cloud_cover, roof_area, tariff):
    """Predict solar energy potential using LSTM."""
    try:
        base_values = [peak_sun_hours, shadow_coverage, temperature, cloud_cover, roof_area, tariff]
        noise_scales = [0.03, 0.01, 0.0, 0.0, 0.0, 0.0]
        raw_seq = build_sequence(base_values, noise_scales=noise_scales)

        x_min = solar_scaler.get("x_min", [0] * 6)
        x_max = solar_scaler.get("x_max", [1] * 6)
        y_min = solar_scaler.get("y_min", [0] * 5)
        y_max = solar_scaler.get("y_max", [1] * 5)

        seq_norm = normalize_sequence(raw_seq, x_min, x_max)
        input_tensor = torch.FloatTensor(seq_norm).unsqueeze(0)

        with torch.no_grad():
            pred_norm = solar_model(input_tensor).numpy()[0]

        pred = denormalize_output(pred_norm, y_min, y_max)

        result = {
            "type": "solar",
            "predictions": {
                "system_size_kw": round(float(max(pred[0], 0)), 2),
                "energy_month_kwh": round(float(max(pred[1], 0)), 2),
                "savings_month_inr": round(float(max(pred[2], 0)), 2),
                "effective_sun_hours": round(float(np.clip(pred[3], 0, 10)), 2),
                "usable_roof_area_m2": round(float(max(pred[4], 0)), 2),
            },
            "derived": {
                "energy_year_kwh": round(float(max(pred[1], 0)) * 12, 2),
                "savings_year_inr": round(float(max(pred[2], 0)) * 12, 2),
            },
            "input_conditions": {
                "peak_sun_hours": float(peak_sun_hours),
                "shadow_coverage": float(shadow_coverage),
                "temperature_c": float(temperature),
                "cloud_cover": float(cloud_cover),
                "roof_area_m2": float(roof_area),
                "tariff_inr_per_kwh": float(tariff),
            },
            "constants": {
                "usability_factor": 0.7,
                "performance_ratio": 0.8,
                "sqm_per_kw": 10.0,
            },
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
    title="Air2Earth - Solar Potential Predictor",
    theme=gr.themes.Soft(),
) as app:

    gr.Markdown(
        "# ☀️ Air2Earth — Solar Potential Prediction (LSTM)\n"
        "Predict **solar energy yield**, **system size**, and **financial savings** "
        "for building rooftops using a trained LSTM model. Returns structured JSON."
    )

    with gr.Row():
        with gr.Column():
            gr.Markdown("### Input Parameters")
            sun_hours = gr.Number(
                label="Peak Sun Hours (hrs/day)",
                value=5.5, minimum=1.0, maximum=8.0,
                info="Average daily peak sun hours for the location"
            )
            shadow = gr.Slider(
                label="Shadow Coverage",
                value=0.20, minimum=0.0, maximum=0.8, step=0.05,
                info="Fraction of roof under shadow (0 = no shadow, 0.8 = heavy shadow)"
            )
            temp = gr.Number(
                label="Temperature (°C)",
                value=30, minimum=5, maximum=50,
                info="Ambient temperature — panels lose efficiency above 25°C"
            )
            cloud = gr.Slider(
                label="Cloud Cover",
                value=0.2, minimum=0.0, maximum=1.0, step=0.05,
                info="0 = clear sky, 1 = fully overcast"
            )
            roof = gr.Number(
                label="Roof Area (m²)",
                value=150, minimum=10, maximum=1000,
                info="Total building rooftop area"
            )
            tariff = gr.Number(
                label="Electricity Tariff (₹/kWh)",
                value=8.5, minimum=2.0, maximum=15.0,
                info="Local electricity rate"
            )
            predict_btn = gr.Button("☀️ Predict Solar Potential", variant="primary")

        with gr.Column():
            gr.Markdown("### Prediction Result (JSON)")
            output = gr.JSON(label="Solar Prediction")

    predict_btn.click(
        predict_solar_potential,
        inputs=[sun_hours, shadow, temp, cloud, roof, tariff],
        outputs=output,
    )

    gr.Markdown(
        "---\n"
        "**Formula reference:**\n"
        "- Usable Roof = Roof Area × 0.7 × (1 − Shadow)\n"
        "- System Size = Usable Roof ÷ 10 m²/kW\n"
        "- Energy/Year = System × 365 × Sun Hours × 0.8 × Temp Coefficient\n"
        "- Savings = Energy × Tariff\n\n"
        "*Model trained on synthetic data derived from Air2Earth solar calculations. "
        "Sequence length = 24 time-steps (hourly).*"
    )

# =====================================================================
#                          LAUNCH
# =====================================================================

if __name__ == "__main__":
    app.launch(server_name="0.0.0.0", server_port=7860)
