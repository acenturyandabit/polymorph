function workflowy_stick(el){
    var viewport = window.visualViewport;
    const layoutSpanner = document.createElement("div"); 

    document.body.appendChild(layoutSpanner);

    layoutSpanner.style.position="fixed";
    layoutSpanner.style.width="100%";
    layoutSpanner.style.height="100%";
    layoutSpanner.style.visibility="hidden";

    function viewportHandler() {
        // Since the bar is position: fixed we need to offset it by the visual
        // viewport's offset from the layout viewport origin.
        var offsetX = viewport.offsetLeft;
        var offsetY = viewport.height
                    - layoutSpanner.getBoundingClientRect().height
                    + viewport.offsetTop;

        // You could also do this by setting style.left and style.top if you
        // use width: 100% instead.
        el.style.transform = 'translate(' + 
                                    offsetX + 'px,' +
                                    offsetY + 'px) ' +
                                    'scale(' + 1/viewport.scale + ')'
    }
    window.visualViewport.addEventListener('scroll', viewportHandler);
    window.visualViewport.addEventListener('resize', viewportHandler);
}