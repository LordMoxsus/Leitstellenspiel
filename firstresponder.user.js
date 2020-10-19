// ==UserScript==
// @name         FirstResponder (Original by JuMaHo)
// @version      1.1.0
// @description  wählt das nächstgelegene FirstResponder-Fahrzeug aus
// @author       DrTraxx
// @match        *://www.leitstellenspiel.de/missions/*
// @match        *://www.leitstellenspiel.de/aaos/*/edit
// @match        *://www.missionchief.co.uk/missions/*
// @match        *://www.missionchief.co.uk/aaos/*/edit
// @grant        none
// ==/UserScript==
/* global $ */

(async function() {
    'use strict';

    var aVehicleTypesNew = [];
    var vehicleTypes = [];
    var aaoId = 0;

    if(I18n.locale == "de_DE") {
        if(!localStorage.aVehicleTypesNew || JSON.parse(localStorage.aVehicleTypesNew).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) {
            await $.getJSON("https://drtraxx.github.io/vehicletypes.json").done(data => localStorage.setItem('aVehicleTypesNew', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );
        }
        aVehicleTypesNew = JSON.parse(localStorage.aVehicleTypesNew).value;
    }
    if(I18n.locale == "en_GB") {
        if(!localStorage.aVehicleTypesUk || JSON.parse(localStorage.aVehicleTypesUk).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) {
            await $.getJSON("https://lss-manager.de/api/cars.php?lang=en_GB").done(data => localStorage.setItem('aVehicleTypesUk', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );
        }
        aVehicleTypesNew = JSON.parse(localStorage.aVehicleTypesUk).value;
    }

    function mapVehicles(arrClasses, trigger) {
        var returnValue = [];
        if(trigger == "type") {
            returnValue = $.map(arrClasses, function(item) {
                return aVehicleTypesNew.filter((obj) => obj.name == item)[0].id;
            });
        } else if(trigger == "name") {
            returnValue = $.map(arrClasses, function(item) {
                return aVehicleTypesNew.filter((obj) => obj.id == item)[0].name;
            });
        }
        return returnValue;
    }

    if(window.location.pathname.includes("aaos") && window.location.pathname.includes("edit")) {
        if(I18n.locale == "de_DE") $("h1").append(`<a class="btn btn-info" id="frSaveAaoId" style="margin-left:2em">AAO-ID speichern</a>`);
        if(I18n.locale == "en_GB") $("h1").append(`<a class="btn btn-info" id="frSaveAaoId" style="margin-left:2em">save AAO-ID</a>`);
    }

    if(window.location.pathname.includes("missions")) {
        var arrVehicles = [];

        for(var i in aVehicleTypesNew) {
            arrVehicles.push(aVehicleTypesNew[i].name);
        }
        arrVehicles.sort((a, b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1);

        if(I18n.locale == "de_DE" && localStorage.fr_aaoId) {
            if(localStorage.fr_vehicleTypes) vehicleTypes = JSON.parse(localStorage.fr_vehicleTypes);
            aaoId = +localStorage.fr_aaoId;
            $("#available_aao_" + aaoId)
                .parent()
                .after(`<button type="button" class="btn btn-success btn-xs" data-toggle="modal" data-target="#frModal" style="height:24px">
                        <div class="glyphicon glyphicon-cog" style="color:LightSteelBlue"></div>
                        </button>
                        <div class="modal fade" id="frModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                        <div class="modal-content">
                        <div class="modal-header">
                        <h5 class="modal-title" id="frModalLabel">Einstellungen</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                        </button>
                        </div>
                        <div class="modal-body" id="frModalBody">
                        <label for="frSelectVehicles">Fahrzeugtypen (Mehrfachauswahl mit Strg + Klick)</label>
                        <select multiple class="form-control" id="frSelectVehicles" style="height:20em;width:40em"></select>
                        </div>
                        <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-dismiss="modal">Schließen</button>
                        <button type="button" class="btn btn-success" id="frSavePreferences">Speichern</button>
                        </div>
                        </div>
                        </div>
                        </div>`);
        }
        if(I18n.locale == "en_GB" && localStorage.fr_aaoIdUk) {
            if(localStorage.fr_vehicleTypesUk) vehicleTypes = JSON.parse(localStorage.fr_vehicleTypesUk);
            aaoId = +localStorage.fr_aaoIdUk;
            $("#available_aao_" + aaoId)
                .parent()
                .after(`<button type="button" class="btn btn-success btn-xs" data-toggle="modal" data-target="#frModal" style="height:24px">
                        <div class="glyphicon glyphicon-cog" style="color:LightSteelBlue"></div>
                        </button>
                        <div class="modal fade" id="frModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                        <div class="modal-content">
                        <div class="modal-header">
                        <h5 class="modal-title" id="frModalLabel">Settings</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                        </button>
                        </div>
                        <div class="modal-body" id="frModalBody">
                        <label for="frSelectVehicles">vehicle-types (multiple-choice with Strg + click)</label>
                        <select multiple class="form-control" id="frSelectVehicles" style="height:20em;width:20em"></select>
                        </div>
                        <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-dismiss="modal">close</button>
                        <button type="button" class="btn btn-success" id="frSavePreferences">save</button>
                        </div>
                        </div>
                        </div>
                        </div>`);
        }

        for(i in arrVehicles) {
            $("#frSelectVehicles").append(`<option>${arrVehicles[i]}</option>`);
        }

        $("#frSelectVehicles").val(mapVehicles(vehicleTypes, "name"));
    }

    $("body").on("click", "#frSaveAaoId", function() {
        if(I18n.locale == "de_DE") {
            localStorage.fr_aaoId = +window.location.pathname.replace(/\D+/g,"");
            $("#frSaveAaoId").css({"display":"none"});
            alert("AAO-ID gespeichert.");
        }
        if(I18n.locale == "en_GB") {
            localStorage.fr_aaoIdUk = +window.location.pathname.replace(/\D+/g,"");
            $("#frSaveAaoId").css({"display":"none"});
            alert("AAO-ID successfully saved.");
        }
    });

    $("body").on("click", "#frSavePreferences", function() {
        vehicleTypes = mapVehicles($("#frSelectVehicles").val(), "type");
        if(I18n.locale == "de_DE") {
            localStorage.fr_vehicleTypes = JSON.stringify(vehicleTypes);
            $("#frModalBody").html("<h3><center>Die Einstellungen wurden gespeichert.</center></h5>");
        }
        if(I18n.locale == "en_GB") {
            localStorage.fr_vehicleTypesUk = JSON.stringify(vehicleTypes);
            $("#frModalBody").html("<h3><center>Settings successfully saved.</center></h5>");
        }
        $("#frSavePreferences").css({"display":"none"});
    });

    $("#aao_"+aaoId).click(function() {
        $(".vehicle_checkbox").each(function() {
            var vType = $(this).attr("vehicle_type_id") ? +$(this).attr("vehicle_type_id") : 0;
            var vId = +$(this).attr("value");

            if(vehicleTypes.includes(vType)) {
                if(!$("#vehicle_checkbox_"+vId)[0].checked) {
                    if(!$("#vehicle_checkbox_"+vId)[0].disabled) {
                        $("#vehicle_checkbox_"+vId).click();
                        return false;
                    }
                }
            }
        });
    });

})();
