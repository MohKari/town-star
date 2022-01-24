// ==UserScript==
// @name         MohKari: Production Rate Monitor With Reset
// @namespace    http://tampermonkey.net/
// @version      0.2
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

    // ToDo: Add on screen timer.
    // ToDo: Add $$ and points to tracket.
    // ToDo: Add exclude list ( any items you want to perm NOT report ( Petroleum )

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
    async function newItem(item){

        console.log("newItem: " + item);

        // add new default item
        list[item] = {
            count: 1,
            first: Date.now(),
            minute: 0,
            hour: 0
        };

        // row's id
        let id = "mk-prm-" + item;

        // add new row to table
        let html = "<tr id='" + id + "'>";
                html += "<td class='item'>" + item + "</td>";
                html += "<td class='count'></td>";
                html += "<td class='minute'></td>";
                html += "<td class='hour'></td>";
            html += "</tr>";
        $('#mk-prm-table').append(html);

        // clone image when available
        let image = await cloneImageWhenAvailable('.hud-craft-display-' + item);

        console.log(image);

        // copy image into my table
        $('#' + id + ' .item').html("").append(image);
        $('#' + id + ' .hud-craft-icon').css("width", 24);

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

        // add some html
        let html = "<table id='mk-prm-table'>";
                html += "<tr>";
                    html += "<td>Item</td>";
                    html += "<td>#</td>";
                    html += "<td>min</td>";
                    html += "<td>hour</td>";
                html += "</tr>";
            html += "</table>";
        $('.hud-right').after(html);

                // add some simple css to the button
        $("#mk-prm-table").css({
            'border':'1px solid #ccc',
            'background-color':'#fff',
            'width':'92%',
            'margin-top':'10px',
            'border-radius':'5px',
            'opacity':'0.8',
            'border-spacing':'10px',
            'border-collapse':'separate'
        });

        // add button with listener
        let button = '<button id="mk-prm-reset"/>Reset</button>';
        $('#mk-prm-table').after(button);
        $("#mk-prm-reset").click(resetList);

        // add some simple css to the button
        $("#mk-prm-reset").css({
            'width':'92%',
            'padding':'5px',
            'margin':'10px 0px',
            'border-radius':'5px',
            'border':'solid 1px #ccc'
        });

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
                let item = this.craft;

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

    ////////////
    // UTLITY //
    ////////////

    /**
     * Clone and return image when available
     * @param  {[type]} selector [description]
     */
    async function cloneImageWhenAvailable(selector) {

        while (!$(selector).find('img').length) {
            await new Promise( r => setTimeout(r, 500) )
        }

        let image = $(selector).find('img').clone();

        return image;

    }

})();
