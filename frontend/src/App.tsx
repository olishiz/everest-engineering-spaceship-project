import {
  Activity, BedDouble, ChevronDown, CircleGauge, Cross, Crown, Database,
  Dumbbell, ExternalLink, Leaf, LockKeyhole, Radio, Rocket, Settings2,
  ShieldCheck, Sparkles, Utensils, X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DemoSpaceshipApi, HttpSpaceshipApi, type SpaceshipApi } from './api';
import type { AccessDecision, Passenger, ShipResource, Tier } from './types';

const iconMap = { sleep: BedDouble, food: Utensils, oxygen: Leaf, medical: Cross, cabin: Crown, recreation: Dumbbell };
const tierOrder: Tier[] = ['SILVER', 'GOLD', 'PLATINUM'];

function ShipVisual() {
  return (
    <div className="ship-stage" aria-label="Spaceship X26 in orbit">
      <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="planet" />
      <div className="ship">
        <div className="ship-glow" /><div className="ship-wing wing-left" /><div className="ship-wing wing-right" />
        <div className="ship-body">
          <div className="ship-cockpit" /><div className="ship-window window-one" />
          <div className="ship-window window-two" /><div className="ship-window window-three" />
          <span className="ship-mark">X26</span>
        </div>
        <div className="engine engine-left" /><div className="engine engine-right" />
      </div>
      <span className="coordinate coordinate-top">ORBIT 26.4°</span>
      <span className="coordinate coordinate-bottom">VELOCITY 7.62 KM/S</span>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  return <span className={`tier tier-${tier.toLowerCase()}`}>{tier}</span>;
}

function ApiDialog({ initialUrl, onClose, onConnect }: {
  initialUrl: string; onClose: () => void; onConnect: (url: string) => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="api-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="eyebrow"><Radio size={14} /> Live integration</div>
        <h2 id="api-dialog-title">Connect the existing API</h2>
        <p>Enter the public origin of the unchanged NestJS backend. The command deck will call its existing <code>/api</code> routes.</p>
        <label htmlFor="api-url">Backend origin</label>
        <input id="api-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://api.example.com" autoFocus />
        <div className="integration-flow"><span>Cloudflare UI</span><i /><span>NestJS API</span><i /><span>PostgreSQL</span></div>
        <div className="dialog-actions">
          <button className="button button-ghost" onClick={() => onConnect('')}>Use demo data</button>
          <button className="button button-primary" onClick={() => onConnect(url.trim())} disabled={!url.trim()}>
            Connect API <ExternalLink size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const storedUrl = localStorage.getItem('x26-api-url') ?? '';
  const [apiUrl, setApiUrl] = useState(storedUrl);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [resources, setResources] = useState<ShipResource[]>([]);
  const [history, setHistory] = useState<AccessDecision[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loadingId, setLoadingId] = useState('');
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [decision, setDecision] = useState<AccessDecision | null>(null);

  const api = useMemo<SpaceshipApi>(() => apiUrl ? new HttpSpaceshipApi(apiUrl) : new DemoSpaceshipApi(), [apiUrl]);
  const loadData = useCallback(async () => {
    setError('');
    try {
      const [nextPassengers, nextResources] = await Promise.all([api.getPassengers(), api.getResources()]);
      const passengerId = selectedId || nextPassengers[0]?.id || '';
      setPassengers(nextPassengers); setResources(nextResources); setSelectedId(passengerId);
      setHistory(await api.getHistory(passengerId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to reach the API.');
    }
  }, [api, selectedId]);

  useEffect(() => { void loadData(); }, [loadData]);
  const selectedPassenger = passengers.find((item) => item.id === selectedId);

  async function selectPassenger(id: string) {
    setSelectedId(id); setDecision(null); setHistory(await api.getHistory(id));
  }
  async function attempt(resource: ShipResource) {
    if (!selectedPassenger) return;
    setLoadingId(resource.id); setDecision(null); setError('');
    try {
      const result = await api.attemptAccess(selectedPassenger.id, resource.id);
      setDecision(result); setHistory((current) => [result, ...current.filter((item) => item.id !== result.id)]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Access attempt failed.');
    } finally { setLoadingId(''); }
  }
  function connect(url: string) {
    if (url) localStorage.setItem('x26-api-url', url); else localStorage.removeItem('x26-api-url');
    setApiUrl(url); setSelectedId(''); setDecision(null); setDialogOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark"><Rocket size={21} /></span><span>SPACESHIP <b>X26</b></span></a>
        <nav><a className="active" href="#command">Command</a><a href="#resources">Resources</a><a href="#activity">Activity</a></nav>
        <button className="api-status" onClick={() => setDialogOpen(true)}>
          <span className={apiUrl ? 'status-live' : ''} />{apiUrl ? 'LIVE API' : 'DEMO API'}<Settings2 size={15} />
        </button>
      </header>

      <main id="top">
        <section className="hero" id="command">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14} /> Passenger operations</div>
            <h1>One ship.<br /><em>Every resource</em><br />under control.</h1>
            <p>Membership-aware access, immutable audit trails and a calm command interface for the crew of Spaceship X26.</p>
            <div className="hero-metrics">
              <div><b>03</b><span>CREW LEADS</span></div>
              <div><b>{String(passengers.length).padStart(2, '0')}</b><span>PASSENGERS</span></div>
              <div><b>{String(resources.length).padStart(2, '0')}</b><span>RESOURCES</span></div>
            </div>
          </div>
          <ShipVisual />
        </section>

        <section className="command-strip">
          <div className="passenger-control">
            <span className="control-label">ACTIVE PASSENGER</span>
            <div className="select-wrap">
              <select value={selectedId} onChange={(event) => void selectPassenger(event.target.value)} aria-label="Active passenger">
                {passengers.map((passenger) => <option value={passenger.id} key={passenger.id}>{passenger.name}</option>)}
              </select><ChevronDown size={18} />
            </div>
            {selectedPassenger && <TierBadge tier={selectedPassenger.tier} />}
          </div>
          <div className="mission-status">
            <span><ShieldCheck size={16} /> Identity verified</span>
            <span><Database size={16} /> Audit recording</span>
            <span><CircleGauge size={16} /> Systems nominal</span>
          </div>
        </section>

        {error && <div className="error-banner"><strong>Connection issue.</strong> {error}{apiUrl && <button onClick={() => connect('')}>Return to demo</button>}</div>}
        {decision && (
          <section className={`decision-banner ${decision.outcome.toLowerCase()}`}>
            <div className="decision-icon">{decision.outcome === 'ALLOWED' ? <ShieldCheck /> : <LockKeyhole />}</div>
            <div><span>ACCESS {decision.outcome}</span><strong>{decision.resourceName}</strong></div>
            <p>{decision.reason.replaceAll('_', ' ')}</p>
            <button onClick={() => setDecision(null)} aria-label="Dismiss decision"><X /></button>
          </section>
        )}

        <section className="resource-section" id="resources">
          <div className="section-heading">
            <div><span className="section-number">01 / SHIP SERVICES</span><h2>Available resources</h2></div>
            <p>Select a module to validate the passenger’s membership and record the attempt.</p>
          </div>
          <div className="resource-grid">
            {resources.map((resource, index) => {
              const Icon = iconMap[resource.icon];
              const eligible = selectedPassenger && tierOrder.indexOf(selectedPassenger.tier) >= tierOrder.indexOf(resource.minimumTier);
              return (
                <article className="resource-card" key={resource.id}>
                  <div className="resource-topline"><span>MODULE {String(index + 1).padStart(2, '0')}</span><TierBadge tier={resource.minimumTier} /></div>
                  <div className="resource-icon"><Icon /></div>
                  <h3>{resource.name}</h3><p>{resource.description || 'Spaceship X26 passenger service.'}</p><span className="zone">{resource.zone}</span>
                  <button onClick={() => void attempt(resource)} disabled={loadingId === resource.id || !selectedPassenger}>
                    <span>{loadingId === resource.id ? 'VALIDATING…' : 'REQUEST ACCESS'}</span>
                    {eligible ? <ShieldCheck size={18} /> : <LockKeyhole size={18} />}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="activity-section" id="activity">
          <div className="section-heading">
            <div><span className="section-number">02 / AUDIT STREAM</span><h2>Recent activity</h2></div>
            <div className="recording"><span /> RECORDING EVERY DECISION</div>
          </div>
          <div className="activity-list">
            {history.length === 0 ? <div className="empty-state"><Activity /><span>No access attempts for this passenger yet.</span></div> :
              history.slice(0, 5).map((item) => (
                <div className="activity-row" key={item.id}>
                  <span className={`activity-outcome ${item.outcome.toLowerCase()}`}>{item.outcome === 'ALLOWED' ? <ShieldCheck /> : <LockKeyhole />}</span>
                  <div><strong>{item.resourceName}</strong><span>{item.reason.replaceAll('_', ' ')}</span></div>
                  <TierBadge tier={item.passengerTier} />
                  <time>{new Date(item.attemptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  <b>{item.outcome}</b>
                </div>
              ))}
          </div>
        </section>
      </main>
      <footer><span>SPACESHIP X26 · PASSENGER RESOURCE MANAGEMENT</span><span>MICRO-FRONTEND / REST API CONTRACT</span></footer>
      {dialogOpen && <ApiDialog initialUrl={apiUrl} onClose={() => setDialogOpen(false)} onConnect={connect} />}
    </div>
  );
}
