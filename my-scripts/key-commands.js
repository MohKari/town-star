// ==UserScript==
// @name         MohKari: Key Commands
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Bind key press to actions
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

    // 1. Click a tile on your town.
    // 2. Press a key that binds to a function.

    ///////////
    // NOTES //
    ///////////

    // 1. Sometimes when I build a dirt road, and then remove another tile, the dirt road doesn't auto complete.
    // 2. You might want to comment out the remove bind if you are worried you might destroy a building by accident.
    // 3. Script is currently open to "accidental" exploits if you build over a tree, it doesn't cost you anything.
    
    // ToDo: Verify that selected tile is empty!

    // keybinds to trigger functions
    const binds = {
        "r":"remove",               // remove tile
        "d":"dirtRoad",             // build and auto complete dirt road
        "1":"buildFarm",            // open build menu to farm tab
        "2":"buildRanch",           // open build menu to ranch tab
        "3":"buildTerrain",         // open build menu to terrain tab
        "4":"buildIndustrial",      // open build menu to industrial tab
        "5":"buildTrade",           // open build menu to trade tab
        "t":"tree",                 // build and auto complete tree
        "g":"grapes"                // build and auto complete pinot noir grapes
    };

    // on "key" press, do value()
    $(document).on("keypress", function (e) {

        // convert keycode into character
        let char = String.fromCharCode(e.which);

        // get value from binds
        let value = binds[char];

        switch(value){
            case "remove": remove(); break;
            case "dirtRoad": dirtRoad(); break;
            case "buildFarm": buildMenu("Farm"); break;
            case "buildRanch": buildMenu("Ranch"); break;
            case "buildTerrain": buildMenu("Terrain"); break;
            case "buildIndustrial": buildMenu("Industrial"); break;
            case "buildTrade": buildMenu("Trade"); break;
            case "tree": tree(); break;
            case "grapes": grapes(); break;
            default:
                console.log("Can't find function [" + value + "]");
        }

    });

    /**
     * Build and complete a "Pinot Noir Vines".
     */
    async function grapes(){

        if( $('.hud-store-button:visible').length ){

            let e;

            await buildMenu("Farm");

            // buy dirt road
            e = await waitForProduct('Pinot Noir Vines');
            e.click();

            // complete the building
            await completeBuilding()

        }

    }

    /**
     * Build and complete a tree.
     */
    async function tree(){

        if( $('.hud-store-button:visible').length ){

            let e;

            await buildMenu("Farm");

            // buy dirt road
            e = await waitForProduct('Tree');
            e.click();

            // complete the building
            await completeBuilding()

        }

    }

    /**
     * Build and complete a dirt road.
     */
    async function dirtRoad(){

        if( $('.hud-store-button:visible').length ){

            let e;

            await buildMenu("Terrain");

            // buy dirt road
            e = await waitForProduct('Dirt Road');
            e.click();

            // complete the building
            await completeBuilding()

        }

    }

    /**
     * Remove a building.
     */
    function remove(){

        if($('.menu-remove:visible').length){
            $('.menu-remove .remove').click();
        }else if($('.menu-cancel:visible').length){
            $('.menu-cancel .remove').click();
        }else{
            return;
        }

        // ToDo: hide menu that appears when you remove a tree/marsh etc
        $('#RemoveItem-confirm').hide();
        setTimeout(function(){
            $('#RemoveItem-confirm .yes').click();
            $('#RemoveItem-confirm').show();
        },500);

    }

    /**
     * Open build menu to specified tab.
     */
    async function buildMenu(tab){

        //
        let map = [
            "Farm",
            "Ranch",
            "Terrain",
            "Industrial",
            "Trade",
        ];
        let index = map.indexOf(tab);

        if(index == -1){
            console.log("Can't map [" + tab + "] in buildMenu().");
            return;
        }

        // open store and select tab
        if( $('.hud-store-button:visible').length ){

            e = await waitForElement('.hud-store-button');
            e.click();

            e = await waitForElement('.store .footer-row button:eq(' + index + ')');
            e.click();

        }

        // select tab ( if store already open )
        if( $('.store .footer-row:visible').length ){

            e = await waitForElement('.store .footer-row button:eq(' + index + ')');
            e.click();

        }

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

    /**
     * Wait for product to load and return the "buy" button
     * @param  {[type]} name [description]
     * @return {[type]}      [description]
     */
    async function waitForProduct(name) {

        while (!$('.store .product.can-purchase').find("h2:contains('" + name + "')").parent().find('button').length) {
            await new Promise( r => setTimeout(r, 500) )
        }
        return $('.store .product.can-purchase').find("h2:contains('" + name + "')").parent().find('button');

    }

    /**
     * Completes newly created building
     * @return {[type]} [description]
     */
    async function completeBuilding() {

        let selectedObj = Game.town.selectedObject;
        let obj = Object.values(Game.town.objectDict).filter(o => o.townX == selectedObj.townX && o.townZ == selectedObj.townZ)[0];
        let buildTime;

        // while state is "WaitForReqs" or buildTime is changing, delay hitting "complete"
        while (obj.data.buildTime != buildTime || obj.data.state == "WaitForReqs") {
            buildTime = obj.data.buildTime;
            await new Promise( r => setTimeout(r, 500) )
        }

        obj.logicObject.CompleteBuild();

    }

});
