// ==UserScript==
// @name         show toplist
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  shows your toplist-position
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/profile/*
// @include      *://leitstellenspiel.de/profile/*
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    var userName = $("img[class*='online_icon']").attr('title').replace(' ist online.','');

    $.getJSON('/api/credits').done(function(data){
        if(data.user_name == userName) $("div[class*='page-header']").append(`<p>Toplist-Platzierung: ${data.user_toplist_position.toLocaleString()}</p>`);
    });

})();
