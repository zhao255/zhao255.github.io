(()=>{
  "use strict";

  const designIds=["twin-pod","articulated","belt"];
  const originals=window.presentationSlides;
  const designs=new Map(originals.filter(slide=>designIds.includes(slide.id)).map(slide=>[slide.id,slide]));

  function element(tag,className,text) {
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text)node.textContent=text;
    return node;
  }

  function orderedSlides(order=designIds) {
    const start=originals.findIndex(slide=>slide.id===designIds[0]);
    // Each design gets 1 minute 20 seconds; the deck computes the clock times.
    const ranked=order.map(id=>({...designs.get(id),seconds:80}));
    return [...originals.slice(0,start),...ranked,...originals.slice(start+designIds.length)];
  }

  function wordmark(className) {
    const wrapper=element("span",className);
    const image=element("img");
    image.src="images/stairio-wordmark.svg";
    image.alt="Stairio";
    wrapper.append(image);
    return wrapper;
  }

  function renderIntro(data, slide, message) {
    const hero=element("div","stairio-hero");
    const brand=wordmark("stairio-brand");
    const copy=element("div","stairio-hero-copy");
    copy.append(element("h1","",data.title),element("p","lead",data.lead),element("p","hero-role",data.sub));
    const button=element("button","stairio-turn");
    button.type="button";
    button.setAttribute("aria-label","Play Stairio 360 product intro");
    const video=element("video");
    video.src="media/stairio-intro.mp4";
    video.poster="images/stairio-intro.webp";
    video.preload="metadata";
    video.muted=true;
    video.playsInline=true;
    video.setAttribute("aria-hidden","true");
    const hint=element("span","stairio-turn-hint","Click the robot or press Next");
    button.append(video,hint);
    hero.append(brand,copy,button);
    slide.append(hero);

    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    let started=reduced;
    const reveal=()=>{hero.dataset.revealed="true";};
    const play=()=>{
      started=true;
      if(!video.paused){video.pause();return;}
      if(video.ended || video.currentTime===0){
        hero.dataset.revealed=String(reduced);
        video.currentTime=0;
      }
      video.play().catch(error=>{
        if(error.name!=="AbortError"){
          reveal();
          message("The product intro clip couldn’t play.");
        }
      });
    };
    button.addEventListener("click",play);
    video.addEventListener("playing",()=>{hint.textContent="";});
    video.addEventListener("pause",()=>{hint.textContent=video.ended?"Replay product intro":"Resume product intro";});
    video.addEventListener("ended",()=>{reveal();hint.textContent="Replay product intro";});
    video.addEventListener("timeupdate",()=>{if(video.currentTime>=2.4)reveal();});
    if(reduced)reveal();
    return {play,started:()=>started};
  }

  function renderScene(slide) {
    const header=element("div","scene-header");
    const brand=wordmark("scene-brand");
    header.append(brand,element("h1","","The inspection scene"));
    const frame=element("iframe","stairio-scene");
    frame.src="inspection/index.html?lang=en&present=1";
    frame.title="Interactive Stairio stairwell inspection";
    frame.allow="fullscreen";
    slide.append(header,frame,element("p","scene-caption","Scroll through the floors or open a 360° capture. The scene and captures are simulated."));
    return frame;
  }

  window.stairioPresentation={orderedSlides, renderIntro, renderScene};
})();