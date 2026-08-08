from sqlalchemy.orm import Session
from .models import NotificationModel

def create_system_notification(
    db: Session, 
    project_id: int, 
    notif_type: str, 
    message: str, 
    user_id: int = None, 
    recipient_role: str = None
):
    """
    Creates a notification in the database.
    Types: weather, risk, suitability, system
    """
    notif = NotificationModel(
        project_id=project_id,
        type=notif_type,
        message=message,
        user_id=user_id,
        recipient_role=recipient_role
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def evaluate_site_hazards_and_trigger_alerts(db: Session, site_id: int, project_id: int, env_data: dict, suitability_score: float):
    """
    Evaluates environmental and geographic conditions to auto-generate warning alerts.
    """
    env = env_data["environmental"]
    infra = env_data["infrastructure"]
    
    # 1. Protected zone check
    if infra["in_protected_zone"]:
        create_system_notification(
            db, project_id, "risk",
            f"CRITICAL: Site intersects a Protected Zone. Legal development is restricted."
        )
        
    # 2. Steep slope check
    if env["land_slope"] > 15.0:
        create_system_notification(
            db, project_id, "risk",
            f"WARNING: High land slope ({env['land_slope']}°) detected. Increases civil engineering and mounting costs."
        )
        
    # 3. High wind/weather risk
    if env["wind_speed"] > 10.0:
        create_system_notification(
            db, project_id, "weather",
            f"ALERT: Severe wind speeds (>10 m/s average) modeled. Turbines must support IEC Class I cut-out ratings."
        )
        
    # 4. Grid distance alert
    if infra["distance_to_transmission"] > 8.0:
        create_system_notification(
            db, project_id, "system",
            f"INFO: Grid transmission lines are remote ({infra['distance_to_transmission']} km away). Interconnection CAPEX will be significant."
        )
        
    # 5. High cloud cover alert for solar
    if env["cloud_cover"] > 45.0:
        create_system_notification(
            db, project_id, "weather",
            f"WARNING: Heavy seasonal cloud cover ({env['cloud_cover']}%) may reduce expected annual solar efficiency."
        )
        
    # 6. High suitability notification
    if suitability_score >= 80.0:
        create_system_notification(
            db, project_id, "suitability",
            f"EXCELLENT: Site score is {suitability_score}. Highly recommended for deployment planning."
        )
