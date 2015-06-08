/*!
 * SideMenu.js v0.1 (beta) ~ Copyright (c) 2013
 * Oscar Sobrevilla oscar.sobrevilla@gmail.com
 * Released under MIT license
 */

(function($) {

    function create($) {

        // Object.create Polyfill
        if (!Object.create)
            Object.create = (function() {
                function F() {}
                return function(o) {
                    F.prototype = o
                    return new F()
                }
            })();

        var isTouch = "ontouchstart" in document.documentElement,
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

            // Scroll Handler for mobile devices
            touchScroll = (function(id) {
                if (!isTouch) {
                    return
                }
                var pos = 0,
                    start = function(event) {
                        var e = event.originalEvent;
                        pos = this.scrollTop + e.touches[0].pageY;
                    },
                    move = function(event) {
                        var e = event.originalEvent;
                        this.scrollTop = pos - e.touches[0].pageY;
                        e.preventDefault();
                    };
                return $(id).on("touchstart", start).on("touchmove", move);
            });

        /**
         * Class represent a Menu element.
         * @constructor
         * @param {Array.<SMItem>} items form the menu.
         * @param {Object} options
         */

        var Menu = (function(items, options) {
            var that = this;
            this.options = {};
            $.extend(this.options, options);
            /** @expose*/
            this.$el = $('<div/>').addClass('sm sm-added');
            /** @expose*/
            this.el = this.$el.get(0);
            this.tscroll = touchScroll(this.el);
            if (this.options.title)
                this.$el.append(
                    $('<div/>')
                    .addClass('sm-title')
                    .text(this.title = this.options.title)
                );
            this.$list = $('<div/>').appendTo(this.$el).get(0);
            this.items = [];
            this.addItems(items);
            this.isOpen = false;
            this.parentItem = null;
        });

        $.extend(Menu.prototype, {
            _add: function(menuItem, index) {
                menuItem._setParent(this);
                this.items.splice(index, 0, menuItem);
                if (this.$list.hasChildNodes()) {
                    if (this.$list.childNodes[index])
                        this.$list.insertBefore(menuItem.el, this.$list.childNodes.item(index))
                    else {
                        this.$list.appendChild(menuItem.el);
                    }
                } else {
                    this.$list.appendChild(menuItem.el);
                }
            },
            _refresh: function() {
                if (this.sideMenu)
                    this.sideMenu._refresh()
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
                    callback && callback.apply(this, arguments);
                });
                this.$el.removeClass('sm-show');
                return this;
            },
            _onTransitionEnd: function(callback) {
                var that = this;
                this.$el.one(TRNEND_EV, function(e) {
                    callback && callback.call(that, this, e);
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
                except !== this && this._hide();
                if (this.parentItem && this.parentItem.parent)
                    this.parentItem.parent._closeWithParents(except);
            },
            _openParents: function() {
                this.sideMenu.history.clear();
                var parentNode = this.el.parentNode,
                    parentsMenus = [];
                (function(parentItem) {
                    if (parentItem && parentItem.parent) {
                        parentsMenus.push(parentItem.parent);
                        arguments.callee(parentItem.parent.parentItem);
                    }
                }(this.parentItem));
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
                var that = this,
                    currentMenu = this._getCurrentMenu();
                currentMenu && currentMenu._hide();
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
                return this;
            },
            /** @expose */
            close: function() {
                if (!this.isOpen)
                    return this;
                this._getCurrentMenu() === this ?
                    this.sideMenu.goBack() : this._hide();
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
                var i;
                this.clear();
                this.$el.remove();
                if (this.parentItem){
                    this.parentItem.items.splice(this.parentItem.items.indexOf(this), 1);
                }
            }
        });

        /**
         * Class represent a Side Menu element.
         * @param {Array.<SMItem>} items form the menu.
         * @param {Object} options
         * @constructor
         * @extends {Menu}
         */

        var SideMenu = (function(items, options) {
            var that = this;
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
            this._target = null;
            this.sideMenu = this;
            this.currentMenu = null;
        });

        SideMenu.prototype = Object.create(Menu.prototype);
        $.extend(SideMenu.prototype, {
            constructor: SideMenu,
            /** @override*/
            _add: function(menuItem, index) {
                Menu.prototype._add.call(this, menuItem, index);
                (function(subMenu) {
                    if (subMenu) {
                        subMenu.sideMenu = this;
                        for (var i in subMenu.items) {
                            if (subMenu.items[i] instanceof SMSubMenuItem)
                                arguments.callee.call(this, subMenu.items[i].subMenu)
                        }
                    }
                }.call(this, menuItem.subMenu));
            },
            _refresh: function() {
                this._target && this._target.append(
                    this._target.find('.sm-added').removeClass('sm-added')
                );
            },
            /** @expose */
            goBack: function() {
                var toInMenu = this.history.beforeLastStak(),
                    toOutMenu = this.history.pop();
                this._setCurrentMenu(toInMenu || this);
                toOutMenu && toOutMenu._hide();
                toInMenu && toInMenu._show();
            },
            /** @expose @override */
            close: function() {
                this.history.clear();
                this._closeWithChilds();
                this._setCurrentMenu(null);
                if (this.options.onClose) {
                    this.options.onClose.call(this);
                }
            },
            /** @expose */
            toggle: function() {
                this.history.isEmpty() ? this.open() : this.close();
            },
            /** @expose */
            appendTo: function(target) {
                this._target = $(target).append(this.$el);
                this._refresh();
                return this;
            }
        });

        /**
         * Class represent a Sub-Menu in SideMenu instance
         * @param {Array.<SMItem>} items form the menu.
         * @param {Object} options
         * @constructor
         * @extends {Menu}
         */

        var SideSubMenu = (function(items, options) {
            var that = this;
            Menu.call(this, items, $.extend({}, SideSubMenu.options, options));
            if (this.options.back)
                this._back = $('<div/>')
                .addClass('sm-back')
                .on($.event.special.tapclick ? 'tapclick' : 'click', function(e) {
                    e.preventDefault();
                    that.sideMenu.goBack();
                })
                .text(this.options.back);
            this._back.insertBefore(this.el.lastChild);
            this.$el.addClass('sm-submenu');
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

        var SMItem = (function() {
            /** @expose*/
            this.$el = $('<div/>').addClass('sm-item');
            /** @expose*/
            this.el = this.$el.get(0);
            this.parent = null;
        });
        $.extend(SMItem.prototype, {
            _setParent: function(sideMenu) {
                this.parent = sideMenu;
            },
            /** @expose */
            moveToMenu: function(menuTarget, index) {
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
            moveToPosition: function(index) {
                if (this.parent)
                    this.moveToMenu(this.parent, index);
            },
            /** @expose */
            remove: function() {
                if (this.parent) {
                    var i;
                    this.$el.remove();
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

        var SMLabelItem = (function(title, clsName) {
            if (title === undefined)
                throw 'Error in SMLabelItem: title param is undefined';
            SMItem.call(this);
            this.title = title;
            this.dom = this.dom || {};
            this.dom.title = $('<span/>').addClass('sm-label-text').text(this.title);
            this.$el.append(
                this._label = $('<div/>')
                .addClass('sm-item-label')
                .addClass(clsName)
                .append($('<span/>').addClass('sm-label-icon'))
                .append(this.dom.title)
            );
        })

        SMLabelItem.prototype = Object.create(SMItem.prototype);
        SMLabelItem.prototype.constructor = SMLabelItem;
        SMLabelItem.prototype.setTitle = function(title) {
            this.dom.title.text(title);
        };

        /**
         * Class represent a item type label but with a submenu
         * @param {String} title for item.
         * @param {Array.<SMItem>} items form the submenu.
         * @param {String} clsName is CSS className (optional)
         * @constructor
         * @extends {SMLabelItem}
         */

        var SMSubMenuItem = (function(title, items, clsName) {
            var that = this;
            SMLabelItem.call(this, title, clsName);
            this.$el.addClass('sm-item-more');
            this._label.on($.event.special.tapclick ? 'tapclick' : 'click', function(e) {
                e.stopPropagation();
                that.subMenu.open();
            });
            this.subMenu = new SideSubMenu(items, {
                title: title
            });
            this.subMenu._setParent(this);
            this.$el.append(this.subMenu.el);
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

        var SMLinkItem = (function(title, url, target, clsName) {
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
            this.$el.addClass('sm-item-link');
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

        var SMButtonItem = (function(title, callback, clsName, id) {
            var that = this;
            SMLabelItem.call(this, title, clsName);
            this.id = id || null;
            this.$el.addClass('sm-item-button');
            this.$el.on($.event.special.tapclick ? 'tapclick' : 'click', function(e) {
                callback && callback.call(that, this);
            });
        });

        SMButtonItem.prototype = Object.create(SMLabelItem.prototype);
        SMButtonItem.prototype.constructor = SMButtonItem;

        var SMUserAccountItem = (function(name, src) {
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
        });
        // Extend prototype from SMItem
        SMUserAccountItem.prototype = Object.create(SMItem.prototype);
        SMUserAccountItem.prototype.constructor = SMUserAccountItem;

        var SMSeparatorItem = (function(name, email) {
            SMItem.call(this); // Call SMItem constructor
            // this.$el is jQuery item object that works how wrapper
            this.$el.addClass('sm-item-separator');
            this.$el.append(
                this.name = $('<div/>')
                .addClass('sm-item-separator-name')
                .text(name || '')
            );
        });

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
            SMSeparatorItem: SMSeparatorItem
        };

        return api;
    };

    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function($) {
            return create($);
        });
    } else {
        if ($) {
            $.extend(window, create($));
        } else throw "Error: SideMenu require jQuery Library";
    }
}(window.jQuery));