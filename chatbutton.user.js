// ==UserScript==
// @name         chatbutton
// @version      1.2.1
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/
// @include      *://leitstellenspiel.de/
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    if(!localStorage.cbtnMsgAddress) localStorage.cbtnMsgAddress = 'Bitte bei Freigabe an die Ortsangaben denken.';
    if(!localStorage.cbtnMsgPushNotOwn) localStorage.cbtnMsgPushNotOwn = 'Bitte keine fremden Einsätze pushen.';
    if(!localStorage.cbtnMsgSmall) localStorage.cbtnMsgSmall = 'Bitte keine Kleineinsätze freigeben.';
    if(!localStorage.cbtnMsgPermaPush) localStorage.cbtnMsgPermaPush = 'Bitte Einsätze nicht permanent pushen.';
    if(!localStorage.cbtnMsgSpam) localStorage.cbtnMsgSpam = 'Bitte nicht spamen.';
    if(!alliance_admin && !alliance_coadmin) return false;
    if(alliance_id !== 19) return false;

    var msgAddress = localStorage.cbtnMsgAddress;
    var msgPushNotOwn = localStorage.cbtnMsgPushNotOwn ;
    var msgSmall = localStorage.cbtnMsgSmall;
    var msgPermaPush = localStorage.cbtnMsgPermaPush;
    var msgSpam = localStorage.cbtnMsgSpam;
    var msgLast = 'Letzte Aufforderung!';

    if(!alliance_admin && !alliance_coadmin) return false;
    if(alliance_id !== 19) return false;

    $('#alliance_chat_header_info').after(
        `<div class="btn-group">
           <a class="btn btn-default btn-xs" id="btnAddressInfo" title="${msgAddress}">Ortsang.</a>
           <a class="btn btn-danger btn-xs" id="btnAddressLa" title="${msgAddress} ${msgLast}">LA</a>
           <a class="btn btn-default btn-xs" id="btnPushNotOwn" title="${msgPushNotOwn}">Fremd-E</a>
           <a class="btn btn-danger btn-xs" id="btnPushLa" title="${msgPushNotOwn} ${msgLast}"">LA</a>
           <a class="btn btn-default btn-xs" id="btnSmall" title="${msgSmall}">Klein-E</a>
           <a class="btn btn-danger btn-xs" id="btnSmallLa" title="${msgSmall} ${msgLast}"">LA</a>
           <a class="btn btn-default btn-xs" id="btnPermaPush" title="${msgPermaPush}">Perma-E</a>
           <a class="btn btn-danger btn-xs" id="btnPermaLa" title="${msgPermaPush} ${msgLast}">LA</a>
           <a class="btn btn-default btn-xs" id="btnSpam" title="${msgSpam}">Spam</a>
           <a class="btn btn-danger btn-xs" id="btnSpamLa" title="${msgSpam} ${msgLast}"">LA</a>
           <a class="btn btn-success btn-xs" id="preferences" data-toggle="collapse" data-target="#cbtnPreferences" title="Einstellungen"><div class="glyphicon glyphicon-cog" style="color:LightSteelBlue"></div></a>
         </div>
         <div class="collapse" id="cbtnPreferences">
           <div class="card card-body">
             <input class="form-control" type="text" id="txtAddress" value="${msgAddress}">
             <input class="form-control" type="text" id="txtPushNotOwn" value="${msgPushNotOwn}">
             <input class="form-control" type="text" id="txtSmall" value="${msgSmall}">
             <input class="form-control" type="text" id="txtPermaPush" value="${msgPermaPush}">
             <input class="form-control" type="text" id="txtSpam" value="${msgSpam}">
             <a class="btn btn-success btn-xs" id="savePreferences">Speichern</a>
           </div>
        </div>`);

    if(!alliance_admin && !alliance_coadmin) return false;
    if(alliance_id !== 19) return false;

    $("body").on("click", "#btnAddressInfo", function(){
        var value = $('#alliance_chat_message').val() + '' + msgAddress;
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnAddressLa", function(){
        var value = $('#alliance_chat_message').val() + ' ' + msgAddress + ' ' + msgLast;
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnPushNotOwn", function(){
        var value = $('#alliance_chat_message').val() + ' ' + msgPushNotOwn + ' ' + msgLast;
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnPushLa", function(){
        var value = $('#alliance_chat_message').val() + ' ' + msgPushNotOwn + ' ' + msgLast;
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnSmall", function(){
        var value = $('#alliance_chat_message').val() + ' ' + msgSmall;
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnSmallLa", function(){
        var value = $('#alliance_chat_message').val() + ' ' + msgSmall + ' ' + msgLast;
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnPermaPush", function(){
        var value = $('#alliance_chat_message').val() + ' ' + msgPermaPush;
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnPermaLa", function(){
        var value = $('#alliance_chat_message').val() + ' ' + msgPermaPush + ' ' + msgLast;
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnSpam", function(){
        var value = $('#alliance_chat_message').val() + ' ' + msgSpam;
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnSpamLa", function(){
        var value = $('#alliance_chat_message').val() + ' ' + msgSpam + ' ' + msgLast;
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#savePreferences", function(){
        localStorage.cbtnMsgAddress = $('#txtAddress').val();
        localStorage.cbtnMsgPushNotOwn = $('#txtPushNotOwn').val();
        localStorage.cbtnMsgSmall = $('#txtSmall').val();
        localStorage.cbtnMsgPermaPush = $('#txtPermaPush').val();
        localStorage.cbtnMsgSpam = $('#txtSpam').val();
        window.location.reload();
    });

})();
