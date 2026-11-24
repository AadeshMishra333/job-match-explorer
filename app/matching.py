"""Small deterministic baseline; scores are never hiring probabilities."""

import json
from pathlib import Path

from pydantic import BaseModel, Field, field_validator

JOBS_PATH = Path(__file__).resolve().parents[1] / "data" / "jobs.json"
JOBS = json.loads(JOBS_PATH.read_text(encoding="utf-8"))


class Profile(BaseModel):
    skills: list[str] = Field(default_factory=list, max_length=30)
    remote_preferred: bool = False
    internships_only: bool = False

    @field_validator("skills")
    @classmethod
    def clean_skills(cls, skills: list[str]) -> list[str]:
        seen = set()
        cleaned = []
        for raw in skills:
            skill = raw.strip()
            if not skill or len(skill) > 60:
                raise ValueError("Each skill must contain 1–60 characters")
            key = skill.casefold()
            if key not in seen:
                seen.add(key)
                cleaned.append(skill)
        return cleaned


def rank_jobs(profile: Profile, jobs: list[dict] = JOBS) -> dict:
    """Filter internships and skill gaps, then apply the optional remote preference."""
    wanted = {skill.casefold() for skill in profile.skills}
    matched, excluded = [], []
    for job in jobs:
        if profile.internships_only and job["type"] != "internship":
            excluded.append({**job, "excludedReason": "This is a full-time role; you selected internships only."})
            continue
        overlap = [skill for skill in job["skills"] if skill.casefold() in wanted]
        if not overlap:
            excluded.append({**job, "excludedReason": "No listed skills overlap with your profile."})
            continue
        missing = [skill for skill in job["skills"] if skill.casefold() not in wanted]
        reason = f'Matches {", ".join(overlap)} from your skills'
        reason += f'; you could explore {", ".join(missing)}.' if missing else '; all listed skills match.'
        if profile.remote_preferred:
            reason += " Remote preference: this role is remote." if job["mode"] == "remote" else f' Remote preference: this {job["mode"]} role stays visible below remote roles.'
        matched.append({**job, "overlap": overlap, "missing": missing, "score": len(overlap), "reason": reason})
    matched.sort(key=lambda job: (
        job["mode"] != "remote" if profile.remote_preferred else False,
        -job["score"], job["title"].casefold(), job["id"],
    ))
    return {"matched": matched, "excluded": excluded, "jobCount": len(jobs)}
