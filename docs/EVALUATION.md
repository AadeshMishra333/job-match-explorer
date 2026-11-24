# Fixed-case evaluation — 24 November 2026

Ten synthetic profile/job cases were written before the final local API check. Each asserts whether one sample job belongs in matches or exclusions. `tests/test_matching.py` runs these cases through the real HTTP endpoint.

| Case | Expected behavior | Observed locally |
|---|---|---|
| prefer-remote-keep-onsite | On-site internship stays visible for remote-preferred user | Matched |
| allow-onsite | Same job included when remote preference is off | Matched |
| hard-internship | Full-time ML role excluded for internships-only user | Excluded |
| allow-full-time | Same role included when internships-only is off | Matched |
| no-overlap | Design job excluded for Python-only user | Excluded |
| all-overlap | Remote product job included with all three listed skills | Matched |
| case-fold | Lowercase `python` matches `Python` in a role | Matched |
| empty-skills | No-skill profile excludes the sample product job | Excluded |
| remote-frontend | React profile includes remote frontend internship | Matched |
| hybrid-kept | Hybrid data internship stays visible with remote preference | Matched |

The separate ordering test checks the key preference rule: Cedar Systems' on-site internship matches more listed skills than a remote role, yet appears after that remote role when remote is preferred. See the latest test run and live browser check for observed results. These are behavior checks on synthetic examples, not evidence of real-world recommendation quality.

An observed stage 1 weakness was that jobs with no shared skill still appeared in the shortlist. The rule was changed to put them in exclusions and show “No listed skills overlap with your profile.” The `no-overlap` and `empty-skills` cases now guard that behavior. A remaining failure mode is **intent mismatch**: skill overlap alone can surface a design role for a software applicant who lists CSS. We would need an explicit role preference or labeled real-user judgments before claiming better ranking.
