// ==UserScript==
// @name         ShareAllianceBUND
// @namespace    Dieses Script ist exklusiv für den Verband Bundesweiter KatSchutz (Bund)
// @version      1.1.0
// @description  teilt Einsätze im Verband und postet eine Rückmeldung im Chat
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==
/* global $ */

(async function() {
    'use strict';

    if(!localStorage.aMissions || JSON.parse(localStorage.aMissions).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) await $.getJSON('/einsaetze.json').done(data => localStorage.setItem('aMissions', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );
    if(!localStorage.sabJumpNext) localStorage.sabJumpNext = false;

    var aMissions = JSON.parse(localStorage.aMissions).value;
    var jumpNext = JSON.parse(localStorage.sabJumpNext);
    var missionId = $('#mission_progress_info >> div').attr('id').replace('mission_bar_holder_','');
    var missionIdNextMission = $('#mission_next_mission_btn').attr('href').replace('/missions/','');
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
        .after(`<div class="btn-group dropup">
                  <a class="btn btn-success btn-sm" id="shareBund" title="Alarmieren, im Verband freigeben und eine Rückmeldung mit der Adresse in den Chat senden.">
                    <img class="icon icons8-Phone-Filled" src="/images/icons8-phone_filled.svg" width="16" height="16">
                    <img class="icon icons8-Share" src="/images/icons8-share.svg" width="16" height="16">
                    <span class="glyphicon glyphicon-info-sign"></span>
                    <span class="glyphicon glyphicon-arrow-right" id="jumpArrow" style="display:${jumpNext ? `` : `none`}"></span>
                 </a>
                  <button type="button" class="btn btn-success btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <div class="glyphicon glyphicon-cog" style="color:LightSteelBlue"></div>
                  </button>
                  <div class="dropdown-menu">
                    <a class="dropdown-item btn btn-${jumpNext ? `success` : `danger`} btn-xs" id="btnJumpNext">zum nächsten Einsatz springen</a>
                  </div>
                </div>`);

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
                setTimeout(() => {jumpNext && missionIdNextMission ? window.location.replace('/missions/' + missionIdNextMission) : window.location.reload()}, 1000);
            });
        });
    });

    $("body").on("click", "#btnJumpNext", function(){
        jumpNext = !jumpNext;
        $('#btnJumpNext').toggleClass('btn-success btn-danger');
        localStorage.sabJumpNext = jumpNext;
        if(!jumpNext){
            $('#jumpArrow').css({"display":"none"});
        } else {
            $('#jumpArrow').css({"display":""});
        }
    });

})();
