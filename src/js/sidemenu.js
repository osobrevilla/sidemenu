/*!
 * SideMenu.js v0.8.0 (beta) ~ Copyright (c) 2013
 * Oscar Sobrevilla oscar.sobrevilla@gmail.com
 * Released under MIT license
 */

(function(root, factory) {
	if (typeof define === "function" && define.amd) {
		// Now we're wrapping the factory and assigning the return
		// value to the root (window) and returning it as well to
		// the AMD loader.
		define(["jquery"], function($) {
			var api = factory($);
			$.extend(root, api);
			return api;
		});
	} else if (typeof module === "object" && module.exports) {
		// I've not encountered a need for this yet, since I haven't
		// run into a scenario where plain modules depend on CommonJS
		// *and* I happen to be loading in a CJS browser environment
		// but I'm including it for the sake of being thorough
		var $ = require("jquery");
		var api = factory($);
		$.extend(root, api);
		module.exports = api;
	} else {
		root.jQuery.extend(root, factory(root.jQuery));
	}
}(this, function($) {
	'use strict';
	// Object.create Polyfill
	if (!Object.create)
		Object.create = (function() {
			function F() {}
			return function(o) {
				F.prototype = o;
				return new F();
			};
		})();

	var isTouch = !!('ontouchstart' in window || navigator.maxTouchPoints),
		dummyStyle = document.createElement('div').style,
		vendor = (function() {
			var vendors = 't,webkitT,MozT,msT,OT'.split(','),
				t,
				i = 0,
				l = vendors.length;

			for (; i < l; i++) {
				t = vendors[i] + 'ransform';
				if (t in dummyStyle) {
					return vendors[i].substr(0, vendors[i].length - 1);
				}
			}
			return false;
		})(),
		TRNEND_EV = (function() {
			if (vendor === false) return false;
			var transitionEnd = {
				'': 'transitionend',
				'webkit': 'webkitTransitionEnd',
				'Moz': 'transitionend',
				'O': 'otransitionend',
				'ms': 'MSTransitionEnd'
			};
			return transitionEnd[vendor];
		})(),

		isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),


		pressEvent = $.event.special.tap ? 'tap' : 'click';

	var _cls = "";

	if (isTouch) {
		_cls += " sm-touch";
	} else {
		_cls += " sm-desktop";
	}

	if (isMobile)
		_cls += " sm-mobile";

	document.documentElement.className += _cls;


	function SMMenuOverlay() {
		this.$el = $('<div/>').addClass('sm-overlay');
		this.el = this.$el.get(0);
	}

	$.extend(SMMenuOverlay.prototype, {
		show: function() {
			this.$el.appendTo(document.body);
		},
		hide: function() {
			this.$el.detach();
		},
		destroy: function() {
			this.$el.remove();
		}
	});

	/**
	 * Class represent a Menu element.
	 * @class
	 * @param {SMItem[]} items - items of menu.
	 * @param {Object} options
	 * @param {string} options.title - The title of menu (optional)
	 */

	function Menu(items, options) {
		this.options = {};
		$.extend(this.options, options);
		/** @expose*/
		this.$el = $('<div/>').addClass('sm sm-added');
		this.$body = $('<div/>').addClass('sm-body').appendTo(this.$el);
		this.$scroller = $('<div/>').addClass('sm-scroller').appendTo(this.$body);
		this.$content = $('<div/>').addClass('sm-content').appendTo(this.$scroller);
		/** @expose*/
		this.el = this.$el.get(0);

		this.$scroller.on('scroll', function(e) {
			if (this.scrollHeight - this.scrollTop === this.clientHeight) {
				e.preventDefault();
				this.scrollTop = this.scrollTop - 1;
			} else if (this.scrollTop === 0)
				this.scrollTop = 1;
		});

		if (this.options.title)
			this.$content.append(
				$('<div/>')
				.addClass('sm-title')
				.text(this.title = this.options.title)
			);

		this.$list = $('<ul/>').appendTo(this.$content).get(0);
		this.items = [];
		this.addItems(items);
		this.isOpen = false;
		this.parentItem = null;
	}

	$.extend(Menu.prototype, {
		_add: function(menuItem, index) {
			menuItem._setParent(this);
			this.items.splice(index, 0, menuItem);
			if (this.$list.hasChildNodes()) {
				if (this.$list.childNodes[index])
					this.$list.insertBefore(menuItem.el, this.$list.childNodes.item(index));
				else {
					this.$list.appendChild(menuItem.el);
				}
			} else {
				this.$list.appendChild(menuItem.el);
			}
		},
		_refresh: function() {
			if (this.sideMenu)
				this.sideMenu._refresh();
		},
		_setParent: function(item_) {
			this.parentItem = item_;
		},
		_setCurrentMenu: function(menu) {
			this.sideMenu.currentMenu = menu;
		},
		_getCurrentMenu: function() {
			return this.sideMenu.currentMenu;
		},
		_show: function(callback) {
			this.isOpen = true;
			this.$el.css('z-index', 2);
			if (typeof callback == 'function')
				this._onTransitionEnd(callback);
			this.$el.addClass('sm-show');
			return this;
		},
		_hide: function(callback) {
			if (this.isOpen)
				this.$el.css('z-index', 1);
			this.isOpen = false;
			this._onTransitionEnd(function() {
				this.$el.css('z-index', '');
				if (typeof callback === 'function')
					callback.apply(this, arguments);
			});
			this.$el.removeClass('sm-show');
			return this;
		},
		_onTransitionEnd: function(callback) {
			var that = this;
			this.$el.one(TRNEND_EV, function(e) {
				if (typeof callback === 'function')
					callback.call(that, this, e);
			});
		},
		_hideSubMenus: function() {
			if (this.items && this.items.length)
				for (var i in this.items)
					if (this.items[i] instanceof SMSubMenuItem)
						this.items[i].subMenu._closeWithChilds();

		},
		_closeWithChilds: function() {
			this._hide();
			this._hideSubMenus();
		},
		_closeWithParents: function(except) {
			if (except !== this)
				this._hide();
			if (this.parentItem && this.parentItem.parent)
				this.parentItem.parent._closeWithParents(except);
		},
		_openParents: function() {
			this.sideMenu.history.clear();
			var parentsMenus = [];

			function open(parentItem) {
				if (parentItem && parentItem.parent) {
					parentsMenus.push(parentItem.parent);
					open(parentItem.parent.parentItem);
				}
			}
			open(this.parentItem);
			parentsMenus.reverse();
			for (var i in parentsMenus) {
				//parentNode.insertBefore(parentsMenus[i].el, this.el);
				this.sideMenu.history.add(parentsMenus[i]);
			}
		},
		/** @expose */
		addItem: function(menuItem, index) {
			this._add(menuItem, index === undefined ? this.items.length : index);
			this._refresh();
			return this;
		},
		/** @expose */
		addItems: function(menuItems, index) {
			if (!menuItems)
				return;
			index = index === undefined ? this.items.length : index;
			for (var i = 0; i < menuItems.length; i += 1)
				this._add(menuItems[i], index + i);
			this._refresh();
			return this;
		},
		/** @expose */
		open: function() {
			if (this.isOpen)
				return this;
			var currentMenu = this._getCurrentMenu(),
				overlay;
			if (currentMenu)
				currentMenu._hide();
			this._show(function() {
				if (currentMenu)
					currentMenu._closeWithParents(this);
			});
			this._openParents();
			this._setCurrentMenu(this);
			this.sideMenu.history.add(this);
			if (this.options.onOpen) {
				this.options.onOpen.call(this);
			}
			overlay = this.overlay || this.sideMenu && this.sideMenu.overlay;
			if (overlay)
				overlay.show();
			return this;
		},
		/** @expose */
		close: function() {
			if (!this.isOpen)
				return this;
			if (this._getCurrentMenu() === this)
				this.sideMenu.goBack();
			else this._hide();
			if (this.sideMenu.history.isEmpty())
				this._setCurrentMenu(null);
			if (this.options.onClose) {
				this.options.onClose.call(this);
			}
			return this;
		},
		/** @expose */
		clear: function() {
			this.$list.innerHTML = "";
			this.items = [];
			return this;
		},
		/** @expose */
		getItemByIndex: function(index) {
			return this.items[index];
		},
		/** @expose */
		getItemByName: function(title) {
			var i, reg = new RegExp(title, "gi");
			for (i in this.items) {
				if (this.items[i].title && reg.test(this.items[i].title))
					return this.items[i];
			}
			return null;
		},
		/** @expose */
		getSubMenuByName: function(title) {
			var item = this.getItemByName(title);
			return item ? item.subMenu : item;
		},
		destroy: function() {
			this.clear();
			this.$el.remove();
			if (this.overlay)
				this.overlay.destroy();
			if (this.parentItem) {
				this.parentItem.items.splice(this.parentItem.items.indexOf(this), 1);
			}
		}
	});

	/**
	 * Create a SideMenu instance
	 * @class
	 * @param {SMItem[]} items - The menu items
	 * @param {Object} options
	 * @constructor
	 * @extends Menu
	 */

	function SideMenu(items, options) {
		options = options || {};
		options.back = "";
		Menu.call(this, items, options);
		/** @expose*/
		this.history = {
			stacks: [],
			clear: function() {
				this.stacks = [];
			},
			add: function(obj) {
				if (obj)
					this.stacks.push(obj);
			},
			pop: function() {
				return this.stacks.pop();
			},
			beforeLastStak: function() {
				return this.stacks[this.stacks.length - 2];
			},
			isEmpty: function() {
				return this.stacks.length === 0;
			}
		};

		if (this.options.overlay) {
			this.overlay = new SMMenuOverlay();
			this.overlay.$el.on(isTouch ? 'touchstart' : pressEvent, this.close.bind(this));
		}

		this._target = null;
		this.sideMenu = this;
		this.currentMenu = null;
	}

	SideMenu.prototype = Object.create(Menu.prototype);
	$.extend(SideMenu.prototype, {
		constructor: SideMenu,
		/** @override*/
		_add: function(menuItem, index) {
			Menu.prototype._add.call(this, menuItem, index);
			function walkItems(parent, subMenu) {
				if (subMenu) {
					subMenu.sideMenu = parent;
					for (var i in subMenu.items) {
						if (subMenu.items[i] instanceof SMSubMenuItem)
							walkItems(parent, subMenu.items[i].subMenu);
					}
				}
			}
			walkItems(this, menuItem.subMenu);
		},
		_refresh: function() {
			if (this._target) this._target.append(
				this._target.find('.sm-added').removeClass('sm-added')
			);
		},
		/** @expose */
		goBack: function() {
			var toInMenu = this.history.beforeLastStak(),
				toOutMenu = this.history.pop();
			this._setCurrentMenu(toInMenu || this);
			if (toOutMenu) toOutMenu._hide();
			if (toInMenu) toInMenu._show();
		},
		/** @expose @override */
		close: function() {
			this.history.clear();
			this._closeWithChilds();
			this._setCurrentMenu(null);
			if (this.options.onClose) {
				this.options.onClose.call(this);
			}
			if (this.overlay)
				this.overlay.hide();
		},
		/** @expose */
		toggle: function() {
			if (this.history.isEmpty()) this.open();
			else this.close();
		},
		/** @expose */
		appendTo: function(target) {
			this._target = $(target).append(this.$el);
			this._refresh();
			return this;
		}
	});

	/**
	 * Create a instance of SubMenu
	 * @class
	 * @param {SMItem[]} items - The menu items
	 * @param {Object} options
	 * @constructor
	 * @extends Menu
	 * @description Class represent a SubMenu in SideMenu instance
	 */

	var SideSubMenu = (function(items, options) {
		var that = this;
		Menu.call(this, items, $.extend({}, SideSubMenu.options, options));
		if (this.options.back)
			this._back = $('<li/>')
			.addClass('sm-back')
			.on(pressEvent, function(e) {
				e.preventDefault();
				that.sideMenu.goBack();
			})
			.text(this.options.back);
		if (this._back)
			this.$content.prepend(this._back);
		this.$el.addClass('sm-submenu');
		this.sideMenu = null;
	});

	SideSubMenu.options = ({
		back: 'back'
	});

	SideSubMenu.prototype = Object.create(Menu.prototype);
	SideSubMenu.prototype.constructor = SideSubMenu;

	/**
	 * Create a instance of SMItem
	 * @class
	 */

	function SMItem() {
		/** @expose*/
		this.$el = $('<li/>').addClass('sm-item');
		/** @expose*/
		this.el = this.$el.get(0);
		this.parent = null;
	}

	$.extend(SMItem.prototype, {
		_setParent: function(sideMenu) {
			this.parent = sideMenu;
		},
		/** @expose */
		moveToMenu: function(menuTarget, index) {
			var i, menuItem, items = this.parent.items;
			if (menuTarget instanceof Menu) {
				i = items.indexOf(this);
				if (i !== -1) {
					menuItem = items[i];
					items.splice(i, 1);
					menuTarget.addItem(menuItem, index);
				}
			}
		},
		/** @expose */
		moveToPosition: function(index) {
			if (this.parent)
				this.moveToMenu(this.parent, index);
		},
		/** @expose */
		remove: function() {
			if (this.parent) {
				var i, items = this.parent.items;
				this.$el.remove();
				if ((i = items.indexOf(this)) !== -1)
					items.splice(i, 1);
			}
		}
	});

	/**
	 * Create a instance of SMLabelItem
	 * @class
	 * @param {string} title for item.
	 * @param {string} className is CSS className (optional)
	 * @extends SMItem
	 */

	function SMLabelItem(title, className) {
		if (title === undefined)
			throw 'Error in SMLabelItem: title param is undefined';
		SMItem.call(this);
		this.title = title;
		this.dom = this.dom || {};
		this.dom.title = $('<span/>').addClass('sm-label-text').text(this.title);
		this.$el.append(
			this._label = $('<div/>')
			.addClass('sm-item-label')
			.addClass(className)
			.append($('<span/>').addClass('sm-label-icon'))
			.append(this.dom.title)
		);
	}

	SMLabelItem.prototype = Object.create(SMItem.prototype);
	SMLabelItem.prototype.constructor = SMLabelItem;
	SMLabelItem.prototype.setTitle = function(title) {
		this.dom.title.text(title);
	};

	/**
	 * Class represent a item type label but with a submenu
	 * @class
	 * @param {string} title - the item title.
	 * @param {SMItem[]} items - A list of items.
	 * @param {string} className - A CSS className (optional)
	 * @extends SMLabelItem
	 * @description is a submenu item
	 */

	function SMSubMenuItem(title, items, className) {
		var that = this;
		SMLabelItem.call(this, title, className);
		this.$el.addClass('sm-item-more');
		this._label.on(pressEvent, function(e) {
			e.stopPropagation();
			that.subMenu.open();
		});
		this.subMenu = new SideSubMenu(items, {
			title: title
		});
		this.subMenu._setParent(this);
		this.$el.append(this.subMenu.el);
	}

	SMSubMenuItem.prototype = Object.create(SMLabelItem.prototype);
	SMSubMenuItem.prototype.constructor = SMSubMenuItem;


	/**
	 * Create a instance of SMLinkItem
	 * @class
	 * @param {string} title
	 * @param {string} url
	 * @param {string} [target] (optional)
	 * @param {string} [className] - is CSS className (optional)
	 * @extends SMLabelItem
	 */

	function SMLinkItem(title, url, target, className) {
		if (!title || !url)
			throw 'Error in SMLinkItem: invalid title or url param';
		SMLabelItem.call(this, title);
		this._label.replaceWith(
			$('<a/>', {
				href: url,
				target: target
			})
			.addClass('sm-item-label')
			.addClass(className)
			.append(this._label.contents())
		);
		this.$el.addClass('sm-item-link');
	}

	SMLinkItem.prototype = Object.create(SMLabelItem.prototype);
	SMLinkItem.prototype.constructor = SMLinkItem;

	/**
	 * Class represent a action button item
	 * @class
	 * @param {string} - The text of button
	 * @callback onPress - The callback execute when the button is pressed (click|tap)
	 * @param {string} className is CSS className (optional)
	 * @extends SMLabelItem
	 */

	function SMButtonItem(title, onPress, className, id) {
		var that = this;
		SMLabelItem.call(this, title, className);
		this.id = id || null;
		this.$el.addClass('sm-item-button');
		this.$el.on(pressEvent, function(e) {
			if (typeof onPress === 'function')
				onPress.call(that, this);
		});
	}

	SMButtonItem.prototype = Object.create(SMLabelItem.prototype);
	SMButtonItem.prototype.constructor = SMButtonItem;

	function SMUserAccountItem(name, src) {
		SMItem.call(this); // Call SMItem constructor
		// this.$el is jQuery item object that works how wrapper
		this.$el.addClass('sm-item-useraccount');
		this.$el.append(
			this.photo = $('<img/>')
			.addClass('sm-useraccount-photo')
			.attr({
				src: src
			})
		);
		this.$el.append(
			this.name = $('<div/>')
			.addClass('sm-useraccount-name')
			.text(name)
		);
	}
	// Extend prototype from SMItem
	SMUserAccountItem.prototype = Object.create(SMItem.prototype);
	SMUserAccountItem.prototype.constructor = SMUserAccountItem;

	function SMSeparatorItem(name, email) {
		SMItem.call(this); // Call SMItem constructor
		// this.$el is jQuery item object that works how wrapper
		this.$el.addClass('sm-item-separator');
		this.$el.append(
			this.name = $('<div/>')
			.addClass('sm-item-separator-name')
			.text(name || '')
		);
	}

	// Extend prototype from SMItem
	SMSeparatorItem.prototype = Object.create(SMItem.prototype);
	SMSeparatorItem.prototype.constructor = SMSeparatorItem;
	/* Add to namespace */

	// API expose
	var api = {
		SideMenu: SideMenu,
		SideSubMenu: SideSubMenu,
		SMItem: SMItem,
		SMLabelItem: SMLabelItem,
		SMSubMenuItem: SMSubMenuItem,
		SMButtonItem: SMButtonItem,
		SMLinkItem: SMLinkItem,
		SMUserAccountItem: SMUserAccountItem,
		SMSeparatorItem: SMSeparatorItem,
		pressEvent: pressEvent
	};

	return api;
}));
