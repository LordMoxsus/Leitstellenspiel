// ==UserScript==
// @name         label red
// @version      1.0.0
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/
// @include      *://leitstellenspiel.de/
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    let chatMessageOrig = allianceChat;
    allianceChat = e => {
        chatMessageOrig(e);
        if($('#mission_chat_messages a[class*="lightbox-open"]:first').attr('href').replace(/\D+/g,'') == user_id){
            $('#mission_chat_messages a[class*="lightbox-open"]:first').addClass('label label-danger');
        }
    }
    
})();
