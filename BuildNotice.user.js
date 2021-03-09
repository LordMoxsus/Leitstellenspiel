// ==UserScript==
// @name         BuildNotice
// @version      1.1.1
// @description  ermöglicht Notizen zu jedem Gebäude
// @author       DrTraxx
// @include      /^https?:\/\/(?:w{3}\.)?(?:(policie\.)?operacni-stredisko\.cz|(politi\.)?alarmcentral-spil\.dk|(polizei\.)?leitstellenspiel\.de|missionchief\.gr|(?:(police\.)?missionchief-australia|(police\.)?missionchief|(poliisi\.)?hatakeskuspeli|missionchief-japan|missionchief-korea|nodsentralspillet|meldkamerspel|operador193|jogo-operador112|jocdispecerat112|dispecerske-centrum|112-merkez|dyspetcher101-game)\.com|(police\.)?missionchief\.co\.uk|centro-de-mando\.es|centro-de-mando\.mx|(police\.)?operateur112\.fr|(polizia\.)?operatore112\.it|operatorratunkowy\.pl|dispetcher112\.ru|larmcentralen-spelet\.se)\/.*$/
// @grant        GM_addStyle
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    GM_addStyle(`<style>
.bnShow {
display: block;
}
.bnColor {
color: lime;
}
</style>`);

    if(!localStorage.buildNotice) localStorage.buildNotice = JSON.stringify({});

    var buildNotice = JSON.parse(localStorage.buildNotice);

    $('#buildings_outer').on('DOMNodeInserted', '#building_list', function() {
        for(var key in buildNotice) {
            if(buildNotice[key]) {
                $("#building_button_"+key).removeClass("btn-default").addClass("btn-info");
            }
        }

        if(!$("#buNoToggleInfoBuildings").length) {
            $("#building_panel_heading .btn-group").append(`<a class="btn btn-default btn-xs" id="buNoToggleInfoBuildings"><span class="glyphicon glyphicon-eye-open"</span></a>`);
        }
    });

    if(window.location.pathname.includes("buildings")) {
        var buildingId = window.location.pathname.replace(/\D+/g,'');
        var divAlert = `<div class="alert fade in alert-success "><button class="close" data-dismiss="alert" type="button">×</button>%PLACEHOLDER%</div>`;

        $("h1:first")
            .append(`<span class="glyphicon glyphicon-comment" style="margin-left:1em;cursor:pointer"></span>`)
            .after(`<div class="form-group hidden buildNotice">
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
            if($(".buildNotice").hasClass("hidden")) {
                $(".buildNotice").removeClass("hidden").addClass("bnShow");
            } else if($(".buildNotice").hasClass("bnShow")) {
                $(".buildNotice").removeClass("bnShow").addClass("hidden");
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

    $("body").on("click", "#buNoToggleInfoBuildings", function() {
        var $this = $(this);

        if($this.children("span").hasClass("glyphicon-eye-open")) {
            $("#building_list .btn-default").parent().parent().addClass("hidden");
            $this.children("span").removeClass("glyphicon-eye-open").addClass("glyphicon-eye-close");
        } else if($this.children("span").hasClass("glyphicon-eye-close")) {
            $("#building_list .btn-default").parent().parent().removeClass("hidden");
            $this.children("span").removeClass("glyphicon-eye-close").addClass("glyphicon-eye-open");
        }
    });

})();
