/*!
 * SideMenu.js v0.0.1 (beta) ~ Copyright (c) 2013
 * Oscar Sobrevilla oscar.sobrevilla@gmail.com
 * Released under MIT license
 */
(function ($, undefined) {
    // 'use strict';
    var isTouch = "ontouchstart" in document.documentElement,
        dummyStyle = document.createElement('div').style,
        vendor = (function () {
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
        TRNEND_EV = (function () {
            if (vendor === false) return false;
            var transitionEnd = {
                '': 'transitionend',
                'webkit': 'webkitTransitionEnd',
                'Moz': 'transitionend',
                'O': 'otransitionend',
                'ms': 'MSTransitionEnd'
            };
            return transitionEnd[vendor];
        })();

    // Object.create Polyfill
    if (!Object.create)
        Object.create = (function () {
            function F() {}
            return function (o) {
                F.prototype = o
                return new F()
            }
        })();

    // Scroll Handler for mobile devices
    var touchScroll = (function (id) {
        if (!isTouch) {
            return
        }
        var pos = 0,
            start = function (event) {
                var e = event.originalEvent;
                pos = this.scrollTop + e.touches[0].pageY;
            },
            move = function (event) {
                var e = event.originalEvent;
                this.scrollTop = pos - e.touches[0].pageY;
                e.preventDefault();
            };
        $(id).on("touchstart", start).on("touchmove", move);
    });

    /**
     * Class represent a Menu element.
     * @param {Array.<SMItem>} items form the menu.
     * @param {Object} options
     * @constructor
     * @extends {Object}
     */

    var Menu = (function (items, options) {
        var that = this;
        this.options = {};
        $.extend(this.options, options);
        this._el = $('<div/>').addClass('sm sm-added');
        this.el = this._el.get(0);
        touchScroll(this.el);
        if (this.options.title)
            this._el.append(
                $('<div/>')
                .addClass('sm-title')
                .text(this.title = this.options.title)
            );
        this._list = $('<div/>').appendTo(this._el).get(0);
        this.items = [];
        this.addItems(items);
        this.isOpen = false;
        this.parentItem = null;
    });

    Menu.prototype = ({
        constructor: Menu,
        _add: function (menuItem, index) {
            index = index === undefined ? this.items.length : index;
            menuItem._setParent(this);
            this.items.splice(index, 0, menuItem);
            this._list.insertBefore(menuItem.el,
                this._list.hasChildNodes() ?
                this._list.childNodes[index] : null);
        },
        _refresh: function () {
            this.sideMenu && this.sideMenu._refresh()
        },
        _setParent: function (item_) {
            this.parentItem = item_;
        },
        _setCurrentMenu: function (menu) {
            this.sideMenu.currentMenu = menu;
        },
        _getCurrentMenu: function () {
            return this.sideMenu.currentMenu;
        },
        _show: function (callback) {
            this.isOpen = true;
            if (typeof callback == 'function')
                this._onTransitionEnd(callback);
            this._el.addClass('sm-show');
            return this;
        },
        _hide: function (callback) {
            this.isOpen = false;
            this._el.removeClass('sm-show');
            return this;
        },
        _onTransitionEnd: function (callback) {
            var that = this;
            this._el.one(TRNEND_EV, function (e) {
                callback && callback.call(that, this, e);
            });
        },
        _hideSubMenus: function () {
            if (this.items && this.items.length)
                for (var i in this.items)
                    if (this.items[i] instanceof SMSubMenuItem)
                        this.items[i].subMenu._closeWithChilds();

        },
        _closeWithChilds: function () {
            this._hide();
            this._hideSubMenus();
        },
        _closeWithParents: function (except) {
            except !== this && this._hide();
            if (this.parentItem && this.parentItem.parent)
                this.parentItem.parent._closeWithParents(except);
        },
        _openParents: function () {
            this.sideMenu.history.clear();
            var parentNode = this.el.parentNode,
                parentsMenus = [];
            (function (parentItem) {
                if (parentItem && parentItem.parent) {
                    parentsMenus.push(parentItem.parent);
                    arguments.callee(parentItem.parent.parentItem);
                }
            }(this.parentItem));
            parentsMenus.reverse();
            for (var i in parentsMenus) {
                parentNode.insertBefore(parentsMenus[i].el, this.el);
                this.sideMenu.history.add(parentsMenus[i]);
            }
        },
        addItem: function (menuItem, index) {
            this._add(menuItem, index);
            this._refresh();
            return this;
        },
        addItems: function (menuItems, index) {
            var i;
            for (i in menuItems)
                this._add(menuItems[i], index + i);
            this._refresh();
            return this;
        },
        open: function () {
            if (this.isOpen)
                return this;
            var that = this,
                currentMenu = this._getCurrentMenu();
            this.el.parentNode.appendChild(this.el);
            this.isOpen = true;
            setTimeout(function () {
                currentMenu && currentMenu._hide();
                that._show(function () {
                    currentMenu && currentMenu._closeWithParents(that);
                });
            }, 25);
            this._openParents();
            this._setCurrentMenu(this);
            this.sideMenu.history.add(this);
            return this;
        },
        close: function () {
            if (!this.isOpen)
                return this;
            this._getCurrentMenu() === this ?
                this.sideMenu.goBack() : this._hide();
            if (this.sideMenu.history.isEmpty())
                this._setCurrentMenu(null);
            return this;
        },
        toggle: function () {
            this.isOpen ? this.close() : this.open();
        },
        getItemByIndex: function (index) {
            return this.items[index];
        },
        getItemByName: function (title) {
            var i, reg = new RegExp(title, "gi");
            for (i in this.items) {
                if (this.items[i].title && reg.test(this.items[i].title))
                    return this.items[i];
            }
            return null;
        },
        getSubMenuByName: function (title) {
            var item = this.getItemByName(title);
            return item ? item.subMenu : item;
        }
    });

    /**
     * Class represent a Side Menu element.
     * @param {Array.<SMItem>} items form the menu.
     * @param {Object} options
     * @constructor
     * @extends {Menu}
     */

    var SideMenu = (function (items, options) {
        options = options || {};
        options.back = "";
        Menu.call(this, items, options);
        this.history = {
            stacks: [],
            clear: function () {
                this.stacks = [];
            },
            add: function (obj) {
                if (obj)
                    this.stacks.push(obj);
            },
            pop: function () {
                return this.stacks.pop();
            },
            beforeLastStak: function () {
                return this.stacks[this.stacks.length - 2];
            },
            isEmpty: function () {
                return this.stacks.length === 0;
            }
        };
        this._target = null;
        this.sideMenu = this;
        this.currentMenu = null;
    });

    SideMenu.prototype = Object.create(Menu.prototype);
    $.extend(SideMenu.prototype, {
        constructor: SideMenu,
        _add: function (menuItem, index) {
            Menu.prototype._add.call(this, menuItem, index);
            (function (subMenu) {
                if (subMenu) {
                    subMenu.sideMenu = this;
                    for (var i in subMenu.items) {
                        if (subMenu.items[i] instanceof SMSubMenuItem)
                            arguments.callee.call(this, subMenu.items[i].subMenu)
                    }
                }
            }.call(this, menuItem.subMenu));
        },
        goBack: function () {
            var toInMenu = this.history.beforeLastStak(),
                toOutMenu = this.history.pop();
            this._setCurrentMenu(toInMenu || this);
            toOutMenu && toOutMenu._hide();
            toInMenu && toInMenu._show();
        },
        close: function () {
            this.history.clear();
            this._closeWithChilds();
            this._setCurrentMenu(null);
        },
        appendTo: function (target) {
            this._target = $(target).append(this._el);
            this._refresh();
            return this;
        },
        _refresh: function () {
            this._target && this._target.append(
                this._target.find('.sm-added').removeClass('sm-added')
            );
        }
    });

    /**
     * Class represent a Sub-Menu in SideMenu instance
     * @param {Array.<SMItem>} items form the menu.
     * @param {Object} options
     * @constructor
     * @extends {Menu}
     */

    var SideSubMenu = (function (items, options) {
        var that = this;
        Menu.call(this, items, $.extend({}, SideSubMenu.options, options));
        if (this.options.back)
            this._back = $('<div/>')
                .addClass('sm-back')
                .on('click', function (e) {
                    e.preventDefault();
                    that.sideMenu.goBack();
                })
                .text(this.options.back);
        this._back.insertBefore(this.el.lastChild);
        this._el.addClass('sm-submenu');
        this.sideMenu = null;
    });

    SideSubMenu.options = ({
        back: 'back'
    });

    SideSubMenu.prototype = Object.create(Menu.prototype);
    SideSubMenu.prototype.constructor = SideSubMenu;

    /**
     * Class represent a item in Menu instance
     * @constructor
     * @extends {Object}
     */

    var SMItem = (function () {
        this._el = $('<div/>').addClass('sm-item')
        this.el = this._el.get(0);
        this.parent = null;
    });
    $.extend(SMItem.prototype, {
        constructor: SMItem,
        _setParent: function (sideMenu) {
            this.parent = sideMenu;
        },
        moveToMenu: function (menuTarget, index) {
            var i, menuItem;
            if (menuTarget instanceof Menu) {
                for (i in this.parent.items) {
                    if (this.parent.items[i] === this) {
                        menuItem = this.parent.items[i];
                        this.parent.items.splice(i, 1);
                        break;
                    }
                }
                menuTarget.addItem(menuItem, index);
            }
        },
        moveToPosition: function (index) {
            if (this.parent)
                this.moveToMenu(this.parent, index);
        },
        remove: function () {
            if (this.parent) {
                var i;
                this._el.remove();
                for (i in this.parent.items)
                    if (this.parent.items[i] === this)
                        this.parent.items.splice(i, 1);
            }
        }
    });

    /**
     * Class represent a item type label in SideMenu instance
     * @param {String} title for item.
     * @param {String} clsName is CSS className (optional)
     * @constructor
     * @extends {SMItem}
     */

    var SMLabelItem = (function (title, clsName) {
        if (title === undefined)
            throw 'Error in SMLabelItem: title param is undefined';
        SMItem.call(this);
        this.title = title;
        this._el.append(
            this._label = $('<div/>')
            .addClass('sm-item-label')
            .addClass(clsName)
            .append($('<span/>').addClass('sm-label-icon'))
            .append($('<span/>').addClass('sm-label-text').text(this.title))
        );
    })

    SMLabelItem.prototype = Object.create(SMItem.prototype);
    SMLabelItem.prototype.constructor = SMLabelItem;

    /**
     * Class represent a item type label but with a submenu
     * @param {String} title for item.
     * @param {Array.<SMItem>} items form the submenu.
     * @param {String} clsName is CSS className (optional)
     * @constructor
     * @extends {SMLabelItem}
     */

    var SMSubMenuItem = (function (title, items, clsName) {
        var that = this;
        SMLabelItem.call(this, title, clsName);
        this._el.addClass('sm-item-more');
        this._label.on('click', function (e) {
            e.stopPropagation();
            that.subMenu.open();
        });
        this.subMenu = new SideSubMenu(items, {
            title: title
        });
        this.subMenu._setParent(this);
        this._el.append(this.subMenu.el);
    });

    SMSubMenuItem.prototype = Object.create(SMLabelItem.prototype);
    SMSubMenuItem.prototype.constructor = SMSubMenuItem;

    /**
     * Class represent a item type link native
     * @param {String} title
     * @param {String} url
     * @param {String} target (optional)
     * @param {String} clsName is CSS className (optional)
     * @constructor
     * @extends {SMLabelItem}
     */

    var SMLinkItem = (function (title, url, target, clsName) {
        if (!title || !url)
            throw 'Error in SMLinkItem: invalid title or url param';
        SMLabelItem.call(this, title);
        this._label.replaceWith(
            $('<a/>', {
                href: url,
                target: target
            })
            .addClass('sm-item-label')
            .addClass(clsName)
            .append(this._label.contents())
        );
        this._el.addClass('sm-item-link');
    });

    SMLinkItem.prototype = Object.create(SMLabelItem.prototype);
    SMLinkItem.prototype.constructor = SMLinkItem;

    /**
     * Class represent a action button item
     * @param {String} title
     * @param {Function} callback, when the button is clicked
     * @param {String} clsName is CSS className (optional)
     * @constructor
     * @extends {SMLabelItem}
     */

    var SMButtonItem = (function (title, callback, clsName) {
        var that = this;
        SMLabelItem.call(this, title, clsName);
        this._el.addClass('sm-item-button');
        this._el.on('click', function (e) {
            callback && callback.call(this, e, that);
        });
    });

    SMButtonItem.prototype = Object.create(SMLabelItem.prototype);
    SMButtonItem.prototype.constructor = SMButtonItem;

    /* Add to namespace */

    // API exposed
    var api = ({
        SideMenu: SideMenu,
        SideSubMenu: SideSubMenu,
        SMItem: SMItem,
        SMLabelItem: SMLabelItem,
        SMSubMenuItem: SMSubMenuItem,
        SMButtonItem: SMButtonItem,
        SMLinkItem: SMLinkItem
    });

    // Copy to namespace or object scope
    $.extend(this, api);


}.call(this /* window namespace or other ex. utils, helpers, etc*/ , window.jQuery));