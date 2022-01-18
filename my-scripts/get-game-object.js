// ==UserScript==
// @name         MohKari: Get Game Object
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Periodically console log the game object
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

    // 1. Open developer tools and inspect the game object.

    ///////////
    // NOTES //
    ///////////

    let frequency = 10;

    // observer to check if 'single' run script should run or not
    let observer = new MutationObserver(function(m){

        // game must exist, and must have enough cash
        if(typeof Game != 'undefined' && Game.town != null) {

            // dont watch anymore
            observer.disconnect();

            // start the main script in 10 seconds
            setInterval(function(){
                console.log("==GAME==");
                console.log(Game)
            },frequency*1000);

        }

    });
    observer.observe(document, {attributes: true, childList: true , subtree: true});

});
