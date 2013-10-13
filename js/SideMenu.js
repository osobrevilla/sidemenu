/*!
 * SideMenu.js v0.0.1 (beta) ~ Copyright (c) 2013
 * Oscar Sobrevilla oscar.sobrevilla@gmail.com
 * Released under MIT license
 */
(function ($, undefined) {

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

  var SideMenu = (function (items, options) {
    var that = this;
    this.options = $.extend({}, SideMenu.options, options);
    this._el = $('<div/>')
      .addClass('sm sm-added');
    
    this._list = $('<div/>').appendTo(this._el).get(0);
    this.el = this._el.get(0);
    touchScroll(this.el);
    this.items = [];
    this.addItems(items);
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

  SideMenu.prototype = ({
    constructor: SideMenu,
    _add: function(menuItem, index){
      index = index === undefined ? this.items.length : index;
      menuItem._setParent(this);
      this.items.splice(index, 0, menuItem);
      this._list.insertBefore(menuItem.el, 
          this._list.hasChildNodes() ?
            this._list.childNodes[index] : null);
    },
    addItem: function (menuItem, index){
      this._add(menuItem, index);
      this._refresh();
    },
    addItems: function (menuItems, index){
      var i;
      for (i in menuItems)
        this._add(menuItems[i], index + i);
      this._refresh();
    },
    _refresh: function(){
      (function (obj) {
        if (obj) {
          if (obj instanceof SideMainMenu) {
            obj._refresh();
            return;
          }
          arguments.callee(obj.parent);
        }
      }(this.parent));
    },
    _setParent: function (obj) {
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
  });
  
  SideMenu.options = ({
    back: 'back'
  });



  /**
   * Class SideMainMenu
   */

  var SideMainMenu = (function (items, options) {
    options = options || {};
    options.back = "";
    SideMenu.call(this, items, options);
    this._target = null;
  });

  SideMainMenu.prototype = Object.create(SideMenu.prototype);
  $.extend(SideMainMenu.prototype, {
    constructor: SideMainMenu,
    appendTo: function (target) {
      this._target = $(target).append(this._el);
      this._refresh();
      return this;
    },
    _refresh: function(){
      this._target && this._target.append(
        this._target.find('.sm-added').removeClass('sm-added')
      );
    },
    close: function () {
      SideMenu.prototype.close.call(this);
    }
  });



  /**
   * Class SideSubMenu
   */

  var SideSubMenu = (function (items, options) {
    SideMenu.apply(this, arguments);
    this._el.addClass('sm-submenu');
  });

  SideSubMenu.prototype = Object.create(SideMenu.prototype);
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
    _setParent: function (menuList) {
      this.parent = menuList;
    },
    moveToMenu: function(menuTarget, index){
      var i, menuItem;
      if (menuTarget instanceof SideMenu ) {
          for ( i in this.parent.items) {
            if ( this.parent.items[i] === this ) {
                menuItem = this.parent.items[i];
                this.parent.items.splice(i, 1);
                break;
            }
          }
          menuTarget.addItem(menuItem, index);
      }
    }
  });


  /**
   * Class SMSubMenuItem
   */

  var SMLabelItem = (function(title, clsName){
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

  var SMSubMenuItem = (function (title, subMenu, clsName) {
    var that = this;
    SMLabelItem.call(this, title, clsName);
    this._el.addClass('sm-item-more');
    this._label.on('click', function (e) {
      e.stopPropagation();
      that.subMenu.toggle();
    });
    this.subMenu = new SideSubMenu(subMenu, {
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

  SMButtonItem.prototype = Object.create(SMItem.prototype);
  SMButtonItem.prototype.constructor = SMButtonItem;


/* add to namespace */
  
  $.extend(this, {
    SideMenu: SideMenu,
    SideMainMenu: SideMainMenu,
    SMItem: SMItem,
    SMLabelItem: SMLabelItem,
    SMSubMenuItem: SMSubMenuItem,
    SMButtonItem: SMButtonItem,
    SMLinkItem: SMLinkItem
  });

}.call(this /* window namespace or other ex. utils, helpers, etc*/, window.jQuery));
