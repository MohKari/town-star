// ==UserScript==
// @name         MohKari: TownStar Autosell
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  TownStar Auto Sell
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

    ///////////
    // NOTES //
    ///////////

    // ToDo: add logic to handle freight peirs?
    // ToDo: make it so certain depo's only sell certain items?
    // ToDo: maxTransportTime per depo? / each Depo to have its own timer

    // Note: Script seems to not work if all of your stores are full?
    // Some issue with Game.town.GetStoredCrafts() only returning Gasoline

    // ToDo: on screen log, rather than console?

    // Note: can i get maxTransportTime dynamically?
    const maxTransportTime = 97;    // maximum duration for transportation ( seconds )
    const gasReserve = 1;           // keep this much fuel in reserve

    // ToDo: make it so the trade window doesn't pop up if this is set to true
    const backgroundTrade = true;   // stops the trade window from popping up when the

    const sellItemsAndLimits = [ // Put each item you want to sell here, and the limit (minimum amount that will NOT be sold)
        // ['Sugar', 15],
        // ['Sugarcane', 15],
        // ['Peppermint', 15],
        // ['Candy_Canes', 0],
        ['Pinot_Noir_Grapes', 0],
        ['Wheat', 0],
        // ['Cotton', 0],
    ];

    let depos = [];                 // auto updating list of depos
    let depoIndex = 0;              // index of current depo
    let sellIntervalTime;           // auto updating sellIntervalTime
    let saleAllowed = true;         // flag to determine if we can start a new sale

    // observer to check if script should run or not
    let observer = new MutationObserver(function(m){

        ///////////////////////////
        // FROM PREVIOUS VERSION //
        ///////////////////////////

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

        ///////////////////////////////
        // END FROM PREVIOUS VERSION //
        ///////////////////////////////

        // ToDo: find h1 element that has the html of "Introducing Play to Earn!", then find the closest close-button class and click it
        // <div class="header-row"><div class="left"><h1>Introducing Play to Earn!</h1></div> <button class="close-button"></button></div>

        // game must exist with the town object ( not on the world map )
        if(typeof Game != 'undefined' && Game.town != null) {

            // dont watch anymore
            observer.disconnect();

            // start the main script in 10 seconds
            setTimeout(function(){

                console.log('SCRIPT "auto-sell" HAS STARTED.');

                // update depo data, then update every 30 seconds
                updateDepos();
                setInterval(function(){
                    updateDepos();
                },30000);

                // collect payments pretty quick
                collectPayments();

                // start selling
                startSelling();

            },10000);

        }

    });
    observer.observe(document, {attributes: true, childList: true , subtree: true});

    // update depos data and sellIntervalTime
    function updateDepos(){

        // populate depos list
        depos = Object.values(Game.town.objectDict).filter(o => (o.type === 'Trade_Pier' || o.type === 'Trade_Depot' || o.type === 'Express_Depot'));

        // calculate sell interval
        let newSellIntervalTime = maxTransportTime / depos.length

        // if sell interval has changed, set the next depo to the one just built
        // Note: could probably optimize this for when you remove depo's too...
        if(newSellIntervalTime != sellIntervalTime){
            sellIntervalTime = newSellIntervalTime;
            depoIndex = depos.length-1
        }

    }

    // collect payments from all depots every 30 seconds, with 1 second delays
    function collectPayments(){

        // every 30 seconds...
        setInterval(function(){

            console.log("Collecting all payments $$$.");

            let i = 0;

            // every second click a depo
            let interval = setInterval(function(){

                // click the depo
                let depo = "[" + depos[i].townX + ", " + "0, " + depos[i].townZ + "]";
                Game.town.objectDict[depo].logicObject.OnTapped();

                // advance count, and stop if no more depos
                i++;
                if(i >= depos.length){
                    clearInterval(interval);
                }

            },1000);

        },30000);

    }

    // try to sell something every second
    function startSelling() {

        // check if we can sell every second
        setInterval(function(){

            // is a new sale allowed right now?
            if(saleAllowed == false){
                return;
            }

            // must have enough gas
            if (Game.town.GetStoredCrafts()["Gasoline"] == undefined || Game.town.GetStoredCrafts()["Gasoline"] <= gasReserve) {
                console.log("Unable to sell item(s), need more than [" + gasReserve + "] gasoline.");
                return;
            }

            // loop through all items i want to sell
            for (let i = 0; i < sellItemsAndLimits.length; i++) {

                // name and sell limit of item
                let itemName = sellItemsAndLimits[i][0];
                let sellAbove = sellItemsAndLimits[i][1];

                // amount of item in town
                let itemQuantityInTown = Game.town.GetStoredCrafts()[itemName];

                // if there is enough, proceed to sell
                if (typeof itemQuantityInTown != 'undefined' && (itemQuantityInTown > sellAbove+9)) {

                    console.log("Selling [" + itemName + "]");
                    sellItem(itemName);
                    break;

                // insufficient quantity of items to sell
                }else if(i == sellItemsAndLimits.length-1){
                    console.log('Insufficient quantity of item(s) to sell.');
                    return;
                }

            }

        },1000);

    }

    // sell an item
    function sellItem(itemName){

        // keep track of how much 'extra' time this sale takes
        let delay = 0;

        // temporary instance of interval
        let _interval;

        // prevent any more sales occurring until we are done with this
        saleAllowed = false;

        // do trade in background?
        if(backgroundTrade == true){

        }

        // open sell window
        let depo = depos[depoIndex];
        Game.app.fire("SellClicked", {x: depo.townX, z: depo.townZ});

        // try to click the item to be sold every second, if you can click it, stop checking
        _interval = setInterval(function(){

            delay++;
            let target = $("#trade-craft-target .craft." + itemName);
            if(target.length == 1){

                clearInterval(_interval);
                target.click();

                // try to click the sell button every second, if you can click it, stop checking
                _interval = setInterval(function(){

                    delay++;
                    let target = $("#destination-target .destination .sell-button").first();
                    if(target.length == 1){

                        clearInterval(_interval);

                        // if sell button is disabled ( front end validation, wow ) cancel the sale
                        if(target.hasClass('disabled')){

                            console.log("Sale canceled due lack of gasoline.");

                            // close trade screen
                            let target = $(".trade.fullscreen .close-button");
                            target.click();

                            // allow sale to be tried again
                            saleAllowed = true;

                            return;
                        }

                        // click sell button
                        target.click();

                        // if we are here for a while, click cancel and setup so we can start again
                        let cancelTradeTimeout = setTimeout(function(){

                            // ToDo: Carry any delay incurred from canceled sales to carry through
                            // ToDo: On a cancel, move to next Depo?
                            let target = $(".trade-connection .no");
                            target.click();
                            clearInterval(_interval);
                            setTimeout(function(){
                                saleAllowed = true;
                            },5000);
                            console.log("Sale canceled due to delay, retrying in 5 seconds.");

                        },5000);

                        // watch for when the "selling in progress" message disappears ( successful sale )
                        _interval = setInterval(function(){

                            delay++;
                            let target = $(".trade-connection");
                            if(target.length == 0){

                                clearInterval(_interval);
                                clearTimeout(cancelTradeTimeout);

                                // ensure depoIndex is at correct value
                                depoIndex++;
                                if(depoIndex == depos.length){
                                    depoIndex = 0;
                                }

                                console.log(getTime() + ", sold [" + itemName + "]");
                                console.log("Next sale in " + (sellIntervalTime - delay) +"s. Sale was delayed by " + delay + "s.");

                                // set sales to allowed after correct time has elapsed
                                setTimeout(function(){
                                    saleAllowed = true;
                                },(sellIntervalTime-delay)*1000);

                            }

                        },1000);

                    }

                },1000);

            }

        },1000);


    }

    // return current time in HH:MM:SS format
    function getTime(){

        let d = new Date();
        let hours = formatTwoDigits(d.getHours());
        let minutes = formatTwoDigits(d.getMinutes());
        let seconds = formatTwoDigits(d.getSeconds());

        let string = hours + ":" + minutes + ":" + seconds;
        return string;

    }

    /**
     * This method helps to format a string of two digits.
     * In case the given number is smaller than 10, it will add a leading zero,
     * e.g. 08 instead of 8
     * @param {Number} n - a number with one or two digits
     * @returns {String} String with two digits
     */
    function formatTwoDigits(n) {
        return n < 10 ? '0' + n : n;
    }

});
