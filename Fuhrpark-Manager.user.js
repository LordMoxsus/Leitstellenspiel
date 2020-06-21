// ==UserScript==
// @name         Fuhrpark-Manager
// @version      1.2.0
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/
// @include      *://leitstellenspiel.de/
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    $('#radio_panel_heading').after(`<a id="vehicleManagement" data-toggle="modal" data-target="#tableStatus" ><button type="button" class="btn btn-default btn-xs">Fuhrpark-Manager</button></a>`);
    //$('#menu_profile').parent().before(`<li><a style="cursor: pointer" id="vehicleManagement" data-toggle="modal" data-target="#tableStatus" ><div class="glyphicon glyphicon-list-alt"></div></a></li>`);

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
                     id="tableStatus"
                     tabindex="-1"
                     role="dialog"
                     aria-labelledby="exampleModalLabel"
                     aria-hidden="true"
                >
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                             <div class="pull-left">
                              <h5>Fuhrpark-Manager</h5>
                             </div><br>
                             <button type="button"
                                        class="close"
                                        data-dismiss="modal"
                                        aria-label="Close"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button><br>
                              <div class="pull-left">
                               <button id="complete" class="building_list_fms building_list_fms_1">alle Fahrzeuge</button>
                               <button id="fms1" class="building_list_fms building_list_fms_1">Status 1</button>
                               <button id="fms2" class="building_list_fms building_list_fms_2">Status 2</button>
                               <button id="fms3" class="building_list_fms building_list_fms_3">Status 3</button>
                               <button id="fms4" class="building_list_fms building_list_fms_4">Status 4</button>
                               <button id="fms5" class="building_list_fms building_list_fms_5">Status 5</button>
                               <button id="fms6" class="building_list_fms building_list_fms_6">Status 6</button>
                               <button id="fms7" class="building_list_fms building_list_fms_7">Status 7</button>
                               <button id="fms9" class="building_list_fms building_list_fms_9">Status 9</button>
                             </div><br><br>
                             <div class="pull-left">
                              <select id="sortBy" class="custom-select">
                               <option selected>Sortierung wählen</option>
                              </select><br>
                              <select id="filterType" class="custom-select">
                               <option selected>alle Typen</option>
                              </select><br>
                              <select id="filterOwnClass" class="custom-select">
                               <option selected value="0">eigene Klassen anzeigen</option>
                               <option value="1">eine Klassen ausblenden</option>
                               <option value="2">nur eigene Klassen anzeigen</option>
                              </select>
                             </div>
                             <div class="pull-right">
                              <a id="filterFw" class="label label-success">Feuerwehr</a>
                              <a id="filterRd" class="label label-success">Rettungsdienst</a>
                              <a id="filterThw" class="label label-success">THW</a>
                              <a id="filterPol" class="label label-success">Polizei</a>
                              <a id="filterWr" class="label label-success">Wasserrettung</a>
                              <a id="filterHeli" class="label label-success">Hubschrauber</a>
                              <a id="filterBp" class="label label-success">BePo/Pol-Sonder</a>
                              <a id="filterSeg" class="label label-success">SEG/RHS</a>
                             </div><br><br>
                                <h5 class="modal-title" id="tableStatusLabel">
                                </h5>
                            </div>
                            <div class="modal-body" id="tableStatusBody"></div>
                            <div class="modal-footer">
                             <div id="counter" class="pull-left"></div>
                                v ${GM_info.script.version}
                                <button type="button"
                                        id="tableStatusCloseButton"
                                        class="btn btn-danger"
                                        data-dismiss="modal"
                                >
                                    Schließen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`);

    var sortOptions = ['Status','Name-aufsteigend','Name-absteigend','Wache-aufsteigend','Wache-absteigend','Typ-aufsteigend','Typ-absteigend'];
    for(var i = 0; i < sortOptions.length; i++){
        $('#sortBy').append(`<option value="${sortOptions[i]}">${sortOptions[i]}</option>`);
    }

    var filterFwVehicles = true; //buildingTypeIds: 0, 18
    var filterRdVehicles = true; //buildingTypeIds: 2, 20
    var filterThwVehicles = true; //buildingTypeIds: 9
    var filterPolVehicles = true; //buildingTypeIds: 6, 19
    var filterWrVehicles = true; //buildingTypeIds: 15
    var filterHeliVehicles = true; //buildingTypeIds: 5, 13
    var filterBpVehicles = true; //buildingTypeIds: 11, 17
    var filterSegVehicles = true; //buildingTypeIds: 12, 21
    var filterVehicleType = parseInt($('#filterType').val());
    var filterOwnClassType = parseInt($('#filterOwnClass').val());
    var buildingsCount = 0;
    var vehiclesCount = 0;
    var statusCount = 0;
    var vehicleDatabase = {};
    var getBuildingTypeId = {};
    var getBuildingName = {};
    var vehicleDatabaseFms = {};

    $.getJSON('https://lss-manager.de/api/cars.php?lang=de_DE').done(function(data){
        var mapObj = {"ï¿½": "Ö", "Ã¶": "ö", "Ã¼": "ü", "Ã\u0096": "Ö"};
        $.each(data, (k,v) => {
            v.name = v.name.replace(new RegExp(Object.keys(mapObj).join("|"),"gi"), matched => mapObj[matched])
        });
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
                $('#filterType').append(`<option value="${dropdownDatabase[i].typeId}">${dropdownDatabase[i].name}</option>`);
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
                    else if((statusIndex == item.fms_real) ) tableDatabase.push(pushContent);
                }
            }
            else if(filterOwnClassType == 1 && !item.vehicle_type_caption){
                if(isNaN(filterVehicleType)){
                    if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                    else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
                }
                else if(filterVehicleType == item.vehicle_type){
                    if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                    else if((statusIndex == item.fms_real) ) tableDatabase.push(pushContent);
                }
            }
            else if(filterOwnClassType == 2 && item.vehicle_type_caption){
                if(isNaN(filterVehicleType)){
                    if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                    else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
                }
                else if(filterVehicleType == item.vehicle_type){
                    if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                    else if((statusIndex == item.fms_real) ) tableDatabase.push(pushContent);
                }
            }
        });

        if(!filterFwVehicles){
            for(var fw = tableDatabase.length - 1; fw >= 0; fw--){
                if(getBuildingTypeId[tableDatabase[fw].buildingId] == "0" || getBuildingTypeId[tableDatabase[fw].buildingId] == "18") tableDatabase.splice(fw,1);
            }
        }
        if(!filterRdVehicles){
            for(var rd = tableDatabase.length - 1; rd >= 0; rd--){
                if(getBuildingTypeId[tableDatabase[rd].buildingId] == "2" || getBuildingTypeId[tableDatabase[rd].buildingId] == "20") tableDatabase.splice(rd,1);
            }
        }
        if(!filterThwVehicles){
            for(var thw = tableDatabase.length - 1; thw >= 0; thw--){
                if(getBuildingTypeId[tableDatabase[thw].buildingId] == "9") tableDatabase.splice(thw,1);
            }
        }
        if(!filterPolVehicles){
            for(var pol = tableDatabase.length - 1; pol >= 0; pol--){
                if(getBuildingTypeId[tableDatabase[pol].buildingId] == "6" || getBuildingTypeId[tableDatabase[pol].buildingId] == "19") tableDatabase.splice(pol,1);
            }
        }
        if(!filterWrVehicles){
            for(var wr = tableDatabase.length - 1; wr >= 0; wr--){
                if(getBuildingTypeId[tableDatabase[wr].buildingId] == "15") tableDatabase.splice(wr,1);
            }
        }
        if(!filterHeliVehicles){
            for(var heli = tableDatabase.length - 1; heli >= 0; heli--){
                if(getBuildingTypeId[tableDatabase[heli].buildingId] == "5" || getBuildingTypeId[tableDatabase[heli].buildingId] == "13") tableDatabase.splice(heli,1);
            }
        }
        if(!filterBpVehicles){
            for(var bp = tableDatabase.length - 1; bp >= 0; bp--){
                if(getBuildingTypeId[tableDatabase[bp].buildingId] == "11" || getBuildingTypeId[tableDatabase[bp].buildingId] == "17") tableDatabase.splice(bp,1);
            }
        }
        if(!filterSegVehicles){
            for(var seg = tableDatabase.length - 1; seg >= 0; seg--){
                if(getBuildingTypeId[tableDatabase[seg].buildingId] == "12" || getBuildingTypeId[tableDatabase[seg].buildingId] == "21") tableDatabase.splice(seg,1);
            }
        }

        //setTimeout(function(){
            switch($('#sortBy').val()){
                case "":
                    break;
                case "Status":
                    tableDatabase.sort((a, b) => a.status > b.status ? 1 : -1);
                    break;
                case "Name-aufsteigend":
                    tableDatabase.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1);
                    break;
                case "Name-absteigend":
                    tableDatabase.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? -1 : 1);
                    break;
                case "Wache-aufsteigend":
                    tableDatabase.sort((a, b) => getBuildingName[a.buildingId].toUpperCase() > getBuildingName[b.buildingId].toUpperCase() ? 1 : -1);
                    break;
                case "Wache-absteigend":
                    tableDatabase.sort((a, b) => getBuildingName[a.buildingId].toUpperCase() > getBuildingName[b.buildingId].toUpperCase() ? -1 : 1);
                    break;
                case "Typ-aufsteigend":
                    tableDatabase.sort((a, b) => (a.ownClass ? a.ownClass.toUpperCase() : vehicleDatabase[a.typeId].name.toUpperCase()) > (b.ownClass ? b.ownClass.toUpperCase() : vehicleDatabase[b.typeId].name.toUpperCase()) ? 1 : -1);
                    break;
                case "Typ-absteigend":
                    tableDatabase.sort((a, b) => (a.ownClass ? a.ownClass.toUpperCase() : vehicleDatabase[a.typeId].name.toUpperCase()) > (b.ownClass ? b.ownClass.toUpperCase() : vehicleDatabase[b.typeId].name.toUpperCase()) ? -1 : 1);
                    break;
            }
            let intoLabel =
                `<div class="pull-right">Status ${statusIndex}: ${tableDatabase.length.toLocaleString()} Fahrzeuge</div>`;
            let intoTable =
                `<table class="table">
                 <thead>
                 <tr>
                 <th class="col-1">FMS</th>
                 <th class="col">Kennung</th>
                 <th class="col">Fahrzeugtyp</th>
                 <th class="col"> </th>
                 <th class="col">Wache</th>
                 </tr>
                 </thead>
                 <tbody>`;

            for(let i = 0; i < tableDatabase.length; i++){
                intoTable +=
                    `<tr>
                     <td class="col-1"><span style="cursor: pointer" class="building_list_fms building_list_fms_${tableDatabase[i].status}" id="tableFms_${tableDatabase[i].id}">${tableDatabase[i].status}</span>
                     <td class="col"><a class="lightbox-open" href="/vehicles/${tableDatabase[i].id}">${tableDatabase[i].name}</a></td>
                     <td class="col">${!tableDatabase[i].ownClass ? vehicleDatabase[tableDatabase[i].typeId].name : tableDatabase[i].ownClass}</td>
                     <td class="col"><a class="lightbox-open" href="/vehicles/${tableDatabase[i].id}/zuweisung"><button type="button" class="btn btn-default btn-xs">Personalzuweisung</button></a>
                      <a class="lightbox-open" href="/vehicles/${tableDatabase[i].id}/edit"><button type="button" class="btn btn-default btn-xs"><div class="glyphicon glyphicon-pencil"></div></button></a></td>
                     <td class="col"><a class="lightbox-open" href="/buildings/${tableDatabase[i].buildingId}">${getBuildingName[tableDatabase[i].buildingId]}</a></td>
                     </tr>`;
            }

            intoTable += `</tbody>
                          </table>`;

            $('#tableStatusLabel').html(intoLabel);
            $('#tableStatusBody').html(intoTable);
            $('#counter').html(`<p>Gebäude: ${buildingsCount.toLocaleString()}</p><br><p>Fahrzeuge: ${vehiclesCount.toLocaleString()}</p>`);
            tableDatabase.length = 0;
        //}, 2000);
    }

    $("body").on("click", "#vehicleManagement", function(){
        $('#tableStatusLabel').html('');
        $('#tableStatusBody').html('');
        statusCount = 0;
        getBuildingTypeId.length = 0;
        getBuildingName.length = 0;
        vehicleDatabaseFms.length = 0;
        loadApi()
    });

    $("body").on("click", "#sortBy", function(){
        if(statusCount != 0) createTable(statusCount);
        else {
            statusCount = "1 bis 9";
            createTable(statusCount);
        }
    });

    $("body").on("click", "#tableStatusBody span", function(){
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

    $("body").on("click", "#filterType", function(){
        if(statusCount == 0) filterVehicleType = parseInt($('#filterType').val());
        else {
            filterVehicleType = parseInt($('#filterType').val());
            createTable(statusCount);
        }
    });

    $("body").on("click", "#filterOwnClass", function(){
        if(statusCount == 0) filterOwnClassType = parseInt($('#filterOwnClass').val());
        else {
            filterOwnClassType = parseInt($('#filterOwnClass').val());
            createTable(statusCount);
        }
    });

    $("body").on("click", "#filterFw", function(){
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

        $('#filterFw').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterRd", function(){
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

        $('#filterRd').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterThw", function(){
        if(filterThwVehicles) {
            if(statusCount != 0){
                filterThwVehicles = false;
                createTable(statusCount);
            }
            else filterThwVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterThwVehicles = true;
                createTable(statusCount);
            }
            else filterThwVehicles = true;
        }

        $('#filterThw').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterPol", function(){
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

        $('#filterPol').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterWr", function(){
        if(filterWrVehicles) {
            if(statusCount != 0){
                filterWrVehicles = false;
                createTable(statusCount);
            }
            else filterWrVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterWrVehicles = true;
                createTable(statusCount);
            }
            else filterWrVehicles = true;
        }

        $('#filterWr').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterHeli", function(){
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

        $('#filterHeli').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterBp", function(){
        if(filterBpVehicles) {
            if(statusCount != 0){
                filterBpVehicles = false;
                createTable(statusCount);
            }
            else filterBpVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterBpVehicles = true;
                createTable(statusCount);
            }
            else filterBpVehicles = true;
        }

        $('#filterBp').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterSeg", function(){
        if(filterSegVehicles) {
            if(statusCount != 0){
                filterSegVehicles = false;
                createTable(statusCount);
            }
            else filterSegVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterSegVehicles = true;
                createTable(statusCount);
            }
            else filterSegVehicles = true;
        }

        $('#filterSeg').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#complete", function(){
        statusCount = "1 bis 9";
        createTable(statusCount);
    });

    $("body").on("click", "#fms1", function(){
        statusCount = 1;
        createTable(statusCount);
    });

    $("body").on("click", "#fms2", function(){
        statusCount = 2;
        createTable(statusCount);
    });

    $("body").on("click", "#fms3", function(){
        statusCount = 3;
        createTable(statusCount);
    });

    $("body").on("click", "#fms4", function(){
        statusCount = 4;
        createTable(statusCount);
    });

    $("body").on("click", "#fms5", function(){
        statusCount = 5;
        createTable(statusCount);
    });

    $("body").on("click", "#fms6", function(){
        statusCount = 6;
        createTable(statusCount);
    });

    $("body").on("click", "#fms7", function(){
        statusCount = 7;
        createTable(statusCount);
    });

    $("body").on("click", "#fms9", function(){
        statusCount = 9;
        createTable(statusCount);
    });

})();
