/*!
 * SideMenu.js v0.0.1 (beta) ~ Copyright (c) 2013
 * Oscar Sobrevilla oscar.sobrevilla@gmail.com
 * Released under MIT license
 */
(function ($, undefined) {

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
        var pos = 0;
        $(id).on("touchstart", function (event) {
            var e = event.originalEvent;
            pos = this.scrollTop + e.touches[0].pageY;
        }).on("touchmove", function (event) {
            var e = event.originalEvent;
            this.scrollTop = pos - e.touches[0].pageY;
            e.preventDefault();
        });
    });

    /**
     * Class Menu
     */

    var Menu = (function (items, options) {
        var that = this;
        this.options = $.extend({}, Menu.options, options);
        this._el = $('<div/>').addClass('sm sm-added');
        this._list = $('<div/>').appendTo(this._el).get(0);
        this.el = this._el.get(0);
        touchScroll(this.el);
        this.items = [];
        this.addItems(items);
        if (this.options.back)
            this._back = $('<div/>').addClass('sm-back')
                .on('click', function (e) {
                    e.preventDefault();
                    that.goBack();
                })
                .text(this.options.back);
        this._el.prepend(this._back);
        if (this.options.title)
            this._el.prepend(
                $('<div/>')
                .addClass('sm-title')
                .text(this.title = this.options.title)
            );
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
            this._el.addClass('sm-show');
            if (typeof callback == 'function')
                this._onTransitionEnd(callback);
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
            if (this.items && this.items.length) {
                for (var i in this.items) {
                    if (this.items[i] instanceof SMSubMenuItem) {
                        this.items[i].subMenu._hide();
                        arguments.callee.call(this.items[i].subMenu)
                    }
                }
            }
        },
        _closeInChain: function () {
            this._hide();
            (function (parentItem) {
                if (parentItem && parentItem.parent) {
                    parentItem.parent._hide();
                    arguments.callee(parentItem.parent.parentItem);
                }
            }(this.parentItem));
        },
        _openInChain: function () {
            var parents = [];
            (function (parentItem) {
                if (parentItem && parentItem.parent) {
                    parents.push(parentItem.parent);
                    arguments.callee(parentItem.parent.parentItem);
                }
            }(this.parentItem));
            parents.reverse();
            this.sideMenu.history.clear();
            for (var i in parents) {
                parents[i]._el.insertBefore(this.el);
                this.sideMenu.history.add(parents[i]);
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
        goBack: function () {
            var toInMenu = this.sideMenu.history.beforeLastStak(),
                toOutMenu = this.sideMenu.history.pop();
            this._setCurrentMenu(toInMenu || this.sideMenu);
            toOutMenu && toOutMenu._hide();
            toInMenu && toInMenu._show();
        },
        open: function (step) {
            var that = this;
            if (this.sideMenu.currentMenu === this)
                return;
            this._el.appendTo(this._el.parent());
            var currentMenu = this._getCurrentMenu();
            !step && this._openInChain();
            setTimeout(function () {
                currentMenu && currentMenu._hide();
                that._show(function () {
                    currentMenu && currentMenu._closeInChain();
                });
            },25);
            this._setCurrentMenu(this);
            this.sideMenu.history.add(this);
            return this;
        },
        close: function () {
            this._getCurrentMenu() === this ?
                this.goBack() : this._hide();
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

    Menu.options = ({
        back: 'back'
    });

    /**
     * Class SideMenu
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
        open: function () {
            this.history.clear();
            if (this.currentMenu) {
                var currentMenu = this.currentMenu;
                this._show(function () {
                    this._hideSubMenus();
                });
                this._setCurrentMenu(this);
                this.sideMenu.history.add(this);
            } else {
                Menu.prototype.open.call(this);
            }
        },
        close: function () {
            this.history.clear();
            this._setCurrentMenu(null);
            Menu.prototype.close.call(this);
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
     * Class SideSubMenu
     */

    var SideSubMenu = (function (items, options) {
        Menu.apply(this, arguments);
        this._el.addClass('sm-submenu');
        this.sideMenu = null;
    });

    SideSubMenu.prototype = Object.create(Menu.prototype);
    SideSubMenu.prototype.constructor = SideSubMenu;

    /**
     * Class SMItem
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
     * Class SMLabelItem
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
     * Class SMSubMenuItem
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
     * Class SMLinkItem
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
     * Class SMButtonItem
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

    $.extend(this, {
        SideMenu: SideMenu,
        SideSubMenu: SideSubMenu,
        SMItem: SMItem,
        SMLabelItem: SMLabelItem,
        SMSubMenuItem: SMSubMenuItem,
        SMButtonItem: SMButtonItem,
        SMLinkItem: SMLinkItem
    });

}.call(this /* window namespace or other ex. utils, helpers, etc*/ , window.jQuery));
