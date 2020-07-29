// ==UserScript==
// @name         chatbutton
// @version      1.0.0
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/
// @include      *://leitstellenspiel.de/
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    $('#alliance_chat_header_info').after(
        `<div class="btn-group">
           <a class="btn btn-default btn-xs" id="btnAddressInfo">Ortsangaben</a>
           <a class="btn btn-danger btn-xs" id="btnAddressLa">LA</a>
           <a class="btn btn-default btn-xs" id="btnPushNotOwn">fremde Einsätze</a>
           <a class="btn btn-danger btn-xs" id="btnPushLa">LA</a>
           <a class="btn btn-default btn-xs" id="btnPermaPush">perm. Einsätze</a>
           <a class="btn btn-danger btn-xs" id="btnPermaLa">LA</a>
           <a class="btn btn-default btn-xs" id="btnSpam">Spam</a>
           <a class="btn btn-danger btn-xs" id="btnSpamLa">LA</a>
         </div>`);

    $("body").on("click", "#btnAddressInfo", function(){
        var value = $('#alliance_chat_message').val() + ' Bitte bei Freigabe an die Ortsangaben denken.';
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnAddressLa", function(){
        var value = $('#alliance_chat_message').val() + ' Bitte bei Freigabe an die Ortsangaben denken. Letzte Aufforderung!';
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnPushNotOwn", function(){
        var value = $('#alliance_chat_message').val() + ' Bitte keine fremden Einsätze pushen.';
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnPushLa", function(){
        var value = $('#alliance_chat_message').val() + ' Bitte keine fremden Einsätze pushen. Letzte Aufforderung!';
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnPermaPush", function(){
        var value = $('#alliance_chat_message').val() + ' Bitte Einsätze nicht permanent pushen.';
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnPermaLa", function(){
        var value = $('#alliance_chat_message').val() + ' Bitte Einsätze nicht permanent pushen. Letzte Aufforderung!';
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnSpam", function(){
        var value = $('#alliance_chat_message').val() + ' Bitte nicht spamen.';
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

    $("body").on("click", "#btnSpamLa", function(){
        var value = $('#alliance_chat_message').val() + ' Bitte nicht spamen. Letzte Aufforderung!';
        $.post("/alliance_chats", {"alliance_chat": {"message": value}, "authenticity_token" : $("meta[name=csrf-token]").attr("content")});
        $('#alliance_chat_message').val('');
    });

})();
