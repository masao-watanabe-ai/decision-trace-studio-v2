from fastapi import APIRouter

from app.repositories.flow_repository import FlowRepository
from app.repositories.simulation_repository import SimulationRepository
from app.repositories.suggestion_repository import SuggestionRepository
from app.repositories.trace_repository import TraceRepository
from app.schemas.decision_operation import DecisionOperationRequest, DecisionOperationResult
from app.services.decision_operation_service import DecisionOperationService

router = APIRouter(tags=["decision_operation"])


def _get_service() -> DecisionOperationService:
    return DecisionOperationService(
        FlowRepository(),
        SuggestionRepository(),
        TraceRepository(),
        SimulationRepository(),
    )


@router.post(
    "/api/projects/{project_id}/decision-operation",
    response_model=DecisionOperationResult,
    status_code=201,
)
def run_decision_operation(
    project_id: str,
    body: DecisionOperationRequest,
) -> DecisionOperationResult:
    return _get_service().run(project_id, body)
