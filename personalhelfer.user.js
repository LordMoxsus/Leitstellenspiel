// ==UserScript==
// @name         Personalhelfer
// @version      1.2.0
// @description  Werbephasen und Personalsoll in der Gebaeudeuebersicht auswaehlen
// @author       DrTraxx
// @include      /^https?:\/\/[www.]*(?:leitstellenspiel\.de|missionchief\.co\.uk|missionchief\.com|meldkamerspel\.com|centro-de-mando\.es|missionchief-australia\.com|larmcentralen-spelet\.se|operatorratunkowy\.pl|operatore112\.it|operateur112\.fr|dispetcher112\.ru|alarmcentral-spil\.dk|nodsentralspillet\.com|operacni-stredisko\.cz|112-merkez\.com|jogo-operador112\.com|operador193\.com|centro-de-mando\.mx|dyspetcher101-game\.com|missionchief-japan\.com)\/buildings\/.*\
// @grant        none
// ==/UserScript==
/* global $ */

(async function() {
    'use strict';

    if(!$('#vehicle_table') || !$('#vehicle_table')[0]) return false;

    var buildingId = $('span[class*="glyphicon glyphicon-pencil"]').parent('a[class="btn btn-default"]').attr('href').replace(/\D+/g,'');
    var hireStart = `<div class="alert fade in alert-success "><button class="close" data-dismiss="alert" type="button">×</button>Die Einstellungsphase wurde gestartet.</div>`;
    var hireEnd = `<div class="alert fade in alert-success "><button class="close" data-dismiss="alert" type="button">×</button>Die Einstellungsphase wurde beendet.</div>`;
    var maxPersonal = $('dd:contains("Angestellte")')[0].innerText.replace(/[a-zA-Z]./g,'').replace(',','').trim().split(':')[1] ? $('dd:contains("Angestellte")')[0].innerText.replace(/[a-zA-Z]./g,'').replace(',','').trim().split(':')[1].trim() : 0;
    var hire = false;
    var cssHide = {"display":"none"};
    var cssShow = {"display":""};

    $.get('/buildings/' + buildingId + '/hire', function(data){
        if($('a[href*="/buildings/' + buildingId + '/hire_do/0"]', data)[0]){
            hire = true;
        }
    }).done(() =>{
        $('dl[class*="dl-horizontal"]')
            .after(`<div class="btn-group input-group">
                       <a id="hire_do_1" class="btn btn-default" style="display:${!hire ? `` : `none`}">1 Tag werben</a>
                       <a id="hire_do_2" class="btn btn-default" style="display:${!hire ? `` : `none`}">2 Tage werben</a>
                       <a id="hire_do_3" class="btn btn-default" style="display:${!hire ? `` : `none`}">3 Tage werben</a>
                       <a id="hire_do_0" class="btn btn-danger" style="display:${hire ? `` : `none`}">Einstellungsphase abbrechen</a>
                       <a id="hire_do_automatic" class="btn btn-default" style="display:${user_premium && !hire ? `` : `none`}">automatisch</a>
                       <input class="numeric integer optional form-control" type="number" value="${maxPersonal}" id="setPersonal" style="width:5em">
                       <a id="savePersonal" class="btn btn-success">Speichern</a>
                     </div>`);
    });

    $("body").on("click", "#hire_do_1",function(){
        $.get(`/buildings/${buildingId}/hire_do/1`).done(() => {
            $('h1').parent().before(hireStart);
            $('#hire_do_1').css(cssHide);
            $('#hire_do_2').css(cssHide);
            $('#hire_do_3').css(cssHide);
            $('#hire_do_automatic').css(cssHide);
            $('#hire_do_0').css(cssShow);
        });
    });

    $("body").on("click", "#hire_do_2",function(){
        $.get(`/buildings/${buildingId}/hire_do/2`).done(() => {
            $('h1').parent().before(hireStart);
            $('#hire_do_1').css(cssHide);
            $('#hire_do_2').css(cssHide);
            $('#hire_do_3').css(cssHide);
            $('#hire_do_automatic').css(cssHide);
            $('#hire_do_0').css(cssShow);
        });
    });

    $("body").on("click", "#hire_do_3",function(){
        $.get(`/buildings/${buildingId}/hire_do/3`).done(() => {
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
        $.get(`/buildings/${buildingId}/hire_do/0`).done(() => {
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
            $.post('/buildings/' + buildingId + '?personal_count_target_only=1', {"building" : {"personal_count_target" : value}, "_method" : "put", "authenticity_token" : $("meta[name=csrf-token]").attr("content")})
                .done(setTimeout(() => {
                window.location.reload();
            }, 1000));
        }
    });

})();
