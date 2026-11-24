// Route distances and stop positions are derived from the rendered Blender scene.
export function sampleRoute(route, distance) {
  const d = Math.max(0, Math.min(route.lengthM, distance));
  const s = route.segments.find(segment => d <= segment.stationM + segment.lengthM + 1e-8) || route.segments.at(-1);
  const t = Math.max(0, Math.min(1, (d - s.stationM) / s.lengthM));
  let position, tangent;
  if (s.kind === 'elbow') {
    const angle = s.angle_rad * t;
    position = s.center.map((v, i) => v + s.radiusM * (s.axisU[i] * Math.cos(angle) + s.axisV[i] * Math.sin(angle)));
    tangent = s.axisU.map((v, i) => -v * Math.sin(angle) + s.axisV[i] * Math.cos(angle));
  } else {
    position = s.start.map((v, i) => v + (s.end[i] - v) * t);
    tangent = s.end.map((v, i) => v - s.start[i]);
  }
  const length = Math.hypot(...tangent);
  return { position, tangent: tangent.map(v => v / length), flightIndex: s.flightIndex };
}

export class InspectionTour {
  constructor(route, captures, { speed = 2.2, direction = 1, dwell = 3.2, reviewHold = .7, reducedMotion = false, onEvent = () => {} } = {}) {
    this.direction = direction < 0 ? -1 : 1;
    this.route = route; this.speed = speed; this.dwell = dwell; this.reviewHold = reviewHold; this.onEvent = onEvent;
    this.stops = captures.map(capture => {
      const segment = route.segments.find(s => s.kind === 'flight' && s.flightIndex === capture.flight_index - 1);
      if (!segment) throw new Error(`Missing route segment for ${capture.id}`);
      return { ...capture, distance: segment.stationM + segment.lengthM / 2 };
    }).sort((a, b) => this.direction * (a.distance - b.distance));
    this.reset(!reducedMotion);
  }
  reset(playing = true) {
    this.distance = this.direction < 0 ? this.route.lengthM : 0; this.next = 0; this.elapsed = 0; this.phase = 'travel';
    this.playing = playing; this.captured = new Set(); this.revealed = new Set();
    this.onEvent({ type: 'reset' });
  }
  tick(seconds) {
    if (!this.playing || this.phase === 'complete' || seconds <= 0) return;
    let remaining = seconds;
    while (remaining > 1e-8 && this.phase !== 'complete') {
      if (this.phase === 'travel') {
        const stop = this.stops[this.next];
        const destination = stop?.distance ?? (this.direction < 0 ? 0 : this.route.lengthM);
        const time = Math.abs(destination - this.distance) / this.speed;
        const consumed = Math.min(remaining, Math.max(0, time));
        this.distance += this.direction * Math.min(Math.abs(destination - this.distance), consumed * this.speed);
        remaining -= consumed;
        if (Math.abs(this.distance - destination) <= 1e-7) {
          this.distance = destination;
          if (!stop) { this.phase = 'complete'; this.playing = false; this.onEvent({ type: 'complete' }); break; }
          this.phase = 'inspect'; this.elapsed = 0; this.onEvent({ type: 'arrive', capture: stop });
        }
      } else if (this.phase === 'inspect') {
        const stop = this.stops[this.next];
        const consumed = Math.min(remaining, this.dwell - this.elapsed);
        this.elapsed += consumed; remaining -= consumed;
        // Publish the panorama and its findings together only after exposure finishes.
        if (this.elapsed >= this.dwell - 1e-7 && !this.captured.has(stop.id)) {
          this.phase = 'review'; this.elapsed = 0;
          this.captured.add(stop.id); this.onEvent({ type: 'capture', capture: stop });
          this.revealed.add(stop.id); this.onEvent({ type: 'findings', capture: stop });
        }
      } else {
        const stop = this.stops[this.next];
        const consumed = Math.min(remaining, this.reviewHold - this.elapsed);
        this.elapsed += consumed; remaining -= consumed;
        if (this.elapsed >= this.reviewHold - 1e-7) {
          this.next++; this.phase = 'travel'; this.onEvent({ type: 'depart', capture: stop });
        }
      }
    }
  }
}
