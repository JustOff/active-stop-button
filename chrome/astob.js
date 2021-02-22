if (typeof activestopbutton == "undefined") {

  var activestopbutton = {

	aust: false,
	smnk: false,
	sblist: [],
	prefs: null,
	alltabs: "",
	stajax: 2,
	sflag: 3,

	stopTab: function() {
		window.gBrowser.webNavigation.stop(this.sflag);
	},
	
	stopAll: function() {
		var browser, tabs = getBrowser().mTabContainer.childNodes;
		for (let tab of tabs) {
			browser = getBrowser().getBrowserForTab(tab);
			browser.webNavigation.stop(this.stajax);
		}
	},

	clickStopE: function(e) {
		activestopbutton.clickStop(e);
	},
	
	clickStop: function(e) {
		if (e.detail == 1) {
		  switch (this.alltabs) {
			case "c_click": if (e.button == 0) { 
				if (e.ctrlKey) this.stopAll(); 
					else this.stopTab();
					e.preventDefault();
				}
				break;
			case "l_click": if (e.button == 0) {
					this.stopAll();
					e.preventDefault()
				}
				break;
			case "r_click": if (e.button == 0) this.stopTab();
				if (e.button == 2) this.stopAll();
				e.preventDefault();
				break;
			case "d_click": if (e.button == 0) {
					this.stopTab();
					e.preventDefault();
				}
				break;
			default: this.stopTab(); e.preventDefault();
		  };
		} else if (e.detail == 2) {
		  if (this.alltabs == "d_click") this.stopAll();
		}
	},

	auxclickStopE: function(e) {
		if (activestopbutton.alltabs == "r_click" && e.button == 2) {
			e.preventDefault();
		}
	},

	manageCSS: function(mode) {
		if (this.smnk) return;
		var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                    .getService(Components.interfaces.nsIStyleSheetService);
		var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
		if (this.aust) {
			var uri = ios.newURI("chrome://astob/content/astobCB.css", null, null);
		} else {
			var urlbar = document.getElementById("urlbar-container");
			if (urlbar.getAttribute("combined"))
				var uri = ios.newURI("chrome://astob/content/astobCB.css", null, null);
			else
				var uri = ios.newURI("chrome://astob/content/astobUC.css", null, null);
		}
		if (mode == "u") {
			if(sss.sheetRegistered(uri, sss.USER_SHEET))
				sss.unregisterSheet(uri, sss.USER_SHEET);
		}
		if (mode == "r") {
			if(!sss.sheetRegistered(uri, sss.USER_SHEET))
				sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
		}
	},
	
	clickListen: function() {
		if (this.smnk) {
			var stbs = document.getElementsByAttribute("oncommand", "BrowserStop();");
		} else {
			var stbs = document.getElementsByAttribute("command", "Browser:Stop");
		}
		for (let stb of stbs) {
			if (stb.localName == "toolbarbutton") {
				this.sblist.push(stb);
				stb.addEventListener('click', this.clickStopE, false);
				stb.addEventListener('auxclick', this.auxclickStopE, false);
				stb.removeAttribute("disabled");
			}
		}
	},
	
	beforeCustomize: function() {
		for (let stb of this.sblist) {
			stb.removeEventListener('click', this.clickStopE);
			stb.removeEventListener('auxclick', this.auxclickStopE);
		}
		this.sblist.length = 0;
		if (!this.aust) {
			this.manageCSS('u');
		}
	},
	
	customizeDone: function() {
		this.clickListen();
		if (!this.aust) {
			this.manageCSS('r');
		}
	},
	
	observe: function(aSubject, aTopic, aData) {
		if (aTopic == 'nsPref:changed') {
			switch (aData) {
				case "alltabs": this.alltabs = this.prefs.getCharPref('alltabs'); break;
				case "stajax": var stj = this.prefs.getBoolPref('stajax'); 
								if (stj) this.stajax = 3; else this.stajax = 2; break;
			}
		}
	},
	
	init: function() {
		let that = this;
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
			.getService(Components.interfaces.nsIXULAppInfo);
		this.smnk = (appInfo.ID == "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}") || (appInfo.ID == "{a3210b97-8e8a-4737-9aa0-aa0e607640b9}");
		var verCheck = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
			.getService(Components.interfaces.nsIVersionComparator);
		this.aust = (appInfo.ID != "{8de7fcbb-c55c-4fbe-bfc5-fc555c87dbc4}") && (verCheck.compare(appInfo.version, "29.0a1") >= 0);
		
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService).getBranch("extensions.astob.");
		this.prefs.addObserver("", this, false);
		this.alltabs = this.prefs.getCharPref('alltabs');
		var stj = this.prefs.getBoolPref('stajax'); if (stj) this.stajax = 3; else this.stajax = 2;

		if (this.smnk) {
			var stopCommand = document.getElementById("stop-button");
		} else {
			var stopCommand = XULBrowserWindow.stopCommand;
		}
		var observerC = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				var name = mutation.attributeName, value = mutation.target.getAttribute(name);
				if (name == 'disabled') {
					switch (value) {
						case 'false': break;
						case 'true': that.sflag = 2; 
									stopCommand.setAttribute('disabled', 'false');
									for (let stb of that.sblist) {
										stb.removeAttribute("disabled");
									}
									break;
						default: that.sflag = 3; 
					}
				}
			});
		});
		observerC.observe(stopCommand, {attributes: true});
		stopCommand.removeAttribute('disabled');
	
		if (this.smnk) {
			var contextMenu = document.getElementById('context-stop');
		} else {
			var contextMenu = document.getElementById('context-reload');
		}
		var observerM = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				if (gContextMenu && (gContextMenu.onTextInput || gContextMenu.onImage || gContextMenu.onLink 
					|| gContextMenu.onMailtoLink || gContextMenu.isTextSelected)) {
					return;
				}
				var name = mutation.attributeName, value = mutation.target.getAttribute(name);
				if ((name == 'disabled' || name == 'hidden') && value == 'true') {
					contextMenu.removeAttribute('disabled');
					contextMenu.removeAttribute('hidden');
				}
			});
		});
		observerM.observe(contextMenu, {attributes: true});
		contextMenu.removeAttribute('disabled');
		contextMenu.removeAttribute('hidden');

		this.clickListen();

		window.addEventListener("beforecustomization", function() { that.beforeCustomize(); }, false);
		window.addEventListener("aftercustomization", function() { that.customizeDone(); }, false);
		
		var cstop = window.document.getElementById("context-stop");
		cstop.addEventListener('click', this.clickStopE, false);

		var key = window.document.getElementById("key_stop");
		if (key.getAttribute("command") == "Browser:Stop") {
			key.removeAttribute("command");
			key.setAttribute("oncommand", "activestopbutton.stopTab();");
		}

		if (!this.aust && !this.smnk) {
			var strbundle = document.getElementById("asbstrings");
			var zeroLabel = strbundle.getString("zerospace");
			var ntoolbox = document.getElementById('navigator-toolbox');
			var zeroButton = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
			zeroButton.setAttribute( "id", "asb-zero" );
			zeroButton.setAttribute( "label", zeroLabel );
			zeroButton.setAttribute( "class", "KUI-panel-closebutton" );
			zeroButton.setAttribute( "style", "list-style-image:none;opacity:1;background-color:white;width:16px;");
			ntoolbox.palette.appendChild(zeroButton);

			[].some.call(window.document.querySelectorAll("toolbar[currentset]"),
				function(tb) {
					var cs = tb.getAttribute("currentset").split(","),
						bp = cs.indexOf("asb-zero") + 1;
					
					if (bp) {
						var at = null, f = [],
						xul={spacer:1,spring:1,separator:1};
						cs.splice(bp).some(function(id)
							(at=window.document.getElementById(id))?!0:(f.push(id),!1));
						at&&f.length&&f.forEach(function(n)xul[n]
							&&(at=at&&at.previousElementSibling));
						CombinedStopReload.uninit();
						tb.insertItem("asb-zero", at, null, false);
						CombinedStopReload.init();
						return true;
					}
				});
		}

		this.manageCSS("r");
	}
  };

  window.addEventListener('load', function() { activestopbutton.init(); }, false);

};