// ==UserScript==
// @name         ShareAllianceBUND
// @namespace    Dieses Script ist exklusiv für den Verband Bundesweiter KatSchutz (Bund)
// @version      1.0.0
// @description  teilt Einsätze im Verband und postet eine Rückmeldung im Chat
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==
/* global $ */

(async function() {
    'use strict';

    if(!localStorage.aMissions || JSON.parse(localStorage.aMissions).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) await $.getJSON('/einsaetze.json').done(data => localStorage.setItem('aMissions', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );

    var aMissions = JSON.parse(localStorage.aMissions).value;
    var missionId = $('#mission_progress_info >> div').attr('id').replace('mission_bar_holder_','');
    var missionTypeId = $('#mission_help').attr('href').split("/").pop().replace(/\?.*/, '');
    var shareLink = $('#mission_alliance_share_btn').attr('href');
    var credits = 0;
    var missionAddress = $('#mission_general_info').children()[2].innerText.split('|')[0].trim();

    if(!missionTypeId || !shareLink) return false;

    for(let i = 0; i < aMissions.length; i++){
        if(aMissions[i].id == missionTypeId){
            credits = aMissions[i].average_credits;
            break;
        }
    }

    if(credits <= 2500) return false;

    $('#mission_finish_now_btn').parent()
        .after(`<a class="btn btn-success btn-sm" id="shareBund" title="Alarmieren, im Verband freigeben und eine Rückmeldung mit der Adresse in den Chat senden.">
                  <img class="icon icons8-Phone-Filled" src="/images/icons8-phone_filled.svg" width="18" height="18">
                  <img class="icon icons8-Share" src="/images/icons8-share.svg" width="20" height="20">
                  <span class="glyphicon glyphicon-info-sign"></span>
                </a>`);

    $("body").on("click", "#shareBund", function(){

        var checkedVehicles = [];

        $('.vehicle_checkbox').each(function(){
            if($(this)[0].checked){
                checkedVehicles.push($(this).attr('value'));
            }
        });

        $.when(
            $.get('/missions/' + missionId + '/alarm', {'vehicle_ids' : checkedVehicles}))
            .done(() => {
            $.when(
                $.get('/missions/' + missionId + '/alliance'))
                .done(() => {
                $.post("/mission_replies", {"mission_reply": {"alliance_chat" : 1, "content" : missionAddress, "mission_id" : missionId}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
                setTimeout(() => {window.location.reload()}, 1000);
            });
        });
    });

})();
