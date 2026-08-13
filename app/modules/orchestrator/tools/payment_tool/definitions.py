PAYMENT_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "calculate_order_total",
            "description": "Calculates tax, tip, and total final price for an order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "subtotal": {"type": "number", "description": "The cart items subtotal amount."},
                    "tax_rate": {"type": "number", "description": "Optional tax rate percentage (default 0.08)."},
                    "tip_amount": {"type": "number", "description": "Optional tip amount."}
                },
                "required": ["subtotal"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "initiate_payment",
            "description": "Initiates payment checkout for an order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "The ID of the order to pay."},
                    "amount": {"type": "number", "description": "The total amount to charge."},
                    "payment_method": {"type": "string", "description": "Payment method (CREDIT_CARD, APPLE_PAY, CASH)."}
                },
                "required": ["order_id", "amount"]
            }
        }
    }
]
