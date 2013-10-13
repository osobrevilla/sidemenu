# Basic API documentation

#### SideMenu Class

Class that represent a list menu. this class is parent for **SideMenuMain** and **SideSubMenu** SubClases

`new SideMenu([SMItem,..], options)`

* addItem(SMItem, index)
* addItems([SMItem, SMItem,..], index)
* open()
* close()
* toggle()
* getItemByIndex(index)
* getItemByName("Share")
* getSubMenuByName("Animals")

#### SideMainMenu Class

Extend from **SideMenu**, represent a master menu dom object.

`new SideMainMenu([SMItem,..], options)`


* appendTo(domTarget)

#### SideSubMenu Class

Extend from **SideMenu**. **SideSubMenu** represent a submenu dom object.

new SideSubMenu([SMItem,..], options)

#### SMItem Class

Class that represent one empty list item. this class is template to create other type items.

`new SMItem()`

* moveToMenu(SideMenu, index)

#### SMLabelItem Class
Extend from **SMItem** class, and represent one item with a text title and icon.

`new SMLabelItem("title", "className")`

#### SMSubMenuItem Class
Extend from **SMLabelItem**, represent a single item with a submenu child.

`new SMSubMenuItem("title", [SMItem,..], "className")`

#### SMLinkItem Class
Extend from **SMLabelItem**, represent a native link.

`new SMLinkItem("title", "url", "_blank"., "className")`

#### SMButtonItem Class

Extend from **SMItem**, represent a action button item.

`new SMButtonItem("name", onClickHandler)`
