// ==UserScript==
// @name         n/a Message
// @version      1.0.0
// @description  Abwesenheitsnotiz bei Ansprache im Chat
// @author       DrTraxx
// @include      /^https?:\/\/(?:w{3}\.)?(?:(policie\.)?operacni-stredisko\.cz|(politi\.)?alarmcentral-spil\.dk|(polizei\.)?leitstellenspiel\.de|missionchief\.gr|(?:(police\.)?missionchief-australia|(police\.)?missionchief|(poliisi\.)?hatakeskuspeli|missionchief-japan|missionchief-korea|nodsentralspillet|meldkamerspel|operador193|jogo-operador112|jocdispecerat112|dispecerske-centrum|112-merkez|dyspetcher101-game)\.com|(police\.)?missionchief\.co\.uk|centro-de-mando\.es|centro-de-mando\.mx|(police\.)?operateur112\.fr|(polizia\.)?operatore112\.it|operatorratunkowy\.pl|dispetcher112\.ru|larmcentralen-spelet\.se)\/.*$/
// @grant        none
// ==/UserScript==
/* global $, allianceChat, user_id, user_name */

(function() {
    'use strict';

    $("#new_alliance_chat")
        .before(`<div class="form-check">
                   <input type="checkbox" class="form-check-input" id="namCbxMessage">
                   <label class="form-check-label" for="namCbxMessage">Abwesenheit setzen</label>
                 </div>
                 <input type="text" class="form-control hidden" id="namTxtMessage" value="The person you have called, is temporarily not available. Please call back later.">`);

    let allianceChatOrig = allianceChat;
    allianceChat = e => {
        allianceChatOrig(e);
        if((e.whisper === user_id || e.message.includes("@"+user_name)) && e.user_id !== user_id && $("#namCbxMessage")[0].checked) {
            $.post("/alliance_chats", {"alliance_chat": {"message": "/w "+e.username+" "+$("#namTxtMessage").val()}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        }
    }
    $("body").on("click", "#namCbxMessage", function() {
        if($("#namCbxMessage")[0].checked) {
            $("#namTxtMessage").removeClass("hidden");
        } else {
            $("#namTxtMessage").addClass("hidden");
        }
    });

})();
