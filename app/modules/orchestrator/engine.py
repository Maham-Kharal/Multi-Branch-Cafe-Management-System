import json
import re
import base64
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.modules.chat.voice_ai.groq_service import GroqService
from app.modules.chat.voice_ai.elevenlabs_service import ElevenLabsService

from app.modules.orchestrator.tools.menu_tool.definitions import MENU_TOOL_DEFINITIONS
from app.modules.orchestrator.tools.menu_tool.tool import execute_search_menu_items

from app.modules.orchestrator.tools.order_tool.definitions import ORDER_TOOL_DEFINITIONS
from app.modules.orchestrator.tools.order_tool.tool import execute_add_to_cart, execute_remove_from_cart, execute_check_order_status

from app.modules.orchestrator.tools.branch_tool.definitions import BRANCH_TOOL_DEFINITIONS
from app.modules.orchestrator.tools.branch_tool.tool import execute_list_branches, execute_select_branch, execute_create_branch

from app.modules.orchestrator.tools.payment_tool.definitions import PAYMENT_TOOL_DEFINITIONS
from app.modules.orchestrator.tools.payment_tool.tool import execute_calculate_order_total, execute_initiate_payment

from app.modules.chat.chat_messages.service import ChatMessageService

logger = logging.getLogger(__name__)


