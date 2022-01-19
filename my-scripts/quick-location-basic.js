// ==UserScript==
// @name         MohKari: Quick Location - Basic
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Quickly select a town location at game start with manual click
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

    // 1. Click an empty tile on the world map.

    ///////////
    // NOTES //
    ///////////

    // 1. Chance your account could be banned, as the script is faster than a human.
    // 2. Use at your own risk.

    // desired name
    let name = "CookieBandit";

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

        // wait for the "yes" button to appear
        console.log("waiting for the 'yes' button to appear");
        e = await waitForElement(".confirmlocationui-container:visible .yes");
        e.click();

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
    async function waitForElement(selector) {

        while (!$(selector).length) {
            await new Promise( r => setTimeout(r, 500) )
        }

        return $(selector);

    }

});
