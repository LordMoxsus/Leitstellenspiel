// ==UserScript==
// @name         FirstResponder (Original by JuMaHo) - Version UK
// @version      1.0.2
// @description  wählt das nächstgelegene FirstResponder-Fahrzeug aus
// @author       DrTraxx
// @match        *://www.missionchief.co.uk/missions/*
// @match        *://www.missionchief.co.uk/aaos/*/edit
// @grant        none
// ==/UserScript==
/* global $ */

(async function() {
    'use strict';

    if(!localStorage.aVehicleTypesUk || JSON.parse(localStorage.aVehicleTypesUk).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) {
        await $.getJSON("https://lss-manager.de/api/cars.php?lang=en_GB").done(data => localStorage.setItem('aVehicleTypesUk', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );
    }

    var aVehicleTypesUk = JSON.parse(localStorage.aVehicleTypesUk).value;
    var vehicleTypes = localStorage.fr_vehicleTypesUk ? JSON.parse(localStorage.fr_vehicleTypesUk) : [];
    var aaoId = localStorage.fr_aaoIdUk ? +localStorage.fr_aaoIdUk : 0;

    function mapVehicles(arrClasses, trigger) {
        var returnValue = [];
        if(trigger == "type") {
            returnValue = $.map(arrClasses, function(item) {
                return aVehicleTypesUk.filter((obj) => obj.name == item)[0].id;
            });
        } else if(trigger == "name") {
            returnValue = $.map(arrClasses, function(item) {
                return aVehicleTypesUk.filter((obj) => obj.id == item)[0].name;
            });
        }
        return returnValue;
    }

    if(window.location.pathname.includes("aaos") && window.location.pathname.includes("edit") && !localStorage.fr_aaoIdUk) {
        $("h1").append(`<a class="btn btn-info" id="frSaveAaoIdUk" style="margin-left:2em">save AAO-ID</a>`);
    }

    if(window.location.pathname.includes("missions") && localStorage.fr_aaoIdUk) {
        var arrVehicles = [];

        for(var i in aVehicleTypesUk) {
            arrVehicles.push(aVehicleTypesUk[i].name);
        }
        arrVehicles.sort((a, b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1);

        $("#available_aao_" + aaoId)
            .parent()
            .after(`<button type="button" class="btn btn-success btn-xs" data-toggle="modal" data-target="#frModalUk" style="height:24px">
                      <div class="glyphicon glyphicon-cog" style="color:LightSteelBlue"></div>
                    </button>
                    <div class="modal fade" id="frModalUk" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                      <div class="modal-dialog" role="document">
                        <div class="modal-content">
                          <div class="modal-header">
                            <h5 class="modal-title" id="frModalLabelUk">Einstellungen</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                          <div class="modal-body" id="frModalBodyUk">
                            <label for="frSelectVehicles">vehicle-types (multiple choice with Strg + click)</label>
                            <select multiple class="form-control" id="frSelectVehiclesUk" style="height:20em;width:20em"></select>
                          </div>
                          <div class="modal-footer">
                            <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-success" id="frSavePreferencesUk">Save</button>
                          </div>
                        </div>
                      </div>
                    </div>`);

        for(i in arrVehicles) {
            $("#frSelectVehiclesUk").append(`<option>${arrVehicles[i]}</option>`);
        }

        $("#frSelectVehiclesUk").val(mapVehicles(vehicleTypes, "name"));
    }

    $("body").on("click", "#frSaveAaoIdUk", function() {
        localStorage.fr_aaoIdUk = +window.location.pathname.replace(/\D+/g,"");
        $("#frSaveAaoId").css({"display":"none"});
        alert("AAO-ID saved successfully.");
    });

    $("body").on("click", "#frSavePreferencesUk", function() {
        vehicleTypes = mapVehicles($("#frSelectVehicles").val(), "type");
        localStorage.fr_vehicleTypesUk = JSON.stringify(vehicleTypes);

        $("#frModalBodyUk").html("<h3><center>Settings saved successfully.</center></h5>");
        $("#frSavePreferencesUk").css({"display":"none"});
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
