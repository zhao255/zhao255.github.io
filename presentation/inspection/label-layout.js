const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export function overlaps(a, b, gap = 6) {
  return Math.abs(a.x-b.x) < (a.width+b.width)/2+gap && Math.abs(a.y-b.y) < (a.height+b.height)/2+gap;
}
// Screen-space layout uses measured text, including translations, and reserves UI controls.
export function layoutLabels(labels, width, height, obstacles = []) {
  const occupied = [...obstacles], result = [];
  const priority = {'floor-label':0, 'capture-icon':1, hazard:2};
  for (const label of [...labels].sort((a,b) => priority[a.type]-priority[b.type] || a.id-b.id)) {
    const inset = 8, left = inset+label.width/2, right = width-inset-label.width/2;
    const top = inset+label.height/2, bottom = height-inset-label.height/2;
    if (left>right || top>bottom) continue;
    const startX = clamp(label.x,left,right), startY = clamp(label.y-(label.type==='hazard'?22:0),top,bottom);
    const clear = p => !occupied.some(o => overlaps({...label,...p},o));
    const candidates = [{x:startX,y:startY}];
    if (!clear(candidates[0])) {
      for (const o of occupied) {
        const xs=[startX,clamp(o.x-(o.width+label.width)/2-7,left,right),clamp(o.x+(o.width+label.width)/2+7,left,right)];
        const ys=[startY,clamp(o.y-(o.height+label.height)/2-7,top,bottom),clamp(o.y+(o.height+label.height)/2+7,top,bottom)];
        for(const x of xs) for(const y of ys) candidates.push({x,y});
      }
    }
    candidates.sort((a,b) => (a.x-startX)**2+(a.y-startY)**2*1.4 - ((b.x-startX)**2+(b.y-startY)**2*1.4));
    let position = candidates.find(clear);
    if (!position) {
      const fallback=[];
      for(let y=top;y<=bottom;y+=8)for(let x=left;x<=right;x+=12)fallback.push({x,y});
      fallback.sort((a,b)=>(a.x-startX)**2+(a.y-startY)**2-((b.x-startX)**2+(b.y-startY)**2));
      position=fallback.find(clear);
    }
    if (!position) continue;
    const placed = {...label,...position}; occupied.push(placed); result.push(placed);
  }
  return result;
}
