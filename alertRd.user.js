// ==UserScript==
// @name         alert RD-Mitteilungen
// @version      1.0.0
// @description  zeigt Rückmeldungen von Einsätzen, die den RD betreffen, als Alert
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==
/* global $ */

(function () {
    'use strict';

    if ($("#mission_replies > li").length) {
        var alertContent = "";

        $("#mission_replies > li").each(function () {
            if ($(this)[0].innerText.includes("RD") || $(this)[0].innerText.includes("Rettungsdienst")) {
                alertContent += $(this)[0].innerText + "<br>";
            }
        });

        if (alertContent) {
            $("#mission_general_info").parent().after(`<div class="alert alert-info">
                                                        <button class="close" data-dismiss="alert" type="button">×</button>
                                                        ${alertContent.trim()}
                                                        </div>`);
        }
    }


})();
