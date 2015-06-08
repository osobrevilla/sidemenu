// TapClick Hybrid EventHandler 
// Mouse Click and Touch Events

(function($) {


    var isTouch = 'ontouchstart' in window;

    $.event.special.tapclick = isTouch ? {
        
        distanceThreshold: 10,
        
        timeThreshold: 500,

        _fn: function(startEvent) {
            var that = this,
                $el = $(this);
            var target = startEvent.target,
                touchStart = startEvent.originalEvent.touches[0],
                startX = touchStart.pageX,
                startY = touchStart.pageY,
                threshold = $.event.special.tapclick.distanceThreshold,
                timeout;

            if (startEvent.originalEvent.touches.length > 1)
                return;

            function removeTapHandler() {
                clearTimeout(timeout);
                $el.off('touchmove', moveHandler).off('touchend', tapHandler);
                if ($el.attr('role') == 'button'){
                    $el.removeClass('tapped');
                }
            };

            function tapHandler(endEvent) {
                removeTapHandler();
                var touches = endEvent.originalEvent.touches;
                if ( touches && touches.length > 1)
                    return;
                if (target == endEvent.target) {
                    $.event.simulate('tapclick', that, endEvent);
                }
            };

            function moveHandler(moveEvent) {
                var touchMove = moveEvent.originalEvent.touches[0],
                    moveX = touchMove.pageX,
                    moveY = touchMove.pageY;

                if (Math.abs(moveX - startX) > threshold ||
                    Math.abs(moveY - startY) > threshold) {
                    removeTapHandler();
                }
            };


            timeout = setTimeout(removeTapHandler, $.event.special.tapclick.timeThreshold);

            $el.on('touchmove', moveHandler).on('touchend', tapHandler);

            if ($el.attr('role') == 'button'){
                $el.addClass('tapped');
            }

        },

        _default: function(e){
            e.preventDefault();
        },
        
        setup: function() { 
            var that = this;
            if (that.nodeName == 'A') {
                that.onclick = $.event.special.tapclick._default;
            }
            // Bind touch start
            $(that).on('touchstart', $.event.special.tapclick._fn);

        },

        remove: function(){
            var that = this;
            if (that.nodeName == 'A' && that.onclick === $.event.special.tapclick._default) {
                that.onclick = null;
            }
            $(that).off('touchstart', $.event.special.tapclick._fn);
        }

    } : {
        setup: function() {
            $(this).on("click", $.event.special.tapclick.click);
        },
        click: function(e) {
            e.type = "tapclick";
            $.event.dispatch.apply(this, arguments);
        },
        teardown: function() {
            $(this).off("click", $.event.special.tapclick.click);
        }
    }
})(jQuery);