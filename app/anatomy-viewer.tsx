'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Rotate3D, RefreshCw } from 'lucide-react';

type ViewerApi = {
  start: () => void;
  addEventListener: (event: string, fn: () => void) => void;
  stop: () => void;
};
type Client = {
  init: (
    id: string,
    options: {
      success: (api: ViewerApi) => void;
      error: () => void;
      autostart: number;
      ui_theme: string;
      dnt: number;
    },
  ) => void;
};
type SketchfabWindow = Window & {
  Sketchfab?: new (version: string, frame: HTMLIFrameElement) => Client;
};
let sdkPromise: Promise<void> | undefined;
function loadSdk() {
  if ((window as SketchfabWindow).Sketchfab) return Promise.resolve();
  if (!sdkPromise)
    sdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        sdkPromise = undefined;
        reject(new Error('Viewer unavailable'));
      };
      document.head.appendChild(script);
    });
  return sdkPromise;
}
export function AnatomyViewer({
  id,
  title,
  skin,
}: {
  id: string;
  title: string;
  skin: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'slow' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let api: ViewerApi | undefined;
    const timer = setTimeout(() => {
      if (!cancelled) setState((s) => (s === 'ready' ? s : 'slow'));
    }, 35000);
    loadSdk()
      .then(() => {
        if (cancelled || !frame.current) return;
        const Constructor = (window as SketchfabWindow).Sketchfab;
        if (!Constructor) throw new Error('Viewer unavailable');
        new Constructor('1.12.1', frame.current).init(id, {
          autostart: 1,
          ui_theme: 'dark',
          dnt: 1,
          success: (viewer) => {
            if (cancelled) return;
            api = viewer;
            viewer.addEventListener('viewerready', () => {
              if (!cancelled) {
                clearTimeout(timer);
                setState('ready');
              }
            });
            viewer.start();
          },
          error: () => {
            if (!cancelled) {
              clearTimeout(timer);
              setState('error');
            }
          },
        });
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      try {
        api?.stop();
      } catch {
        /* Frame disposal does not block navigation. */
      }
    };
  }, [id, attempt]);
  return (
    <div className="live-viewer">
      <iframe
        ref={frame}
        key={id + '-' + attempt}
        className="anatomy-frame"
        title={title}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
      />
      {state !== 'ready' && (
        <output
          className={
            'viewer-status ' + (state === 'loading' ? 'is-loading' : '')
          }
        >
          <Rotate3D size={25} />
          <strong>
            {state === 'loading'
              ? 'Preparing the 3D specimen'
              : state === 'slow'
                ? 'This detailed model is taking a moment'
                : 'The 3D viewer couldn’t connect'}
          </strong>
          <p>
            {state === 'loading'
              ? 'Loading the model from Sketchfab.'
              : 'You can retry here or open the original model.'}
          </p>
          {state !== 'loading' && (
            <div>
              <button
                onClick={() => {
                  setState('loading');
                  setAttempt((a) => a + 1);
                }}
              >
                <RefreshCw size={15} /> Retry
              </button>
              <a
                href={'https://sketchfab.com/models/' + id}
                target="_blank"
                rel="noreferrer"
              >
                Open original <ArrowUpRight size={15} />
              </a>
            </div>
          )}
        </output>
      )}
      <div className="viewer-instructions">
        <Rotate3D size={15} />
        <span>Drag to rotate · scroll or pinch to zoom</span>
        <a
          href={'https://sketchfab.com/models/' + id}
          target="_blank"
          rel="noreferrer"
          aria-label="Open this model on Sketchfab"
        >
          <ArrowUpRight size={17} />
        </a>
      </div>
      <p className="model-context">
        {skin
          ? 'Full-body surface model · choose a limb or head tab for exposed muscles.'
          : 'Scientific muscle reconstruction · José Saúl Martín / Visible Ape Project'}
      </p>
    </div>
  );
}
