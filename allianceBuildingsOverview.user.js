// ==UserScript==
// @name         allianceBuildingsOverview
// @version      1.1.0
// @description  zeigt eine Übersicht aller vom Verband gebauten Gebäude
// @author       DrTraxx
// @include      /^https?:\/\/(?:w{3}\.)?(?:(policie\.)?operacni-stredisko\.cz|(politi\.)?alarmcentral-spil\.dk|(polizei\.)?leitstellenspiel\.de|missionchief\.gr|(?:(police\.)?missionchief-australia|(police\.)?missionchief|(poliisi\.)?hatakeskuspeli|missionchief-japan|missionchief-korea|nodsentralspillet|meldkamerspel|operador193|jogo-operador112|jocdispecerat112|dispecerske-centrum|112-merkez|dyspetcher101-game)\.com|(police\.)?missionchief\.co\.uk|centro-de-mando\.es|centro-de-mando\.mx|(police\.)?operateur112\.fr|(polizia\.)?operatore112\.it|operatorratunkowy\.pl|dispetcher112\.ru|larmcentralen-spelet\.se)\/.*$/
// @grant        GM_addStyle
// ==/UserScript==
/* global $, user_id, I18n */

(async function() {
    'use strict';

    if(!sessionStorage.aAllianceBuildings || JSON.parse(sessionStorage.aAllianceBuildings).lastUpdate < (new Date().getTime() - 5 * 1000 * 60) || JSON.parse(sessionStorage.aAllianceBuildings).userId != user_id) {
        await $.getJSON('/api/alliance_buildings').done(data => sessionStorage.setItem('aAllianceBuildings', JSON.stringify({lastUpdate: new Date().getTime(), value: data, userId: user_id})) );
    }

    var aAllianceBuildings = JSON.parse(sessionStorage.aAllianceBuildings).value;

    function translate(subject) {
        var lang = I18n.locale === "de_DE";
        var returnValue = "";

        switch(subject) {
            case "modalTitle" : returnValue = lang ? "Verbandsgebäude" : "alliance buildings";
                break;
            case "btnClose": returnValue = lang ? "Schließen" : "close";
                break;
            case "name": returnValue = lang ? "Name" : "name";
                break;
            case "classroom": returnValue = lang ? "Klassenräume" : "classrooms";
                break;
            case "build": returnValue = lang ? "gebaut" : "build";
                break;
            case "onBuild": returnValue = lang ? "im Ausbau" : "on Build";
                break;
            case "tax": returnValue = lang ? "Abgabe in Prozent" : "tax (percentage)";
                break;
            case "pris": returnValue = lang ? "aktuell in den Zellen" : "now at jail";
                break;
            case "hosp": returnValue = lang ? "aktuell belegte Betten" : "now at hospital";
                break;
            case "count": returnValue = lang ? "Anzahl" : "count";
                break;
        }

        return returnValue;
    }

    GM_addStyle(`.modal {
display: none;
position: fixed; /* Stay in place front is invalid - may break your css so removed */
padding-top: 100px;
left: 0;
right:0;
top: 0;
bottom: 0;
overflow: auto;
background-color: rgb(0,0,0);
background-color: rgba(0,0,0,0.4);
z-index: 9999;
}
.modal-body{
height: 650px;
overflow-y: auto;
}
.aboShow{
display: table-row;
}`);

    $("body")
        .prepend(
        `<div class="modal fade bd-example-modal-lg" id="aboModal" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
           <div class="modal-dialog modal-lg" role="document">
             <div class="modal-content">
               <div class="modal-header">
                 <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                   <span aria-hidden="true">&#x274C;</span>
                 </button>
                 <h3 class="modal-title"><center>${translate("modalTitle")}: ${aAllianceBuildings.length.toLocaleString()}</center></h3>
                 <div class="btn-group hidden" id="aboBtnGrp">
                   <a class="btn btn-primary btn-xs" id="aboBuildingList">Gebäudeliste</a>
                   <a class="btn btn-primary btn-xs" id="aboStatistics">Gebäudestatistiken</a>
                 </div>
               </div>
                 <div class="modal-body" id="aboModalBody">
                 </div>
                 <div class="modal-footer">
                   <button type="button" class="btn btn-danger" data-dismiss="modal">${translate("btnClose")}</button>
                   <div class="pull-left">v ${GM_info.script.version}</div>
                 </div>
           </div>
         </div>`);

    $("#building_panel_heading .btn-group").append(`<a class="btn btn-default btn-xs" data-toggle="modal" data-target="#aboModal" id="aboOpenModal">${translate("modalTitle")}</a>`);

    function tableBuildings() {
        if(aAllianceBuildings.length >= 2) aAllianceBuildings.sort((a, b) => a.caption.toUpperCase() > b.caption.toUpperCase() ? 1 : -1);

        var i, k, ext;
        var tableHTML = `<table class="table">
                           <thead>
                             <tr>
                               <th class="col">${translate("name")}</th>
                               <th class="col-1"></th>
                             </tr>
                           </thead>
                           <tbody>`;

        for(i in aAllianceBuildings) {
            var e = aAllianceBuildings[i];
            if(e.extensions.length >= 2) e.extensions.sort((a, b) => a.type_id > b.type_id ? 1 : -1);
            var activeEx = 0;

            tableHTML += `<tr><td class="col"><a class="lightbox-open" href="/buildings/${e.id}">${e.caption}</a></td>`;
            tableHTML += `<td class="col-1">`;

            if(e.extensions.length > 0 || e.level > 0) {
                tableHTML += `<span class="glyphicon glyphicon-plus-sign" building_id="${e.id}" style="cursor:pointer"></span>`;
            }

            tableHTML += "</td></tr>";

            if(e.prisoner_count === undefined && e.patient_count === undefined) {
                for(k in e.extensions) {
                    ext = e.extensions[k];
                    if(ext.available && ext.enabled) activeEx++;
                    tableHTML += `<tr class="table_${e.id} hidden">
                              <td class="col">${ext.caption}</td>
                              <td class="col-1">${(ext.available && ext.enabled) ? translate("build") : translate("onBuild")}</td>
                              </tr>`;
                }
                tableHTML += `<tr class="table_${e.id} hidden">
                              <td class="col">${translate("classroom")}</td>
                              <td class="col-1">${1 + activeEx}</td>
                              </tr>`;
            }

            if(e.prisoner_count >= 0 || e.patient_count >= 0) {
                for(k in e.extensions) {
                    ext = e.extensions[k];
                    tableHTML += `<tr class="table_${e.id} hidden">
                                  <td class="col">${ext.caption}</td>
                                  <td class="col-1">${(ext.available && ext.enabled) ? translate("build") : translate("onBuild")}</td>
                                  </tr>`;
                }
                tableHTML += `<tr class="table_${e.id} hidden">
                              <td class="col">${translate("tax")}</td>
                              <td class="col-1">${e.alliance_share_credits_percentage}</td>
                              </tr>
                              <tr class="table_${e.id} hidden">
                              <td class="col">${translate(e.prisoner_count === undefined ? "hosp" : "pris")}</td>
                              <td class="col-1">${e.prisoner_count === undefined ? e.patient_count : e.prisoner_count}</td>
                              </tr>`;
            }
        }

        tableHTML += "</tbody></table>";

        $("#aboModalBody").html(tableHTML);
    }

    function getShownContent(name, value, type) {
        return `<tr>
                <td class="col">${name}<span class="glyphicon glyphicon-plus-sign" tree_for="${type}" style="cursor:pointer;margin-left:2em"></span></td>
                <td class="col-1">${value.toLocaleString()}</td>
                </tr>`;
    }

    function getHiddenContent(name, value, type) {
        return `<tr class="${type} hidden">
                <td class="col">${name}</td>
                <td class="col-1">${value.toLocaleString()}</td>
                </tr>`;
    }

    function statisticBuildings() {
        var buildings = {};
        var buildExt = {};
        var onBuildExt = {};
        var tableHTML = `<table class="table">
                           <thead>
                             <tr>
                               <th class="col">${translate("name")}</th>
                               <th class="col-1">${translate("count")}</th>
                             </tr>
                           </thead>
                           <tbody>`;
        var key;

        $.each(aAllianceBuildings, function(key, item) {
            switch(item.building_type) {
                case 1: buildings.fireSchool ? buildings.fireSchool++ : buildings.fireSchool = 1;
                    break;
                case 3: buildings.rescueSchool ? buildings.rescueSchool++ : buildings.rescueSchool = 1;
                    break;
                case 4:
                    buildings.hospi ? buildings.hospi++ : buildings.hospi = 1;
                    buildings.hospiBeds > 0 ? buildings.hospiBeds += item.level : buildings.hospiBeds = item.level;
                    break;
                case 8: buildings.polSchool ? buildings.polSchool++ : buildings.polSchool = 1;
                    break;
                case 10: buildings.thwSchool ? buildings.thwSchool++ : buildings.thwSchool = 1;
                    break;
                case 14: buildings.bsr ? buildings.bsr++ : buildings.bsr = 1;
                    break;
                case 16: buildings.cells ? buildings.cells++ : buildings.cells = 1;
                    break;
            }
            if(item.extensions.length > 0) {
                for(var i in item.extensions) {
                    var e = item.extensions[i];
                    var eKey = e.caption + "_" + item.building_type;
                    if(e.available && e.enabled) buildExt[eKey] ? buildExt[eKey]++ : buildExt[eKey] = 1;
                    if(!e.available && e.enabled) onBuildExt[eKey] ? onBuildExt[eKey]++ : onBuildExt[eKey] = 1;
                }
            }
        });

        if(buildings.bsr > 0) tableHTML += getHiddenContent("Bereitstellungsräume", buildings.bsr, "").replace("hidden", "");
        if(buildings.hospi > 0) {
            tableHTML += getShownContent("Krankenhäuser", buildings.hospi, "hospital");
            tableHTML += getHiddenContent("Betten", buildings.hospiBeds + (buildings.hospi * 10), "hospital");
            for(key in buildExt) {
                if(key.includes("4")) {
                    tableHTML += getHiddenContent(key.replace("_4",""), buildExt[key], "hospital");
                }
            }
            for(key in onBuildExt) {
                if(key.includes("4")) {
                    tableHTML += getHiddenContent(key.replace("_4","")+" im Ausbau", onBuildExt[key], "hospital");
                }
            }
        }
        if(buildings.cells > 0) {
            tableHTML += getShownContent("Gefängnisse", buildings.cells, "cells");
            tableHTML += getHiddenContent("Zellen", buildings.cells + buildExt.Zelle_16, "cells");
            if(onBuildExt.Zelle_16 > 0) tableHTML += getHiddenContent("Zellen im Bau", onBuildExt.Zelle_16, "cells");
        }
        if(buildings.fireSchool > 0) {
            tableHTML += getShownContent("Feuerwehrschulen", buildings.fireSchool, "fwSchool");
            tableHTML += getHiddenContent("Klassenräume", buildExt["Weiterer Klassenraum_1"] + buildings.fireSchool, "fwSchool");
            if(onBuildExt["Weiterer Klassenraum_1"]) tableHTML += getHiddenContent("Klassenräume im Bau", onBuildExt["Weiterer Klassenraum_1"], "fwSchool");
        }
        if(buildings.rescueSchool > 0) {
            tableHTML += getShownContent("Rettungsdienstschulen", buildings.rescueSchool, "rdSchool");
            tableHTML += getHiddenContent("Klassenräume", buildExt["Weiterer Klassenraum_3"] + buildings.rescueSchool, "rdSchool");
            if(onBuildExt["Weiterer Klassenraum_3"]) tableHTML += getHiddenContent("Klassenräume im Bau", onBuildExt["Weiterer Klassenraum_3"], "rdSchool");
        }
        if(buildings.polSchool > 0) {
            tableHTML += getShownContent("Polizeischulen", buildings.polSchool, "polSchool");
            tableHTML += getHiddenContent("Klassenräume", buildExt["Weiterer Klassenraum_8"] + buildings.polSchool, "polSchool");
            if(onBuildExt["Weiterer Klassenraum_8"]) tableHTML += getHiddenContent("Klassenräume im Bau", onBuildExt["Weiterer Klassenraum_8"], "polSchool");
        }
        if(buildings.thwSchool > 0) {
            tableHTML += getShownContent("THW-Bundesschulen", buildings.thwSchool, "thwSchool");
            tableHTML += getHiddenContent("Klassenräume", buildExt["Weiterer Klassenraum_10"] + buildings.thwSchool, "thwSchool");
            if(onBuildExt["Weiterer Klassenraum_10"]) tableHTML += getHiddenContent("Klassenräume im Bau", onBuildExt["Weiterer Klassenraum_10"], "thwSchool");
        }

        tableHTML += "</tbody></table>";

        $("#aboModalBody").html(tableHTML);
    }

    $("body").on("click", "#aboOpenModal", function() {
        if(I18n.locale === "de_DE") {
            if($("#aboBtnGrp").hasClass("hidden")) $("#aboBtnGrp").removeClass("hidden");
        } else {
            tableBuildings();
        }
    });

    $("body").on("click", ".glyphicon", function() {
        var $this = $(this);
        if($this.hasClass("glyphicon-plus-sign")) {
            $this.removeClass("glyphicon-plus-sign").addClass("glyphicon-minus-sign");
            if($this.attr("building_id")) {
                $(".table_"+$this.attr("building_id")).removeClass("hidden").addClass("aboShow");
            } else if($this.attr("tree_for")) {
                $("."+$this.attr("tree_for")).removeClass("hidden").addClass("aboShow");
            }
        } else if($this.hasClass("glyphicon-minus-sign")) {
            $this.removeClass("glyphicon-minus-sign").addClass("glyphicon-plus-sign");
            if($this.attr("building_id")) {
                $(".table_"+$this.attr("building_id")).removeClass("aboShow").addClass("hidden");
            } else if($this.attr("tree_for")) {
                $("."+$this.attr("tree_for")).removeClass("aboShow").addClass("hidden");
            }
        }
    });

    $("body").on("click", "#aboBuildingList", function() {
        tableBuildings();
    });

    $("body").on("click", "#aboStatistics", function() {
        statisticBuildings();
    });


})();
