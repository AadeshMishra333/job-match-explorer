import React, { useEffect, useState } from 'react';
import { presets } from './jobs.js';

const initialProfile = { ...presets.product };

function JobCard({ job, excluded = false }) {
  return (
    <article className={`job-card ${excluded ? 'job-card--excluded' : ''}`}>
      <div className="job-card__top">
        <div>
          <p className="job-card__company">{job.company}</p>
          <h3>{job.title}</h3>
        </div>
        <span className={`status ${excluded ? 'status--excluded' : 'status--match'}`}>
          {excluded ? 'Excluded' : `${job.score} skill${job.score === 1 ? '' : 's'} matched`}
        </span>
      </div>
      <p className="job-card__summary">{job.summary}</p>
      <div className="job-card__meta">
        <span>{job.location}</span><span>{job.type === 'internship' ? 'Internship' : 'Full-time'}</span>
      </div>
      {!excluded && (
        <div className="skill-list" aria-label="Role skills">
          {job.skills.map((skill) => (
            <span className={`skill ${job.overlap.includes(skill) ? 'skill--matched' : ''}`} key={skill}>{skill}</span>
          ))}
        </div>
      )}
      <p className={`reason ${excluded ? 'reason--excluded' : ''}`}>
        <strong>{excluded ? 'Why excluded:' : 'Why it appears:'}</strong> {excluded ? job.excludedReason : job.reason}
      </p>
    </article>
  );
}

export default function App() {
  const [profile, setProfile] = useState(initialProfile);
  const [activePreset, setActivePreset] = useState('product');
  const [results, setResults] = useState({ matched: [], excluded: [], jobCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { matched, excluded, jobCount } = results;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skills: profile.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
            remote_preferred: profile.remotePreferred,
            internships_only: profile.internshipsOnly,
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Match request failed (${response.status})`);
        setResults(await response.json());
        setLoading(false);
      } catch (cause) {
        if (cause.name !== 'AbortError') {
          setError('Could not load matches. Check that the API is running and try changing a preference.');
          setLoading(false);
        }
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [profile]);

  function setField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setActivePreset(null);
  }

  function usePreset(name) {
    setProfile({ ...presets[name] });
    setActivePreset(name);
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="brand"><span className="brand-mark">↗</span><span>Job Match <b>Explorer</b></span></div>
        <span className="header-note">A small matching lab · synthetic jobs</span>
      </header>

      <main>
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">See the decision, not just the list</p>
            <h1 id="page-title">Find roles that fit <em>your rules.</em></h1>
            <p>Choose skills and preferences. Every result tells you why it appeared—or why it was left out.</p>
          </div>
          <div className="hero-step" aria-label="How this preview works">
            <span>01 / Edit your profile</span><span>02 / Review matches</span><span>03 / Inspect exclusions</span>
          </div>
        </section>

        <div className="workspace">
          <aside className="profile-panel" aria-labelledby="profile-heading">
            <div className="panel-heading"><span className="section-kicker">YOUR INPUT</span><h2 id="profile-heading">Your preferences</h2><p>Start with a sample profile, then make it yours.</p></div>
            <div className="preset-row" role="group" aria-label="Sample profiles">
              {Object.entries(presets).map(([name, preset]) => (
                <button className={`preset ${activePreset === name ? 'preset--active' : ''}`} key={name} type="button" onClick={() => usePreset(name)} aria-pressed={activePreset === name}>{preset.label}</button>
              ))}
            </div>
            <label className="field-label" htmlFor="skills">Skills <span>separate with commas</span></label>
            <input id="skills" type="text" value={profile.skills} onChange={(event) => setField('skills', event.target.value)} placeholder="Python, React, SQL" />
            <fieldset className="checks"><legend>Preferences and filters</legend>
              <label className="check-row"><input type="checkbox" checked={profile.remotePreferred} onChange={(event) => setField('remotePreferred', event.target.checked)} /><span><strong>Prefer remote</strong><small>Keep other roles, but rank them below remote roles</small></span></label>
              <label className="check-row"><input type="checkbox" checked={profile.internshipsOnly} onChange={(event) => setField('internshipsOnly', event.target.checked)} /><span><strong>Internships only</strong><small>Hide full-time roles</small></span></label>
            </fieldset>
            <p className="panel-footnote">This demo uses an API and invented jobs, not open applications.</p>
          </aside>

          <div className="results" aria-live="polite">
            <section aria-labelledby="matches-heading">
              <div className="results-heading"><div><span className="section-kicker">SHORTLIST · {jobCount || 12} SAMPLE ROLES</span><h2 id="matches-heading">Your matches <span className="count">{matched.length}</span></h2></div><p>{profile.remotePreferred ? 'Remote first, then listed skill overlap' : 'Ordered by listed skill overlap'}</p></div>
              {error ? <div className="empty-state" role="alert"><h3>Matches unavailable</h3><p>{error}</p></div> : loading ? <p className="quiet-state">Checking your preferences…</p> : matched.length ? <div className="card-list">{matched.map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="empty-state"><h3>No matches with these rules</h3><p>Add a skill or loosen a dealbreaker to see more sample jobs.</p></div>}
            </section>
            <section className="excluded-section" aria-labelledby="excluded-heading">
              <div className="results-heading"><div><span className="section-kicker">TRANSPARENCY</span><h2 id="excluded-heading">Excluded roles <span className="count count--muted">{excluded.length}</span></h2></div></div>
              {!loading && !error && (excluded.length ? <div className="card-list">{excluded.map((job) => <JobCard key={job.id} job={job} excluded />)}</div> : <p className="quiet-state">No sample roles are excluded by your current rules.</p>)}
            </section>
          </div>
        </div>
      </main>
      <footer>Job Match Explorer · Synthetic job data · Deterministic rules, no AI scoring or live vacancies</footer>
    </div>
  );
}
