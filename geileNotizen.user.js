// ==UserScript==
// @name         GeileNotizen
// @version      1.0.0
// @description  ermöglicht Notizen unterhalb der Einsatzliste
// @author       DrTraxx
// @include      /^https?:\/\/(?:w{3}\.)?(?:(policie\.)?operacni-stredisko\.cz|(politi\.)?alarmcentral-spil\.dk|(polizei\.)?leitstellenspiel\.de|missionchief\.gr|(?:(police\.)?missionchief-australia|(police\.)?missionchief|(poliisi\.)?hatakeskuspeli|missionchief-japan|missionchief-korea|nodsentralspillet|meldkamerspel|operador193|jogo-operador112|jocdispecerat112|dispecerske-centrum|112-merkez|dyspetcher101-game)\.com|(police\.)?missionchief\.co\.uk|centro-de-mando\.es|centro-de-mando\.mx|(police\.)?operateur112\.fr|(polizia\.)?operatore112\.it|operatorratunkowy\.pl|dispetcher112\.ru|larmcentralen-spelet\.se)\/.*$/
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    if(!localStorage.geile_notizen) localStorage.geile_notizen = "";

    $("#btn-alliance-new-mission")
        .parent()
        .parent()
        .after(`<div class="form-group btn-group">
                  <label for="geileNotizenTextarea">Example textarea</label>
                  <textarea class="form-control" id="geileNotizenTextarea" rows="4" value="${localStorage.geile_notizen}" style="width:40em"></textarea>
                  <a class="btn btn-success btn-xs" id="geileNotizenSave">Speichern</a>
                  <a class="btn btn-danger btn-xs" id="geileNotizenClear">Löschen</a>
                </div>`);

    $("body").on("click", "#geileNotizenSave", function() {
        localStorage.geile_notizen = $("#geileNotizenTextarea").val();
        alert("Geile Notizen wurden gespeichert!");
    });

    $("body").on("click", "#geileNotizenClear", function() {
        $("#geileNotizenTextarea").val("");
        localStorage.geile_notizen = "";
        alert("Geile Notizen gelöscht!");
    });

})();
