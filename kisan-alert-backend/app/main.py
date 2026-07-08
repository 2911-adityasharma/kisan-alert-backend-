from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.routers import whatsapp_webhook, escalations, recommend, auth, dashboard, chat, scan
from app.services.scheduler import check_and_alert, create_scheduler


# ── Lifespan: start/stop APScheduler alongside the FastAPI process ─────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.

    on startup  : create and start the APScheduler (every 6 h drought alert).
    on shutdown : gracefully stop the scheduler so in-flight jobs can finish.
    """
    # Ensure static directories exist
    os.makedirs("static/uploads", exist_ok=True)
    os.makedirs("static/assets", exist_ok=True)
    
    scheduler = create_scheduler()
    scheduler.start()
    app.state.scheduler = scheduler
    yield
    scheduler.shutdown(wait=False)


# ── Application factory ────────────────────────────────────────────────────────
app = FastAPI(
    title="Kisan Alert Backend",
    description="API for Kisan Alert farm monitoring and alert notification system",
    version="1.0.0",
    lifespan=lifespan,
)

# WARNING: CORS origins are read from the ALLOWED_ORIGINS environment variable
# (comma-separated list). In production on Railway, set this to your Vercel URL,
# e.g. ALLOWED_ORIGINS=https://your-app.vercel.app
# Falls back to permissive localhost origins for local development only.
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
if _raw_origins:
    _allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
else:
    _allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist at import time so StaticFiles doesn't raise error during initialization
os.makedirs("static/uploads", exist_ok=True)
os.makedirs("static/assets", exist_ok=True)

# ── Mount static files (uploads & assets) ────────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

# ── Include API routers ────────────────────────────────────────────────────────
app.include_router(whatsapp_webhook.router)
app.include_router(escalations.router)
app.include_router(recommend.router)
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(chat.router)
app.include_router(scan.router)



# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    """
    Simple health check endpoint to verify backend service status.
    """
    return {"status": "healthy"}


# ── Admin: on-demand alert trigger ────────────────────────────────────────────
@app.post(
    "/admin/trigger-alerts",
    tags=["Admin"],
    summary="Manually trigger the drought alert job",
    description=(
        "Runs check_and_alert() immediately without waiting for the next "
        "6-hour scheduler tick. Useful for demos and smoke-testing. "
        "Returns a per-plot summary of what was sent, skipped, or errored."
    ),
    response_class=JSONResponse,
)
async def trigger_alerts():
    """
    Run the drought-alert job on demand.

    Executes synchronously within the request so the caller receives the
    full per-plot result. For a fire-and-forget background variant, use
    BackgroundTasks (swap the implementation below if needed).
    """
    result = await check_and_alert()
    return result


# ── Serve React SPA Entry point ─────────────────────────────────────────────────
# These MUST be placed at the very end of main.py so they do not swallow REST APIs.
@app.get("/", tags=["Frontend"])
async def serve_index():
    """Serves the index.html of the compiled React frontend."""
    index_path = "static/index.html"
    if not os.path.exists(index_path):
        return JSONResponse(
            status_code=404,
            content={"detail": "Frontend build not found. Make sure Stage 1 built successfully."}
        )
    return FileResponse(index_path)


@app.get("/{catchall:path}", tags=["Frontend"])
async def serve_react_app(catchall: str):
    """
    Serves static files in the root folder (e.g., favicon.ico) or falls back
    to index.html for React Router client-side routing on page refresh.
    """
    # If file exists in static folder, serve it directly
    file_path = os.path.join("static", catchall)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    # Fallback to index.html for client-side routing
    index_path = "static/index.html"
    if not os.path.exists(index_path):
        return JSONResponse(
            status_code=404,
            content={"detail": "Frontend build not found. Make sure Stage 1 built successfully."}
        )
    return FileResponse(index_path)

