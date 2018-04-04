   $(window).on("load", function() {

     // Insert notesify buttons
     $('.ui-title-bar__badge').after('<div class="notesify-btn"></div><style>.notesify-btn{margin-right: -15px;margin-top: -5px;background:url("https://cdn.shopify.com/s/files/1/1871/0043/files/icon-128.png?15782027863000543388")no-repeat;cursor:pointer;background-size:contain;border:none;width:30px;height:30px;}.notesify-btn:hover{box-shadow:0 0 5px 2px rgba(0,0,0,0.2);border-radius:100%;width:30px;height:30px:}.notesify-btn:active{box-shadow:inset 0 0 10px rgba(200,200,200,0.9);border-radius:100%;width:30px;height:30px;}</style>');

     $('.note-form > .btn').after('<div id="notesify-btn" class="notesify-btn notesify-btn2"></div><style>.notesify-btn2{position:absolute;display:inline-table;margin:auto;margin-left:10px;margin-top:3px;}</style>');

     // Set caret position function taken from https://goo.gl/t2mDQe
     (function($) {
       $.caretTo = function(el, index) {
         if (el.createTextRange) {
           var range = el.createTextRange();
           range.move("character", index);
           range.select();
         } else if (el.selectionStart != null) {
           el.focus();
           el.setSelectionRange(index, index);
         }
       };
       $.fn.caretTo = function(index, offset) {
         return this.queue(function(next) {
           if (isNaN(index)) {
             var i = $(this).val().indexOf(index);

             if (offset === true) {
               i += index.length;
             } else if (offset) {
               i += offset;
             }

             $.caretTo(this, i);
           } else {
             $.caretTo(this, index);
           }

           next();
         });
       };

       $.fn.caretToStart = function() {
         return this.caretTo(0);
       };

       $.fn.caretToEnd = function() {
         return this.queue(function(next) {
           $.caretTo(this, $(this).val().length);
           next();
         });
       };
     }(jQuery));


     $('.notesify-btn').click(function() {

       // send message to background.js
       chrome.runtime.sendMessage({ greeting: "clicked" },
       function(response) {
         console.log("sent click message");
       });
     });

     // listen for response from background.js and fill out textarea
     chrome.runtime.onMessage.addListener(function(request) {
       if (request.data) {
         console.log("received message");
       }
       if (request.data.startsWith("https://shopify.zendesk.com/") ) {
       fillTextArea(request.data);
       $('html, body').animate({
         scrollTop: $("#note-history").offset().top
       }, 100);
     } else {
       alert("Copy a Zendesk URL and try again");
     }

     });

     function fillTextArea(clipboardData) {

       var suppBy = $('table.ui-data-table.ui-data-table--scroll:first tr:nth-child(1) td:nth-child(2)').children().text(); // gets value from supported by column
       var name = $('table.ui-data-table.ui-data-table--scroll:first tr:nth-child(1) td:nth-child(1)').children().text().replace(" (current theme)", ""); // gets value from name column
       var themesArray = ["Boundless", "Brooklyn", "Debut", "Jumpstart", "Minimal", "Narrative", "Pop", "Simple", "Supply", "Venture"] // used if can't find theme name from supported by column
       var rowCount = $('table.ui-data-table.ui-data-table--scroll:first tbody tr').length; // number of rows in theme table
       var themeURL = $('table.ui-data-table.ui-data-table--scroll:first tr:nth-child(1) td:nth-child(2)').children().attr("href"); //used to get shopify supported theme name

       var designTime = $('dd#design-time').text().replace(/[^0-9]/g,""); // gets design time text
       var designTimeInt = parseInt(designTime); // converts design time text to interger
       var themeName = "";

       if (suppBy == "") {
         // if unable to get data from supported column, use name column
         name = name.toLowerCase();

         // check if current theme name contains a shopify supported theme name in the string
         for (var i = 0, len = themesArray.length; i < len; i++) {
           var foundThemeName = false;
           if (name.indexOf(themesArray[i].toLowerCase()) > -1) {
             themeName = themesArray[i];
             foundThemeName = true;
             break;
           }
         }
         if (rowCount > 1 && foundThemeName == true) {
           themeName = prompt("Multiple themes detected. \nClick OK or enter a Shopify theme name:", themeName);
         }
         if (foundThemeName == false) {
           themeName = prompt("Unable to detect theme. \nEnter a Shopify theme name:");
         }
       } else if (suppBy == "Theme designer") {
         themeName = prompt("3rd party theme detected. \nEnter a Shopify theme name:", name);
       } else if (suppBy == "Shopify") {
         if (rowCount > 1) {
           trimUrl();
           themeName = prompt("Multiple themes detected. \nClick OK or enter another Shopify theme name:", themeURL);
         } else {
           trimUrl();
         }
       };

       // Get theme name from url taken from 'supported by' column
       function trimUrl() {
         if (themeURL != null) {
           themeURL = themeURL.substring(themeURL.lastIndexOf("/") + 1, themeURL.length);
           themeURL = themeURL.charAt(0).toUpperCase() + themeURL.substr(1).toLowerCase();
           themeName = themeURL;
         }
       };

       // populate textarea and change option selections
       if (designTimeInt >= 55) {
          $('#internal_note_body').val('"[' + themeName + ']  #DP":' + clipboardData);
          $('#internal_note_body').caretTo('] ', true);
          $("#internal_note_category").val('Design Policy');
          chrome.storage.sync.get("dp_Alert", function (items) {
            if (items.dp_Alert) {
              alert("#DP added to note. Design time is " + designTime + " mins!");
            }
          });
       } else if (designTimeInt >= 45) {
          $('#internal_note_body').val('"[' + themeName + ']  #DPWarn":' + clipboardData);
          $('#internal_note_body').caretTo('] ', true);
          $("#internal_note_category").val('Design');
          chrome.storage.sync.get("dp_WarnAlert", function (items) {
            if (items.dp_WarnAlert) {
              alert("#DPWarn added to note. Design time left is " + designTime + " mins!");
            }
          });
       } else {
          $('#internal_note_body').val('"[' + themeName + '] ":' + clipboardData);
          $('#internal_note_body').caretTo('] ', true);
          $("#internal_note_category").val('Design');
       }
       $("#internal_note_minutes_spent").val('5');
     }
   });
