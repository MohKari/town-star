// ==UserScript==
// @name         MohKari: Upgrade Dirt Roads
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Upgrade all Dirt Roads to Paved Roads
// @author       MohKari
// @match        *://*.sandbox-games.com/*
// @grant        none
// @run-at       document-start
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

$(function() {

    ///////////////////////
    // HOW TO USE SCRIPT //
    ///////////////////////

    // 1. Don't.

    // only start upgrading paths if cash is above this amount
    let targetCash = 2000000;

    // how much time you want between each upgrade ( gives your builders enough time to upgrade )
    // because you don't want lots of upgrades happening at the same time ( in seconds )
    let timeOut = 120;

    // observer to check if 'single' run script should run or not
    let observer = new MutationObserver(function(m){

        // game must exist, and must have enough cash
        if(typeof Game != 'undefined' && Game.town != null && Game.currency >= targetCash) {

            // dont watch anymore
            observer.disconnect();

            // start the main script in 10 seconds
            setTimeout(function(){

                console.log('SCRIPT "upgrade-dirt-roads" HAS STARTED.');

                upgradePaths();
                confirmUpgradedPaths();

            },10000);

        }

    });
    observer.observe(document, {attributes: true, childList: true , subtree: true});

    // trys to upgrade a dirt roads every X seconds
    function upgradePaths(){

        // is this process, in process?
        let inProcess = false;

        // loop through each item, giving it enough time to do what it needs to do.
        setInterval(function(){

            // is upgrade in process?
            if(inProcess == true){
                return;
            }

            // mark the process as started, so we don't try another item for a while
            inProcess = true;

            // get all dirt roads in play
            let items = Object.values(Game.town.objectDict).filter(o => (o.type === 'Dirt_Road'));

            // if no dirt roads exist, let the next check occur after timeOut
            if(items == "undefined" || items.length == 0){

                console.log("Unable to find any [Dirt Road]'s to upgrade. Will check again in " + timeout +"s.");

                setTimeout(function(){
                    inProcess = false;
                },timeOut*1000);

                return;

            }

            // trigger upgrade window to appear
            UpgradeUi.instance.UI.Open(Game.town.GetObjectAt(items[0].townX, items[0].townZ));

            // make sure the try and hit "confirm" on the dialog
            let _interval = setInterval(function(){

                let target = $(".upgrade .buy-currency");
                if(target.length != 0){

                    clearInterval(_interval);
                    target.click();
                    console.log("[Dirt Road] upgrading into [Paved Road]'. Next item in " + timeOut +"s.");

                    // set sales to allowed after correct time has elapsed
                    setTimeout(function(){
                        inProcess = false;
                    },timeOut*1000);

                }

            },1000);


        },1000);

    }

    // every 10 seconds, complete any paved roads upgrades
    function confirmUpgradedPaths(){

        setInterval(function(){

            let count = 0;

            let items = Object.values(Game.town.objectDict).filter(o => (o.type === 'Construction_Site'));

            for (var i = items.length - 1; i >= 0; i--) {

                let item = items[i];
                if(item.data.type == "Paved_Road" && item.data.state == "Complete"){
                    item.logicObject.CompleteBuild();
                    count++;
                }

            }

            if(count != 0){
                console.log("Confirmed upgrade of " + count + " [Paved_Road](s).");
            }

        },10000);

    }

});
