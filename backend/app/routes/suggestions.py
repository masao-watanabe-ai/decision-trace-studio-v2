from fastapi import APIRouter, HTTPException
from app.repositories.flow_repository import FlowRepository
from app.repositories.suggestion_repository import SuggestionRepository
from app.repositories.trace_repository import TraceRepository
from app.schemas.suggestion import FromContextRequest, GenerateSuggestionsRequest, Suggestion
from app.services.suggestion_service import SuggestionService

router = APIRouter(tags=["suggestions"])


def _get_service() -> SuggestionService:
    return SuggestionService(FlowRepository(), TraceRepository(), SuggestionRepository())


@router.post(
    "/api/projects/{project_id}/suggestions/generate",
    response_model=list[Suggestion],
    status_code=201,
)
def generate_suggestions(
    project_id: str,
    body: GenerateSuggestionsRequest | None = None,
) -> list[Suggestion]:
    ctx = body.additional_context if body else None
    return _get_service().generate(project_id, ctx)


@router.post(
    "/api/projects/{project_id}/suggestions/from-context",
    response_model=Suggestion,
    status_code=201,
)
def create_suggestion_from_context(
    project_id: str,
    body: FromContextRequest,
) -> Suggestion:
    return _get_service().from_context(project_id, body)


@router.get(
    "/api/projects/{project_id}/suggestions",
    response_model=list[Suggestion],
)
def list_suggestions(project_id: str) -> list[Suggestion]:
    return _get_service().list_suggestions(project_id)


@router.post(
    "/api/suggestions/{suggestion_id}/accept",
    response_model=Suggestion,
)
def accept_suggestion(suggestion_id: str) -> Suggestion:
    try:
        return _get_service().accept(suggestion_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/api/suggestions/{suggestion_id}/reject",
    response_model=Suggestion,
)
def reject_suggestion(suggestion_id: str) -> Suggestion:
    try:
        return _get_service().reject(suggestion_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
