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
  Layers,
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
  muscleModels,
  type ModelId,
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
  const isSkeleton = state.model === 'skeleton';
  const muscleModel = muscleModels.find((m) => m.id === state.model);
  const changeModel = (model: ModelId) => {
    if (model !== state.model) {
      setReady(false);
      setError('');
    }
    setState((s) => ({ ...initialState, model, reset: s.reset + 1 }));
  };
  const reset = () =>
    setState((s) => ({ ...initialState, model: s.model, reset: s.reset + 1 }));
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
              if (state.model !== 'skeleton') setReady(false);
              flushSync(() =>
                setState((s) => ({
                  ...s,
                  model: 'skeleton',
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
  }, [state.model]);
  return (
    <main className="studio">
      <SkeletonScene
        key={`${state.model}-${attempt}`}
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
          <span> / </span>
          {isSkeleton ? 'Skeleton' : 'Muscles'}
        </p>
      </header>
      <button
        className="info-button glass"
        aria-label="About the anatomy and sources"
        onClick={() => setInfo(true)}
      >
        <Info size={18} />
        <span>About</span>
      </button>
      <section
        className="regions-panel glass"
        aria-label="Anatomy and region controls"
      >
        <div className="panel-heading">
          <span>
            <Layers size={16} /> Anatomy
          </span>
          <span className="count">02</span>
        </div>
        <RadioGroup
          className="system-options"
          value={isSkeleton ? 'skeleton' : 'muscles'}
          onValueChange={(value) =>
            changeModel(value === 'skeleton' ? 'skeleton' : 'muscles-head')
          }
          aria-label="Anatomical system"
        >
          {['Skeleton', 'Muscles'].map((label) => (
            <label
              key={label}
              className={isSkeleton === (label === 'Skeleton') ? 'active' : ''}
            >
              <RadioGroupItem value={label.toLowerCase()} aria-label={label} />
              <span>{label}</span>
            </label>
          ))}
        </RadioGroup>
        <p className="panel-label">
          {isSkeleton ? 'FOCUS REGION' : 'MUSCLE REGION'}
        </p>
        <div className="region-list">
          {isSkeleton
            ? regions.map((r) => (
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
              ))
            : muscleModels.map((m) => (
                <button
                  key={m.id}
                  aria-pressed={state.model === m.id}
                  onClick={() => changeModel(m.id)}
                  className={state.model === m.id ? 'selected' : ''}
                >
                  <span className="region-dot muscle-dot" />
                  <span>{m.name}</span>
                  <ChevronRight size={15} />
                </button>
              ))}
        </div>
        <div className="panel-foot">
          <span className="status-dot" />{' '}
          {isSkeleton ? 'CT-derived specimen' : 'Regional 3D reconstructions'}
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
        <button onClick={reset} aria-label="Fit whole model" disabled={!ready}>
          <Scan size={18} />
        </button>
      </div>
      {!ready && !error && (
        <output className="loading glass">
          <div className="loading-icon">
            <Bone size={24} />
          </div>
          <div>
            <strong>
              Loading{' '}
              {isSkeleton ? 'the skeleton' : muscleModel?.name.toLowerCase()}
            </strong>
            <p>Preparing the 3D anatomy…</p>
            <div className="loading-track">
              <span />
            </div>
          </div>
        </output>
      )}
      {error && (
        <div className="loading error glass">
          <strong>Let’s reload the anatomy.</strong>
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
        {(isSkeleton ? region.caption : muscleModel!.caption).toUpperCase()}
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
          aria-label={state.rotate ? 'Pause rotation' : 'Rotate model'}
          aria-pressed={state.rotate}
          onClick={() => setState((s) => ({ ...s, rotate: !s.rotate }))}
          disabled={!ready}
        >
          {state.rotate ? <Pause size={17} /> : <Play size={17} />}
          <span>{state.rotate ? 'Pause' : 'Rotate'}</span>
        </button>
        <button
          className="dock-button"
          aria-label="Reset view"
          onClick={reset}
          disabled={!ready}
        >
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
            A closer look at chimp anatomy.
          </DialogTitle>
          <DialogDescription className="about-description">
            Explore the complete adult common chimpanzee skeleton, plus separate
            head-and-neck and lower-limb muscle reconstructions from the Visible
            Ape Project.
          </DialogDescription>
          <p>
            The skeleton preserves the CT specimen’s turned head and bent legs.
            Bone controls focus the camera. Muscle views load distinct regional
            models with their original anatomical colors; they are not a
            complete body muscle layer over this skeleton.
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
              href="https://www.visibleapeproject.com/"
              target="_blank"
              rel="noreferrer"
            >
              Muscle reconstructions <ArrowUpRight size={15} />
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
            href="/ATTRIBUTION.md"
            target="_blank"
            rel="noreferrer"
          >
            All model sources & adaptation notes <ArrowUpRight size={15} />
          </a>
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
