'use client';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  ArrowUpRight,
  Bone,
  ChevronRight,
  Info,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scan,
  Focus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SkeletonScene from './skeleton-scene';
import {
  initialState,
  regions,
  type View,
  type RegionId,
} from './skeleton-state';
const views: { id: View; label: string }[] = [
  { id: 'three-quarter', label: '¾' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
  { id: 'back', label: 'Back' },
];
export default function Home() {
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [info, setInfo] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback((message: string) => setError(message), []);
  const region = regions.find((r) => r.id === state.region)!;
  const reset = () =>
    setState((s) => ({ ...initialState, reset: s.reset + 1 }));
  const focus = (id: RegionId) =>
    setState((s) => ({ ...s, region: id, rotate: false, reset: s.reset + 1 }));
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: object,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'focus_chimp_skeleton',
            title: 'Focus chimp skeleton',
            description:
              'Move the skeleton camera to a region and viewing angle. Does not isolate or alter bones.',
            inputSchema: {
              type: 'object',
              properties: {
                region: { type: 'string', enum: regions.map((r) => r.id) },
                view: { type: 'string', enum: views.map((v) => v.id) },
              },
              required: ['region'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input: unknown) {
              if (!input || typeof input !== 'object' || Array.isArray(input))
                throw new Error('Expected camera options.');
              const value = input as Record<string, unknown>;
              if (
                Object.keys(value).some(
                  (key) => key !== 'region' && key !== 'view',
                ) ||
                !regions.some((r) => r.id === value.region) ||
                (value.view !== undefined &&
                  !views.some((v) => v.id === value.view))
              )
                throw new Error('Unknown skeleton region or camera angle.');
              flushSync(() =>
                setState((s) => ({
                  ...s,
                  region: value.region as RegionId,
                  view: (value.view as View) || 'three-quarter',
                  rotate: false,
                })),
              );
              return {
                region: value.region,
                view: value.view || 'three-quarter',
                action: 'camera focus',
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Optional browser capability. */
    }
    return () => lifecycle.abort();
  }, []);
  return (
    <main className="studio">
      <SkeletonScene
        key={attempt}
        state={state}
        onReady={onReady}
        onError={onError}
      />
      <div className="vignette" aria-hidden="true" />
      <header className="identity">
        <div className="eyebrow">
          <span className="status-dot" /> ANATOMY EXPLORER
        </div>
        <h1>
          Chimp Atlas <span>3D</span>
        </h1>
        <p>
          <i>Pan troglodytes</i>
          <span> / </span>Skeleton
        </p>
      </header>
      <button
        className="info-button glass"
        aria-label="About the skeleton and sources"
        onClick={() => setInfo(true)}
      >
        <Info size={18} />
        <span>About</span>
      </button>
      <section
        className="regions-panel glass"
        aria-label="Focus the camera on a skeletal region"
      >
        <div className="panel-heading">
          <span>
            <Bone size={16} /> Skeletal anatomy
          </span>
          <span className="count">01</span>
        </div>
        <p className="panel-label">FOCUS REGION</p>
        <div className="region-list">
          {regions.map((r) => (
            <button
              key={r.id}
              aria-pressed={state.region === r.id}
              onClick={() => focus(r.id)}
              disabled={!ready}
              className={state.region === r.id ? 'selected' : ''}
            >
              <span className="region-dot" />
              <span className="region-full-name">{r.name}</span>
              <span className="region-short-name">
                {
                  {
                    whole: 'All',
                    skull: 'Skull',
                    thorax: 'Ribs',
                    pelvis: 'Pelvis',
                    legs: 'Legs',
                  }[r.id]
                }
              </span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
        <div className="panel-foot">
          <span className="status-dot" /> CT-derived specimen
        </div>
      </section>
      <div className="zoom-controls glass" aria-label="Zoom controls">
        <button
          onClick={() => setState((s) => ({ ...s, zoom: s.zoom + 1 }))}
          aria-label="Zoom in"
          disabled={!ready}
        >
          <Plus size={18} />
        </button>
        <span />
        <button
          onClick={() => setState((s) => ({ ...s, zoom: s.zoom - 1 }))}
          aria-label="Zoom out"
          disabled={!ready}
        >
          <Minus size={18} />
        </button>
        <span />
        <button
          onClick={reset}
          aria-label="Fit whole skeleton"
          disabled={!ready}
        >
          <Scan size={18} />
        </button>
      </div>
      {!ready && !error && (
        <output className="loading glass">
          <div className="loading-icon">
            <Bone size={24} />
          </div>
          <div>
            <strong>Loading the skeleton</strong>
            <p>Preparing the complete 3D scan…</p>
            <div className="loading-track">
              <span />
            </div>
          </div>
        </output>
      )}
      {error && (
        <div className="loading error glass">
          <strong>Let’s reload the skeleton.</strong>
          <p>{error}</p>
          <button
            onClick={() => {
              setError('');
              setReady(false);
              setAttempt((a) => a + 1);
              reset();
            }}
          >
            <RotateCcw size={16} /> Try again
          </button>
        </div>
      )}
      <div className="scene-caption">
        <span />
        {region.caption.toUpperCase()}
        <span />
      </div>
      <div className="bottom-dock glass">
        <RadioGroup
          className="camera-options"
          value={state.view}
          onValueChange={(value) =>
            setState((s) => ({ ...s, view: value as View, rotate: false }))
          }
          aria-label="Camera angle"
          disabled={!ready}
        >
          {views.map((v) => (
            <label key={v.id} className={state.view === v.id ? 'active' : ''}>
              <RadioGroupItem
                value={v.id}
                aria-label={
                  v.id === 'three-quarter'
                    ? 'Three-quarter view'
                    : v.label + ' view'
                }
              />
              <span>{v.label}</span>
            </label>
          ))}
        </RadioGroup>
        <div className="dock-divider" />
        <button
          className={'dock-button ' + (state.rotate ? 'active' : '')}
          aria-pressed={state.rotate}
          onClick={() => setState((s) => ({ ...s, rotate: !s.rotate }))}
          disabled={!ready}
        >
          {state.rotate ? <Pause size={17} /> : <Play size={17} />}
          <span>{state.rotate ? 'Pause' : 'Rotate'}</span>
        </button>
        <button className="dock-button" onClick={reset} disabled={!ready}>
          <RotateCcw size={17} />
          <span>Reset</span>
        </button>
      </div>
      <footer className="studio-footer">
        <span>
          Drag to rotate <b>·</b> Scroll or pinch to zoom
        </span>
        <button onClick={() => setInfo(true)}>
          Visible Ape Project <ArrowUpRight size={12} />
        </button>
      </footer>
      <Dialog open={info} onOpenChange={setInfo}>
        <DialogContent className="about-dialog">
          <div className="eyebrow">
            <Focus size={16} /> THE SPECIMEN
          </div>
          <DialogTitle className="about-title">
            A closer look at the chimp skeleton.
          </DialogTitle>
          <DialogDescription className="about-description">
            A complete adult common chimpanzee skeleton reconstructed from CT
            imaging. The scan retains the specimen’s original posture, including
            its turned head and bent legs.
          </DialogDescription>
          <p>
            This viewer moves the camera around one continuous skeletal surface.
            Region controls focus the view; they do not separate individual
            bones.
          </p>
          <div className="source-block">
            <strong>Model & license</strong>
            <a
              href="https://www.visibleapeproject.com/chimpanzee-skeleton"
              target="_blank"
              rel="noreferrer"
            >
              Visible Ape Project <ArrowUpRight size={15} />
            </a>
            <a
              href="https://sketchfab.com/3d-models/ct-based-adult-common-chimp-skeleton-ce2e42392cca4c4c8a45412a683e9859"
              target="_blank"
              rel="noreferrer"
            >
              Original CT-based skeleton <ArrowUpRight size={15} />
            </a>
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              Creative Commons Attribution 4.0 <ArrowUpRight size={15} />
            </a>
            <p>
              Geometry simplified for faster loading; proportions and specimen
              pose preserved. Native model sourced via the public Objaverse
              archive.
            </p>
          </div>
          <a
            className="reference-link"
            href="https://github.com/ashemag/human-atlas"
            target="_blank"
            rel="noreferrer"
          >
            Interface inspired by ashemag’s Human Atlas{' '}
            <ArrowUpRight size={15} />
          </a>
        </DialogContent>
      </Dialog>
    </main>
  );
}
