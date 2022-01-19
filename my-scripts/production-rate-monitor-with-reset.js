// ==UserScript==
// @name         MohKari: Production Rate Monitor With Reset
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Monitor production rate of specified craft items.
// @author       MohKari
// @credits      Groove
// @match        *://*.sandbox-games.com/*
// @grant        none
// @run-at       document-start
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {

    ///////////////////////
    // HOW TO USE SCRIPT //
    ///////////////////////

    // 1. Run it, the UI will auto populate as your workers deliver items.

    ///////////
    // NOTES //
    ///////////

    // 1. I think energy doesn't get tracked?

    // ToDo: Replace item name with image.
    // ToDo: Add on screen timer.

    // will auto populate/display while game is running
    let list = {};

    // observer to check if script should run or not, script wont run if you already have a town placed.
    let observer = new MutationObserver(function(m){

        // hud-right must exist
        if($('.hud-right').length){

            console.log('SCRIPT "production-rate-monitor-with-reset" HAS STARTED.');

            // dont watch anymore
            observer.disconnect();

            // run
            run();

        }

    });
    observer.observe(document, {childList: true , subtree: true});


    /**
     * Resets the tracked items, back to zero!
     */
    function resetList(){

        console.log("reset button hit.");

        // remove existing ui
        $('#mk-prm-table').remove();
        $('#mk-prm-reset').remove();

        // re-add ui
        startUI();

        // empty list
        list = {};
    }

    /**
     * Update item in list
     * @param  {[type]} item
     */
    function updateItem(item){

        console.log("updateItem: " + item);

        // increase count
        list[item].count++;

        // update minute/hour
        let count = list[item].count;
        let first = list[item].first;
        let diff = Date.now() - first;

        list[item].minute = count / ( diff / 60000 );
        list[item].hour = count / ( diff / 3600000 );

    }

    /**
     * Add new item to tracked list
     * @param  {[type]} item
     */
    function newItem(item){

        console.log("newItem: " + item);

        // add new default item
        list[item] = {
            count: 1,
            first: Date.now(),
            minute: 0,
            hour: 0
        };

        // some styles yo!
        let itemStyle = "max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";

        // add new row to table
        let html = "<tr id='mk-prm-" + item + "'>";
                html += "<td class='item' style='" + itemStyle + "'>" + item + "</td>";
                html += "<td class='count'></td>";
                html += "<td class='minute'></td>";
                html += "<td class='hour'></td>";
            html += "</tr>";
        $('#mk-prm-table').append(html);

    }

    /**
     * Update the UI
     * @param  {[type]} item
     */
    function updateUI(item){

        console.log("updateUI: " + item);

        let count = list[item].count;
        let minute = list[item].minute.toFixed(1);
        let hour = list[item].hour.toFixed(1);

        // update ui
        $("#mk-prm-" + item + " .count").html(count);
        $("#mk-prm-" + item + " .minute").html(minute);
        $("#mk-prm-" + item + " .hour").html(hour);

    }

    /**
     * Add elements to UI
     */
    function startUI(){

        // some inline css for our table
        let tableStyle = "border-radius: 8px; box-shadow: 2px 2px 27px 0px #000; border: 1px solid #cccccc; background-color: #ffffff;";
        tableStyle += "width:100%;"

        // add some html
        let html = "<table id='mk-prm-table' style='" + tableStyle + "'>";
                html += "<tr>";
                    html += "<td>Item</td>";
                    html += "<td>#</td>";
                    html += "<td>min</td>";
                    html += "<td>hour</td>";
                html += "</tr>";
            html += "</table>";
        $('.hud-right').after(html);

        // bootstrap like button
        let buttonStyle = "margin-top:5px; margin-bottom:5px; color:#212529; background-color:#f0ad4e; border-color: #eea236;";
        buttonStyle += "display: inline-block; margin-bottom: 0; font-weight: 400; text-align: center; white-space: nowrap;";
        buttonStyle += "vertical-align: middle; -ms-touch-action: manipulation; touch-action: manipulation; cursor: pointer;";
        buttonStyle += "background-image: none; border: 1px solid transparent; padding: 6px 12px; font-size: 14px;";
        buttonStyle += "line-height: 1.42857143; border-radius: 4px; -webkit-user-select: none; -moz-user-select: none;";
        buttonStyle += "-ms-user-select: none; user-select: none; font-family: inherit; -webkit-appearance: button; cursor: pointer;";
        buttonStyle += "text-transform: none; overflow: visible; margin: 0;";
        buttonStyle += "width:100%;"

        // add button with listener
        let button = '<button id="mk-prm-reset" style="' + buttonStyle + '"/>Reset</button>';
        $('#mk-prm-table').after(button);
        $("#mk-prm-reset").click(resetList);

    }

    /**
     * Run!
     */
    function run() {

        startUI();

        // making a new class....
        class TrackUnitDeliverOutputTask extends UnitDeliverOutputTask {

            // overwrite the onArrive functionality
            onArrive() {

                // make sure to do the original onArrive functionality
                super.onArrive();

                // let trackedItem = trackedItems.find(item => item.item.toUpperCase() == this.craft.toUpperCase())
                let item = this.craft.toUpperCase();

                // if we are already tracking the item, update its values
                if(list[item]){
                    updateItem(item);
                // else make it as a new item
                }else{
                    newItem(item);
                }

                // then update the ui
                updateUI(item);

            }

        }

        // not gonna lie... not too sure what this is doing
        let origfindDeliverOutputTask = TS_UnitLogic.prototype.findDeliverOutputTask;
        TS_UnitLogic.prototype.findDeliverOutputTask = function(t) {

            // this method gets called when someone picks up something or drops it off?
            let origReturn = origfindDeliverOutputTask.call(this, t);
            return origReturn ? new TrackUnitDeliverOutputTask(origReturn.unit,origReturn.targetObject,t) : null

        }

    }

})();
