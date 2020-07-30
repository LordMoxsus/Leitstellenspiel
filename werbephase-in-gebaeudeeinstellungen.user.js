// ==UserScript==
// @name         Werbephasen in Gebaeudeeinstellungen
// @version      2.1.0
// @description  Werbephasen in den Gebaeudeeinstellungen auswählen
// @author       DrTraxx
// @include      /^https?:\/\/[www.]*(?:leitstellenspiel\.de|missionchief\.co\.uk|missionchief\.com|meldkamerspel\.com|centro-de-mando\.es|missionchief-australia\.com|larmcentralen-spelet\.se|operatorratunkowy\.pl|operatore112\.it|operateur112\.fr|dispetcher112\.ru|alarmcentral-spil\.dk|nodsentralspillet\.com|operacni-stredisko\.cz|112-merkez\.com|jogo-operador112\.com|operador193\.com|centro-de-mando\.mx|dyspetcher101-game\.com|missionchief-japan\.com)\/buildings\/.*\/edit$/
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    if(!$('#building_personal_count_target').val()) return false;

    var buildingId = $('#back_to_building').attr('href').replace('/buildings/','');
    var clickSuccess = `<div class="alert fade in alert-success "><button class="close" data-dismiss="alert" type="button">×</button>Die Einstellungsphase wurde gestartet.</div>`;

    $("input[value*='Speichern']")
        .after(`<div class="btn-group">
                  <a id="hire_do_1" class="btn btn-default">1 Tag werben</a>
                  <a id="hire_do_2" class="btn btn-default">2 Tage werben</a>
                  <a id="hire_do_3" class="btn btn-default">3 Tage werben</a>
                  ${user_premium ? `<a id="hire_do_automatic" class="btn btn-default">automatisch</a></div>` :
               `</div>`}`);

    $("body").on("click", "#hire_do_1",function(){
        $.get(`/buildings/${buildingId}/hire_do/1`).done(() => {
            $('#back_to_building').parent().before(clickSuccess);
        });
    });

    $("body").on("click", "#hire_do_2",function(){
        $.get(`/buildings/${buildingId}/hire_do/2`).done(() => {
            $('#back_to_building').parent().before(clickSuccess);
        });
    });

    $("body").on("click", "#hire_do_3",function(){
        $.get(`/buildings/${buildingId}/hire_do/3`).done(() => {
            $('#back_to_building').parent().before(clickSuccess);
        });
    });

    $("body").on("click", "#hire_do_automatic",function(){
        $.get(`/buildings/${buildingId}/hire_do/automatic`).done(() => {
            $('#back_to_building').parent().before(clickSuccess);
        });
    });

})();
