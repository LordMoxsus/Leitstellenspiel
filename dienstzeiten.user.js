// ==UserScript==
// @name         Dienstzeiten
// @version      1.0.1
// @description  Dienstzeiten der Fahrzeuge in der Uebersicht
// @author       DrTraxx
// @include      /^https?:\/\/[www.]*(?:leitstellenspiel\.de|missionchief\.co\.uk|missionchief\.com|meldkamerspel\.com|centro-de-mando\.es|missionchief-australia\.com|larmcentralen-spelet\.se|operatorratunkowy\.pl|operatore112\.it|operateur112\.fr|dispetcher112\.ru|alarmcentral-spil\.dk|nodsentralspillet\.com|operacni-stredisko\.cz|112-merkez\.com|jogo-operador112\.com|operador193\.com|centro-de-mando\.mx|dyspetcher101-game\.com|missionchief-japan\.com)\/buildings\/.*\
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    if(!$('#vehicle_table') || !$('#vehicle_table')[0]) return false;

    var vehicleIds = [];

    $('#vehicle_table >> tr').each(function(){
        var $this = $(this);
        if($this.children()[1].firstElementChild.href){
            var vehicleId = $this.children()[1].firstElementChild.href.replace(/\D+/g,'');
            vehicleIds.push(vehicleId);
        }
    });

    for(let i = 0; i < vehicleIds.length; i++){
        setTimeout(() => {
            $.get('/vehicles/' + vehicleIds[i] + '/edit', (data) => {
                var start = $('#vehicle_working_hour_start', data).val();
                var end = $('#vehicle_working_hour_end', data).val();
                if(start !== undefined && end !== undefined){
                    $(`td[sortvalue*="${vehicleIds[i]}"]`).append(`<br><small>Dienstzeit: ${start}:00 - ${end}:00 Uhr</small>`);
                }
            });
        }, i * 100);
    }

})();
