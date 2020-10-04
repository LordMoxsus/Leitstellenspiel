// ==UserScript==
// @name         Personalhelfer
// @version      1.4.2
// @description  Werbephasen und Personalsoll in der Gebaeudeuebersicht auswaehlen
// @author       DrTraxx
// @include      /^https?:\/\/[www.]*(?:leitstellenspiel\.de|missionchief\.co\.uk|missionchief\.com|meldkamerspel\.com|centro-de-mando\.es|missionchief-australia\.com|larmcentralen-spelet\.se|operatorratunkowy\.pl|operatore112\.it|operateur112\.fr|dispetcher112\.ru|alarmcentral-spil\.dk|nodsentralspillet\.com|operacni-stredisko\.cz|112-merkez\.com|jogo-operador112\.com|operador193\.com|centro-de-mando\.mx|dyspetcher101-game\.com|missionchief-japan\.com)\/buildings\/.*\
// @grant        none
// ==/UserScript==
/* global $ */

(async function() {
    'use strict';

    var buildingId = window.location.pathname.replace(/\D+/g,'');
    var hireStart = `<div class="alert fade in alert-success "><button class="close" data-dismiss="alert" type="button">×</button>Die Einstellungsphase wurde gestartet.</div>`;
    var hireEnd = `<div class="alert fade in alert-success "><button class="close" data-dismiss="alert" type="button">×</button>Die Einstellungsphase wurde beendet.</div>`;
    var hire = false;
    var cssHide = {"display":"none"};
    var cssShow = {"display":"inline"};
    var building = await $.getJSON("/api/buildings/" + buildingId, (data) => data);
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

    $("body").on("click", "#hire_do_1",function(){
        $.get(`/buildings/${buildingId}/hire_do/1`).done(function() {
            $('h1').parent().before(hireStart);
            $('#hire_do_1').css(cssHide);
            $('#hire_do_2').css(cssHide);
            $('#hire_do_3').css(cssHide);
            $('#hire_do_automatic').css(cssHide);
            $('#hire_do_0').css(cssShow);
        });
    });

    $("body").on("click", "#hire_do_2",function(){
        $.get(`/buildings/${buildingId}/hire_do/2`).done(function() {
            $('h1').parent().before(hireStart);
            $('#hire_do_1').css(cssHide);
            $('#hire_do_2').css(cssHide);
            $('#hire_do_3').css(cssHide);
            $('#hire_do_automatic').css(cssHide);
            $('#hire_do_0').css(cssShow);
        });
    });

    $("body").on("click", "#hire_do_3",function(){
        $.get(`/buildings/${buildingId}/hire_do/3`).done(function() {
            $('h1').parent().before(hireStart);
            $('#hire_do_1').css(cssHide);
            $('#hire_do_2').css(cssHide);
            $('#hire_do_3').css(cssHide);
            $('#hire_do_automatic').css(cssHide);
            $('#hire_do_0').css(cssShow);
        });
    });

    $("body").on("click", "#hire_do_automatic",function(){
        $.get(`/buildings/${buildingId}/hire_do/automatic`).done(() => {
            $('h1').parent().before(hireStart);
            $('#hire_do_1').css(cssHide);
            $('#hire_do_2').css(cssHide);
            $('#hire_do_3').css(cssHide);
            $('#hire_do_automatic').css(cssHide);
            $('#hire_do_0').css(cssShow);
        });
    });

    $("body").on("click", "#hire_do_0",function(){
        $.get(`/buildings/${buildingId}/hire_do/0`).done(function() {
            $('h1').parent().before(hireEnd);
            $('#hire_do_1').css(cssShow);
            $('#hire_do_2').css(cssShow);
            $('#hire_do_3').css(cssShow);
            $('#hire_do_automatic').css(cssShow);
            $('#hire_do_0').css(cssHide);
        });
    });

    $("body").on("click", "#savePersonal", function(){
        var value = $('#setPersonal').val();
        if(!value || value < 0 || value > 300) alert("Bitte Ganzzahl zwischen 0 und 300 angeben.");
        else{
            $.post('/buildings/' + buildingId + '?personal_count_target_only=1', {"building" : {"personal_count_target" : value}, "_method" : "put", "authenticity_token" : $("meta[name=csrf-token]").attr("content")}, function(data) {
                if(data == value) window.location.reload();
            });
        }
    });

})();
