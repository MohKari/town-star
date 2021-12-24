// ==UserScript==
// @name         Improved Town Star Auto-Sell
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  An improved version of the TownStar Auto-Sell script
// @author       MrCelticFox
// @match        https://townstar.sandbox-games.com/launch/
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_getValue
// @grant        GM_deleteValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const sellTimer = 300; // Seconds between selling (best setting is longest journey time divided by number of trade terminals)
    const gasLimit = 16; // Minimum amount of gas to keep, script will not sell anything when gas falls below this value
    const sellItemsAndLimits = [ // Put each item you want to sell here, and the limit (minimum amount that will NOT be sold)
        ['Wood', 65],
        ['Gasoline', 65],
        ['Pinot_Noir_Grapes', 0],
        ['Wheat', 20],
        ['Eggs', 15],
        ['Sugar', 15],
        ['Sugarcane', 20],
        ['Pumpkin', 20],
        ['Pumpkin_Pie', 0]
    ]; // All above are examples, you can put as many or as few as you want, and whatever limits you want
    
    let sellItemIndex = 0;

    // Updates the index for the items in a circular manner (goes back to the beginning when it hits the end)
    function updateSellItemIndex() {
        console.log("updating sellItem index..");
        sellItemIndex += 1;
        if (sellItemIndex >= sellItemsAndLimits.length) {
            sellItemIndex = 0;
        }
    }

    let availableDepots = []; // Leave empty, the script will auto-fill this with what's available in game
    let depotIndex = 0;

    // Updates the index for the depots and piers in a circular manner (goes back to the beginning when it hits the end)
    function updateDepotIndex() {
        console.log("updating depot index..");
        depotIndex += 1;
        if (depotIndex >= availableDepots.length) {
            depotIndex = 0;
        }
    }

    let sellingActive = 0;

    /*
    Handles basic game functions like automatically clicking 'play' when the page is refreshed
    */
    new MutationObserver(function(mutations){
        let airdropcollected = 0;
        if(document.getElementsByClassName('hud-jimmy-button')[0] && document.getElementsByClassName('hud-jimmy-button')[0].style.display != 'none'){
            document.getElementsByClassName('hud-jimmy-button')[0].click();
            document.getElementById('Deliver-Request').getElementsByClassName('yes')[0].click();
        }
        if(document.getElementsByClassName('hud-airdrop-button')[0] && document.getElementsByClassName('hud-airdrop-button')[0].style.display != 'none'){
            if(airdropcollected == 0){
                airdropcollected = 1;
                document.getElementsByClassName('hud-airdrop-button')[0].click();
                document.getElementsByClassName('air-drop')[0].getElementsByClassName('yes')[0].click();
            }
        }
        if (document.getElementById("playnow-container") && document.getElementById("playnow-container").style.visibility !== "hidden") {
            document.getElementById("playButton").click();
        }
        if(typeof Game != 'undefined' && Game.town != null) {
            if(sellingActive == 0) {
              console.log('Game loaded');
              sellingActive = 1;
              activateSelling();
              //activateTestFunction();
            }
        }
    }).observe(document, {attributes: true, childList: true , subtree: true});



    /*
    The main selling function
    */
    function activateSelling() {
        let start = GM_getValue("start", Date.now());
        GM_setValue("start", start);
        setTimeout(function(){
            let tempSpawnCon = Trade.prototype.SpawnConnection;
            Trade.prototype.SpawnConnection = function(r) {tempSpawnCon.call(this, r); console.log(r.craftType); GM_setValue(Math.round((Date.now() - start)/1000).toString(), r.craftType);}
        },10000);

        // load all the trade depots and trade piers into an array
        availableDepots = Object.values(Game.town.objectDict).filter(o => (o.type === 'Trade_Pier' || o.type === 'Trade_Depot'));

        window.mySellTimer = setInterval(function(){
            let depotObj = availableDepots[depotIndex];
            let depotKey = "[" + depotObj.townX + ", " + "0, " + depotObj.townZ + "]";
            Game.town.objectDict[depotKey].logicObject.OnTapped(); // Collect reward from previous time if there is one

            // Must have enough gas first
            if (Game.town.GetStoredCrafts()["Gasoline"] > gasLimit) {
                // Skip over any items we can't sell because they are below the limit
                let tmpCounter = 0;
                while(tmpCounter < sellItemsAndLimits.length) {
                    let tmpAmount = Game.town.GetStoredCrafts()[sellItemsAndLimits[sellItemIndex][0]];
                    if (typeof tmpAmount != 'undefined' && (tmpAmount > (sellItemsAndLimits[sellItemIndex][1] + 9)) ) {
                        break;
                    }
                    updateSellItemIndex();
                    tmpCounter++;
                }

                // Get item to sell and its limit from the array
                let sellItem = sellItemsAndLimits[sellItemIndex][0];
                let sellLimit = sellItemsAndLimits[sellItemIndex][1];

                // Execute the trade (but double check because maybe we don't have enough of anything)
                if (Game.town.GetStoredCrafts()[sellItem] > (sellLimit + 9)) {
                    console.log("SELLING " + sellItem + "!");
                    Game.app.fire("SellClicked", {x: depotObj.townX, z: depotObj.townZ});
                    setTimeout(function(){
                        let craftTarget = document.getElementById("trade-craft-target");
                        craftTarget.querySelectorAll('[data-name="' + sellItem + '"]')[0].click();
                        setTimeout(function(){
                            document.getElementById("destination-target").getElementsByClassName("destination")[0].getElementsByClassName("sell-button")[0].click();
                        },1000);
                    },3000);
                    updateDepotIndex();
                    updateSellItemIndex();
                }
                else {
                    console.log("Not enough items to sell");
                }
            }
            else {
                console.log("Not enough fuel");
            }
        },sellTimer*1000);
    }



    /*
    For running tests while developing
    */
    function activateTestFunction() {
        
    }
})();