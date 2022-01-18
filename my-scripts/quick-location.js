// ==UserScript==
// @name         MohKari: Quick Location
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Quickly select a town location at game start
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

    // 1. Visit https://townstar.guide/gasmap.html
    // 2. Hover over a cell that you want to "automatically" create your town on.
    // 3. The tooltip that appears are your values to put into the pos array below.

    ///////////
    // NOTES //
    ///////////

    // 1. Chance your town will be removed, as the script is faster than a human.
    // 2. Use at your own risk.
    // 3. Conflicts with "Auto Sell" that hits "play now button".
    // 4. Doesn't handle the "pop up" that appears if someone else has actually chosen the location.

    // desired name
    let name = "CaspiansPizza";

    // locations to try and place town, in order
    let pos = [
        [63, 78],   // t:f n:- e:- s:m w:o
        [27, 51],   // t:f n:- e:- s:o w:m
        [63, 80],   // t:f n:m e:- s:- w:o
        [290, 173], // t:d n:- e:m s:d w:r  on desert
        [275, 145], // t:f n:r e:- s:m w:c  no salt
        [275, 143], // t:f n:- e:r s:r w:m  no salt
    ];

    // observer to check if script should run or not, script wont run if you already have a town placed.
    let observer = new MutationObserver(function(m){

        // game must exist with no town object
        if(typeof Game != 'undefined' && Game.town == null) {

            console.log('SCRIPT "quick-location" HAS STARTED.');

            // dont watch anymore
            observer.disconnect();

            // run
            run();

        }

    });
    observer.observe(document, {attributes: true, childList: true , subtree: true});

    async function run(){

        let e;

        // wait till game has loaded 100%
        console.log("waiting for 100%");
        await waitForElement("#progressText:contains('100%')");

        // hit play now button
        console.log("hitting play now when it appears");
        await waitForElement("#playnow-container:visible");
        e = await waitForElement("#playButton");
        e.click()

        // wait till it says "Pick Location"
        console.log("making sure 'Pick Location' message exists");
        await waitForElement(".main-text");

        // loop through each position
        for (var i = 0; i <= pos.length; i++) {

            // get x and y from array
            let x = pos[i][0];
            let z = pos[i][1];

            // selecting location
            console.log("selecting location [" + x + ", " + z + "]");

            // include offset
            x = x + MapDataManager.offset.x;
            z = z + MapDataManager.offset.z;

            // click location
            Game.app.fire("WorldTapped", {point:{x:x,z:z}});

            // check if the "confirmation" element appears
            console.log("checking for confirmation window...");
            e = await waitForElement(".confirmlocationui-container:visible .yes", 12);

            // if the confirmation window doesn't appear, move onto the next item
            if(e == false){
                continue;
            }

            // otherwise, click the "yes" button and break the loop
            e.click();
            break;

        }

        // put town name in
        console.log("putting in name");
        e = await waitForElement(".townName input");
        e.val(name);

        // click ok
        console.log("clicking ok");
        e = $(".townName button");
        e.prop('disabled', false);
        e.click();

        console.log("town created");

    }

    ////////////
    // UTLITY //
    ////////////

    /**
     * Wait for element to load and return the element
     * @param  {[type]} selector [description]
     * @return {[type]}          [description]
     */
    async function waitForElement(selector, max = 1000) {

        let count = 0;

        while (!$(selector).length) {
            count++;
            if(count >= max){
                return false;
            }
            await new Promise( r => setTimeout(r, 500) )
        }

        return $(selector);

    }

});
