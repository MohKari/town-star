// ==UserScript==
// @name         MohKari: Automate Gas Production
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Can create Gas with just one refinery.
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

    // When this script is turned "on", it "triggers" whenever ANY of your refineries "craft" a product.
    // It targets whichever refinery crafted the product and trys to set it to "Petroleum", unless the
    // refinery just made "Petroleum", in which case the production is set to "Gasoline".

    // ToDo: Allow for user to input a maximum Gasoline/Petroleum/JetFuel amount, and make sure to not go above it
    // ToDo: Allow user to specify if they want the refinery to produce JetFuel ( no point have 1000000 gas )

    // automate gas production? true/false
    let enabled = false;

    // just the messages that appear on the button.
    const on = "Gas Production On";
    const off = "Gas Production Off";

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

        // overwrite this function
        // this function triggers whenever a "crafted" item is produced
        // ( as soon as the lil lab guy runs out of the refinery holding something )
        UnitGetOutputTask.prototype.onArrive = function(){

            // don't forget to still call the original version of this function!
            ori.call(this);

            // don't do anything if enabled is false
            if (enabled == false){
                return;
            }

            let obj = this.targetObject;

            // only do stuff to refineries
            if(obj.type == "Refinery"){

                 // what we wan't to start crafting ( Petroleum by default? )
                let craftTarget = "Petroleum";

                // if we just made petroleum, we want to make gasoline
                if(this.craft == "Petroleum"){
                    craftTarget = "Gasoline";
                }

                _debug("Refinery Crafting: " + craftTarget);
                obj.logicObject.SetCraft(craftTarget);

            }

        }

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
