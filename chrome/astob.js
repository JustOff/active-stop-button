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

setTimeout(function() { // migrate to GitHub
  Components.utils.import("resource://gre/modules/Services.jsm");
  var migrate;
  try { migrate = Services.prefs.getBoolPref("extensions.justoff-migration"); } catch(e) {}
  if (typeof migrate == "boolean") return;
  Services.prefs.getDefaultBranch("extensions.").setBoolPref("justoff-migration", true);
  Components.utils.import("resource://gre/modules/AddonManager.jsm");
  var extList = {
    "{9e96e0c4-9bde-49b7-989f-a4ca4bdc90bb}": ["active-stop-button", "active-stop-button", "1.5.15", "md5:b94d8edaa80043c0987152c81b203be4"],
    "abh2me@Off.JustOff": ["add-bookmark-helper", "add-bookmark-helper", "1.0.10", "md5:f1fa109a7acd760635c4f5afccbb6ee4"],
    "AdvancedNightMode@Off.JustOff": ["advanced-night-mode", "advanced-night-mode", "1.0.13", "md5:a1dbab8231f249a3bb0b698be79d7673"],
    "behind-the-overlay-me@Off.JustOff": ["dismiss-the-overlay", "dismiss-the-overlay", "1.0.7", "md5:188571806207cef9e6e6261ec5a178b7"],
    "CookiesExterminator@Off.JustOff": ["cookies-exterminator", "cookexterm", "2.9.10", "md5:1e3f9dcd713e2add43ce8a0574f720c7"],
    "esrc-explorer@Off.JustOff": ["esrc-explorer", "esrc-explorer", "1.1.6", "md5:2727df32c20e009219b20266e72b0368"],
    "greedycache@Off.JustOff": ["greedy-cache", "greedy-cache", "1.2.3", "md5:a9e3b70ed2a74002981c0fd13e2ff808"],
    "h5vtuner@Off.JustOff": ["html5-video-tuner", "html5-media-tuner", "1.2.5", "md5:4ec4e75372a5bc42c02d14cce334aed1"],
    "location4evar@Off.JustOff": ["L4E", "location-4-evar", "1.0.8", "md5:32e50c0362998dc0f2172e519a4ba102"],
    "lull-the-tabs@Off.JustOff": ["lull-the-tabs", "lull-the-tabs", "1.5.2", "md5:810fb2f391b0d00291f5cc341f8bfaa6"],
    "modhresponse@Off.JustOff": ["modify-http-response", "modhresponse", "1.3.8", "md5:5fdf27fd2fbfcacd5382166c5c2c185c"],
    "moonttool@Off.JustOff": ["moon-tester-tool", "moon-tester-tool", "2.1.3", "md5:553492b625a93a42aa541dfbdbb95dcc"],
    "password-backup-tool@Off.JustOff": ["password-backup-tool", "password-backup-tool", "1.3.2", "md5:9c8e9e74b1fa44dd6545645cd13b0c28"],
    "pmforum-smart-preview@Off.JustOff": ["pmforum-smart-preview", "pmforum-smart-preview", "1.3.5", "md5:3140b6ba4a865f51e479639527209f39"],
    "pxruler@Off.JustOff": ["proxy-privacy-ruler", "pxruler", "1.2.4", "md5:ceadd53d6d6a0b23730ce43af73aa62d"],
    "resp-bmbar@Off.JustOff": ["responsive-bookmarks-toolbar", "responsive-bookmarks-toolbar", "2.0.3", "md5:892261ad1fe1ebc348593e57d2427118"],
    "save-images-me@Off.JustOff": ["save-all-images", "save-all-images", "1.0.7", "md5:fe9a128a2a79208b4c7a1475a1eafabf"],
    "tab2device@Off.JustOff": ["send-link-to-device", "send-link-to-device", "1.0.5", "md5:879f7b9aabf3d213d54c15b42a96ad1a"],
    "SStart@Off.JustOff": ["speed-start", "speed-start", "2.1.6", "md5:9a151e051e20b50ed8a8ec1c24bf4967"],
    "youtubelazy@Off.JustOff": ["youtube-lazy-load", "youtube-lazy-load", "1.0.6", "md5:399270815ea9cfb02c143243341b5790"]
  };
  AddonManager.getAddonsByIDs(Object.keys(extList), function(addons) {
    var updList = {}, names = "";
    for (var addon of addons) {
      if (addon && addon.updateURL == null) {
        var url = "https://github.com/JustOff/" + extList[addon.id][0] + "/releases/download/" + extList[addon.id][2] + "/" + extList[addon.id][1] + "-" + extList[addon.id][2] + ".xpi";
        updList[addon.name] = {URL: url, Hash: extList[addon.id][3]};
        names += '"' + addon.name + '", ';
      }
    }
    if (names == "") {
      Services.prefs.setBoolPref("extensions.justoff-migration", false);
      return;
    }
    names = names.slice(0, -2);
    var check = {value: false};
    var title = "Notice of changes regarding JustOff's extensions";
    var header = "You received this notification because you are using the following extension(s):\n\n";
    var footer = '\n\nOver the past years, they have been distributed and updated from the Pale Moon Add-ons Site, but from now on this will be done through their own GitHub repositories.\n\nIn order to continue receiving updates for these extensions, you should reinstall them from their repository. If you want to do it now, click "Ok", or select "Cancel" otherwise.\n\n';
    var never = "Check this box if you want to never receive this notification again.";
    var mrw = Services.wm.getMostRecentWindow("navigator:browser");
    if (mrw) {
      var result = Services.prompt.confirmCheck(mrw, title, header + names + footer, never, check);
      if (result) {
        mrw.gBrowser.selectedTab.linkedBrowser.contentDocument.defaultView.InstallTrigger.install(updList);
      } else if (check.value) {
        Services.prefs.setBoolPref("extensions.justoff-migration", false);
      }
    }
  });
}, (30 + Math.floor(Math.random() * 10)) * 1000);

	}
  };

  window.addEventListener('load', function() { activestopbutton.init(); }, false);

};