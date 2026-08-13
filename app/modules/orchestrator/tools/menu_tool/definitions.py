MENU_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_menu_items",
            "description": "Searches for cafe menu items in branch menus or master catalog. Call this tool whenever a customer asks to see the branch menu, catalog menu, menu items, prices, or item availability.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Optional search term for item name (e.g., 'Ramen', 'coffee', 'pink tea')."
                    },
                    "category": {
                        "type": "string",
                        "description": "Optional category filter (e.g., 'Hot food', 'Hot drink', 'Beverages')."
                    },
                    "branch_id": {
                        "type": "string",
                        "description": "Optional branch ID or branch name to query a specific branch menu."
                    },
                    "menu_type": {
                        "type": "string",
                        "description": "Set to 'BRANCH' to search branch menus, or 'CATALOG' for master menu catalog. Defaults to 'BRANCH'."
                    }
                },
                "required": []
            }
        }
    }
]
