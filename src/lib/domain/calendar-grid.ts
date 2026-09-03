// Shared pure logic for the weekly timeline-grid calendars (crew-wide
// "coming in" view and each intern's own personal calendar) — lane
// packing for overlapping blocks, and compact time labels for narrow lanes.

export interface TimedBlock {
  id: string;
  startMin: number;
  endMin: number;
}

export interface LanedBlock<T extends TimedBlock> {
  block: T;
  lane: number;
  totalLanes: number;
}

/**
 * Packs overlapping blocks into side-by-side lanes, like a calendar day
 * view — but only within each cluster of blocks that actually overlap
 * (transitively). A block with no real overlap always keeps full width,
 * even if something else overlaps later that same day.
 */
export function packLanes<T extends TimedBlock>(blocks: T[]): LanedBlock<T>[] {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
  const result: LanedBlock<T>[] = [];
  let cluster: T[] = [];
  let clusterEnd = -Infinity;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const laneEnds: number[] = [];
    const withLane = cluster.map((block) => {
      let lane = laneEnds.findIndex((end) => end <= block.startMin);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(block.endMin);
      } else {
        laneEnds[lane] = block.endMin;
      }
      return { block, lane };
    });
    const totalLanes = Math.max(1, laneEnds.length);
    result.push(...withLane.map((b) => ({ ...b, totalLanes })));
    cluster = [];
  };

  for (const b of sorted) {
    if (cluster.length > 0 && b.startMin >= clusterEnd) {
      flushCluster();
      clusterEnd = -Infinity;
    }
    cluster.push(b);
    clusterEnd = Math.max(clusterEnd, b.endMin);
  }
  flushCluster();

  return result;
}

/** Compact "5:30p" form for narrow side-by-side lanes, where "5:30 PM" would wrap. */
export function compactTimeLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  const ap = h < 12 ? "a" : "p";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return mm === 0 ? `${hh}${ap}` : `${hh}:${String(mm).padStart(2, "0")}${ap}`;
}

/** Repeating hour gridlines as a CSS background-image value, for a given row height in px. */
export function gridlinesBackground(hourPx: number): string {
  return `repeating-linear-gradient(to bottom, transparent, transparent calc(${hourPx}px - 1px), var(--color-divider) calc(${hourPx}px - 1px), var(--color-divider) ${hourPx}px)`;
}

/** The [start, end] minute window a grid should display, padded and clamped. */
export function computeWindow(
  minutes: number[],
  options: { min: number; max: number; fallback: [number, number] },
): [number, number] {
  if (minutes.length === 0) return options.fallback;
  const min = Math.max(options.min, Math.floor((Math.min(...minutes) - 30) / 60) * 60);
  const max = Math.min(options.max, Math.ceil((Math.max(...minutes) + 30) / 60) * 60);
  return [min, Math.max(max, min + 120)];
}