class OrchestratorEngine:
    """
    Supervisor AI Engine that aggregates domain tools, manages Groq LLM tool calls,
    executes Python tool functions, enforces role permissions, and generates voice responses.
    """

    @classmethod
    def get_all_tool_definitions(cls) -> List[Dict[str, Any]]:
        return (
            MENU_TOOL_DEFINITIONS +
            ORDER_TOOL_DEFINITIONS +
            BRANCH_TOOL_DEFINITIONS +
            PAYMENT_TOOL_DEFINITIONS
        )

    @classmethod
    def execute_tool_call(
        cls,
        db: Session,
        tool_name: str,
        tool_args: Dict[str, Any],
        user_role: str = "CUSTOMER",
        user_id: str = ""
    ) -> Dict[str, Any]:
        logger.info(f"Orchestrator Engine executing tool call: {tool_name} with args: {tool_args} (user_role={user_role})")
        
        if tool_name == "search_menu_items":
            return execute_search_menu_items(
                db,
                query=tool_args.get("query", ""),
                category=tool_args.get("category", ""),
                branch_id=tool_args.get("branch_id", ""),
                menu_type=tool_args.get("menu_type", "BRANCH")
            )
        elif tool_name == "add_to_cart":
            return execute_add_to_cart(
                db,
                items=tool_args.get("items", []),
                branch_id=tool_args.get("branch_id", "")
            )
        elif tool_name == "remove_from_cart":
            return execute_remove_from_cart(
                db,
                item_names=tool_args.get("item_names", []),
                branch_id=tool_args.get("branch_id", "")
            )
        elif tool_name == "check_order_status":
            return execute_check_order_status(
                db,
                order_id=tool_args.get("order_id", "")
            )
        elif tool_name == "list_branches":
            return execute_list_branches(
                db,
                city=tool_args.get("city", "")
            )
        elif tool_name == "select_branch":
            return execute_select_branch(
                db,
                branch_id=tool_args.get("branch_id", "")
            )
        elif tool_name == "create_branch":
            return execute_create_branch(
                db,
                user_role=user_role,
                user_id=user_id,
                name=tool_args.get("name", ""),
                address=tool_args.get("address", ""),
                phone=tool_args.get("phone", "")
            )
        elif tool_name == "calculate_order_total":
            return execute_calculate_order_total(
                db,
                subtotal=float(tool_args.get("subtotal", 0.0)),
                tax_rate=float(tool_args.get("tax_rate", 0.08)),
                tip_amount=float(tool_args.get("tip_amount", 0.0))
            )
        elif tool_name == "initiate_payment":
            return execute_initiate_payment(
                db,
                order_id=tool_args.get("order_id", ""),
                amount=float(tool_args.get("amount", 0.0)),
                payment_method=tool_args.get("payment_method", "CREDIT_CARD")
            )
        else:
            return {"error": f"Unknown tool name: {tool_name}"}

    @classmethod
    def clean_text_response(cls, text: str) -> str:
        """Strips out raw <function(...)> tags that Groq occasionally prints in dialogue."""
        if not text:
            return ""
        cleaned = re.sub(r'<function\(.*?\).*?</function>', '', text, flags=re.DOTALL)
        cleaned = re.sub(r'<function.*?>', '', cleaned, flags=re.DOTALL)
        return cleaned.strip()

    @classmethod
    def process_user_request(
        cls,
        db: Session,
        session_id: str,
        user_prompt: str,
        generate_voice: bool = False,
        user_role: str = "CUSTOMER",
        user_id: str = ""
    ) -> Dict[str, Any]:
        """
        Executes conversation turn with role checking and strict tool enforcement.
        """
        # Step 1: Save User Message
        user_msg = ChatMessageService.create_message(
            db,
            session_id=session_id,
            content=user_prompt,
            sender="USER"
        )

        # Step 2: Fetch Dialogue History (trimmed to last 10 messages)
        history_msgs = ChatMessageService.list_messages_for_session(db, session_id)
        recent_msgs = history_msgs[-10:] if len(history_msgs) > 10 else history_msgs
        groq_messages = []
        for m in recent_msgs:
            role = "user" if m.sender == "USER" else "assistant"
            cleaned_content = cls.clean_text_response(m.content)
            if cleaned_content:
                groq_messages.append({"role": role, "content": cleaned_content})

        tools = cls.get_all_tool_definitions()

        # Step 3: Call Groq API
        first_response = GroqService.generate_chat_completion(
            messages=groq_messages,
            tools=tools
        )

        final_text = first_response.get("content", "")
        tool_calls = first_response.get("tool_calls", [])
        executed_tool_data = []

        # Step 4: Execute Tool Calls if triggered
        if tool_calls:
            tool_messages = list(groq_messages)
            
            tool_messages.append({
                "role": "assistant",
                "content": final_text or None,
                "tool_calls": tool_calls
            })

            for tc in tool_calls:
                fn = tc.get("function", {})
                call_id = tc.get("id", "call_1")
                tool_name = fn.get("name", "")
                raw_args = fn.get("arguments", "{}")
                
                try:
                    args_dict = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                except Exception:
                    args_dict = {}

                tool_result = cls.execute_tool_call(db, tool_name, args_dict, user_role=user_role, user_id=user_id)
                executed_tool_data.append({
                    "tool_name": tool_name,
                    "arguments": args_dict,
                    "result": tool_result
                })

                tool_messages.append({
                    "role": "tool",
                    "tool_call_id": call_id,
                    "content": json.dumps(tool_result)
                })

            # Re-call Groq to synthesize final response
            second_response = GroqService.generate_chat_completion(
                messages=tool_messages
            )
            final_text = second_response.get("content") or final_text or "Processed request."

        # Clean text response of any leftover raw <function(...)> strings
        final_text = cls.clean_text_response(final_text)
        if not final_text:
            final_text = "I have processed your request."

        # Step 5: Generate Voice Audio if requested
        audio_base64 = None
        ai_metadata = {
            "tool_executions": executed_tool_data
        }
        
        if generate_voice and final_text:
            voice_res = ElevenLabsService.generate_speech(final_text)
            if voice_res.get("success") and voice_res.get("audio_bytes"):
                audio_bytes = voice_res.get("audio_bytes")
                audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
                ai_metadata["voice_info"] = {
                    "has_audio": True,
                    "voice_id": voice_res.get("voice_id"),
                    "model_used": voice_res.get("model_used")
                }

        # Step 6: Save AI Response Message
        ai_msg = ChatMessageService.create_message(
            db,
            session_id=session_id,
            content=final_text,
            sender="ASSISTANT",
            metadata_json=ai_metadata
        )

        return {
            "session_id": session_id,
            "user_message": user_msg,
            "assistant_message": ai_msg,
            "tool_executions": executed_tool_data,
            "final_text": final_text,
            "audio_base64": audio_base64
        }
