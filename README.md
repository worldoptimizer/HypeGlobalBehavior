# Hype GlobalBehavior

![00002|690x413](https://playground.maxziebell.de/Hype/GlobalBehavior/HypeGlobalBehavior.png)

This idea got triggered back in the day :face_with_monocle: when <a href="https://forums.tumult.com/t/outdated-tutorials/2546/4)">trying to explain Custom Behavior as Tweets</a>. The idea stuck with me …

Mostly I use Hype these days for Widgets in CMS-Projects, hence I thought I share the concept of a unified communication pipeline across individual widget. So, I recreated LocalConnection from the Flash-days with a little Twitter-twist and named it GlobalBehavior:

_**Hint:** The code is an extension. It enables all Hype-Widget loaded on the same page to form a broadcast network. Inside the widget are just plain Custom Behavior calls following the rules mentioned in the example. The code from the JS-files below can also just be pasted into the Head-HTML._

**Demonstration:**\
https://playground.maxziebell.de/Hype/GlobalBehavior/

**Installation:**

* Link the runtime below into your head …  `<script type="text/javascript" src="YOURPATH/HypeCustomBehavior.min.js"></script>`. Please don't hotlink from my server in production sites (for testing it is fine) rather put the code in your project or server. 
* Another way is to drag it into your resource folder (use the minified version). 
* Or you can copy and paste the code into Head-HTML in your file (full or minified) but then don't forget to wrap in in a script-tag … `<script type="text/javascript">` CODE HERE `</script>`. 

**You only need one of the methods not all!**


Explanation
---
It's rather "simple" how it works…

## Flow when triggering a behavior
![image|690x460](https://forums.tumult.com/uploads/db2156/original/3X/c/0/c03f410a38e178b4884eced61bf95271f40d29fc.pngg) 

* Any custom behavior is sent to the local context as is!
  * It is also sent to Global Behavior on the page level
* Global Behavior forwards the behavior adding a # infront to all Hype Widgets, even the one sending it in the first place.

## Flow when triggering a targeted behavior
![image|690x460](https://forums.tumult.com/uploads/db2156/original/3X/0/a/0a8ee5eedbbf9d9742d8598610d81b20a5fa72f4.png) 

* Using the @ symbol directs the custom behavior to only the specified Hype widgets
* Hint: As in this flow the ping@C is sent to Hype GlobalBehavior and processed there. **A** internally actually only receives the string as is "ping@C" (little grey arrow)

**Updates:**\
`1.0	Initial release #-syntax, @-syntax based on Hype Observer Pattern`\
`1.1	Added callbacks in JS hypedocument.onGlobalBehavior`\
`1.2	Added iFrame (onedirectional), onedirectional postMessage`\
`1.3	Refactored code to Revealing Module Pattern, compiled against Closure-compiler, Bidirectional postMessage (Bubble Up, Bubble Down, Bubble Branching)`\
`1.4  Refactored to new naming and interface, corrected to american english`\
`1.5   Fixed a bug with iFrame propagation and added a "Singleton" check`\
`1.6   Added Custom Behavior Ticker feature, code cleanup`\
`1.7   Removed a bug when triggering a Hype widget in a iFrame that was not present on the same page level`
