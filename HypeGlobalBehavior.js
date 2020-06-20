/*!
Hype GlobalBehavior 1.7
copyright (c) 2018 Max Ziebell, (https://maxziebell.de). MIT-license
*/

/**
 * This module allows to extend custom behavior across Hype document and iFrame boundaries containing Hype documents. There is also an implementation making this work across devices using Pusher.
 * @module Hype GlobalBehavior
 */

/*
 * Version-History
 * 1.0	Initial release #-syntax, @-syntax based on Hype Observer Pattern
 * 1.1	Added callbacks in JS hypedocument.onLocalConnection
 * 1.2	Added iFrame (onedirectional), onedirectional postMessage
 * 1.3	Refactored code to Revealing Module Pattern, compiled against Closure-compiler, Bidirectional postMessage
 * 1.4	Refactored to new naming and interface, corrected to american english
 * 1.5   Fixed a bug with iFrame propagation and added a "Singleton" check
 * 1.6   Added Custom Behavior Ticker feature, code cleanup
 * 1.7   Removed a bug when triggering a Hype widget in a iFrame that was not present on the same page level
 */

/**
 * @typedef {Object} HypeGlobalBehavior
 * @property {function} allowPostMessageFrom This function allows to limit the iFrame parents by domain that can communicate with the Hype documents contained in the current window using global behavior
 * @property {function} triggerCustomBehaviorNamed This function allows to trigger a custom behavior from the window scope.  The signature is equal to hypeDocument.triggerCustomBehavior
 * @property {function} startCustomBehaviorTicker This function allows to start a time based global behavior ticker from the window scope. The signatur is equal to hypeDocument.startCustomBehaviorTicker
 * @property {function} stopCustomBehaviorTicker This function allows to stop a time based global behavior ticker from the window scope. The signatur is equal to hypeDocument.stopCustomBehaviorTicker
 * @property {function} stopAllCustomBehaviorTicker This function allows to stop all time based global behavior ticker from the window scope. The signatur is equal to hypeDocument.stopAllCustomBehaviorTicker
 */

