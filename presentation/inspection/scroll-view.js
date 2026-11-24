const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export function scrollTopForHeight(height, min, max, extent) {
  return (1 - (clamp(height,min,max)-min)/(max-min)) * Math.max(0,extent);
}
export function heightForScrollTop(top, min, max, extent) {
  return extent > 0 ? min + (1-clamp(top/extent,0,1))*(max-min) : min;
}
// Only height changes. The dashboard angle, distance and lens stay fixed.
export function fixedCameraPose(height) {
  return { position:[11.556,height+2.87,16.36], target:[2.7,height,1.6] };
}

// Translate the fixed camera vertically until the robot lies on its center line.
// Account for stair depth: using robot.y alone drifts between left/right flights.
export function centeredCameraHeight([x,y,z]) {
  const dx=8.856,dz=14.76,dy=2.87;
  return y-dy-dy*(dx*(x-11.556)+dz*(z-16.36))/(dx*dx+dz*dz);
}

// Final-floor label stays at 17% of the fixed 16:9 view, matching the reference.
export function topCameraHeight(halfRise) { return halfRise*8-.9765817434; }

// Consume only the available dashboard travel; the remainder belongs to the page.
export function splitScrollDelta(top, delta, extent) {
  const limit=Math.max(0,extent),start=clamp(top,0,limit);
  const next=clamp(start+delta,0,limit);
  return {next,overflow:delta-(next-start)};
}
