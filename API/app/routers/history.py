"""
routers/history.py
Endpoint tra cứu lịch sử dự báo và thống kê dashboard.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException

from API.app.state import state

router = APIRouter(tags=["History"])


@router.get("/get-history/{zone_name}")
def get_history(zone_name: str):
    try:
        cursor = state.history_collection.find({"zone_name": zone_name}) \
            .sort("timestamp", -1).limit(20)
        history = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            history.append(doc)
        return {"zone": zone_name, "total_records": len(history), "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi truy xuất lịch sử: {str(e)}")


@router.get("/get-history-by-date/{zone_name}")
def get_history_by_date(
    zone_name: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50,
):
    try:
        if end_date is None:
            end_date = datetime.now().strftime("%Y-%m-%d")
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)

        cursor = state.history_collection.find({
            "zone_name": zone_name,
            "timestamp": {"$gte": start_dt, "$lt": end_dt},
        }).sort("timestamp", -1).limit(limit)

        history = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "timestamp" in doc:
                doc["timestamp"] = doc["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
            history.append(doc)

        return {
            "zone": zone_name,
            "period": {"start_date": start_date, "end_date": end_date},
            "total_records": len(history),
            "history": history,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi truy xuất lịch sử: {str(e)}")


@router.get("/dashboard-stats")
def get_dashboard_stats():
    try:
        total_predictions = state.history_collection.count_documents({})
        zones = state.history_collection.distinct("zone_name")

        latest_per_zone = []
        for zone in zones:
            latest = state.history_collection.find_one(
                {"zone_name": zone}, sort=[("timestamp", -1)]
            )
            if latest:
                latest["_id"] = str(latest["_id"])
                if "timestamp" in latest:
                    latest["timestamp"] = latest["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
                latest_per_zone.append(latest)

        return {
            "total_predictions": total_predictions,
            "total_zones": len(zones),
            "zones": zones,
            "latest_predictions": latest_per_zone,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy thống kê: {str(e)}")
