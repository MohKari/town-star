// ==UserScript==
// @name         MohKari: Production Rate Monitor With Reset
// @namespace    http://tampermonkey.net/
// @version      0.4
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

    // ToDo: Look into why the reset timer starts at 01 for me and 09 for others D:
    // I got you bro~ (by jarnMod KFP Sticky Note Service)
    const timezoneGMT = -7;
    
    // ToDo: Add $$ and points to tracket.
    // ToDo: Add exclude list ( any items you want to perm NOT report ( Petroleum )

    // will auto populate/display while game is running
    let list = {};

    // if true, you will get a onscreen "stop watch", otherwise set to false
    let timeStart = true;

    // false = stop a bunch of the console.log messages appearing
    let debug = false;

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
     * display message/obj to console.log if debug is true
     * @param  {[type]} obj [description]
     */
    function debug(obj){

        if(!debug){
            return;
        }

        console.log(obj);

    }

    /**
     * Resets the tracked items, back to zero!
     */
    function resetList(){

        debug("reset button hit.");

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

        debug("updateItem: " + item);

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

        debug("newItem: " + item);

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

        // copy image into my table
        $('#' + id + ' .item').html("").append(image);
        $('#' + id + ' .hud-craft-icon').css("width", 24);

    }

    /**
     * Update the UI
     * @param  {[type]} item
     */
    function updateUI(item){

        debug("updateUI: " + item);

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

        addTable();
        addRestartButton();
        addClock();

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

    /**
     * Add table HTML
     */
    function addTable(){

        let html = "<table id='mk-prm-table'>";
                html += "<tr>";
                    html += "<td>Item</td>";
                    html += "<td>#</td>";
                    html += "<td>min</td>";
                    html += "<td>hour</td>";
                html += "</tr>";
            html += "</table>";
        $('.hud-right').after(html);

        // add some simple css to the table
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

    }

    /**
     * Add restart button HTML
     */
    function addRestartButton(){

        // add button with listener
        let html = '<button id="mk-prm-reset"/>Reset</button>';
        $('#mk-prm-table').after(html);

        // bind function
        $("#mk-prm-reset").click(resetList);

        // add some simple css to the button
        $("#mk-prm-reset").css({
            'width':'92%',
            'padding':'10px',
            'margin-top':'10px',
            'border-radius':'5px',
            'border':'solid 1px #ccc'
        });

    }

    /**
     * Add on screen clock to the reset button
     */
    function addClock(){

        // don't do any on screen clock if time is set to false
        if(timeStart == false){
            return;
        }

        // start interval if not already started
        if(timeStart == true){

            // update timeStart
            timeStart = Date.now();

            // every 1 second, update the on screen timer
            // Note: this might not be the most efficient way to do this
            setInterval(function(){

                let diff = new Date() - timeStart;
                let d = new Date(diff);
                let hours = formatTwoDigits(d.getHours()+timezoneGMT); //instead of -1, change to - respective timezone different. This should reset hour to 00
                let minutes = formatTwoDigits(d.getMinutes());
                let seconds = formatTwoDigits(d.getSeconds());
                let string = "Reset : " + hours + ":" + minutes + ":" + seconds;

                $('#mk-prm-reset').html(string);

            },1000);

        }else{

            // update timeStart
            timeStart = Date.now();

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

})();
