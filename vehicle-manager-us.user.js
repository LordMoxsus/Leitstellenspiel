// ==UserScript==
// @name         Vehicle-Manager-us
// @version      1.2.0
// @author       DrTraxx
// @include      *://www.missionchief.com/
// @include      *://missionchief.com/
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    $('#radio_panel_heading').after(`<a id="vehicleManagementUs" data-toggle="modal" data-target="#tableStatusUs" ><button type="button" class="btn btn-default btn-xs">Vehicle-Manager</button></a>`);
    //$('#menu_profile').parent().before(`<li><a style="cursor: pointer" id="vehicleManagementUs" data-toggle="modal" data-target="#tableStatusUs" ><div class="glyphicon glyphicon-list-alt"></div></a></li>`);

    $("head").append(`<style>
.modal {
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
</style>`);

    $("body")
        .prepend(`<div class="modal fade"
                     id="tableStatusUs"
                     tabindex="-1"
                     role="dialog"
                     aria-labelledby="exampleModalLabel"
                     aria-hidden="true"
                >
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                             <div class="pull-left">
                              <h5>vehicle-manager</h5>
                             </div><br>
                             <button type="button"
                                        class="close"
                                        data-dismiss="modal"
                                        aria-label="Close"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button><br>
                              <div class="pull-left">
                               <button id="completeUs" class="building_list_fms building_list_fms_1">all vehicles</button>
                               <button id="fms1Us" class="building_list_fms building_list_fms_1">code 1</button>
                               <button id="fms2Us" class="building_list_fms building_list_fms_2">code 2</button>
                               <button id="fms3Us" class="building_list_fms building_list_fms_3">code 3</button>
                               <button id="fms4Us" class="building_list_fms building_list_fms_4">code 4</button>
                               <button id="fms5Us" class="building_list_fms building_list_fms_5">code 5</button>
                               <button id="fms6Us" class="building_list_fms building_list_fms_6">code 6</button>
                               <button id="fms7Us" class="building_list_fms building_list_fms_7">code 7</button>
                               <button id="fms9Us" class="building_list_fms building_list_fms_9">code 9</button>
                             </div><br><br>
                             <div class="pull-left">
                              <select id="sortByUs" class="custom-select">
                               <option selected>select sort</option>
                              </select><br>
                              <select id="filterTypeUs" class="custom-select">
                               <option selected>all types</option>
                              </select><br>
                              <select id="filterOwnClassUs" class="custom-select">
                               <option selected value="0">show own class</option>
                               <option value="1">hide own class</option>
                               <option value="2">only show own class</option>
                              </select>
                             </div>
                             <div class="pull-right">
                              <a id="filterFwUs" class="label label-success">fire station</a>
                              <a id="filterRdUs" class="label label-success">ambulance station</a>
                              <a id="filterPolUs" class="label label-success">police station</a>
                              <a id="filterHeliUs" class="label label-success">helicopter</a>
                              <a id="filterAirUs" class="label label-success">planes</a>
                              <a id="filterBoatUs" class="label label-success">boats</a>
                             </div><br><br>
                                <h5 class="modal-title" id="tableStatusLabelUs">
                                </h5>
                            </div>
                            <div class="modal-body" id="tableStatusBodyUs"></div>
                            <div class="modal-footer">
                             <div id="counterUs" class="pull-left"></div>
                                v ${GM_info.script.version}
                                <button type="button"
                                        id="tableStatusCloseButtonUs"
                                        class="btn btn-danger"
                                        data-dismiss="modal"
                                >
                                    close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`);

    var sortOptions = ['radio','name-up','name-down','building-up','building-down','type-up','type-down'];
    for(var i = 0; i < sortOptions.length; i++){
        $('#sortByUs').append(`<option value="${sortOptions[i]}">${sortOptions[i]}</option>`);
    }

    var filterFwVehicles = true;
    var filterRdVehicles = true;
    var filterPolVehicles = true;
    var filterHeliVehicles = true;
    var filterAirplanes = true;
    var filterBoats = true;
    var filterVehicleType = parseInt($('#filterTypeUs').val());
    var filterOwnClassType = parseInt($('#filterOwnClassUs').val());
    var buildingsCount = 0;
    var vehiclesCount = 0;
    var statusCount = 0;
    var vehicleDatabase = {};
    var getBuildingTypeId = {};
    var getBuildingName = {};
    var vehicleDatabaseFms = {};

    $.getJSON('https://lss-manager.de/api/cars.php?lang=en_US').done(function(data){
        vehicleDatabase = data;
    });

    setTimeout(function(){
        var dropdownDatabase = [];
        $.each(vehicleDatabase, function(key, item){
            dropdownDatabase.push({"typeId": key, "name": item.name});
        });
        //setTimeout(function(){
            dropdownDatabase.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1);
            for(let i = 0; i < dropdownDatabase.length; i++){
                $('#filterTypeUs').append(`<option value="${dropdownDatabase[i].typeId}">${dropdownDatabase[i].name}</option>`);
            }
        //}, 2000);
    }, 2000);

    function loadApi(){

        $.getJSON('/api/buildings').done(function(data){
            buildingsCount = data.length;
            $.each(data, function(key, item){
                getBuildingTypeId[item.id] = item.building_type;
                getBuildingName[item.id] = item.caption;
            });
        });

        $.getJSON('/api/vehicles').done(function(data){
            vehiclesCount = data.length;
            vehicleDatabaseFms = data;
        });
    }

    function createTable(statusIndex) {

        var tableDatabase = [];

        $.each(vehicleDatabaseFms, function(key, item){
            var pushContent = {"status": item.fms_real, "id": item.id, "name": item.caption, "typeId": item.vehicle_type, "buildingId": item.building_id, "ownClass": item.vehicle_type_caption};
            if(filterOwnClassType == 0){
                if(isNaN(filterVehicleType)){
                    if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                    else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
                }
                else if(filterVehicleType == item.vehicle_type){
                    if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                    else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
                }
            }
            else if(filterOwnClassType == 1 && !item.vehicle_type_caption){
                if(isNaN(filterVehicleType)){
                    if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                    else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
                }
                else if(filterVehicleType == item.vehicle_type){
                    if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                    else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
                }
            }
            else if(filterOwnClassType == 2 && item.vehicle_type_caption){
                if(isNaN(filterVehicleType)){
                    if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                    else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
                }
                else if(filterVehicleType == item.vehicle_type){
                    if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                    else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
                }
            }
        });

        if(!filterFwVehicles){
            for(var fw = tableDatabase.length - 1; fw >= 0; fw--){
                if(getBuildingTypeId[tableDatabase[fw].buildingId] == "0" || getBuildingTypeId[tableDatabase[fw].buildingId] == "13") tableDatabase.splice(fw,1);
            }
        }
        if(!filterRdVehicles){
            for(var rd = tableDatabase.length - 1; rd >= 0; rd--){
                if(getBuildingTypeId[tableDatabase[rd].buildingId] == "3" || getBuildingTypeId[tableDatabase[rd].buildingId] == "14" || getBuildingTypeId[tableDatabase[rd].buildingId] == "16") tableDatabase.splice(rd,1);
            }
        }
        if(!filterPolVehicles){
            for(var pol = tableDatabase.length - 1; pol >= 0; pol--){
                if(getBuildingTypeId[tableDatabase[pol].buildingId] == "5" || getBuildingTypeId[tableDatabase[pol].buildingId] == "15") tableDatabase.splice(pol,1);
            }
        }
        if(!filterHeliVehicles){
            for(var heli = tableDatabase.length - 1; heli >= 0; heli--){
                if(getBuildingTypeId[tableDatabase[heli].buildingId] == "6" || getBuildingTypeId[tableDatabase[heli].buildingId] == "8") tableDatabase.splice(heli,1);
            }
        }
        if(!filterAirplanes){
            for(var air = tableDatabase.length - 1; air >= 0; air--){
                if(getBuildingTypeId[tableDatabase[air].buildingId] == "17") tableDatabase.splice(air,1);
            }
        }
        if(!filterBoats){
            for(var boat = tableDatabase.length - 1; boat >= 0; boat--){
                if(getBuildingTypeId[tableDatabase[boat].buildingId] == "11" || getBuildingTypeId[tableDatabase[boat].buildingId] == "12") tableDatabase.splice(boat,1);
            }
        }

        //setTimeout(function(){
            switch($('#sortByUs').val()){
                case "":
                    break;
                case "radio":
                    tableDatabase.sort((a, b) => a.status > b.status ? 1 : -1);
                    break;
                case "name-up":
                    tableDatabase.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1);
                    break;
                case "name-down":
                    tableDatabase.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? -1 : 1);
                    break;
                case "building-up":
                    tableDatabase.sort((a, b) => getBuildingName[a.buildingId].toUpperCase() > getBuildingName[b.buildingId].toUpperCase() ? 1 : -1);
                    break;
                case "building-down":
                    tableDatabase.sort((a, b) => getBuildingName[a.buildingId].toUpperCase() > getBuildingName[b.buildingId].toUpperCase() ? -1 : 1);
                    break;
                case "type-up":
                    tableDatabase.sort((a, b) => (a.ownClass ? a.ownClass.toUpperCase() : vehicleDatabase[a.typeId].name.toUpperCase()) > (b.ownClass ? b.ownClass.toUpperCase() : vehicleDatabase[b.typeId].name.toUpperCase()) ? 1 : -1);
                    break;
                case "type-down":
                    tableDatabase.sort((a, b) => (a.ownClass ? a.ownClass.toUpperCase() : vehicleDatabase[a.typeId].name.toUpperCase()) > (b.ownClass ? b.ownClass.toUpperCase() : vehicleDatabase[b.typeId].name.toUpperCase()) ? -1 : 1);
                    break;
            }
            let intoLabel =
                `<div class="pull-right">radio ${statusIndex}: ${tableDatabase.length.toLocaleString()} vehicles</div>`;
            let intoTable =
                `<table class="table">
                 <thead>
                 <tr>
                 <th class="col-1">radio</th>
                 <th class="col">name</th>
                 <th class="col">vehicle type</th>
                 <th class="col"> </th>
                 <th class="col">building</th>
                 </tr>
                 </thead>
                 <tbody>`;

            for(let i = 0; i < tableDatabase.length; i++){
                intoTable +=
                    `<tr>
                     <td class="col-1"><span style="cursor: pointer" class="building_list_fms building_list_fms_${tableDatabase[i].status}" id="tableFms_${tableDatabase[i].id}">${tableDatabase[i].status}</span>
                     <td class="col"><a class="lightbox-open" href="/vehicles/${tableDatabase[i].id}">${tableDatabase[i].name}</a></td>
                     <td class="col">${!tableDatabase[i].ownClass ? vehicleDatabase[tableDatabase[i].typeId].name : tableDatabase[i].ownClass}</td>
                     <td class="col"><a class="lightbox-open" href="/vehicles/${tableDatabase[i].id}/zuweisung"><button type="button" class="btn btn-default btn-xs">assign personnel</button></a>
                      <a class="lightbox-open" href="/vehicles/${tableDatabase[i].id}/edit"><button type="button" class="btn btn-default btn-xs"><div class="glyphicon glyphicon-pencil"></div></button></a></td>
                     <td class="col"><a class="lightbox-open" href="/buildings/${tableDatabase[i].buildingId}">${getBuildingName[tableDatabase[i].buildingId]}</a></td>
                     </tr>`;
            }

            intoTable += `</tbody>
                          </table>`;

            $('#tableStatusLabelUs').html(intoLabel);
            $('#tableStatusBodyUs').html(intoTable);
            $('#counterUs').html(`<p>buildings: ${buildingsCount.toLocaleString()}</p><br><p>vehicles: ${vehiclesCount.toLocaleString()}</p>`);
            tableDatabase.length = 0;
        //}, 2000);
    }

    $("body").on("click", "#vehicleManagementUs", function(){
        $('#tableStatusLabelUs').html('');
        $('#tableStatusBodyUs').html('');
        statusCount = 0;
        getBuildingTypeId.length = 0;
        getBuildingName.length = 0;
        vehicleDatabaseFms.length = 0;
        loadApi()
    });

    $("body").on("click", "#sortByUs", function(){
        if(statusCount != 0) createTable(statusCount);
        else {
            statusCount = "1 to 9";
            createTable(statusCount);
        }
    });

    $("body").on("click", "#tableStatusBodyUs span", function(){
        if($(this)[0].className == "building_list_fms building_list_fms_6"){
            $.get('/vehicles/' + $(this)[0].id.replace('tableFms_','') + '/set_fms/2');
            $(this).toggleClass("building_list_fms_6 building_list_fms_2");
            $(this).text("2");
        } else if($(this)[0].className == "building_list_fms building_list_fms_2"){
            $.get('/vehicles/' + $(this)[0].id.replace('tableFms_','') + '/set_fms/6');
            $(this).toggleClass("building_list_fms_6 building_list_fms_2");
            $(this).text("6");
        }
    });

    $("body").on("click", "#filterTypeUs", function(){
        if(statusCount == 0) filterVehicleType = parseInt($('#filterTypeUs').val());
        else {
            filterVehicleType = parseInt($('#filterTypeUs').val());
            createTable(statusCount);
        }
    });

    $("body").on("click", "#filterOwnClassUs", function(){
        if(statusCount == 0) filterOwnClassType = parseInt($('#filterOwnClassUs').val());
        else {
            filterOwnClassType = parseInt($('#filterOwnClassUs').val());
            createTable(statusCount);
        }
    });

    $("body").on("click", "#filterFwUs", function(){
        if(filterFwVehicles) {
            if(statusCount != 0){
                filterFwVehicles = false;
                createTable(statusCount);
            }
            else filterFwVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterFwVehicles = true;
                createTable(statusCount);
            }
            else filterFwVehicles = true;
        }

        $('#filterFwUs').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterRdUs", function(){
        if(filterRdVehicles) {
            if(statusCount != 0){
                filterRdVehicles = false;
                createTable(statusCount);
            }
            else filterRdVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterRdVehicles = true;
                createTable(statusCount);
            }
            else filterRdVehicles = true;
        }

        $('#filterRdUs').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterPolUs", function(){
        if(filterPolVehicles) {
            if(statusCount != 0){
                filterPolVehicles = false;
                createTable(statusCount);
            }
            else filterPolVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterPolVehicles = true;
                createTable(statusCount);
            }
            else filterPolVehicles = true;
        }

        $('#filterPolUs').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterHeliUs", function(){
        if(filterHeliVehicles) {
            if(statusCount != 0){
                filterHeliVehicles = false;
                createTable(statusCount);
            }
            else filterHeliVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterHeliVehicles = true;
                createTable(statusCount);
            }
            else filterHeliVehicles = true;
        }

        $('#filterHeliUs').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterAirUs", function(){
        if(filterAirplanes) {
            if(statusCount != 0){
                filterAirplanes = false;
                createTable(statusCount);
            }
            else filterAirplanes = false;
        }
        else {
            if(statusCount != 0) {
                filterAirplanes = true;
                createTable(statusCount);
            }
            else filterAirplanes = true;
        }

        $('#filterAirUs').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterBoatUs", function(){
        if(filterBoats) {
            if(statusCount != 0){
                filterBoats = false;
                createTable(statusCount);
            }
            else filterBoats = false;
        }
        else {
            if(statusCount != 0) {
                filterBoats = true;
                createTable(statusCount);
            }
            else filterBoats = true;
        }

        $('#filterBoatUs').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#completeUs", function(){
        statusCount = "1 to 9";
        createTable(statusCount);
    });

    $("body").on("click", "#fms1Us", function(){
        statusCount = 1;
        createTable(statusCount);
    });

    $("body").on("click", "#fms2Us", function(){
        statusCount = 2;
        createTable(statusCount);
    });

    $("body").on("click", "#fms3Us", function(){
        statusCount = 3;
        createTable(statusCount);
    });

    $("body").on("click", "#fms4Us", function(){
        statusCount = 4;
        createTable(statusCount);
    });

    $("body").on("click", "#fms5Us", function(){
        statusCount = 5;
        createTable(statusCount);
    });

    $("body").on("click", "#fms6Us", function(){
        statusCount = 6;
        createTable(statusCount);
    });

    $("body").on("click", "#fms7Us", function(){
        statusCount = 7;
        createTable(statusCount);
    });

    $("body").on("click", "#fms9Us", function(){
        statusCount = 9;
        createTable(statusCount);
    });

})();
