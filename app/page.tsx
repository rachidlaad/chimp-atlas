'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import { AnatomyViewer } from './anatomy-viewer';
import {
  ArrowUpRight,
  ArrowRight,
  Crosshair,
  Rotate3D,
  Share2,
  Scan,
  ChevronRight,
  Fingerprint,
  BookOpen,
  Plus,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const muscles = [
  {
    name: 'Pectoralis major',
    region: 'CHEST',
    role: 'The pull starts here.',
    text: 'Draws the upper arm inward and contributes to shoulder flexion and rotation.',
    tag: 'SHOULDER MOVEMENT',
    view: 'upper',
    x: 46,
    y: 30,
  },
  {
    name: 'Deltoid',
    region: 'SHOULDER',
    role: 'Reach. Raise. Stabilize.',
    text: 'Moves the upper arm away from the torso. Different portions also move it forward and backward.',
    tag: 'ARM ELEVATION',
    view: 'upper',
    x: 62,
    y: 26,
  },
  {
    name: 'Biceps brachii',
    region: 'UPPER ARM',
    role: 'Built for the pull.',
    text: 'Bends the elbow and also crosses the shoulder. One part of a forelimb adapted for climbing and support.',
    tag: 'ELBOW FLEXION',
    view: 'upper',
    x: 65,
    y: 38,
  },
  {
    name: 'Triceps brachii',
    region: 'UPPER ARM',
    role: 'The other side of strength.',
    text: 'Straightens the elbow. Its long head also acts at the shoulder. Rotate the upper-limb model to inspect it.',
    tag: 'ELBOW EXTENSION',
    view: 'upper',
    x: 35,
    y: 38,
  },
  {
    name: 'Forearm flexors',
    region: 'FOREARM',
    role: 'A whole system for grasping.',
    text: 'A group of muscles that bends the wrist and fingers. Superficial and deep layers work together to support grasping.',
    tag: 'WRIST & FINGER FLEXION',
    view: 'upper',
    x: 68,
    y: 53,
  },
  {
    name: 'Latissimus dorsi',
    region: 'BACK',
    role: 'Power across the back.',
    text: 'Moves the upper arm backward and contributes to shoulder rotation during climbing. Rotate the upper-limb model to inspect it.',
    tag: 'SHOULDER EXTENSION',
    view: 'upper',
    x: 34,
    y: 43,
  },
  {
    name: 'Quadriceps',
    region: 'THIGH',
    role: 'Drive through the legs.',
    text: 'A group of four muscles that extends the knee. The rectus femoris also crosses the hip.',
    tag: 'KNEE EXTENSION',
    view: 'lower',
    x: 54,
    y: 64,
  },
  {
    name: 'Gastrocnemius',
    region: 'CALF',
    role: 'From the ground up.',
    text: 'Points the foot downward at the ankle and also crosses the knee. Explore the lower-limb model for its deeper relationships.',
    tag: 'ANKLE MOVEMENT',
    view: 'lower',
    x: 42,
    y: 78,
  },
];
const models: Record<string, { id: string; title: string }> = {
  upper: {
    id: '214ab1b88d3e4a49b1094b23695af93e',
    title: 'Chimpanzee upper-limb muscular reconstruction',
  },
  head: {
    id: '16e37cef8db9438fa319a53d26eb64b0',
    title: 'Chimpanzee head and neck muscular reconstruction',
  },
  lower: {
    id: '5c1e4c3c8cd645b488050b2711e9395b',
    title: 'Chimpanzee lower-limb muscular reconstruction',
  },
  hairless: {
    id: 'd17d5c660ff24e11aca12209dcb9e93f',
    title: 'Animated realistic hairless chimpanzee by Zerindo',
  },
};

function subscribeToLocation(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}
const getLocation = () => window.location.search;
const getServerLocation = () => '';

export default function Home() {
  const location = useSyncExternalStore(
    subscribeToLocation,
    getLocation,
    getServerLocation,
  );
  const query = new URLSearchParams(location);
  const sharedIndex = muscles.findIndex((m) => m.name === query.get('muscle'));
  const sharedView = query.get('view');
  const [selectionOverride, setSelected] = useState<number | null>(null);
  const [viewOverride, setView] = useState<string | null>(null);
  const selected = selectionOverride ?? (sharedIndex >= 0 ? sharedIndex : 2);
  const view =
    viewOverride ??
    (sharedView &&
    (sharedView === 'overview' || Object.hasOwn(models, sharedView))
      ? sharedView
      : 'overview');
  const [copied, setCopied] = useState(false);
  const muscle = muscles[selected];
  useEffect(() => {
    const registry = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: object,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!registry) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        registry.registerTool(
          {
            name: 'inspect_chimp_muscle',
            title: 'Inspect a chimp muscle',
            description:
              'Select a muscle in the anatomy explorer and optionally open its scientific 3D region.',
            inputSchema: {
              type: 'object',
              properties: {
                muscle: { type: 'string', enum: muscles.map((m) => m.name) },
                open3D: { type: 'boolean' },
              },
              required: ['muscle'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input: unknown) {
              if (!input || typeof input !== 'object' || Array.isArray(input))
                throw new Error('Expected an object');
              const data = input as Record<string, unknown>;
              if (
                Object.keys(data).some(
                  (k) => k !== 'muscle' && k !== 'open3D',
                ) ||
                (data.open3D !== undefined && typeof data.open3D !== 'boolean')
              )
                throw new Error('Invalid parameters');
              const idx = muscles.findIndex((m) => m.name === data.muscle);
              if (idx < 0) throw new Error('Choose a listed muscle');
              flushSync(() => {
                setSelected(idx);
                setView(data.open3D ? muscles[idx].view : 'overview');
              });
              return {
                muscle: muscles[idx].name,
                description: muscles[idx].text,
                view: data.open3D ? muscles[idx].view : 'overview',
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
  async function share() {
    const url =
      'https://built-different-chimp-lab.xracheed.chatgpt.site/?' +
      new URLSearchParams({ muscle: muscle.name, view });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Copy the lab link', url);
    }
  }
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#explore">
          <Crosshair size={27} />
          <span>
            PRIMAL<span className="brand-sub">THE ANATOMY LAB</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#explore" className="active">
            The anatomy
          </a>
          <a href="#science">
            The science <ArrowUpRight size={14} />
          </a>
          <a href="#debate">The debate</a>
        </nav>
        <button className="share-button" onClick={share}>
          <Share2 size={16} />
          <span>{copied ? 'Link copied' : 'Share the lab'}</span>
        </button>
      </header>
      <section
        className="explorer"
        id="explore"
        aria-label="Interactive chimpanzee anatomy explorer"
      >
        <div className="intro-column">
          <p className="eyebrow">
            <span className="status-dot" /> BIG CLAIM. MEET THE ANATOMY.
          </p>
          <h1>
            BUILT
            <br />
            <span>DIFFERENT.</span>
          </h1>
          <p className="intro">
            You’ve seen the MMA debate.
            <br />
            Now meet what’s under the fur.
          </p>
          <div className="muscle-index">
            <div className="section-label">
              <span>EXPLORE THE MUSCLES</span>
              <span>08</span>
            </div>
            {muscles.map((m, i) => (
              <button
                key={m.name}
                className={'muscle-row ' + (selected === i ? 'selected' : '')}
                onClick={() => setSelected(i)}
                aria-pressed={selected === i}
              >
                <span className="index-number">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{m.name}</span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          <a className="evidence-link" href="#science">
            <BookOpen size={16} /> Real anatomy. Actual papers.{' '}
            <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="specimen-column">
          <div className="specimen-topline">
            <span>PAN TROGLODYTES</span>
            <span>SPECIMEN / 001</span>
          </div>
          <Tabs
            value={view}
            onValueChange={(v) => setView(String(v))}
            className="viewer-tabs"
          >
            <TabsList aria-label="Anatomy view" className="view-switcher">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="upper">
                <Rotate3D size={14} /> Upper limb
              </TabsTrigger>
              <TabsTrigger value="head">Head</TabsTrigger>
              <TabsTrigger value="lower">Lower limb</TabsTrigger>
              <TabsTrigger value="hairless">Hairless</TabsTrigger>
            </TabsList>
          </Tabs>
          <div
            className={
              'model-stage ' +
              (view === 'overview' ? 'overview-stage' : 'live-stage')
            }
          >
            {view === 'overview' ? (
              <>
                <span className="stage-word" aria-hidden="true">
                  PRIMAL
                </span>
                <div className="image-assembly">
                  <Image
                    unoptimized
                    className="specimen-image"
                    src="/chimp-anatomy.png"
                    alt="Illustrative full-body chimpanzee reconstruction showing superficial muscle fibers and tendons"
                    width="1086"
                    height="1448"
                    priority
                  />
                  {muscles
                    .filter((_, i) => [0, 1, 2, 4, 6, 7].includes(i))
                    .map((m) => {
                      const i = muscles.indexOf(m);
                      return (
                        <button
                          key={m.name}
                          aria-label={'Inspect ' + m.name}
                          aria-pressed={selected === i}
                          className={
                            'hotspot ' + (selected === i ? 'selected' : '')
                          }
                          style={{ left: m.x + '%', top: m.y + '%' }}
                          onClick={() => setSelected(i)}
                        >
                          <Plus size={13} />
                        </button>
                      );
                    })}
                </div>
                <div className="image-note">
                  ILLUSTRATIVE RECONSTRUCTION · 2D
                </div>
                <button
                  className="enter-3d"
                  onClick={() => setView(muscle.view)}
                >
                  <Rotate3D size={19} /> Explore real anatomy in 3D{' '}
                  <ArrowUpRight size={18} />
                </button>
              </>
            ) : (
              <>
                <AnatomyViewer
                  key={view}
                  id={models[view].id}
                  title={models[view].title}
                  skin={view === 'hairless'}
                />
              </>
            )}
          </div>
          <div className="specimen-bottomline">
            <span>
              <Scan size={15} />
              {view === 'overview'
                ? 'SELECT A MUSCLE TO INVESTIGATE'
                : 'INTERACTIVE 3D / SKETCHFAB'}
            </span>
            <span>{view === 'overview' ? '01 — 08' : '360°'}</span>
          </div>
        </div>
        <aside className="detail-column">
          <div className="detail-card" key={selected}>
            <div className="section-label">
              <span>MUSCLE FILE</span>
              <Fingerprint size={20} />
            </div>
            <span className="file-number">
              {String(selected + 1).padStart(2, '0')}
              <span>/08</span>
            </span>
            <div className="region-tag">{muscle.region}</div>
            <h2>{muscle.name}</h2>
            <p className="muscle-role">{muscle.role}</p>
            <div className="detail-divider" />
            <p className="detail-description">{muscle.text}</p>
            <div className="function-label">PRIMARY FUNCTION</div>
            <div className="function-tag">
              <ArrowUpRight size={16} />
              {muscle.tag}
            </div>
            <button
              className="outline-button"
              onClick={() => setView(muscle.view)}
            >
              Inspect region in 3D <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="fact-teaser">
            <span className="eyebrow">THE NUMBER THAT MATTERS</span>
            <div className="big-stat">
              1.35<span>×</span>
            </div>
            <p>
              Modeled muscle force & power.
              <br />
              <strong>Similar muscle size.</strong>
            </p>
            <a href="#science">
              Read the fine print <ArrowRight size={16} />
            </a>
          </div>
        </aside>
      </section>
      <div className="ticker" aria-hidden="true">
        <span>NO FUR. NO FILTER.</span>
        <Plus />
        <span>ANATOMY OVER EGO.</span>
        <Plus />
        <span>BUILT FOR A DIFFERENT WORLD.</span>
        <Plus />
        <span>NO FUR. NO FILTER.</span>
      </div>
      <section className="science-section" id="science">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / THE SCIENCE</p>
            <h2>
              THE MUSCLE.
              <br />
              MINUS THE MYTH.
            </h2>
          </div>
          <p>
            There’s a real story here.
            <br />
            It doesn’t need fake strength multipliers.
          </p>
        </div>
        <div className="science-grid">
          <article>
            <span className="science-index">01 — POWER</span>
            <div className="science-stat">
              35<span>%</span>
            </div>
            <h3>More modeled muscle power.</h3>
            <p>
              O’Neill and colleagues estimated about 1.35× maximum dynamic force
              and power for chimpanzee muscle of similar size to human muscle.
            </p>
            <a
              href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5514706/"
              target="_blank"
              rel="noreferrer"
            >
              O’Neill et al. · PNAS, 2017 <ArrowUpRight size={16} />
            </a>
          </article>
          <article>
            <span className="science-index">02 — FIBER TYPE</span>
            <div className="science-stat">
              67<span>%</span>
            </div>
            <h3>A fast-twitch bias.</h3>
            <p>
              The study’s chimpanzee pelvis and hindlimb sample averaged about
              67% fast-twitch fibers. Its human model used about 40%. These are
              not values for every muscle.
            </p>
            <a
              href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5514706/"
              target="_blank"
              rel="noreferrer"
            >
              See the study and its limits <ArrowUpRight size={16} />
            </a>
          </article>
          <article className="myth-card">
            <span className="science-index">03 — REALITY CHECK</span>
            <div className="science-stat crossed">5×</div>
            <h3>Retire the internet multiplier.</h3>
            <p>
              Muscle power is not whole-body strength. Neither is a fight
              prediction. Body size, muscle architecture and the task all change
              the comparison.
            </p>
            <a
              href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3248660/"
              target="_blank"
              rel="noreferrer"
            >
              Myatt et al. · Journal of Anatomy <ArrowUpRight size={16} />
            </a>
          </article>
        </div>
      </section>
      <section className="debate-section" id="debate">
        <p className="eyebrow">02 / THE INTERNET HAS ENTERED THE CHAT</p>
        <h2>
          CONFIDENCE ISN’T
          <br />
          <span>A MUSCLE GROUP.</span>
        </h2>
        <p>
          Cole “Wavy” Johnson’s claim started a debate.
          <br />
          Here’s the anatomy behind the bravado.
        </p>
        <button className="lime-button" onClick={share}>
          {copied ? 'LINK COPIED' : 'SEND THIS TO THAT FRIEND'}{' '}
          <ArrowUpRight size={20} />
        </button>
        <a
          className="context-source"
          href="https://timesofindia.indiatimes.com/sports/mma/news/i-never-thought-i-was-going-to-do-it-cole-johnson-reveals-how-a-joke-suddenly-turned-into-a-real-fight-after-a-huge-offer-came-his-way/amp_articleshow/133859700.cms"
          target="_blank"
          rel="noreferrer"
        >
          The story behind the claim ↗
        </a>
        <div className="debate-note">
          An anatomy explainer. Not a fight forecast or an invitation to test
          it.
        </div>
      </section>
      <footer>
        <a className="brand" href="#explore">
          <Crosshair size={24} />
          <span>
            PRIMAL<span className="brand-sub">THE ANATOMY LAB</span>
          </span>
        </a>
        <p>
          Scientific 3D models: José Saúl Martín /{' '}
          <a
            href="https://www.visibleapeproject.com/chimpanzee-downloads"
            target="_blank"
            rel="noreferrer"
          >
            Visible Ape Project
          </a>{' '}
          ·{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          .<br />
          Hairless chimp: Zerindo, via Sketchfab. Overview: AI-generated
          illustrative reconstruction.
        </p>
        <a href="#explore">BACK TO THE SPECIMEN ↑</a>
      </footer>
    </main>
  );
}
