# Job Match Explorer

A small, explainable candidate-to-job matching demo built for learning. It uses **12 invented job postings** and a deterministic baseline. It does not read live vacancies, use an LLM, predict hiring outcomes, or represent Elip's product.

## What the demo does

Enter comma-separated skills and choose hard dealbreakers. The React page sends a profile to `POST /api/matches`. FastAPI first excludes roles that violate remote-only or internships-only rules, then excludes roles with no listed skill overlap. It ranks the remaining roles by number of shared skills (ties by title and ID) and returns the exact shared/missing skills used to assemble each reason. The browser renders a shortlist and a separate excluded list.

For example, start with **Product builder** (`Python, React`, remote only, internships only). Cedar Systems' on-site internship is excluded despite matching both skills. Uncheck remote only; the API now includes it. This is a hard dealbreaker. A future “remote preferred” option could instead keep it and lower its rank.

## Run locally

Requirements: Node 20.19+ and Python 3.11+.

```sh
npm ci
npm run build
python -m venv .venv
# Activate the virtual environment for your shell, then:
pip install -r requirements-dev.txt
pytest -q
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/`. The API health check is `/api/health`; interactive API docs are at `/docs`. The built frontend is served by the same FastAPI process, so a separate Vite development server is unnecessary for the demo. Re-run `npm run build` after frontend edits.

## Architecture

```text
React profile state (src/App.jsx)
    → POST /api/matches
    → input validation (app/matching.py Profile)
    → hard filters → skill overlap → stable ordering → field-backed reasons
    → React match and exclusion cards
```

`data/jobs.json` is the single source of sample job data. `data/evaluation_cases.json` contains ten fixed expected inclusion/exclusion cases, checked by `tests/test_matching.py`. The API test suite also checks filter precedence, repeatable ordering, reason fields, invalid input, health and frontend serving. See [the evaluation notes](docs/EVALUATION.md).

## Deployment

`Dockerfile` builds the React frontend with Node, installs FastAPI in a Python image, and serves both on one port. `render.yaml` requests a free Docker web service with `/api/health` as its health path. For a live URL, connect this repository to Render and select the Free plan. Free instances can spin down when idle, so the first visit may take longer. No user data is stored; profile input is only processed for the response.

## Limits and contribution record

- Keyword overlap misses synonyms and job intent. A person with `CSS` may see a design role even if they want software engineering. The score is a transparent toy heuristic, never a hiring probability.
- All listings are synthetic; no live feed, scraping, semantic search, RAG, LLM agent, persistence, authentication, or real-user quality measurement is claimed.
- Codex implemented the frontend, backend, tests and deployment preparation on 24 November 2026 after Aadesh requested a running demo. The previous stage 1 React preview was also Codex-built. Aadesh predicted that an on-site role should rank lower under “remote only”; we clarified that this describes a separate soft “remote preferred” rule. His own code change and end-to-end explanation remain unobserved. The CV should identify the artifact as AI-assisted rather than imply independent authorship.