if("HypeGlobalBehavior" in window === false) window['HypeGlobalBehavior'] = (function () {
	
	/* Lookup for running intervals by behavior name */
	var _ticker = {};

	/* Array of allowed servers (optional security for postMessage) */
	var _allowedServers = [];

	/* Core progapation globalBehaviour */
	var globalBehavior = function(hypeDocument, element, event) {
		if (event.customBehaviorName.substr(0,1)!='#') {
			/* command parser */
			var args = event.customBehaviorName.split('@');
			var behavior = args.shift();
			var docs = (args.length==0) ? Object.keys(window['HYPE']['documents']) : args;
			/* trigger in hype context */
			for (var id in docs) {
				var hypeDoc;
				if (window['HYPE']['documents'].hasOwnProperty(docs[id])){
					hypeDoc = window['HYPE']['documents'][docs[id]];
					hypeDoc.triggerCustomBehaviorNamed('#'+ behavior);
					if (hypeDoc.hasOwnProperty('onGlobalBehavior')) {
						hypeDoc['onGlobalBehavior']('#'+ behavior);
					}
				}
			}
			/* trigger in page context */
			if (HypeGlobalBehavior.hasOwnProperty('onGlobalBehavior')) {
				HypeGlobalBehavior['onGlobalBehavior']('#'+ behavior);
			}
			/* propagation */
			var isBubbleOrigin = (!event['isBubbleDown']&&!event['isBubbleUp']);
			if (event['isBubbleDown']||isBubbleOrigin) {
				notifyChildren(behavior, null);
			}
			if (event['isBubbleUp']||isBubbleOrigin) {
				notifyParent(behavior);
				if (event['childToAvoid']) {
					notifyChildren(behavior, event['childToAvoid']);
				}	
			}
		}
		return true;
	};

	var notifyParent = function(behavior){
		if (window!=top) {
			window.parent.postMessage({
				type:'TriggerCustomBehaviorBubbleUp',
				customBehaviorName: behavior
			}, '*');
		}
	};

	var notifyChildren = function(behavior, childToAvoid){
		[].forEach.call( document.querySelectorAll('iframe'), function fn(elem){ 
			var iframe = elem.contentWindow;
			if (childToAvoid!=iframe) {
				iframe.postMessage({
					type:'TriggerCustomBehaviorBubbleDown',
					customBehaviorName: behavior
				}, '*');
			}
		});
	};

	var handlePostMessage = function(event) {
		if (_allowedServers.length) { /* only use if populated */
			if (_allowedServers.indexOf(event.origin) == -1) {
				console.log ("Blocked behavior from "+event.origin);
				return;
			}
		}
		if (event.data.hasOwnProperty('type') && event.data.hasOwnProperty('customBehaviorName')){
			var isBubbleUp = (event.data.type == 'TriggerCustomBehaviorBubbleUp');
			var isBubbleDown = (event.data.type == 'TriggerCustomBehaviorBubbleDown');
			if (isBubbleUp || isBubbleDown) {
				globalBehavior(null, null, {
					customBehaviorName: event.data.customBehaviorName,
					isBubbleUp: isBubbleUp,
					isBubbleDown: isBubbleDown,
					childToAvoid: (isBubbleUp) ? window : null
				});
			}
		}
	};
	
	var triggerCustomBehaviorNamed = function(behavior){
		globalBehavior(null, null, {customBehaviorName:behavior});
	};

	var allowPostMessageFrom = function(server){
		_allowedServers.push(server);
	};

	/* Custom behavior ticker feature */
	var startCustomBehaviorTicker = function(behavior, time, opt){
		if (behavior==null || time==null) return;
		if (!_ticker.hasOwnProperty(behavior)) {
			var fnc;
			var interval = (time.hasOwnProperty('FPS')) ? 1000/time.FPS : time*1000;
			opt = opt ? opt : {};
			if (opt.hasOwnProperty('pattern')) {
				opt._buf = opt.pattern.slice(0);
				if (opt.countdown==null) opt.countdown = Infinity;
				fnc=function(){
					if (opt._buf.length==0) opt._buf = opt.pattern.slice(0);
					if (opt._buf.shift()) triggerCustomBehaviorNamed(behavior);
				}
			} else {
				fnc=function(){
					triggerCustomBehaviorNamed(behavior);
				}
			}
			_ticker[behavior] = setInterval(fnc,interval);
			if ( !opt.omitFirst) fnc();
		}
	}

	var stopCustomBehaviorTicker = function(behavior){
		if (_ticker.hasOwnProperty(behavior)) {
			clearInterval( _ticker[behavior]);
			delete _ticker[behavior];
		}
	}

	var stopAllCustomBehaviorTicker = function(){
		for (var behavior in _ticker) {
			stopCustomBehaviorTicker (behavior);
		}
	}	

	/* Reveal Public interface to hypeDocument */
	var extendHype = function(hypeDocument, element, event) {

		/**
		* hypeDocument.startCustomBehaviorTicker
		* @param {String} behavior name to fire
		* @param {Number} time in seconds (can be fractional)
		* @param {Object} Some optional settings like pattern
		*/
		hypeDocument.startCustomBehaviorTicker = function(behavior, time, opt){
			startCustomBehaviorTicker (behavior, time, opt);
		}

		/**
		* hypeDocument.stopCustomBehaviorTicker
		* @param {String} behavior name to stop firing
		*/
		hypeDocument.stopCustomBehaviorTicker = function(behavior){
			stopCustomBehaviorTicker (behavior);
		}

		/**
		* hypeDocument.stopAllCustomBehaviorTicker
		* @require stopCustomBehaviorTicker
		*/
		hypeDocument.stopAllCustomBehaviorTicker = function(){
			stopAllCustomBehaviorTicker ();
		}

		return true;
	};

	/* Setup and handlers */
	window.addEventListener('message', handlePostMessage, false);

	/* Setup Hype listeners */
	if("HYPE_eventListeners" in window === false) { window.HYPE_eventListeners = Array();}
	window.HYPE_eventListeners.push({"type":"HypeDocumentLoad", "callback": extendHype});
	window.HYPE_eventListeners.push({"type":"HypeTriggerCustomBehavior", "callback": globalBehavior});

	/** 
	 * Reveal Public interface to window['HypeGlobalBehavior'] 
	 * return {HypeGlobalBehavior}
	 */
	return {
		version: '1.7',

		'allowPostMessageFrom': allowPostMessageFrom,
		'triggerCustomBehaviorNamed': triggerCustomBehaviorNamed,

		'startCustomBehaviorTicker': startCustomBehaviorTicker,
		'stopCustomBehaviorTicker': stopCustomBehaviorTicker,
		'stopAllCustomBehaviorTicker': stopAllCustomBehaviorTicker,
	};
})();
