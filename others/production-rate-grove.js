// ==UserScript==
// @name         Production Rate Monitor - Uni
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Monitor production rate of specified craft items.
// @author       Groove
// @match        https://townstar.sandbox-games.com/launch/
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const trackedItems = [
        {item: 'Wood', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Lumber', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Cotton', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Wool', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Cotton_Yarn', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Wool_Yarn', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Uniforms', count: 0, first: 0, oneMin: 0, oneHour: 0},
        {item: 'Gasoline', count: 0, first: 0, oneMin: 0, oneHour: 0},
    ];
    let loaded = 0;

    new MutationObserver(function(mutations) {
        if (document.querySelector('.hud .right .hud-right') && loaded == 0) {
            loaded = 1;
            LoadProductionMonitor();
        }
    }).observe(document, {childList: true, subtree: true});


function LoadProductionMonitor() {
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

        for (let item of trackedItems) {
            let trackedItemElem = document.createElement('div');
            trackedItemElem.id = 'tracked-item-' + item.item;
            trackedItemElem.classList.add('bank', 'contextual');
            trackedItemElem.style = 'width: 75%;';
            trackedItemElem.innerHTML = item.item + ':&nbsp;Count&nbsp;|&nbsp;/1Min&nbsp;|&nbsp;/1Hour';
            trackedHud.appendChild(trackedItemElem);
        }

 class TrackUnitDeliverOutputTask extends UnitDeliverOutputTask {
            onArrive() {
                super.onArrive();
                let trackedItem = trackedItems.find(item => item.item.toUpperCase() == this.craft.toUpperCase())
                if (trackedItem) {
                    trackedItem.count++;
                    if (trackedItem.count == 1) {
                        trackedItem.first = Date.now();
                    } else {
                        let timeDiff = Date.now() - trackedItem.first;
                        trackedItem.oneMin = trackedItem.count / (timeDiff / 60000)
                        trackedItem.oneHour = trackedItem.count / (timeDiff / 3600000)
                    }
                    document.getElementById('tracked-item-' + trackedItem.item).innerHTML = trackedItem.item + ':&nbsp;<b>' + trackedItem.count + '</b>&nbsp;|&nbsp;<b>' + trackedItem.oneMin.toFixed(2) + '</b>&nbsp;|&nbsp;<b>' + trackedItem.oneHour.toFixed(2) + '</b>';
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
