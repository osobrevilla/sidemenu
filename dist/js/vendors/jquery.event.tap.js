
// jquery.event.tap
//
// 0.4
//
// Emits a tap event as soon as touchend is heard, as long as it's related
// touchstart was less than a certain time ago.
//
// This script makes an attempt to normalise touch events and the way browsers
// simulate mouse events. The point is to do away with simulated mouse events
// on touch devices, so that a site's touch interaction model can be treated
// differently from it's mouse interaction model. This kind of thing is fraut
// with danger. Check out PPK's round-up of touch event support, and my own
// touch event compatibility table:
// http://www.quirksmode.org/mobile/tableTouch.html
// http://labs.cruncher.ch/touch-events-compatibility-table/
//
// Simulated mouse events are prevented by:
// Android: cancelling them in the capture phase
// iOS: preventDefault on touchend
//
// Also, in iOS labels don't check or focus their associated checkboxes. This
// is normalised for checkboxes and radio buttons, but there is no known
// workaround for text inputs.


// Make jQuery copy touch event properties over to the jQuery event
// object, if they are not already listed.
(function(jQuery, undefined){
	var props = ["radiusX", "radiusY", "rotationAngle", "force", "touches", "targetTouches", "changedTouches"],
	    l = props.length;

	while (l--) {
		if (jQuery.event.props.indexOf(props[l]) === -1) {
			jQuery.event.props.push(props[l]);
		}
	}
})(jQuery);


(function(jQuery, undefined){
	var debug = false;

	var duration = 480,
	    amputateFlag = true,
	    cache = {};

	function preventDefault(e) {
		e.preventDefault();
	}

	function stopPropagation(e) {
		e.stopPropagation();
	}

	function amputateMouseEvents() {
		amputateFlag = false;

		// It's extreme, but stopping simulated events in the capture phase is one
		// way of getting dumb browsers to appear not to emit them.
		document.addEventListener('mousedown', stopPropagation, true);
		document.addEventListener('mousemove', stopPropagation, true);
		document.addEventListener('mouseup', stopPropagation, true);
		document.addEventListener('click', stopPropagation, true);
		document.addEventListener('mousedown', preventDefault, true);
		document.addEventListener('mousemove', preventDefault, true);
		document.addEventListener('mouseup', preventDefault, true);
		document.addEventListener('click', preventDefault, true);
	}

	function touchstart(e) {
		if (!e.changedTouches) {
			if (debug) { console.log('This event object has no changedTouches array.', e); }
			return;
		}

		jQuery.each(e.changedTouches, function(i, startTouch) {
			cache[startTouch.identifier] = {
				target: e.target,
				clientX: startTouch.clientX,
				clientY: startTouch.clientY,
				// Some browsers report timeStamp as a date object. Convert to ms.
				timeStamp: +e.timeStamp,
				preventDefault: e.preventDefault,
				checked: e.target.checked
			}
		});
	}

	function touchend(e) {
		jQuery.each(e.changedTouches, function(i, endTouch) {
			var startTouch = cache[endTouch.identifier];

			delete cache[endTouch.identifier];

			if (
				// If time since startTouch is less than duration
				+e.timeStamp < (startTouch.timeStamp + duration) &&

				// If targets are the same
				e.target === startTouch.target &&

				// If the touch has not moved more than 16px
				(Math.pow(endTouch.clientX - startTouch.clientX, 2) + Math.pow(endTouch.clientY - startTouch.clientY, 2)) < 256
			) {
				// Trigger a tap event
				jQuery(e.target).trigger({ type: 'tap', startData: startTouch });

				// Stop simulated mouse events in iOS, except for elements that
				// require it to focus.
				if (e.target.tagName.toLowerCase() !== 'select') {
					e.preventDefault();
				}

				// Android only cancels mouse events if preventDefault has been
				// called on touchstart. We can't do that. That stops scroll and other
				// gestures. Pants. Also, the default Android browser sends simulated
				// mouse events whatever you do. These browsers have something in common:
				// their touch identifiers are always 0.
				if (amputateFlag && endTouch.identifier === 0) {
					amputateMouseEvents();
				}
			}
		});
	}

	var actions = {
		a: function(target) {
			console.log(target.href);
			window.location = target.href;
		},

		input: function(target) {
			if (debug) { console.log('input type="'+target.type+'"'); }

			// Won't work in iOS, but does elsewhere.
			target.focus();

			if (target.type === "checkbox") {
				target.checked = !target.checked;
			}
			else if (target.type === "radio" && !target.checked) {
				target.checked = true;
			}
			else { return; }

			// Dumb browsers send a change event. They are not supposed to
			// when an input is changed programmatically. I suspect it's
			// part of the mouse event simulation. I'm not really worried
			// enough to fix it right now, though, and we do need to make
			// sure a change is sent in iOS, so trigger one anyway, after
			// touchend.
			setTimeout(function(){
			  var e = document.createEvent("HTMLEvents");

			  // type, bubbling, cancelable
			  e.initEvent('change', true, false );
			  target.dispatchEvent(e);
			}, 0);
		},

		select: function(target) {
			target.focus();
		},

		label: function(target) {
			var input = document.getElementById( target.getAttribute("for") );
			actions.input(input);
		}
	};

	jQuery.event.special.tap = {
		_default: function(e) {
			var target = jQuery(e.target).closest('a, label, input, select');

			// Ignore if the tap is not on an interactive element
			if (target.length === 0) { return; }

			actions[target[0].tagName.toLowerCase()](target[0]);
		}
	};

	jQuery(document)
	.on('touchstart', touchstart)
	.on('touchend', touchend);
})(jQuery);
