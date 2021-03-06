SideMenu.js
===========
JavaScript library to create side menus with full object oriented way and touch support.

[see the demo](http://osobrevilla.github.io/sidemenu/)


## How Use

### 1. Add the following files:

```html
 <link rel="stylesheet" type="text/css" href="dist/css/sidemenu.css" />
 <script src="dist/js/vendors/jquery.js"></script>
 <script src="dist/js/vendors/jquery.event.tap.js"></script> <!--  (OPTIONAL) FOR FAST TAP (TOUCH) EVENT! -->
 <script src="dist/js/sidemenu.js"></script>
```

### 2. Add content and wrapper for menu.
The menu ("sm-main") will always adapt to its container.

```html
<body>
	<!-- USE ADITIONAL sm-main-left CLASS FOR ALIGN THE MENU TO LEFT SIDE.-->
	<div id="menu" class="sm-main"></div>
</body>

```
> **NOTE:** Only for full height menu you need add "sm-wrapper" how first child of body. You can create or use your own custom wrapper with other dimensions or hierarchy but do not forget add ever overflow hidden and position absolute/fixed css style.

### 3. Built and add the menu

```javascript
// Creating the master menu (SideMenu)
var myMenu = new SideMenu([
	// adding item(s) in constructor class.
	new SMLabelItem("My first item!")
]);

// adding item after create instance.
myMenu.addItem(new SMSubMenuItem("Colors", [
   new SMLabelItem("Red"),
   new SMLabelItem("Blue"),
   new SMLabelItem("Yellow"),
   new SMLabelItem("Green"),
   new SMLabelItem("etc")
]));

// adding mix type of items with multi-level menus using "SMSubMenuItem".
myMenu.addItem(new SMSubMenuItem("Animals", [
   new SMLinkItem("Bunny", "//www.google.com.pe/?#q=Bunny"),
   new SMLinkItem("Tiger", "//www.google.com.pe/?#q=Tiger"),
   new SMLinkItem("Dog", "//www.google.com.pe/?#q=Dog"),
   new SMLinkItem("Cat", "//www.google.com.pe/?#q=Cat", "_blank"),
   new SMSubMenuItem("Birds", [
       new SMLinkItem("Eagle", "//www.google.com.pe/?#q=eagle"),
       new SMLabelItem("Hawk"),
       new SMLabelItem("Tucan"),
       new SMButtonItem("Parrot", function () {
           alert("Hello World!")
       }),
       new SMLabelItem("Chicken"),
       new SMLabelItem("Duck")
   ]),
   new SMLabelItem("Pig"),
   new SMLinkItem("Crocodile", "//www.google.com.pe/?#q=Crocodile")
]));

// Adding new single item type "SMButtonItem" with click handler;
myMenu.addItem(
    new SMButtonItem("Download File", function(){
      alert("Go Download File!");
    })
);


// Using API
myMenu.addItem(
    new SMButtonItem("Close", function () {
        myMenu.close();
    })
);

// Finally add SideMenu object to DOM tree target.
myMenu.appendTo(document.getElementById('menu'));

```


## API documentation
### SideMenu Class
Class that represent a master menu.

```javascript
new SideMenu([SMItem,..], options);
		// Other methods
		.addItem(SMItem, index);
		.addItems([SMItem, SMItem,..], index);
		.open();
		.close();
		.toggle();
		.getItemByIndex(index);
		.getItemByName("Share");
		.getSubMenuByName("Animals");
		.appendTo(domTarget);
```

### SideSubMenu Class

Represent a submenu object.


```javascript
new SideSubMenu([SMItem,..], options);
	// Other methods
	.addItem(SMItem, index);
	.addItems([SMItem, SMItem,..], index);
	.open();
	.close();
	.getItemByIndex(index);
	.getItemByName("Share");
	.getSubMenuByName("Animals");
```
### SMItem Class

Class that represent one empty list item. this class is template to create other type items.
```javascript
new SMItem();
	// Other methods
	.moveToMenu(SideMenu, index);
	.moveToPosition(index);
	.remove();
```
### SMLabelItem Class
Extend from **SMItem** class, and represent one item with a text title and icon.

```javascript
new SMLabelItem("title", "className");
```

### SMSubMenuItem Class
Extend from **SMLabelItem**, represent a single item with a submenu child.

```javascript
new SMSubMenuItem("title", [SMItem,..], "className");
```

### SMLinkItem Class
Extend from **SMLabelItem**, represent a native link.
```javascript
new SMLinkItem("title", "url", "_blank"., "className");
```

### SMButtonItem Class

Extend from **SMItem**, represent a action button item.

```javascript
new SMButtonItem("name", onClickHandler);
```
