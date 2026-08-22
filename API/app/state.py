"""
state.py
Nơi giữ các đối tượng dùng chung xuyên suốt app (model, scaler, kết nối DB)
để tránh biến global rải rác khắp nơi.
"""


class AppState:
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self.history_collection = None
        self.weather_logs_collection = None

        self.mlp_model = None
        self.scaler_X = None
        self.scaler_y = None


state = AppState()
