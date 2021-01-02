// ==UserScript==
// @name         FirstResponder (Original by JuMaHo)
// @version      1.4.0
// @description  wählt das nächstgelegene FirstResponder-Fahrzeug aus
// @author       DrTraxx
// @match        *://www.leitstellenspiel.de/missions/*
// @match        *://www.leitstellenspiel.de/aaos/*/edit
// @match        *://www.leitstellenspiel.de/buildings/*/edit
// @match        *://www.missionchief.co.uk/missions/*
// @match        *://www.missionchief.co.uk/aaos/*/edit
// @match        *://www.missionchief.co.uk/buildings/*/edit
// @match        *://www.missionchief.com/missions/*
// @match        *://www.missionchief.com/aaos/*/edit
// @match        *://www.missionchief.com/buildings/*/edit
// @require      https://drtraxx.github.io/js/apis.1.0.1.js
// @grant        none
// ==/UserScript==
/* global $,I18n */

(async function() {
    'use strict';

    if(!localStorage.firstResponder) localStorage.firstResponder = JSON.stringify({"vehicleTypes":{},"aaoId":{}});
    if(!localStorage.fr_dispatchSetup) localStorage.fr_dispatchSetup = JSON.stringify({"dispatchId":[], "useIt": false, "additionalBuildings": []});

    var aVehicleTypes = [];
    var frSettings = JSON.parse(localStorage.firstResponder);
    var dispatchSetup = JSON.parse(localStorage.fr_dispatchSetup);
    var lang = I18n.locale;
    var aBuildings = await getBuildings();

    if(lang == "de_DE") {
        aVehicleTypes = await getVehicleTypes();
    } else {
        if(!localStorage.aVehicleTypes || JSON.parse(localStorage.aVehicleTypes).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) {
            await $.getJSON("https://lss-manager.de/api/cars.php?lang="+lang).done(data => localStorage.setItem('aVehicleTypes', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );
        }
        aVehicleTypes = JSON.parse(localStorage.aVehicleTypes).value;
    }

    if(!frSettings.vehicleTypes[lang]) frSettings.vehicleTypes[lang] = [];
    if(!dispatchSetup.additionalBuildings) dispatchSetup.additionalBuildings = [];

    function mapVehicles(arrClasses, trigger) {
        var returnValue = [];
        if(trigger == "type") {
            returnValue = $.map(arrClasses, function(item) {
                return aVehicleTypes.filter((obj) => obj.name == item)[0].id;
            });
        } else if(trigger == "name") {
            returnValue = $.map(arrClasses, function(item) {
                return aVehicleTypes.filter((obj) => obj.id == item)[0].name;
            });
        }
        return returnValue;
    }

    function mapDispatchCenter(arrDispatchCenter, trigger) {
        var returnValue = [];
        if(trigger == "name") {
            returnValue = $.map(arrDispatchCenter, function(item) {
                return aBuildings.filter((obj) => obj.id == item)[0].caption;
            });
        } else if(trigger == "id") {
            returnValue = $.map(arrDispatchCenter, function(item) {
                return aBuildings.filter((obj) => obj.caption == item)[0].id;
            });
        }
        return returnValue;
    }

    if(window.location.pathname.includes("aaos") && window.location.pathname.includes("edit")) {
        $(".boolean.optional.checkbox")
            .before(`<label class="form-check-label" for="frSaveAaoId">
                    <input class="form-check-input" type="checkbox" id="frSaveAaoId" ${window.location.pathname.includes(frSettings.aaoId[lang]) ? "checked" : ""}>
                    ${lang == "de_DE" ? "Diese ID für den First Responder nutzen." : "Use this id for FirstResponder."}
                    </label>`);
    }

    if(window.location.pathname.includes("missions")) {
        var arrVehicles = [];
        var dispatchCenter = mapDispatchCenter(dispatchSetup.additionalBuildings, "name");
        var i;

        for(i in aVehicleTypes) {
            arrVehicles.push(aVehicleTypes[i].name);
        }
        arrVehicles.sort((a, b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1);

        for(i in aBuildings) {
            var e = aBuildings[i];

            if(e.leitstelle_building_id && !dispatchCenter.includes(aBuildings.filter((obj) => obj.id == e.leitstelle_building_id)[0].caption)) {
                dispatchCenter.push(aBuildings.filter((obj) => obj.id == e.leitstelle_building_id)[0].caption);
            }
        }
        dispatchCenter.sort((a, b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1);

        if(frSettings.aaoId[lang]) {
            $("#available_aao_" + frSettings.aaoId[lang])
                .parent()
                .after(`<button type="button" class="btn btn-success btn-xs" data-toggle="modal" data-target="#frModal" style="height:24px">
                        <div class="glyphicon glyphicon-cog" style="color:LightSteelBlue"></div>
                        </button>
                        <div class="modal fade" id="frModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                        <div class="modal-content">
                        <div class="modal-header">
                        <h3 class="modal-title" id="frModalLabel">${lang == "de_DE" ? "Einstellungen" : "Settings"}</h3>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                        </button>
                        </div>
                        <div class="modal-body" id="frModalBody">
                        <label for="frSelectVehicles">${lang == "de_DE" ? "Fahrzeugtypen (Mehrfachauswahl mit Strg + Klick)" : "vehicle-types (multiple-choice with Strg + click)"}</label>
                        <select multiple class="form-control" id="frSelectVehicles" style="height:20em;width:40em"></select>
                        <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="frCbxUseLst" ${dispatchSetup.useIt ? "checked" : ""}>
                        <label class="form-check-label" for="frCbxUseLst" style="margin-top:2em">${lang == "de_DE" ? "nur Fahrzeuge bestimmter Leitstellen wählen" : "only use specific dispatchcenter"}</label>
                        </div>
                        <label for="frSelectDispatch">${lang == "de_DE" ? "Leitstellen (Mehrfachauswahl mit Strg + Klick)" : "dispatchcenter (multiple-choice with Strg + click)"}</label>
                        <select multiple class="form-control" id="frSelectDispatch" style="height:10em;width:40em"></select>
                        </div>
                        <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-dismiss="modal">${lang == "de_DE" ? "Schließen" : "close"}</button>
                        <button type="button" class="btn btn-success" id="frSavePreferences">${lang == "de_DE" ? "Speichern" : "save"}</button>
                        </div>
                        </div>
                        </div>
                        </div>`);
        }

        for(i in arrVehicles) {
            $("#frSelectVehicles").append(`<option>${arrVehicles[i]}</option>`);
        }
        for(i in dispatchCenter) {
            $("#frSelectDispatch").append(`<option>${dispatchCenter[i]}</option>`);
        }

        $("#frSelectVehicles").val(mapVehicles(frSettings.vehicleTypes[lang], "name"));
        $("#frSelectDispatch").val(mapDispatchCenter(dispatchSetup.dispatchId, "name"));
    }

    if(window.location.pathname.includes("buildings") && window.location.pathname.includes("edit")) {
        $(".building_leitstelle_building_id")
            .after(`<div class="form-check">
                      <input type="checkbox" class="form-check-input" id="frCbxBuildingId" ${$.inArray(+window.location.pathname.replace(/\D+/g,""), dispatchSetup.additionalBuildings) > -1 ? "checked" : ""}>
                      <label class="form-check-label" for="frCbxBuildingId">${lang == "de_DE" ? "Wachen-ID im First Responder berücksichtigen" : "use this building id for First Responder"}</label>
                    </div>`);
    }

    $("body").on("click", "#frSaveAaoId", function() {
        if($("#frSaveAaoId")[0].checked) {
            frSettings.aaoId[lang] = window.location.pathname.replace(/\D+/g,"");
        } else {
            delete frSettings.aaoId[lang];
        }
        localStorage.firstResponder = JSON.stringify(frSettings);
    });

    $("body").on("click", "#frCbxBuildingId", function() {
        var buildingId = +window.location.pathname.replace(/\D+/g,"")
        if($("#frCbxBuildingId")[0].checked) {
            dispatchSetup.additionalBuildings.push(buildingId);
        } else {
            dispatchSetup.additionalBuildings.splice($.inArray(buildingId, dispatchSetup.additionalBuildings), 1);
            if(dispatchSetup.dispatchId.includes(buildingId)) {
                dispatchSetup.dispatchId.splice($.inArray(buildingId, dispatchSetup.dispatchId), 1);
            }
        }
        localStorage.fr_dispatchSetup = JSON.stringify(dispatchSetup);
    });

    $("body").on("click", "#frSavePreferences", function() {
        frSettings.vehicleTypes[lang] = mapVehicles($("#frSelectVehicles").val(), "type");
        dispatchSetup.dispatchId = mapDispatchCenter($("#frSelectDispatch").val(), "id");
        dispatchSetup.useIt = $("#frCbxUseLst")[0].checked;
        localStorage.fr_dispatchSetup = JSON.stringify(dispatchSetup);
        localStorage.firstResponder = JSON.stringify(frSettings);
        $("#frSavePreferences").addClass("hidden");

        if(lang == "de_DE") {
            $("#frModalBody").html("<h3><center>Die Einstellungen wurden gespeichert.</center></h5>");
        } else {
            $("#frModalBody").html("<h3><center>Settings successfully saved.</center></h5>");
        }
    });

    $("#aao_" + frSettings.aaoId[lang]).click(function() {
        $(".vehicle_checkbox").each(function() {
            var vType = +$(this).attr("vehicle_type_id");
            var vId = $(this).attr("value");
            var lstId = +$(this).attr("building_id").split("_")[1];
            var buId = +$(this).attr("building_id").split("_")[0];

            if(frSettings.vehicleTypes[lang].includes(vType) && !$("#vehicle_checkbox_"+vId)[0].checked && !$("#vehicle_checkbox_"+vId)[0].disabled &&
               (dispatchSetup.usit === false || dispatchSetup.dispatchId.includes(lstId) || dispatchSetup.additionalBuildings.includes(buId))) {
                $("#vehicle_checkbox_"+vId).click();
                return false;
            }
        });
    });

})();
