"""
Air2Earth - Water Harvesting Prediction using LSTM
Gradio interface for predicting rainwater collection potential.
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

class WaterLSTM(nn.Module):
    """LSTM model for predicting rainwater harvesting potential."""
    def __init__(self, input_dim=6, hidden_dim=64, output_dim=4, num_layers=2):
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


water_model, water_scaler = load_model_and_scaler(
    WaterLSTM, "water_lstm.pth", "water_scaler.json"
)


# =====================================================================
#                      PREDICTION FUNCTIONS
# =====================================================================

def build_sequence(base_values, seq_len=SEQ_LEN):
    """Build a time-series input sequence with realistic rain variation."""
    seq = []
    for t in range(seq_len):
        storm_factor = 1.0 + 0.3 * np.sin(t * np.pi / 6)
        step = []
        for i, val in enumerate(base_values):
            if i == 0:  # intensity — storm surges
                v = val * storm_factor + np.random.normal(0, 0.1)
                v = np.clip(v, 0.05, 3.0)
            elif i == 1:  # angle — wind shifts
                v = val + np.random.normal(0, 0.15) + 0.1 * np.sin(t * np.pi / 8)
                v = np.clip(v, -2.0, 2.0)
            elif i == 2:  # size — slight variation
                v = val + np.random.normal(0, 0.08)
                v = np.clip(v, 0.05, 3.0)
            elif i == 3:  # speed — gusts
                v = val + np.random.normal(0, 3) + 5 * np.sin(t * np.pi / 10)
                v = np.clip(v, 5, 120)
            else:  # roof_area, roof_angle — constant
                v = val
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


def predict_water_harvesting(rain_intensity, rain_angle, rain_size, rain_speed, roof_area, roof_angle):
    """Predict water harvesting potential using LSTM."""
    try:
        base_values = [rain_intensity, rain_angle, rain_size, rain_speed, roof_area, roof_angle]
        raw_seq = build_sequence(base_values)

        x_min = water_scaler.get("x_min", [0] * 6)
        x_max = water_scaler.get("x_max", [1] * 6)
        y_min = water_scaler.get("y_min", [0] * 4)
        y_max = water_scaler.get("y_max", [1] * 4)

        seq_norm = normalize_sequence(raw_seq, x_min, x_max)
        input_tensor = torch.FloatTensor(seq_norm).unsqueeze(0)

        with torch.no_grad():
            pred_norm = water_model(input_tensor).numpy()[0]

        pred = denormalize_output(pred_norm, y_min, y_max)

        result = {
            "type": "water_harvesting",
            "predictions": {
                "collection_efficiency_pct": round(float(np.clip(pred[0], 30, 95)), 2),
                "liters_per_hour": round(float(max(pred[1], 0)), 2),
                "liters_per_day": round(float(max(pred[2], 0)), 2),
                "harvesting_potential_pct": round(float(np.clip(pred[3], 40, 95)), 2),
            },
            "derived": {
                "liters_per_month_estimate": round(float(max(pred[2], 0)) * 15, 2),
                "liters_per_year_estimate": round(float(max(pred[2], 0)) * 15 * 12, 2),
            },
            "input_conditions": {
                "rain_intensity": float(rain_intensity),
                "rain_angle": float(rain_angle),
                "rain_size": float(rain_size),
                "rain_speed": float(rain_speed),
                "roof_area_m2": float(roof_area),
                "roof_angle_deg": float(roof_angle),
            },
            "constants": {
                "base_rainfall_rate_mm_hr": 5,
                "rain_hours_per_day": 6,
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
    title="Air2Earth - Water Harvesting Predictor",
    theme=gr.themes.Soft(),
) as app:

    gr.Markdown(
        "# 💧 Air2Earth — Water Harvesting Prediction (LSTM)\n"
        "Predict **rainwater collection efficiency**, **liters/hour**, **liters/day**, "
        "and **harvesting potential** for building rooftops using a trained LSTM model. "
        "Returns structured JSON."
    )

    with gr.Row():
        with gr.Column():
            gr.Markdown("### Rain Parameters")
            intensity = gr.Slider(
                label="Rain Intensity",
                value=1.0, minimum=0.1, maximum=2.0, step=0.1,
                info="Rainfall intensity multiplier (0.1 = drizzle, 2.0 = heavy)"
            )
            angle = gr.Slider(
                label="Rain Angle",
                value=-0.6, minimum=-1.5, maximum=1.5, step=0.1,
                info="Rain tilt (0 = vertical, negative = wind-driven)"
            )
            size = gr.Slider(
                label="Droplet Size",
                value=0.6, minimum=0.1, maximum=2.0, step=0.1,
                info="Droplet size factor (larger → better retention)"
            )
            speed = gr.Number(
                label="Rain Speed",
                value=60, minimum=10, maximum=100,
                info="Droplet fall speed (optimal ≈ 50)"
            )

            gr.Markdown("### Building Parameters")
            roof = gr.Number(
                label="Roof Area (m²)",
                value=200, minimum=20, maximum=800,
                info="Total building roof area"
            )
            roof_ang = gr.Slider(
                label="Roof Angle (°)",
                value=5, minimum=0, maximum=45, step=1,
                info="Roof slope angle (0 = flat)"
            )
            predict_btn = gr.Button("💧 Predict Water Harvesting", variant="primary")

        with gr.Column():
            gr.Markdown("### Prediction Result (JSON)")
            output = gr.JSON(label="Water Harvesting Prediction")

    predict_btn.click(
        predict_water_harvesting,
        inputs=[intensity, angle, size, speed, roof, roof_ang],
        outputs=output,
    )

    gr.Markdown(
        "---\n"
        "**Formula reference (from calculations.ts):**\n"
        "- Collection Efficiency = AngleEff × SizeEff × SpeedEff × RoofEff\n"
        "- Liters/hr = Roof Area × Rainfall Rate × Intensity × Efficiency\n"
        "- Liters/day = Liters/hr × 6 hrs (rain hours/day)\n"
        "- Potential = 60 + log(area) × 1.5 + roofAngleEffect − rainAngleEffect\n\n"
        "*Model trained on synthetic data derived from Air2Earth water harvesting calculations. "
        "Sequence length = 24 time-steps (hourly).*"
    )

# =====================================================================
#                          LAUNCH
# =====================================================================

if __name__ == "__main__":
    app.launch(server_name="0.0.0.0", server_port=7860)
