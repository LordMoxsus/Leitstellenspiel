// ==UserScript==
// @name         showCounty
// @version      1.0.0
// @description  zeigt den Landkreis der gebauten Wache an
// @author       DrTraxx
// @include      /^https?:\/\/[www.]*(?:leitstellenspiel\.de|missionchief\.co\.uk|missionchief\.com|meldkamerspel\.com|centro-de-mando\.es|missionchief-australia\.com|larmcentralen-spelet\.se|operatorratunkowy\.pl|operatore112\.it|operateur112\.fr|dispetcher112\.ru|alarmcentral-spil\.dk|nodsentralspillet\.com|operacni-stredisko\.cz|112-merkez\.com|jogo-operador112\.com|operador193\.com|centro-de-mando\.mx|dyspetcher101-game\.com|missionchief-japan\.com)\/buildings\/.*\
// @require      https://drtraxx.github.io/js/apis.1.0.1.js
// @grant        none
// ==/UserScript==
/* global $, singleBuilding */

(async function() {
    'use strict';

    var building = await singleBuilding(+window.location.href.replace(/\D+/g, ""));

    await $.getJSON("https://nominatim.openstreetmap.org/reverse?format=json&lat="+building.latitude+"&lon="+building.longitude+"&zoom=18&addressdetails=1", function(data) {
        $(".active:first").after("<span class='label label-info' style='cursor:default;margin-left:2em'>"+(data.address.county ? data.address.county : (data.address.city ? data.address.city : data.address.town))+"</span>");
    });

})();
