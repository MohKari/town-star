// ==UserScript==
// @name         MohKari: Automate Gas Production
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Create Gas with just one refinery.
// @author       MohKari
// @match        *://*.sandbox-games.com/*
// @grant        none
// @run-at       document-start
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {

    ///////////////////////
    // HOW TO USE SCRIPT //
    ///////////////////////

    // 1. Toggle "Produce Gas" "on/off" buttons.

    // automate gas production? true/false
    let enabled = false;

    // just the messages that appear on the button.
    const on = "Gas Production On";
    const off = "Gas Production Off";

    // observer to check if script should run or not, script wont run if you already have a town placed.
    let observer = new MutationObserver(function(m){

        // hud-right must exist
        if($('.hud-right').length){

            console.log('SCRIPT "automate-gas-production" HAS STARTED.');

            // dont watch anymore
            observer.disconnect();

            // run
            addButton();

            // try to automate gas production every second, if enabled
            setInterval(function(){

                if(enabled){
                    tryToAutomateGasProduction();
                }

            },1000);

        }

    });
    observer.observe(document, {childList: true , subtree: true});

    /**
     * Add on/off button HTML
     */
    function addButton(){

        // add button with listener
        let html = '<button id="mk-agp-button"/></button>';
        $('.hud-right').after(html);

        // bind function
        $("#mk-agp-button").click(toggleGasProduction);

        // add some simple css to the button
        $("#mk-agp-button").css({
            'width':'92%',
            'padding':'10px',
            'margin-top':'10px',
            'border-radius':'5px',
            'border':'solid 1px #ccc',
            'background-color':'#28a745'
        });

        // temporarily reverse bool, so when i trigger the button its correct
        enabled = !enabled;
        toggleGasProduction();

    }

    /**
     * Toggles "automatic" gas production on/off
     * @return {[type]} [description]
     */
    function toggleGasProduction(){

        if(enabled == true){

            enabled = false;
            $("#mk-agp-button").html(off);
            $("#mk-agp-button").css({
                'background-color':'#dc3545'
            });

        }else{

            enabled = true;
            $("#mk-agp-button").html(on);
            $("#mk-agp-button").css({
                'background-color':'#28a745'
            });

        }

    }

    /**
     * Tell all refineries to produce petroleum or gasoline
     */
    function tryToAutomateGasProduction(){

        // how many 'Petroleum' do we have?
        let count = Game.town.GetStoredCrafts()["Petroleum"];

        // get all refineries
        let items = Object.values(Game.town.objectDict).filter(o => (o.type === 'Refinery'));

        let craftTarget = "Gasoline";

        // loop through all refineries
        for (var i = items.length - 1; i >= 0; i--) {

            let item = items[i];

            // what is the refinery currently making?
            let currentlyMaking = item.logicObject.data.craft;

            // ToDo: Something in here to prevent the loop of..
            // 1. Worker makes material
            // 2. Worker deposits material
            // 3. Worker picks up deposited material
            // 4. Worker deposits picked up material ( start back at 3 )

            // if we don't know how many we have, or we have 0, then we are making 'Petroleum'
            if(count == undefined || count == 0){
                craftTarget = 'Petroleum';
            }

            // if we are currently making, what we want to make, move onto the next refinery
            if(currentlyMaking == craftTarget){
                continue;
            }

            // tell the refinery to make the item
            console.log("Refinery Crafting: " + craftTarget);
            item.logicObject.SetCraft(craftTarget);

        }

    }

})();
