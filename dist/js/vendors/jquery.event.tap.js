//https://github.com/jonpacker/jquery.tap

! function(e, t) {
	"use strict";
	var n, i, o, r = "._tap",
		a = "._tapActive",
		s = "tap",
		l = "clientX clientY screenX screenY pageX pageY".split(" "),
		c = {
			count: 0,
			event: 0
		},
		u = function(e, n) {
			var i = n.originalEvent,
				o = t.Event(i);
			o.type = e;
			for (var r = 0, a = l.length; r < a; r++) o[l[r]] = n[l[r]];
			return o
		},
		d = function(e) {
			if (e.isTrigger) return !1;
			var n = c.event,
				i = Math.abs(e.pageX - n.pageX),
				o = Math.abs(e.pageY - n.pageY),
				r = Math.max(i, o);
			return e.timeStamp - n.timeStamp < t.tap.TIME_DELTA && r < t.tap.POSITION_DELTA && (!n.touches || 1 === c.count) && f.isTracking
		},
		h = function(e) {
			if (!o) return !1;
			var n = Math.abs(e.pageX - o.pageX),
				i = Math.abs(e.pageY - o.pageY),
				r = Math.max(n, i);
			return Math.abs(e.timeStamp - o.timeStamp) < 750 && r < t.tap.POSITION_DELTA
		},
		p = function(e) {
			if (0 === e.type.indexOf("touch")) {
				e.touches = e.originalEvent.changedTouches;
				for (var t = e.touches[0], n = 0, i = l.length; n < i; n++) e[l[n]] = t[l[n]]
			}
			e.timeStamp = Date.now ? Date.now() : +new Date
		},
		f = {
			isEnabled: !1,
			isTracking: !1,
			enable: function() {
				f.isEnabled || (f.isEnabled = !0, n = t(e.body).on("touchstart" + r, f.onStart).on("mousedown" + r, f.onStart).on("click" + r, f.onClick))
			},
			disable: function() {
				f.isEnabled && (f.isEnabled = !1, n.off(r))
			},
			onStart: function(e) {
				e.isTrigger || (p(e), t.tap.LEFT_BUTTON_ONLY && !e.touches && 1 !== e.which || (e.touches && (c.count = e.touches.length), f.isTracking || !e.touches && h(e) || (f.isTracking = !0, c.event = e, e.touches ? (o = e, n.on("touchend" + r + a, f.onEnd).on("touchcancel" + r + a, f.onCancel)) : n.on("mouseup" + r + a, f.onEnd))))
			},
			onEnd: function(e) {
				var n;
				e.isTrigger || (p(e), d(e) && (n = u(s, e), i = n, t(c.event.target).trigger(n)), f.onCancel(e))
			},
			onCancel: function(e) {
				e && "touchcancel" === e.type && e.preventDefault(), f.isTracking = !1, n.off(a)
			},
			onClick: function(e) {
				if (!e.isTrigger && i && i.isDefaultPrevented() && i.target === e.target && i.pageX === e.pageX && i.pageY === e.pageY && e.timeStamp - i.timeStamp < 750) return i = null, !1
			}
		};
	t(e).ready(f.enable), t.tap = {
		POSITION_DELTA: 10,
		TIME_DELTA: 400,
		LEFT_BUTTON_ONLY: !0
	}
}(document, jQuery)
