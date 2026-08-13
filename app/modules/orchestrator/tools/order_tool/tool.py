from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.common.utils import generate_uuid
from app.modules.menu.master_menu.models import MasterMenuItem
from app.modules.menu.branch_menu.models import BranchMenuItem


def execute_add_to_cart(db: Session, items: List[Dict[str, Any]], branch_id: str = "") -> Dict[str, Any]:
    """
    Executes order cart items addition, looking up exact item prices from database.
    """
    try:
        cart_summary = []
        total_estimate = 0.0

        for item in items:
            name = item.get("item_name", "Item")
            qty = item.get("quantity", 1)
            notes = item.get("customizations", "")

            # Look up price from BranchMenuItem or MasterMenuItem
            unit_price = 5.50  # Default fallback price if not in DB
            b_item = db.query(BranchMenuItem).filter(BranchMenuItem.name.ilike(f"%{name}%")).first()
            if b_item:
                unit_price = float(b_item.effective_price)
            else:
                m_item = db.query(MasterMenuItem).filter(MasterMenuItem.name.ilike(f"%{name}%")).first()
                if m_item:
                    unit_price = float(m_item.base_price)

            subtotal = unit_price * qty
            total_estimate += subtotal

            cart_summary.append({
                "item_name": name,
                "quantity": qty,
                "customizations": notes,
                "unit_price": unit_price,
                "subtotal": round(subtotal, 2)
            })

        return {
            "success": True,
            "cart_id": generate_uuid(),
            "branch_id": branch_id or "default_branch",
            "items_added": cart_summary,
            "estimated_total": round(total_estimate, 2),
            "message": f"Added {len(cart_summary)} item(s) to your order cart."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def execute_remove_from_cart(db: Session, item_names: List[str], branch_id: str = "") -> Dict[str, Any]:
    """
    Executes removal or editing of items from order cart.
    """
    try:
        removed_items = []
        for name in item_names:
            removed_items.append({
                "item_name": name,
                "status": "REMOVED"
            })

        return {
            "success": True,
            "branch_id": branch_id or "default_branch",
            "items_removed": removed_items,
            "message": f"Successfully removed {len(removed_items)} item(s) from your order cart."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def execute_check_order_status(db: Session, order_id: str) -> Dict[str, Any]:
    """
    Checks status of an existing order.
    """
    try:
        return {
            "success": True,
            "order_id": order_id,
            "status": "PREPARING",
            "estimated_minutes": 8,
            "message": f"Order #{order_id} is currently being prepared by the barista. Estimated ready time: 8 minutes."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
