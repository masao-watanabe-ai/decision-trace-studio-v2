from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import decision_operation, flows, projects, simulations, suggestions, traces

app = FastAPI(title="Decision Trace Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(flows.router)
app.include_router(simulations.router)
app.include_router(traces.router)
app.include_router(suggestions.router)
app.include_router(decision_operation.router)
