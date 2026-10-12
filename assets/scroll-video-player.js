// Native players in standalone pages use the same scroll behavior as portfolio clips.
(() => {
    const attached = new WeakSet();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function attach(video) {
        if (attached.has(video)) return;
        attached.add(video);
        video.muted = true;
        video.playsInline = true;
        let visible = false;
        let userPaused = false;
        const sync = () => {
            if (visible && !document.hidden && !reducedMotion.matches && !userPaused && !video.ended) {
                void video.play().catch(() => {});
            } else video.pause();
        };
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
            if (!visible) userPaused = false;
            sync();
        }, { threshold: [0, 0.35] });
        video.addEventListener('pause', () => {
            if (visible && !document.hidden && !reducedMotion.matches && !video.ended) userPaused = true;
        });
        video.addEventListener('play', () => {
            if (!visible || document.hidden) video.pause();
            else userPaused = false;
        });
        video.addEventListener('loadedmetadata', sync);
        document.addEventListener('visibilitychange', sync);
        reducedMotion.addEventListener('change', sync);
        observer.observe(video);
    }
    const scan = () => document.querySelectorAll('video[controls]').forEach(attach);
    scan();
    new MutationObserver(scan).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['controls'],
    });
})();
