"""
ml.py
Nạp mô hình MLP + scaler, và hàm chạy dự đoán số ca sốt xuất huyết.
"""
import logging
import os

import joblib
import numpy as np

from app.config import MODEL_PATH, ORDERED_COLUMNS, SCALER_X_PATH, SCALER_Y_PATH
from app.state import state

logger = logging.getLogger(__name__)


def load_ml_artifacts():
    """Nạp model MLP và scaler vào state. Raise nếu thiếu file bắt buộc."""
    for label, path in [("Model", MODEL_PATH), ("Scaler X", SCALER_X_PATH)]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Không tìm thấy {label} tại: {path}")

    state.mlp_model = joblib.load(MODEL_PATH)
    state.scaler_X = joblib.load(SCALER_X_PATH)

    if os.path.exists(SCALER_Y_PATH):
        state.scaler_y = joblib.load(SCALER_Y_PATH)
        logger.info("✅ Đã nạp thành công model, scaler_X và scaler_y!")
    else:
        state.scaler_y = None
        logger.info("✅ Đã nạp thành công model và scaler_X (không tìm thấy scaler_y).")


def run_inference(feature_values: dict) -> int:
    """
    Chạy dự đoán số ca bệnh dựa trên các đặc trưng đầu vào.
    feature_values: dict chứa đủ các key trong ORDERED_COLUMNS
    """
    input_values = [feature_values[col] for col in ORDERED_COLUMNS]
    input_data = np.array([input_values])

    input_scaled = state.scaler_X.transform(input_data)
    prediction_scaled = state.mlp_model.predict(input_scaled)

    if state.scaler_y is not None:
        prediction_real = state.scaler_y.inverse_transform(prediction_scaled.reshape(-1, 1))
        predicted_cases = max(0, int(round(prediction_real[0][0])))
    else:
        predicted_cases = max(0, int(round(prediction_scaled[0])))

    return predicted_cases
