/*!
 * SideMenu.js v0.0.1 (beta) ~ Copyright (c) 2013 
 * Oscar Sobrevilla oscar.sobrevilla@gmai.com
 * Released under MIT license
 */


(function ($) {
  /*
   * Class SideMenu
   */
  SideMenu = function (items, options) {
    var that = this,
      p;
    this.options = $.extend({}, SideMenu.options, options);
    this._el = $('<div/>')
      .addClass('sm');
    this._list = $('<div/>').appendTo(this._el).get(0);
    this.el = this._el.get(0);
    this.items = [];
    for (var i in items)
      this.addItem(items[i]);
    if (this.options.back)
      this._back = $('<a/>')
        .attr({
          'class': 'sm-back',
          'href': '#back'
        })
        .on('click', function (e) {
          e.preventDefault();
          that.close();
        })
        .text(this.options.back);
    this._el.prepend(this._back);
    if (this.options.title)
      this._el.prepend(
        $('<div/>')
        .addClass('sm-title')
        .text(this.options.title)
      );
    this.isOpen = false;
    this.parent = null;
  };
  $.extend(SideMenu.prototype, {
    addItem: function (menuItem) {
      menuItem.setParent(this);
      this.items.push(menuItem);
      this._list.appendChild(menuItem.el);
    },
    open: function () {
      this.isOpen = true;
      this._el.addClass('sm-open');
    },
    close: function () {
      this.isOpen = false;
      this._el.removeClass('sm-open');
    },
    toggle: function () {
      this[this.isOpen ? 'close' : 'open']();
    }
  });
  $.extend(SideMenu, {
    options: {
      back: 'Back'
    }
  });
  /*
   * Class SideMainMenu
   */
  SideMainMenu = function (list, options) {
    options.back = '';
    SideMenu.apply(this, arguments);
  };
  $.extend(SideMainMenu.prototype, SideMenu.prototype, {
    constructor: SideMainMenu,
    appendTo: function (target) {
      $(target).append(this._el).append(this._el.find('.sm-submenu'));
      return this;
    }
  });
  /*
   * Class SideSubMenu
   */
  SideSubMenu = function (items, options) {
    SideMenu.apply(this, arguments);
    this._el.addClass('sm-submenu');
  }
  $.extend(SideSubMenu.prototype, SideMenu.prototype, {
    constructor: SideSubMenu,
    refresh: function () {
      this.menu.append(this._el.find('.sm-submenu'));
    }
  });
  /*
   * Class SideMenuItem
   */
  SideMenuItem = function (title, options) {
    var that = this,
      p;
    this.options = {};
    for (p in options)
      this.options[p] = options[p];
    this._el = $('<div/>').addClass('sm-item');
    if (this.options.url) {
      this._button = $('<a/>').attr({
        href: this.options.url,
        target: '_blank'
      });
    } else {
      this._button = $('<div/>');
    }
    this._button
      .addClass('sm-item-title')
      .addClass(this.options.cls)
      .append($('<span class="sm-item-icon"/>'))
      .append($('<span class="sm-item-text"/>').text(title))
      .appendTo(this._el);
    this.el = this._el.get(0);
    this.parent = null;
  };
  $.extend(SideMenuItem.prototype, {
    constructor: SideMenuItem,
    setParent: function (menuList) {
      this.parent = menuList;
    }
  });
  /*
   * Class SideMenuListItem
   */
  SideMenuListItem = function (title, list, cls) {
    var that = this;
    SideMenuItem.call(this, title);
    this._el
      .addClass('sm-item-more')
      .addClass(cls || '')
      .first()
      .on('click', '.sm-item-title', function (e) {
        e.stopPropagation();
        that.subMenu.toggle();
      })
    this.subMenu = null;
  };
  $.extend(SideMenuListItem.prototype, SideMenuItem.prototype, {
    constructor: SideMenuListItem,
    addSubMenu: function (subMenu, options) {
      this.subMenu = new SideSubMenu(subMenu, options);
      this._el.append(this.subMenu.el);
      return this;
    }
  });
  /*
   * Class SideMenuItemLink
   */
  SideMenuItemLink = function (title, url) {
    SideMenuItem.call(this, title, {
      url: url
    });
    this._el.addClass('sm-item-link');
  };
  $.extend(SideMenuItemLink.prototype, SideMenuItem.prototype, {
    constructor: SideMenuItemLink
  });
  /*
   * Class SideMenuItemButton
   */
  SideMenuItemButton = function (title, callback) {
    var that = this;
    SideMenuItem.call(this, title);
    this._el.addClass('sm-item-button');
    this._el.on('click', function (e) {
      callback && callback.call(this, e, that);
    });
  };
  $.extend(SideMenuItemButton.prototype, SideMenuItem.prototype, {
    constructor: SideMenuItemButton
  });
}(jQuery));