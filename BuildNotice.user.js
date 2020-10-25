// ==UserScript==
// @name         BuildNotice
// @version      1.0.0
// @description  ermöglicht Notizen zu jedem Gebäude
// @author       DrTraxx
// @include      /^https?:\/\/[www.]*(?:leitstellenspiel\.de|missionchief\.co\.uk|missionchief\.com|meldkamerspel\.com|centro-de-mando\.es|missionchief-australia\.com|larmcentralen-spelet\.se|operatorratunkowy\.pl|operatore112\.it|operateur112\.fr|dispetcher112\.ru|alarmcentral-spil\.dk|nodsentralspillet\.com|operacni-stredisko\.cz|112-merkez\.com|jogo-operador112\.com|operador193\.com|centro-de-mando\.mx|dyspetcher101-game\.com|missionchief-japan\.com)\/buildings\/.*\
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    $("head").append(`<style>
.bnHide {
display: none;
}
.bnShow {
display: block;
}
</style>`);

    if(!localStorage.buildNotice) localStorage.buildNotice = JSON.stringify({});

    var buildingId = window.location.pathname.replace(/\D+/g,'');
    var buildNotice = JSON.parse(localStorage.buildNotice);
    var divAlert = `<div class="alert fade in alert-success "><button class="close" data-dismiss="alert" type="button">×</button>%PLACEHOLDER%</div>`;

    $("h1:first")
        .append(`<span class="glyphicon glyphicon-comment" style="margin-left:1em;cursor:pointer"></span>`)
        .after(`<div class="form-group bnHide buildNotice">
                  <label for="iptBuildNotice">
                    Notizen
                    <a class="btn btn-success btn-xs" id="btnSaveBuildNotice">Speichern</a>
                    <a class="btn btn-danger btn-xs" id="btnEmptyBuildNotice">Notiz löschen</a>
                  </label>
                  <textarea class="form-control" id="iptBuildNotice" rows="4"></textarea>
                </div>`);

    $("#iptBuildNotice").val(buildNotice[buildingId] ? buildNotice[buildingId] : "");

    $("body").on("click", ".glyphicon-comment", function() {
        if($(".buildNotice").hasClass("bnHide")) {
            $(".buildNotice").removeClass("bnHide").addClass("bnShow");
        } else if($(".buildNotice").hasClass("bnShow")) {
            $(".buildNotice").removeClass("bnShow").addClass("bnHide");
        }
    });

    $("body").on("click", "#btnSaveBuildNotice", function() {
        buildNotice[buildingId] = $("#iptBuildNotice").val();
        localStorage.buildNotice = JSON.stringify(buildNotice);
        $("h1:first").parent().before(divAlert.replace("%PLACEHOLDER%", "Notiz gespeichert."));
    });

    $("body").on("click", "#btnEmptyBuildNotice", function() {
        $("#iptBuildNotice").val("");
        buildNotice[buildingId] = $("#iptBuildNotice").val();
        localStorage.buildNotice = JSON.stringify(buildNotice);
        $("h1:first").parent().before(divAlert.replace("%PLACEHOLDER%", "Notiz gelöscht."));
    });

})();
