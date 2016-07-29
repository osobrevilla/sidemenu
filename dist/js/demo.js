 $(function() {

 	/*
 	    ==========================================================================
 	        CODE FOR DEMO PAGE (IGNORE)
 	    ==========================================================================
 	*/

 	var isTouch = !!('ontouchstart' in window || navigator.maxTouchPoints),
 		evt = isTouch ? 'touchend' : 'click';
 	var next = function() {
 		$(this).attr("disabled", "disabled").parent().next('li').find('button').removeAttr("disabled");
 	};

 	$("#open-demo").one(evt, function(e) {
 		e.preventDefault();
 		sideMenu.open();
 		next.call(this);
 	});

 	$("#close-demo").one(evt, function(e) {
 		e.preventDefault();
 		sideMenu.close();
 		if (confirm("Try again?"))  {
 			location.reload(true);
 		} else {
 			$(this).text("Try again!");
 			$("#close-demo").on(evt, function() {
 				location.reload(true);
 			});
 		}
 	});

 	$("#add-item-1").one(evt, function(e) {
 		e.preventDefault();
 		sideMenu.addItem(new SMSubMenuItem("Others"));
 		next.call(this);
 	});

 	$("#add-item-2").one(evt, function(e) {
 		e.preventDefault();
 		sideMenu.getSubMenuByName("others")
 			.open()
 			.addItem(
 				new SMLinkItem("Go to google", "http://google.com", "_blank")
 			);
 		next.call(this);
 	});

 	$("#close-item-1").one(evt, function(e) {
 		e.preventDefault();
 		sideMenu.getSubMenuByName("others").close();
 		next.call(this);
 	});

 	$("#move-item-1").one(evt, function(e) {
 		e.preventDefault();
 		sideMenu.getItemByName("Animals").moveToPosition(sideMenu.items.length);
 		next.call(this);
 	});

 	$("#move-item-2").one(evt, function(e) {
 		e.preventDefault();
 		var share = sideMenu.getSubMenuByName("Share").open();
 		sideMenu.getItemByName("Animals").moveToMenu(share);
 		next.call(this);
 	});

 	$("#return-item-1").one(evt, function(e) {
 		e.preventDefault();
 		var share = sideMenu.getSubMenuByName("Share");
 		share.getItemByName("Animals").moveToMenu(sideMenu, 0);
 		share.close();
 		next.call(this);
 	});

 	$("#remove-item-1").one(evt, function(e) {
 		e.preventDefault();
 		sideMenu.getItemByName("Others").remove();
 		next.call(this);
 	});

 	$("#move-item-3").one(evt, function(e) {
 		e.preventDefault();
 		sideMenu.getItemByIndex(1).moveToPosition(0);
 		next.call(this);
 	});
 });
