ORDER_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "add_to_cart",
            "description": "Adds items to customer order cart with quantity and optional notes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "item_name": {"type": "string", "description": "Name of the cafe menu item."},
                                "quantity": {"type": "integer", "description": "Quantity to add (default 1)."},
                                "customizations": {"type": "string", "description": "Notes (e.g. 'extra hot', 'oat milk')."}
                            },
                            "required": ["item_name"]
                        }
                    },
                    "branch_id": {"type": "string", "description": "Selected branch ID."}
                },
                "required": ["items"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "remove_from_cart",
            "description": "Removes or edits items in the customer's order cart when a user wants to cancel, edit, or remove items.",
            "parameters": {
                "type": "object",
                "properties": {
                    "item_names": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of item names to remove or edit from the cart (e.g. ['caramel mocca'])."
                    },
                    "branch_id": {"type": "string", "description": "Selected branch ID."}
                },
                "required": ["item_names"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_order_status",
            "description": "Checks the status of an existing customer order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "The ID of the order to check."}
                },
                "required": ["order_id"]
            }
        }
    }
]
