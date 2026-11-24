(()=>{
  "use strict";
  if(new URLSearchParams(location.search).get("present")!=="1" || parent===window)return;
  const forward=new Set(["ArrowDown","ArrowUp","ArrowLeft","ArrowRight","PageDown","PageUp"," ","Enter","Backspace","Home","End","F5","f","n","r","e","v","?","Escape"]);
  const send=data=>parent.postMessage({type:"stairio:presentation",...data},location.origin);
  window.addEventListener("keydown",event=>{
    if(event.defaultPrevented||event.isComposing||event.repeat||event.ctrlKey||event.altKey||event.metaKey||document.querySelector("dialog[open]"))return;
    const key=event.key.length===1&&event.key!==" " ? event.key.toLowerCase() : event.key;
    if(!forward.has(key)||event.shiftKey&&key!=="?"||key==="Escape"&&document.fullscreenElement)return;
    if(event.target?.closest?.("input,select,textarea,video,[contenteditable=true]")||
      ([" ","Enter"].includes(key)&&event.target?.closest?.("button,a[href],summary")))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    send({key});
  },true);
  window.addEventListener("pointermove",event=>send({pointerY:event.clientY}),{passive:true});
  window.addEventListener("pointerdown",event=>{if(event.pointerType==="touch") send({pointerY:event.clientY});},{passive:true});
})();