// ==UserScript==
// @name         MohKari: Remove Undesirable Items
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Remove all Marsh's Tree's and Rock's.
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

    // start to remove undesirable items when cash is above this number
    let targetCash = 2000000;

    // observer to check if 'single' run script should run or not
    let observer = new MutationObserver(function(m){

        // game must exist, and must have enough cash
        if(typeof Game != 'undefined' && Game.town != null && Game.currency >= targetCash) {

            // dont watch anymore
            observer.disconnect();

            // start the main script in 10 seconds
            setTimeout(function(){

                console.log('SCRIPT "remove-undesirable-items" HAS STARTED.');

                start();

            },10000);

        }

    });
    observer.observe(document, {attributes: true, childList: true , subtree: true});

    function start(){

        // is this process, in process?
        let inProcess = false;

        // loop through each item, giving it enough time to do what it needs to do.
        let _interval = setInterval(function(){

            // is removal in process?
            if(inProcess == true){
                return;
            }

            // mark the process as started, so we don't try another item for a while
            inProcess = true;

            // delay inProcess switching back to false AFTER complete
            let delay = 0;

            // get all Marsh, Tree and Rock items in play
            // Note: Tested with Wheat Field and DOES NOT WORK.
            let items = Object.values(Game.town.objectDict).filter(o => (o.type === 'Marsh' || o.type == 'Tree' || o.type == 'Rock'));

            // if we are done, we are done!
            if(items == "undefined" || items.length == 0){
                console.log("Unable to find any item(s) to remove.");
                clearInterval(_interval);
                return;
            }

            // trigger confirm remove of item popup to occur
            Game.app.fire("ConfirmRemove", items[0].townX, items[0].townZ);

            // make sure the try and hit "confirm" on the remove dialog
            let __interval = setInterval(function(){

                delay++;
                let target = $("#RemoveObstacle-confirm .buy-currency");
                if(target.length != 0){

                    clearInterval(__interval);
                    target.click();
                    console.log("Removed item '" + items[0].type + "'. Removing next item in " + delay +"s.");

                    // set sales to allowed after correct time has elapsed
                    setTimeout(function(){
                        inProcess = false;
                    },delay*1000);

                }

            },2000);


        },2000);

    }

});
