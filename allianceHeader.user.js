// ==UserScript==
// @name         Alliance-Header
// @version      1.1.0
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/*
// @include      *://leitstellenspiel.de/*
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    var candidatureCount = $('#alliance_candidature_count').text().replace('(','').replace(')','');

    $('#menu_alliance').parent().after(`<li><a id="rules" class="lightbox-open" href="/verband/regeln/${alliance_id}" ><div class="glyphicon glyphicon-book"></div></a></li`);
    $('#rules').parent().after(`<li><a id="schoolings" class="lightbox-open" href="/schoolings" ><div class="glyphicon glyphicon-education"></div></a></li`);
    $('#schoolings').parent().after(`<li><a id="alliance_messages_header" class="lightbox-open" href="/alliance_messages" ><div class="glyphicon glyphicon-envelope"></div></a></li>`);
    $('#alliance_messages_header').parent().after(`<li><a id="alliance_forum_header" class="lightbox-open" href="/alliance_threads" ><div class="glyphicon glyphicon-list-alt"></div></a></li>`);
    if(alliance_admin || alliance_coadmin){
        $('#alliance_forum_header').parent().after(`<li><a id="candidature" class="lightbox-open" href="/verband/bewerbungen" >(${candidatureCount})</div></a></li>`);
        $('#candidature').parent().after(`<li><a id="alliance_logfiles" class="lightbox-open" href="/alliance_logfiles" ><div class="glyphicon glyphicon-info-sign"></div></a></li>`);
    }

    if(candidatureCount > 0 && (alliance_admin || alliance_coadmin)) $('#candidature').css({"backgroundColor":"LightGreen"});
    if($('#alliance_message_new').attr('style') == "display: inline-block;") $('#alliance_messages_header').css({"backgroundColor":"LightGreen"});
    if($('#alliance_forum_new').attr('style') !== "display:none") $('#alliance_forum_header').css({"backgroundColor":"LightGreen"});

    let allianceCandidatureCountOrig = allianceCandidatureCount;
    allianceCandidatureCount = c => {
        allianceCandidatureCountOrig(c);
        if(alliance_admin || alliance_coadmin){
            c > 0 ? $('#candidature').css({"backgroundColor":"LightGreen"}).text(`(${c})`) : $('#candidature').css({"backgroundColor":""}).text(`(${c})`);
        }
    }

    let allianceMessageNewOrig = allianceMessageNew;
    allianceMessageNew = m => {
        allianceMessageNewOrig(m);
        m ? $('#alliance_messages_header').css({"backgroundColor":"LightGreen"}) : $('#alliance_messages_header').css({"backgroundColor":""});
    }

    let allianceForumNewOrig = allianceForumNew;
    allianceForumNew = f => {
        allianceForumNewOrig(f);
        f ? $('#alliance_forum_header').css({"backgroundColor":"LightGreen"}) : $('#alliance_forum_header').css({"backgroundColor":""});
    }

})();
