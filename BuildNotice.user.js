// ==UserScript==
// @name         BuildNotice
// @version      1.0.1
// @description  ermöglicht Notizen zu jedem Gebäude
// @author       DrTraxx
// @include      /^https?:\/\/(?:w{3}\.)?(?:(policie\.)?operacni-stredisko\.cz|(politi\.)?alarmcentral-spil\.dk|(polizei\.)?leitstellenspiel\.de|missionchief\.gr|(?:(police\.)?missionchief-australia|(police\.)?missionchief|(poliisi\.)?hatakeskuspeli|missionchief-japan|missionchief-korea|nodsentralspillet|meldkamerspel|operador193|jogo-operador112|jocdispecerat112|dispecerske-centrum|112-merkez|dyspetcher101-game)\.com|(police\.)?missionchief\.co\.uk|centro-de-mando\.es|centro-de-mando\.mx|(police\.)?operateur112\.fr|(polizia\.)?operatore112\.it|operatorratunkowy\.pl|dispetcher112\.ru|larmcentralen-spelet\.se)\/.*$/
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
.bnColor {
color: lime;
}
</style>`);

    if(!localStorage.buildNotice) localStorage.buildNotice = JSON.stringify({});

    var buildNotice = JSON.parse(localStorage.buildNotice);

    for(var key in buildNotice) {
        if(buildNotice[key]) {
            $("#building_button_"+key).removeClass("btn-default").addClass("btn-info");
        }
    }

    if(window.location.pathname.includes("buildings")) {
        var buildingId = window.location.pathname.replace(/\D+/g,'');
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

        if(buildNotice[buildingId]) {
            $("#iptBuildNotice").val(buildNotice[buildingId]);
            $(".glyphicon-comment").addClass("bnColor");
        }

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
            if(buildNotice[buildingId]) $(".glyphicon-comment").addClass("bnColor");
            $("h1:first").parent().before(divAlert.replace("%PLACEHOLDER%", "Notiz gespeichert."));
        });

        $("body").on("click", "#btnEmptyBuildNotice", function() {
            $("#iptBuildNotice").val("");
            delete buildNotice[buildingId];
            localStorage.buildNotice = JSON.stringify(buildNotice);
            $(".glyphicon-comment").removeClass("bnColor");
            $("h1:first").parent().before(divAlert.replace("%PLACEHOLDER%", "Notiz gelöscht."));
        });
    }

})();
