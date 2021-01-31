// ==UserScript==
// @name         Personalhelfer
// @version      1.4.4
// @description  Werbephasen und Personalsoll in der Gebaeudeuebersicht auswaehlen
// @author       DrTraxx
// @include      /^https?:\/\/(?:w{3}\.)?(?:(policie\.)?operacni-stredisko\.cz|(politi\.)?alarmcentral-spil\.dk|(polizei\.)?leitstellenspiel\.de|missionchief\.gr|(?:(police\.)?missionchief-australia|(police\.)?missionchief|(poliisi\.)?hatakeskuspeli|missionchief-japan|missionchief-korea|nodsentralspillet|meldkamerspel|operador193|jogo-operador112|jocdispecerat112|dispecerske-centrum|112-merkez|dyspetcher101-game)\.com|(police\.)?missionchief\.co\.uk|centro-de-mando\.es|centro-de-mando\.mx|(police\.)?operateur112\.fr|(polizia\.)?operatore112\.it|operatorratunkowy\.pl|dispetcher112\.ru|larmcentralen-spelet\.se)\/buildings\/.*\
// @require      https://drtraxx.github.io/js/apis.1.0.1.js
// @grant        none
// ==/UserScript==
/* global $, user_premium, singleBuilding */

(async function() {
    'use strict';

    var buildingId = window.location.pathname.replace(/\D+/g,'');
    var hireStart = `<div class="alert fade in alert-success "><button class="close" data-dismiss="alert" type="button">×</button>Die Einstellungsphase wurde gestartet.</div>`;
    var hireEnd = `<div class="alert fade in alert-success "><button class="close" data-dismiss="alert" type="button">×</button>Die Einstellungsphase wurde beendet.</div>`;
    var hire = false;
    var cssHide = {"display":"none"};
    var cssShow = {"display":"inline"};
    var building = await singleBuilding(buildingId);
    var noPersonalBuildings = [1,3,4,7,8,10,14];

    if(building.hiring_automatic === true || building.hiring_phase > 0) hire = true;
    if(noPersonalBuildings.includes(building.building_type)) return false;
    $(".breadcrumb")
        .append(`<div class="btn-group input-group pull-right" style="float:right">
                   <a id="hire_do_1" class="btn btn-default btn-xs" style="display:${!hire ? `inline` : `none`}">1 Tag werben</a>
                   <a id="hire_do_2" class="btn btn-default btn-xs" style="display:${!hire ? `inline` : `none`}">2 Tage werben</a>
                   <a id="hire_do_3" class="btn btn-default btn-xs" style="display:${!hire ? `inline` : `none`}">3 Tage werben</a>
                   <a id="hire_do_0" class="btn btn-danger btn-xs" style="display:${hire ? `inline` : `none`}">Einstellungsphase abbrechen</a>
                   <a id="hire_do_automatic" class="btn btn-default btn-xs" style="display:${user_premium && !hire ? `inline` : `none`}">automatisch</a>
                   <input class="numeric integer optional form-control" type="number" value="${building.personal_count_target}" id="setPersonal" style="width:5em;height:22px">
                   <a id="savePersonal" class="btn btn-success btn-xs">Speichern</a>
                 </div>`);

    $("body").on("click", "#hire_do_1", async function(){
        await $.get(`/buildings/${buildingId}/hire_do/1`);
        $('h1').parent().before(hireStart);
        $('#hire_do_1').css(cssHide);
        $('#hire_do_2').css(cssHide);
        $('#hire_do_3').css(cssHide);
        $('#hire_do_automatic').css(cssHide);
        $('#hire_do_0').css(cssShow);
    });

    $("body").on("click", "#hire_do_2", async function(){
        await $.get(`/buildings/${buildingId}/hire_do/2`);
        $('h1').parent().before(hireStart);
        $('#hire_do_1').css(cssHide);
        $('#hire_do_2').css(cssHide);
        $('#hire_do_3').css(cssHide);
        $('#hire_do_automatic').css(cssHide);
        $('#hire_do_0').css(cssShow);
    });

    $("body").on("click", "#hire_do_3", async function(){
        await $.get(`/buildings/${buildingId}/hire_do/3`);
        $('h1').parent().before(hireStart);
        $('#hire_do_1').css(cssHide);
        $('#hire_do_2').css(cssHide);
        $('#hire_do_3').css(cssHide);
        $('#hire_do_automatic').css(cssHide);
        $('#hire_do_0').css(cssShow);
    });

    $("body").on("click", "#hire_do_automatic", async function(){
        await $.get(`/buildings/${buildingId}/hire_do/automatic`);
        $('h1').parent().before(hireStart);
        $('#hire_do_1').css(cssHide);
        $('#hire_do_2').css(cssHide);
        $('#hire_do_3').css(cssHide);
        $('#hire_do_automatic').css(cssHide);
        $('#hire_do_0').css(cssShow);
    });

    $("body").on("click", "#hire_do_0", async function(){
        $.get(`/buildings/${buildingId}/hire_do/0`);
        $('h1').parent().before(hireEnd);
        $('#hire_do_1').css(cssShow);
        $('#hire_do_2').css(cssShow);
        $('#hire_do_3').css(cssShow);
        $('#hire_do_automatic').css(cssShow);
        $('#hire_do_0').css(cssHide);
    });

    $("body").on("click", "#savePersonal", async function(){
        var value = $('#setPersonal').val();
        if(!value || value < 0 || value > 300) alert("Bitte Ganzzahl zwischen 0 und 300 angeben.");
        else{
            await $.post('/buildings/' + buildingId + '?personal_count_target_only=1', {"building" : {"personal_count_target" : value}, "_method" : "put", "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        }
        window.location.reload();
    });

})();
