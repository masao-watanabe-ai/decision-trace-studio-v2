from uuid import uuid4

from app.engines import suggestion_engine
from app.repositories.flow_repository import FlowRepository
from app.repositories.suggestion_repository import SuggestionRepository
from app.repositories.trace_repository import TraceRepository
from app.schemas.flow import FlowNode, FlowUpdate
from app.schemas.suggestion import FromContextRequest, Suggestion


def _apply_to_flow(suggestion: Suggestion, flow_repo: FlowRepository) -> bool:
    """Mutate the current flow based on suggestion. Returns True when flow was changed."""
    if suggestion.type not in ("boundary_add", "context_node_add", "priority_adjust"):
        return False

    flow = flow_repo.get_current_by_project(suggestion.project_id)

    if suggestion.type in ("boundary_add", "context_node_add"):
        max_y = max((n.position["y"] for n in flow.nodes), default=0)
        label = (
            suggestion.proposed_label
            or (suggestion.proposed_condition or "New Condition")[:40]
        )
        node_type = suggestion.proposed_node_type or "boundary"
        new_node = FlowNode(
            id=f"node-{uuid4().hex[:8]}",
            type=node_type,
            data={"label": label},
            position={"x": 200, "y": max_y + 125},
            condition=suggestion.proposed_condition or "",
            action=suggestion.proposed_action or "auto_reply",
            priority=(
                suggestion.proposed_priority
                if suggestion.proposed_priority is not None
                else 50
            ),
        )
        flow_repo.update(
            flow.id,
            FlowUpdate(nodes=list(flow.nodes) + [new_node], edges=flow.edges),
        )
        return True

    if suggestion.type == "priority_adjust" and suggestion.target_node_id:
        new_priority = suggestion.proposed_priority
        if new_priority is None:
            return False
        updated_nodes = [
            n.model_copy(update={"priority": new_priority})
            if n.id == suggestion.target_node_id
            else n
            for n in flow.nodes
        ]
        flow_repo.update(
            flow.id,
            FlowUpdate(nodes=updated_nodes, edges=flow.edges),
        )
        return True

    return False


class SuggestionService:
    def __init__(
        self,
        flow_repo: FlowRepository,
        trace_repo: TraceRepository,
        suggestion_repo: SuggestionRepository,
    ) -> None:
        self.flow_repo = flow_repo
        self.trace_repo = trace_repo
        self.suggestion_repo = suggestion_repo

    def generate(self, project_id: str, additional_context=None) -> list[Suggestion]:
        flow = self.flow_repo.get_current_by_project(project_id)
        traces = self.trace_repo.list_by_project(project_id)
        suggestions = suggestion_engine.analyze(project_id, flow, traces)
        self.suggestion_repo.save_many(suggestions)
        return suggestions

    def list_suggestions(self, project_id: str) -> list[Suggestion]:
        return self.suggestion_repo.list_by_project(project_id)

    def accept(self, suggestion_id: str) -> Suggestion:
        suggestion = self.suggestion_repo.get(suggestion_id)
        applied = _apply_to_flow(suggestion, self.flow_repo)
        return self.suggestion_repo.update_status(
            suggestion_id, "accepted", applied_to_flow=applied
        )

    def reject(self, suggestion_id: str) -> Suggestion:
        return self.suggestion_repo.update_status(suggestion_id, "rejected")

    def from_context(self, project_id: str, req: FromContextRequest) -> Suggestion:
        label = req.intent[:40] if req.intent else "Context Node"
        suggestion = Suggestion(
            id=str(uuid4()),
            project_id=project_id,
            type="context_node_add",
            target_node_id=None,
            proposed_node_type="decision",
            proposed_label=label,
            proposed_condition=req.if_condition,
            proposed_action=req.then_adjustment,
            proposed_priority=50,
            reason=f"[Context] {req.intent}",
            impact=req.because_reason,
        )
        self.suggestion_repo.save_many([suggestion])
        return suggestion
