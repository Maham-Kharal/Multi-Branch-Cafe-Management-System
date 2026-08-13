BRANCH_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "list_branches",
            "description": "Lists all active cafe branches or filters by location/city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "Optional city filter (e.g. 'Downtown', 'Westside')."}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "select_branch",
            "description": "Selects a specific cafe branch for ordering.",
            "parameters": {
                "type": "object",
                "properties": {
                    "branch_id": {"type": "string", "description": "The ID of the selected branch."}
                },
                "required": ["branch_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_branch",
            "description": "Creates a new cafe branch. RESTRICTED: Only Cafe Owners (CAFE_OWNER role) can create a new branch.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Name of the new branch."},
                    "address": {"type": "string", "description": "Physical address of the new branch."},
                    "phone": {"type": "string", "description": "Optional phone number."}
                },
                "required": ["name", "address"]
            }
        }
    }
]
