// ==UserScript==
// @name         MohKari: Production Rate Monitor With Reset
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Monitor production rate of specified craft items.
// @author       MohKari
// @credits      Groove
// @match        https://app.gala.games/games/town-star/play/
// @grant        none
// @run-at       document-start
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {

    ///////////////////////
    // HOW TO USE SCRIPT //
    ///////////////////////

    // Don't, in Dev.

    ///////////
    // NOTES //
    ///////////

    // ToDo: Rewrite into own style.
    // ToDo: Add button to UI.

    'use strict';
    let trackedItems = [
        {item: 'Wool', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Wood', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Sugarcane', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Sugar', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Peppermint', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Candy_Canes', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Gasoline', count: 0, first: 0, oneMin: 0, oneHour: 0},
    ];
    let loaded = 0;

    // clones the trackedItems, you need this so you can reset the array
    let trackedItemsClone;

    new MutationObserver(function(mutations) {
        if (document.querySelector('.hud .right .hud-right') && loaded == 0) {

            // at run time, clone the trackedItems into trackedItemsClone
            trackedItemsClone = JSON.parse(JSON.stringify(trackedItems));

            loaded = 1;
            LoadProductionMonitor();
        }
    }).observe(document, {childList: true, subtree: true});

    /**
     * Resets the tracked items, back to zero!
     */
    function resetTrackedItems(){
        trackedItems = JSON.parse(JSON.stringify(trackedItemsClone));
    }

    function LoadProductionMonitor() {

        // add ui shit
        let trackedHud = document.createElement('div');
        trackedHud.id = 'tracked-items';
        let trackedItemHeader = document.createElement('div');
        trackedItemHeader.id = 'tracked-item-header';
        trackedItemHeader.classList.add('bank');
        trackedItemHeader.style = 'width: 75%;';
        trackedItemHeader.innerHTML = 'Craft:&nbsp;Count&nbsp;|&nbsp;/1Min&nbsp;|&nbsp;/1Hour';
        trackedHud.appendChild(trackedItemHeader);
        let hudRight = document.querySelector('.hud .right .hud-right');
        hudRight.insertBefore(trackedHud, hudRight.querySelector('.right-hud').nextSibling);

        // add button to reset
        let button = '<input id="grove-reset" type="button" value="new button"/>';
        $('body').append(button);
        $("#grove-reset").click(resetTrackedItems);

        // add more ui shit
        for (let item of trackedItems) {
            let trackedItemElem = document.createElement('div');
            trackedItemElem.id = 'tracked-item-' + item.item;
            trackedItemElem.classList.add('bank', 'contextual');
            trackedItemElem.style = 'width: 75%;';
            trackedItemElem.innerHTML = item.item + ':&nbsp;Count&nbsp;|&nbsp;/1Min&nbsp;|&nbsp;/1Hour';
            trackedHud.appendChild(trackedItemElem);
        }

        // making a new class....
        class TrackUnitDeliverOutputTask extends UnitDeliverOutputTask {

            // overwrite the onArrive functionality
            onArrive() {

                // make sure to do the original onArrive functionality
                super.onArrive();

                let trackedItem = trackedItems.find(item => item.item.toUpperCase() == this.craft.toUpperCase())

                if (trackedItem) {

                    // add one to the count, cuz an item just got dropped off
                    trackedItem.count++;

                    if (trackedItem.count == 1) {
                        trackedItem.first = Date.now();
                    } else {
                        let timeDiff = Date.now() - trackedItem.first;
                        trackedItem.oneMin = trackedItem.count / (timeDiff / 60000)
                        trackedItem.oneHour = trackedItem.count / (timeDiff / 3600000)
                    }

                    // write to ui
                    let html = trackedItem.item + ':&nbsp;<b>' + trackedItem.count + '</b>&nbsp;|&nbsp;<b>' + trackedItem.oneMin.toFixed(2) + '</b>&nbsp;|&nbsp;<b>' + trackedItem.oneHour.toFixed(2) + '</b>';
                    document.getElementById('tracked-item-' + trackedItem.item).innerHTML = html;

                }

            }

        }

        let origfindDeliverOutputTask = TS_UnitLogic.prototype.findDeliverOutputTask;
        TS_UnitLogic.prototype.findDeliverOutputTask = function(t) {
            let origReturn = origfindDeliverOutputTask.call(this, t);
            return origReturn ? new TrackUnitDeliverOutputTask(origReturn.unit,origReturn.targetObject,t) : null
        }
    }

})();