from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .matching import Profile, rank_jobs

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
app = FastAPI(title="Job Match Explorer", version="0.2.0")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/matches")
def matches(profile: Profile):
    return rank_jobs(profile)


if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/", include_in_schema=False)
    def frontend():
        return FileResponse(DIST / "index.html")
