/*!
 * SideMenu.js v0.0.1 (beta) ~ Copyright (c) 2013
 * Oscar Sobrevilla oscar.sobrevilla@gmail.com
 * Released under MIT license
 */
(function (win, doc) {

    // Object.create Polyfill
    if (!Object.create)
        Object.create = (function () {
            function F() {}
            return function (o) {
                F.prototype = o
                return new F()
            }
        })();

    var isTouch = "ontouchstart" in doc.documentElement,
        clsList = doc.documentElement.classList,
        extend = function (target, source) {
            for (var i in source)
                target[i] = source[i];
            return target;
        },
        addEvent = function () {
            if (win.addEventListener) {
                return function (el, type, fn) {
                    el.addEventListener(type, fn, false);
                };
            } else if (win.attachEvent) {
                return function (el, type, fn) {
                    el.attachEvent('on' + type, fn);
                };
            }
        }(),
        onceEvent = function (el, type, fn) {
            var _fn = function () {
                removeEvent(el, type, _fn);
                fn.apply(this, arguments);
            };
            addEvent(el, type, _fn);
        },
        removeEvent = function () {
            if (win.removeEventListener) {
                return function (el, type, fn) {
                    el.removeEventListener(type, fn, false);
                };
            } else if (win.detachEvent) {
                return function (el, type, fn) {
                    el.detachEvent('on' + type, fn);
                };
            }
        }(),
        dom = {
            create: function (tag) {
                return doc.createElement(tag);
            },
            addClass: clsList ?
                function (el, clsName) {
                    return el.classList.add(clsName);
            } : function (el, clsName) {
                if (!this.hasClass(el, clsName)) {
                    el.className += ' ' + clsName;
                    return true;
                }
            },
            removeClass: clsList ?
                function (el, clsName) {
                    el.classList.remove(clsName);
            } : function (el, clsName) {
                if (this.hasClass(el, clsName)) {
                    var reqex = new RegExp(' ' + clsName, 'g');
                    el.className = el.className.replace(reqex, '');
                    return true;
                }
                return false;
            },
            hasClass: clsList ?
                function (el, clsName) {
                    return el.classList.contains(clsName);
            } : function (el, clsName) {
                var reqex = new RegExp(clsName, 'g');
                return el.className ? !! (el.className.match(reqex)) : false;
            },
            setText: function (el, text) {
                while (el.firstChild !== null)
                    el.removeChild(el.firstChild); // remove all existing content
                el.appendChild(doc.createTextNode(text));
            }

        },
        dummyStyle = dom.create('div').style,
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
        })(),
        touchScroll = (function (el) {
            if (!isTouch) {
                return
            }
            var pos = 0,
                start = function (e) {
                    pos = this.scrollTop + e.touches[0].pageY;
                },
                move = function (e) {
                    this.scrollTop = pos - e.touches[0].pageY;
                    e.preventDefault();
                };
            addEvent(el, "touchstart", start);
            addEvent(el, "touchmove", move);
        });

    /**
     * Class represent a Menu element.
     * @constructor
     * @param {Array.<SMItem>} items form the menu.
     * @param {Object} options
     */

    var Menu = (function (items, options) {
        var that = this;
        this.options = {};
        extend(this.options, options);
        /** @expose */
        this.el = dom.create('div');
        dom.addClass(this.el, 'sm');
        dom.addClass(this.el, 'sm-added');
        touchScroll(this.el);
        if (this.options.title) {
            var domTitle = dom.create('div');
            dom.addClass(domTitle, 'sm-title');
            dom.setText(domTitle, this.title = this.options.title);
            this.el.appendChild(domTitle);
        }
        this._list = dom.create('div');
        this.el.appendChild(this._list);
        this.items = [];
        this.addItems(items, null);
        this.isOpen = false;
        this.parentItem = null;
    });

    extend(Menu.prototype, {

        _add: function (menuItem, index) {
            menuItem._setParent(this);
            this.items.splice(index, 0, menuItem);
            this._list.insertBefore(menuItem.el,
                this._list.hasChildNodes() ?
                this._list.childNodes.item(index) : null);
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
            this.el.style.zIndex = 2;
            if (typeof callback == 'function')
                onceEvent(this.el, TRNEND_EV, callback);
            dom.addClass(this.el, 'sm-show');
            return this;
        },
        _hide: function (callback) {
            if (this.isOpen)
                this.el.style.zIndex = 1;
            this.isOpen = false;    
            onceEvent(this.el, TRNEND_EV, function(){
                this.style.zIndex = '';
                callback && callback.apply(this, arguments);    
            });
            dom.removeClass(this.el, 'sm-show');
            return this;
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
            if (except && except === this) {} else {
                this._hide();
                if (this.parentItem && this.parentItem.parent)
                    this.parentItem.parent._closeWithParents(except);
            }
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
                this.sideMenu.history.add(parentsMenus[i]);
            }
        },
        /** @expose */
        addItem: function (menuItem, index) {
            this._add(menuItem, index === undefined ? this.items.length : index);
            this._refresh();
            return this;
        },
        /** @expose */
        addItems: function (menuItems, index) {
            if (!menuItems) 
                return;
            index = index === undefined ? this.items.length : index;
            for (var i = 0; i < menuItems.length; i+=1)
                this._add(menuItems[i], index + i);
            this._refresh();
            return this;
        },
        /** @expose */
        open: function () {
            if (this.isOpen)
                return this;
            var that = this,
                currentMenu = this._getCurrentMenu();
            currentMenu && currentMenu._hide();
            this._show(function () {
                if (currentMenu) {
                    currentMenu._closeWithParents(that);
                }
            });
            this._openParents();
            this._setCurrentMenu(this);
            this.sideMenu.history.add(this);
            return this;
        },
        /** @expose */
        close: function () {
            if (!this.isOpen)
                return this;
            this._getCurrentMenu() === this ?
                this.sideMenu.goBack() : this._hide();
            if (this.sideMenu.history.isEmpty())
                this._setCurrentMenu(null);
            return this;
        },
        /** @expose */
        getItemByIndex: function (index) {
            return this.items[index];
        },
        /** @expose */
        getItemByName: function (title) {
            var i, reg = new RegExp(title, "gi");
            for (i in this.items) {
                if (this.items[i].title && reg.test(this.items[i].title))
                    return this.items[i];
            }
            return null;
        },
        /** @expose */
        getSubMenuByName: function (title) {
            var item = this.getItemByName(title);
            return item ? item.subMenu : item;
        }
    });

    /**
     * Class represent a Side Menu element.
     * @constructor
     * @param {Array.<SMItem>} items form the menu.
     * @param {Object} options
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
    extend(SideMenu.prototype, {
        constructor: SideMenu,
        /** @override*/
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
        /** @expose */
        goBack: function () {
            var toInMenu = this.history.beforeLastStak(),
                toOutMenu = this.history.pop();
            this._setCurrentMenu(toInMenu || this);
            toOutMenu && toOutMenu._hide();
            toInMenu && toInMenu._show();
        },
        /** @expose 
            @override */
        close: function () {
            this.history.clear();
            this._closeWithChilds();
            this._setCurrentMenu(null);
        },
        /** @expose */
        toggle: function () {
            this.history.isEmpty() ? this.open() : this.close();
        },
        /** @expose */
        appendTo: function (target) {
            if (target)
                target instanceof win.jQuery ?
                    target.append(this.el) : target.appendChild(this.el);
            this._target = target;
            this._refresh();
            return this;
        },
        _refresh: function () {
            if (this._target) {
                var els = Array.prototype.slice.call(this._target.getElementsByClassName('sm-added')),
                    frag = doc.createDocumentFragment();
                for (var i = 0, el; el = els[i]; i++) {
                    dom.removeClass(el, 'sm-added');
                    frag.appendChild(el);
                }
                this._target.appendChild(frag);
            }
        }
    });

    /**
     * Class represent a Sub-Menu in SideMenu instance
     * @constructor
     * @param {Array.<SMItem>} items form the menu.
     * @param {Object} options
     * @extends {Menu}
     */

    var SideSubMenu = (function (items, options) {
        var that = this;
        Menu.call(this, items, extend(extend({}, SideSubMenu.options), options));
        if (this.options.back) {
            this._back = dom.create('div');
            dom.addClass(this._back, 'sm-back');
            addEvent(this._back, 'click', function (e) {
                e.preventDefault();
                that.sideMenu.goBack();
            });
            dom.setText(this._back, this.options.back);
            this.el.insertBefore(this._back, this.el.lastChild);
        }
        dom.addClass(this.el, 'sm-submenu');
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
     */

    var SMItem = (function () {
        /** @expose */
        this.el = dom.create('div');
        dom.addClass(this.el, 'sm-item');
        this.parent = null;
    });
    extend(SMItem.prototype, {

        _setParent: function (sideMenu) {
            this.parent = sideMenu;
        },
        /** @expose */
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
        /** @expose */
        moveToPosition: function (index) {
            if (this.parent)
                this.moveToMenu(this.parent, index);
        },
        /** @expose */
        remove: function () {
            if (this.parent) {
                var i;
                this.el.parentNode.removeChild(this.el);
                for (i in this.parent.items)
                    if (this.parent.items[i] === this)
                        this.parent.items.splice(i, 1);
            }
        }
    });

    /**
     * Class represent a item type label in SideMenu instance
     * @constructor
     * @param {String} title for item.
     * @param {String} clsName is CSS className (optional)
     * @extends {SMItem}
     */

    var SMLabelItem = (function (title, clsName) {
        if (title === undefined)
            throw 'Error in SMLabelItem: title param is undefined';
        SMItem.call(this);
        this.title = title;
        this._label = dom.create('div');
        dom.addClass(this._label, 'sm-item-label');
        if (clsName)
            dom.addClass(this._label, clsName);
        var icon = dom.create('span'),
            desc = dom.create('span');
        dom.addClass(icon, 'sm-label-icon');
        dom.addClass(desc, 'sm-label-text');
        dom.setText(desc, this.title);
        this._label.appendChild(icon);
        this._label.appendChild(desc);
        this.el.appendChild(this._label);
    })

    SMLabelItem.prototype = Object.create(SMItem.prototype);
    SMLabelItem.prototype.constructor = SMLabelItem;

    /**
     * Class represent a item type label but with a submenu
     * @constructor
     * @param {String} title for item.
     * @param {Array.<SMItem>} items form the submenu.
     * @param {String} clsName is CSS className (optional)
     * @extends {SMLabelItem}
     */

    var SMSubMenuItem = (function (title, items, clsName) {
        var that = this;
        SMLabelItem.call(this, title, clsName);
        dom.addClass(this.el, 'sm-item-more');
        addEvent(this._label, 'click', function (e) {
            e.stopPropagation();
            that.subMenu.open();
        });
        this.subMenu = new SideSubMenu(items, {
            title: title
        });
        this.subMenu._setParent(this);
        this.el.appendChild(this.subMenu.el);
    });

    SMSubMenuItem.prototype = Object.create(SMLabelItem.prototype);
    SMSubMenuItem.prototype.constructor = SMSubMenuItem;

    /**
     * Class represent a item type link native
     * @constructor
     * @param {String} title
     * @param {String} url
     * @param {String} target (optional)
     * @param {String} clsName is CSS className (optional)
     * @extends {SMLabelItem}
     */

    var SMLinkItem = (function (title, url, target, clsName) {
        if (!title || !url)
            throw 'Error in SMLinkItem: invalid title or url param';
        SMLabelItem.call(this, title);
        var link = dom.create('a');
        link.href = url;
        if (target)
            link.target = target;
        dom.addClass(link, 'sm-item-label')
        if (clsName)
            dom.addClass(link, clsName)
        while (this._label.hasChildNodes())
            link.appendChild(this._label.firstChild);
        this._label.parentNode.replaceChild(link, this._label);
        dom.addClass(this.el, 'sm-item-link');
    });

    SMLinkItem.prototype = Object.create(SMLabelItem.prototype);
    SMLinkItem.prototype.constructor = SMLinkItem;

    /**
     * Class represent a action button item
     * @constructor
     * @param {String} title
     * @param {Function} callback, when the button is clicked
     * @param {String} clsName is CSS className (optional)
     * @extends {SMLabelItem}
     */

    var SMButtonItem = (function (title, callback, clsName) {
        var that = this;
        SMLabelItem.call(this, title, clsName);
        dom.addClass(this.el, 'sm-item-button');
        addEvent(this.el, 'click', function (e) {
            callback && callback.call(this, e, that);
        });
    });

    SMButtonItem.prototype = Object.create(SMLabelItem.prototype);
    SMButtonItem.prototype.constructor = SMButtonItem;

    /* Add to namespace */

    // API exposed
    var api = ({
        'SideMenu': SideMenu,
        'SideSubMenu': SideSubMenu,
        'SMItem': SMItem,
        'SMLabelItem': SMLabelItem,
        'SMSubMenuItem': SMSubMenuItem,
        'SMButtonItem': SMButtonItem,
        'SMLinkItem': SMLinkItem
    });

    // Copy to namespace or object scope
    extend(this, api);

    // AMD
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return api;
        });
    }

}.call(this /* window namespace or other ex. utils, helpers, etc*/, window, document ));