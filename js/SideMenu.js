/*!
 * SideMenu.js v0.0.1 (beta) ~ Copyright (c) 2013
 * Oscar Sobrevilla oscar.sobrevilla@gmail.com
 * Released under MIT license
 */
(function ($) {

  var isTouch = "ontouchstart" in document.documentElement;

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
    if (!isTouch) { return }
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
   * Class SideMenu
   */

  SideMenu = (function (items, options) {
    var that = this,
      p;
    this.options = $.extend({}, SideMenu.options, options);
    this._el = $('<div/>')
      .addClass('sm');
    
    this._list = $('<div/>').appendTo(this._el).get(0);
    this.el = this._el.get(0);
    touchScroll(this.el);
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
        .text(this.title = this.options.title)
      );
    this.isOpen = false;
    this.parent = null;
  });

  SideMenu.prototype = {
    constructor: SideMenu,
    addItem: function (menuItem) {
      menuItem.setParent(this);
      this.items.push(menuItem);
      this._list.appendChild(menuItem.el);
    },
    setParent: function (obj) {
      this.parent = obj;
    },
    open: function () {
      (function (obj) {
        if (obj) {
          if (obj instanceof SideMenu) {
            obj.open();
            return;
          }
          arguments.callee(obj.parent);
        }
      }(this.parent));
      this.isOpen = true;
      this._el.addClass('sm-open');
    },
    close: function () {
      (function (items) {
        for (var i in items) {
          if (items[i].subMenu instanceof SideMenu) {
            items[i].subMenu.close();
            arguments.callee(items[i].subMenu.items);
          }
        }
      }(this.items));
      this.isOpen = false;
      this._el.removeClass('sm-open');
    },
    toggle: function () {
      this[this.isOpen ? 'close' : 'open']();
    },
    getItemByIndex: function(index){
      return this.items[index];
    },
    getItemByName: function(title){
      var i, reg = new RegExp(title, "gi");
      for (i in this.items) {
        if ( this.items[i].title && reg.test(this.items[i].title) )
          return this.items[i];
      }
      return null;
    },
    getSubMenuByName: function(title){
      var item = this.getItemByName(title);
      return item ? item.subMenu : item;
    }
  };
  $.extend(SideMenu, {
    options: {
      back: 'Back'
    }
  });



  /**
   * Class SideMainMenu
   */

  SideMainMenu = (function (list, options) {
    options = options || {};
    options.back = "";
    SideMenu.call(this, list, options);
    this.currentMenu = this;
  });

  SideMainMenu.prototype = Object.create(SideMenu.prototype);
  $.extend(SideMainMenu.prototype, {
    constructor: SideMainMenu,
    appendTo: function (target) {
      $(target).append(this._el).append(this._el.find('.sm-submenu'));
      return this;
    },
    close: function () {
      SideMenu.prototype.close.call(this);
    }
  });



  /**
   * Class SideSubMenu
   */

  SideSubMenu = (function (items, options) {
    SideMenu.apply(this, arguments);
    this._el.addClass('sm-submenu');
  });

  SideSubMenu.prototype = Object.create(SideMenu.prototype);
  $.extend(SideSubMenu.prototype, {
    constructor: SideSubMenu,
    refresh: function () {
      this.menu.append(this._el.find('.sm-submenu'));
    }
  });



  /**
   * Class SideMenuItem
   */

  SideMenuItem = (function (title, options) {
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
      .append($('<span class="sm-item-text"/>').text(this.title = title))
      .appendTo(this._el);

    if (this.options.cls)
      this._button.addClass(this.options.cls);
    this.el = this._el.get(0);
    this.parent = null;
  });
  $.extend(SideMenuItem.prototype, {
    constructor: SideMenuItem,
    setParent: function (menuList) {
      this.parent = menuList;
    }
  });



  /**
   * Class SideMenuListItem
   */

  SideMenuListItem = (function (title, subMenu, cls) {
    var that = this;
    SideMenuItem.call(this, title, {
      cls: cls
    });
    this._el
      .addClass('sm-item-more')
      .first()
      .on('click', '.sm-item-title', function (e) {
        e.stopPropagation();
        that.subMenu.toggle();
      })
    this.subMenu = new SideSubMenu(subMenu, {
      title: title
    });
    this.subMenu.setParent(this)
    this._el.append(this.subMenu.el);
  });

  SideMenuListItem.prototype = Object.create(SideMenuItem.prototype);
  SideMenuListItem.prototype.constructor = SideMenuListItem;



  /**
   * Class SideMenuItemLink
   */

  SideMenuItemLink = (function (title, url) {
    SideMenuItem.call(this, title, {
      url: url
    });
    this._el.addClass('sm-item-link');
  });

  SideMenuItemLink.prototype = Object.create(SideMenuItem.prototype);
  SideMenuItemLink.prototype.constructor = SideMenuItemLink;



  /**
   * Class SideMenuItemButton
   */

  SideMenuItemButton = (function (title, callback, options) {
    var that = this;
    SideMenuItem.call(this, title, options);
    this._el.addClass('sm-item-button');
    this._el.on('click', function (e) {
      callback && callback.call(this, e, that);
    });
  });

  SideMenuItemButton.prototype = Object.create(SideMenuItem.prototype);
  SideMenuItemButton.prototype.constructor = SideMenuItemButton;



  /**
   * Class SideMenuUserAccountItem
   */

  SideMenuUserAccountItem = (function (name, src) {
    var that = this;
    this._el = $('<div/>');
    this.el = this._el.get(0);
    this._el.addClass('sm-item-useraccount');
    this._el.append(
      this.photo = $('<img/>')
        .addClass('sm-useraccount-photo')
        .attr({ src: src })
    )
    this._el.append(
      this.name = $('<div/>')
      .addClass('sm-useraccount-name')
      .text(name)
    )
  });

  SideMenuUserAccountItem.prototype = Object.create(SideMenuItem.prototype);
  SideMenuUserAccountItem.prototype.constructor = SideMenuUserAccountItem;

}(jQuery));