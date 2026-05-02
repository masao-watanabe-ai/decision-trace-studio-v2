from pydantic import BaseModel

from app.schemas.simulation import SimulationRun
from app.schemas.suggestion import Suggestion


class DecisionOperationRequest(BaseModel):
    intent: str
    if_condition: str
    then_adjustment: str
    because_reason: str
    auto_apply: bool = False
    auto_simulate: bool = False


class DecisionOperationResult(BaseModel):
    suggestion: Suggestion
    applied: bool
    simulation_run: SimulationRun | None = None
