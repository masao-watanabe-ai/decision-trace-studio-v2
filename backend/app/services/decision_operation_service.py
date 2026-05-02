from app.repositories.flow_repository import FlowRepository
from app.repositories.simulation_repository import SimulationRepository
from app.repositories.suggestion_repository import SuggestionRepository
from app.repositories.trace_repository import TraceRepository
from app.schemas.decision_operation import DecisionOperationRequest, DecisionOperationResult
from app.schemas.suggestion import FromContextRequest
from app.services.simulation_service import SimulationService
from app.services.suggestion_service import SuggestionService


class DecisionOperationService:
    def __init__(
        self,
        flow_repo: FlowRepository,
        suggestion_repo: SuggestionRepository,
        trace_repo: TraceRepository,
        sim_repo: SimulationRepository,
    ) -> None:
        self._sugg = SuggestionService(flow_repo, trace_repo, suggestion_repo)
        self._sim = SimulationService(flow_repo, sim_repo, trace_repo)

    def run(self, project_id: str, req: DecisionOperationRequest) -> DecisionOperationResult:
        suggestion = self._sugg.from_context(
            project_id,
            FromContextRequest(
                intent=req.intent,
                if_condition=req.if_condition,
                then_adjustment=req.then_adjustment,
                because_reason=req.because_reason,
            ),
        )

        applied = False
        simulation_run = None

        if req.auto_apply:
            suggestion = self._sugg.accept(suggestion.id)
            applied = suggestion.applied_to_flow

            if req.auto_simulate and applied:
                scenarios = self._sim.generate_scenarios(project_id)
                simulation_run = self._sim.run_simulation(project_id, scenarios)

        return DecisionOperationResult(
            suggestion=suggestion,
            applied=applied,
            simulation_run=simulation_run,
        )
