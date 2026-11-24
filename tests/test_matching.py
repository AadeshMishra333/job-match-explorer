import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.matching import JOBS, Profile, rank_jobs

client = TestClient(app)
cases = json.loads((Path(__file__).resolve().parents[1] / "data" / "evaluation_cases.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", cases, ids=lambda case: case["id"])
def test_fixed_evaluation_case(case):
    response = client.post("/api/matches", json={key: case[key] for key in ("skills", "remote_preferred", "internships_only")})
    assert response.status_code == 200
    result = response.json()
    actual = "matched" if any(job["id"] == case["job_id"] for job in result["matched"]) else "excluded"
    assert actual == case["expected"]
    assert result["jobCount"] == len(JOBS)


def test_remote_preference_keeps_onsite_but_ranks_it_after_remote():
    result = rank_jobs(Profile(skills=["Python", "React", "JavaScript"], remote_preferred=True))
    matched = result["matched"]
    onsite_index = next(index for index, job in enumerate(matched) if job["id"] == "onsite-swe-intern")
    remote_index = next(index for index, job in enumerate(matched) if job["id"] == "remote-frontend-intern")
    assert matched[onsite_index]["score"] > matched[remote_index]["score"]
    assert onsite_index > remote_index
    assert "stays visible below remote roles" in matched[onsite_index]["reason"]


def test_reason_uses_only_actual_job_skills_and_ties_are_deterministic():
    profile = Profile(skills=["Python", "React"])
    first = rank_jobs(profile)["matched"]
    second = rank_jobs(profile)["matched"]
    assert [job["id"] for job in first] == [job["id"] for job in second]
    for job in first:
        assert set(job["overlap"]) <= set(job["skills"])
        assert all(skill in job["reason"] for skill in job["overlap"])


def test_invalid_skill_is_rejected():
    response = client.post("/api/matches", json={"skills": [" "], "remote_preferred": False})
    assert response.status_code == 422


def test_health_and_frontend():
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/").status_code == 200
