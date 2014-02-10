if (typeof activestopbutton == "undefined") {

  var activestopbutton = {

	aust: false,
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

	manageCSS: function(mode) {
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
		var stbs = document.getElementsByAttribute("command", "Browser:Stop");
		for (let stb of stbs) {
			if (stb.localName == "toolbarbutton") {
				this.sblist.push(stb);
				stb.addEventListener('click', this.clickStopE, false);
				stb.removeAttribute("disabled");
			}
		}
	},
	
	beforeCustomize: function() {
		for (let stb of this.sblist) {
			stb.removeEventListener('click', this.clickStopE);
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
		var verCheck = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
			.getService(Components.interfaces.nsIVersionComparator);
		this.aust = (verCheck.compare(appInfo.version, "29.0a1") >= 0);
		
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService).getBranch("extensions.astob.");
		this.prefs.addObserver("", this, false);
		this.alltabs = this.prefs.getCharPref('alltabs');
		var stj = this.prefs.getBoolPref('stajax'); if (stj) this.stajax = 3; else this.stajax = 2;

		var stopCommand = XULBrowserWindow.stopCommand;
		var observerC = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				var name = mutation.attributeName, value = mutation.target.getAttribute(name);
				if (name == 'disabled') {
					switch (value) {
						case 'false': break;
						case 'true': that.sflag = 2; 
									XULBrowserWindow.stopCommand.setAttribute('disabled', 'false');
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
		XULBrowserWindow.stopCommand.setAttribute('disabled', 'false');
	
		var reloadMenu = document.getElementById('context-reload');
		var observerM = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				var name = mutation.attributeName, value = mutation.target.getAttribute(name);
				if ((name == 'disabled' || name == 'hidden') && value == 'true') {
					var reloadMenu = document.getElementById('context-reload');
					reloadMenu.setAttribute('disabled', 'false');
					reloadMenu.setAttribute('hidden', 'false');
				}
			});
		});
		observerM.observe(reloadMenu, {attributes: true});
		reloadMenu.setAttribute('disabled', 'false');
		reloadMenu.setAttribute('hidden', 'false');

		this.clickListen();

		window.addEventListener("beforecustomization", function() { that.beforeCustomize(); }, false);
		window.addEventListener("aftercustomization", function() { that.customizeDone(); }, false);
		
		var cstop = window.document.getElementById("context-stop");
		cstop.addEventListener('click', this.clickStopE, false);

		var key = window.document.getElementById("key_stop");
		key.removeAttribute("command");
		key.setAttribute("oncommand", "activestopbutton.stopTab();");

		if (!this.aust) {
			var strbundle = document.getElementById("asbstrings");
			var zeroLabel = strbundle.getString("zerospace");
			var ntoolbox = document.getElementById('navigator-toolbox');
			var zeroButton = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
			zeroButton.setAttribute( "id", "asb-zero" );
			zeroButton.setAttribute( "label", zeroLabel );
			zeroButton.setAttribute( "class", "KUI-panel-closebutton" );
			zeroButton.setAttribute( "style", "list-style-image:none;opacity:1;background-color:white;width:16px;");
			ntoolbox.palette.appendChild(zeroButton);
			var RDF = Components.classes["@mozilla.org/rdf/rdf-service;1"]
				.getService(Components.interfaces.nsIRDFService);
			var lstore = Components. classes["@mozilla.org/rdf/datasource;1?name=local-store"]
				.getService(Components.interfaces.nsIRDFDataSource);
			if (lstore.GetTarget(RDF.GetResource("chrome://browser/content/browser.xul#nav-bar"), RDF.GetResource("currentset"), true)) {
				var navcset = lstore.GetTarget(RDF.GetResource("chrome://browser/content/browser.xul#nav-bar"),
					RDF.GetResource("currentset"), true).QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
				var curset = navcset.split(",");
				if (curset.indexOf("asb-zero") != -1) {
					var ai = curset[curset.indexOf("asb-zero")+1];
					CombinedStopReload.uninit();
					var navToolbar = document.getElementById("nav-bar");
					var rb = document.getElementById(ai);
					navToolbar.insertItem("asb-zero", rb, null, false); 
					CombinedStopReload.init();
				}
			}
		}
		
		this.manageCSS("r");
	}
  };

  window.addEventListener('load', function() { activestopbutton.init(); }, false);

};