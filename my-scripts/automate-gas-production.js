// ==UserScript==
// @name         MohKari: Automate Gas Production
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Can create Gas/Petroleum/JetFuel with just one refinery.
// @author       MohKari
// @credits      stan
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

    ///////////
    // NOTES //
    ///////////

    // Script Behavior / Priority.
    // Make Gasoline if 1+ petroleum and below max Gasoline.
    // Make Petroleum if max gas and below max Petroleum.
    // Make JetFuel if max petroleum and below max JetFuel.
    // Make "None" if limits are reached, but watch for when amount drops.

    // craft up to these limits.
    let gasolineLimit = 10;
    let petroleumLimit = 10;
    let jetFuelLimit = 10;      // 0 if you never want JetFuel

    // automate fuel production? true/false
    let enabled = false;

    // just the messages that appear on the button.
    const on = "Fuel Production On";
    const off = "Fuel Production Off";

    // false = stop a bunch of the console.log messages appearing
    let output = true;

    // observer to check if script should run or not, script wont run if you already have a town placed.
    let observer = new MutationObserver(function(m){

        // hud-right must exist
        if($('.hud-right').length){

            console.log('SCRIPT "automate-gas-production" HAS STARTED.');

            // dont watch anymore
            observer.disconnect();

            // run
            addButton();

            //...
            run();

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

    function run(){

        // make a reference to the function i'm about to overwrite, because i want to still do it!
        let ori = UnitGetOutputTask.prototype.onArrive;

        // overwrite this function, this function triggers whenever a "crafted" item is produced
        // ( as soon as the lil lab guy runs out of the refinery holding something )
        UnitGetOutputTask.prototype.onArrive = function(){

            // don't forget to still call the original version of this function!
            ori.call(this);

            // don't do anything if enabled is false
            if (enabled == false){
                return;
            }

            // object that just "outputted" a material
            let obj = this.targetObject;

            // only do stuff to refineries
            if(obj.type == "Refinery"){

                // what we just crafted
                let crafted = this.craft;
                let craftTarget = getCraftTarget(crafted);

                // set the craft
                _debug("Refinery Crafting: " + craftTarget);
                console.log(obj);
                obj.logicObject.prototype.SetCraft(craftTarget);

                // add watcher if we craft nothing
                if(craftTarget == "None"){

                    // keep checking if we should make something other than "None"
                    let interval = setInterval(function(){

                        _debug("Waiting for Refinery craft requirement...");

                        // don't do anything if enabled is false
                        if (enabled == false){
                            clearInterval(interval);
                            return;
                        }

                        // get the craft target
                        let craftTarget = getCraftTarget();

                        if(craftTarget != "None"){

                            // stop watcher
                            clearInterval(interval);

                            // set the craft
                            _debug("Refinery Crafting: " + craftTarget);
                            console.log(obj);
                            obj.logicObject.prototype.SetCraft(craftTarget);

                        }

                    },1000);

                }

            }

        }

    }

    /**
     * Figure out what we want to craft next
     * @param  {[string]} crafted Item just crafted
     * @return {[string]}         Item we want to craft next
     */
    function getCraftTarget(crafted = ""){

        // get current stock levels
        let storedCrafts = getLatestStoredCrafts(crafted);
        let jetFuel = storedCrafts["JetFuel"];
        let petroleum = storedCrafts["Petroleum"];
        let gasoline = storedCrafts["Gasoline"];

        console.log(jetFuel);
        console.log(petroleum);
        console.log(gasoline);

        // default value
        let craftTarget = "None";

        // try to make gasoline first of all
        if(petroleum > 0 && gasoline < gasolineLimit){

            craftTarget = "Gasoline";

        // try to make petroleum if we have max gas, but not max petroleum
        }else if(petroleum < petroleumLimit){

            craftTarget = "Petroleum";

        // try to make jetfuel if we have max petroleum, but not max jetfuel
        }else if(jetFuel < jetFuelLimit){

            craftTarget = "Petroleum";

        }

        return craftTarget;

    }

    /**
     * get the latest stored crafts
     * also include the crafted item
     * @param  {[string]} crafted name of item just crafted
     * @return array
     */
    function getLatestStoredCrafts(crafted = ""){

        let storedCrafts = Game.town.GetStoredCrafts();

        if(crafted != ""){
            if(typeof storedCrafts[crafted] === 'undefined'){
                storedCrafts[crafted] = 0;
            }
            storedCrafts[crafted]++;
        }

        return storedCrafts;

    }

    /**
     * display message/obj to console.log if debug is true
     * @param  {[type]} obj [description]
     */
    function _debug(obj){

        if(!output){
            return;
        }

        console.log(obj);

    }

})();
