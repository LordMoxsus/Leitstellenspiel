// ==UserScript==
// @name         vehicleChanges
// @version      1.2.2
// @description  ändert die Einstellungen von AB, SEG ELW, GRTW und Außenlastbehälter
// @author       DrTraxx
// @include      /^https?:\/\/(w{3}\.)?(polizei\.)?leitstellenspiel\.de\/$/
// @grant        GM_addStyle
// ==/UserScript==
/* global $, user_id, I18n */

(async function () {
  'use strict';

  var aVehicles = [];
  var containerIds = [47, 48, 49, 54, 62, 71, 77, 78];
  var segLeader = [];
  var container = [];
  var grtw = [];
  var waterBin = [];

  async function loadApi() {

    aVehicles = await $.getJSON('/api/vehicles')

    for (var i in aVehicles) {
      var e = aVehicles[i];
      if (e.vehicle_type === 59) segLeader.push(e);
      if (containerIds.includes(e.vehicle_type)) container.push(e);
      if (e.vehicle_type === 73) grtw.push(e);
      if (e.vehicle_type === 96) waterBin.push(e);
    }
    console.debug("aVehicles", aVehicles);
    console.debug("segLeader", segLeader);
    console.debug("container", container);
    console.debug("grtw", grtw);
    console.debug("waterBin", waterBin);
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
}`);

  $("body")
    .prepend(
      `<div class="modal fade bd-example-modal-lg" id="veChModal" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
           <div class="modal-dialog modal-lg" role="document">
             <div class="modal-content">
               <div class="modal-header">
                 <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                   <span aria-hidden="true">&#x274C;</span>
                 </button>
                 <h3 class="modal-title"><center>Fahrzeugeinstellungen</center></h3>
                 <div class="btn-group hidden" id="veChBtnGrp">
                   <a class="btn btn-primary btn-xs" id="veChBtnContainer">Abrollbehälter</a>
                   <a class="btn btn-primary btn-xs" id="veChBtnLeader">ELW (SEG)</a>
                   <a class="btn btn-primary btn-xs" id="veChBtnGrtw">GRTW</a>
                   <a class="btn btn-primary btn-xs" id="veChBtnWaterBin">Außenlastbehälter</a>
                 </div>
               </div>
                 <div class="modal-body" id="veChModalBody">
                 </div>
                 <div class="modal-footer">
                   <button type="button" class="btn btn-danger" data-dismiss="modal">Schließen</button>
                   <div class="pull-left">v ${GM_info.script.version}</div>
                 </div>
           </div>
         </div>`);

  $("ul .dropdown-menu[aria-labelledby='menu_profile'] >> a[href='/missionSpeed']")
    .parent()
    .after(`<li role="presentation"><a data-toggle="modal" data-target="#veChModal" style="cursor:pointer" id="veChOpenModal"><span class="glyphicon glyphicon-cog"></span> Fahrzeugeinstellungen</a></li>`);

  async function progress(type) {
    var vehiclesToSet = [];
    var postContent = "";
    var count = 0;

    if (type == "container") {
      vehiclesToSet = container;
      postContent = { "tractive_random": $("#contCbxRdmWlf")[0].checked ? 1 : 0, "tractive_building_random": $("#contCbxEachWlf")[0].checked ? 1 : 0, "vehicle_mode": $("#conSelWlf").val() };
    } else if (type == "segLeader") {
      vehiclesToSet = segLeader;
      postContent = { "hospital_automatic": $("#ldrAutomatic")[0].checked ? 1 : 0, "hospital_own": $("#ldrHospOwn")[0].checked ? 1 : 0, "hospital_right_building_extension": $("#ldrHospRgtExt")[0].checked ? 1 : 0, "hospital_max_price": $("#ldrMaxTax").val(), "hospital_max_distance": $("#ldrMaxDrive").val(), "hospital_free_space": $("#ldrMaxEmptPlace").val() };
    } else if (type == "grtw") {
      vehiclesToSet = grtw;
      postContent = { "vehicle_mode": $("#grtwMode").val() };
    } else if (type == "waterBin") {
      vehiclesToSet = waterBin;
      postContent = { "tractive_random": $("#contCbxRdmWaterBin")[0].checked ? 1 : 0, "tractive_building_random": $("#contCbxEachWaterBin")[0].checked ? 1 : 0 };
    }

    $("#veChModalBody")
      .append(`<div class="progress" style="margin-top:2em">
                       <div class="progress-bar bg-success" role="progressbar" style="width: 0%;color: black" aria-valuenow="0" aria-valuemin="0" aria-valuemax="${vehiclesToSet.length}" id="veChPrgs">0 / ${vehiclesToSet.length.toLocaleString()}</div>
                     </div>`);
    console.debug("progress", type, vehiclesToSet);
    console.debug("postContent", postContent);

    for (var i in vehiclesToSet) {
      count++;
      var percent = Math.round(count / vehiclesToSet.length * 100);
      var e = vehiclesToSet[i];
      $("#veChPrgs")
        .attr("aria-valuenow", count)
        .css({ "width": percent + "%" })
        .text(count.toLocaleString() + " / " + vehiclesToSet.length.toLocaleString());
      await $.post("/vehicles/" + e.id, { "vehicle": postContent, "authenticity_token": $("meta[name=csrf-token]").attr("content"), "_method": "put" });
    }
  }

  $("body").on("click", "#veChOpenModal", async function () {
    if (!$("#veChBtnGrp").hasClass("hidden")) $("#veChBtnGrp").addClass("hidden");
    segLeader.length = 0;
    container.length = 0;
    grtw.length = 0;
    waterBin.length = 0;
    await loadApi();
    $("#veChBtnGrp").removeClass("hidden");
  });

  $("body").on("click", "#veChBtnContainer", function () {
    $("#veChModalBody")
      .html(`<h4>Einstellungen für alle AB (${container.length.toLocaleString()})</h4>
                   <div class="form-check">
                     <input class="form-check-input" type="checkbox" value="" id="contCbxRdmWlf">
                     <label class="form-check-label" for="contCbxRdmWlf">
                       Zufälliges WLF
                     </label>
                   </div>
                   <div class="form-check hidden">
                     <input class="form-check-input" type="checkbox" value="" id="contCbxEachWlf">
                     <label class="form-check-label" for="contCbxEachWlf">
                       WLF von fremden Wachen zulassen
                     </label>
                   </div>
                   <select class="custom-select" id="conSelWlf">
                     <option selected value="2">WLF an Einsatzstelle behalten</option>
                     <option value="3">WLF zur Wache schicken</option>
                   </select>
                   <br>
                   <a class="btn btn-success" id="veChSaveAll" bullet_point="container" style="margin-top:2em">Einstellungen übernehmen</a>`);
  });

  $("body").on("click", "#veChBtnLeader", function () {
    $("#veChModalBody")
      .html(`<h4>Einstellungen für alle ELW (SEG) (${segLeader.length.toLocaleString()})</h4>
                   <div class="form-check">
                     <input class="form-check-input" type="checkbox" value="" id="ldrAutomatic">
                     <label class="form-check-label" for="ldrAutomatic">
                       Rettungsdienst automatisch ein Krankenhaus zuweisen
                     </label>
                   </div>
                   <div class="hidden" id="ldrHiddenContent">
                     <div class="form-check">
                       <input class="form-check-input" type="checkbox" value="" id="ldrHospOwn">
                       <label class="form-check-label" for="ldrHospOwn">
                         Nur eigene Krankenhäuser anfahren
                       </label>
                     </div>
                     <div class="form-check">
                       <input class="form-check-input" type="checkbox" value="" id="ldrHospRgtExt">
                       <label class="form-check-label" for="ldrHospRgtExt">
                         Nur an Krankenhäuser mit passenden Ausbau einliefern
                       </label>
                     </div>
                     <label for="ldrMaxTax">Maximale Abgabe vom Creditsverdienst</label>
                     <br>
                     <select class="custom-select" id="ldrMaxTax" style="margin-left:2em;width:15em">
                       <option selected value="0">0 Prozent</option>
                       <option value="10">10 Prozent</option>
                       <option value="20">20 Prozent</option>
                       <option value="30">30 Prozent</option>
                       <option value="40">40 Prozent</option>
                       <option value="50">50 Prozent</option>
                     </select>
                     <br>
                     <label for="ldrMaxDrive">Maximale Entfernung zum Krankenhaus</label>
                     <br>
                     <select class="custom-select" id="ldrMaxDrive" style="margin-left:2em;width:15em">
                       <option selected value="1">1 Kilometer</option>
                       <option value="5">5 Kilometer</option>
                       <option value="20">20 Kilometer</option>
                       <option value="50">50 Kilometer</option>
                       <option value="100">100 Kilometer</option>
                       <option value="200">200 Kilometer</option>
                     </select>
                     <br>
                     <label for="ldrMaxEmptPlace">Freizulassende Plätze im Krankenhaus</label>
                     <br>
                     <select class="custom-select" id="ldrMaxEmptPlace" style="margin-left:2em;width:15em">
                       <option selected value="0">0 Plätze</option>
                       <option value="1">1 Plätze</option>
                       <option value="2">2 Plätze</option>
                       <option value="3">3 Plätze</option>
                       <option value="4">4 Plätze</option>
                       <option value="5">5 Plätze</option>
                     </select>
                   </div>
                   <br>
                   <a class="btn btn-success" id="veChSaveAll" bullet_point="segLeader" style="margin-top:2em">Einstellungen übernehmen</a>`);
  });

  $("body").on("click", "#veChBtnGrtw", function () {
    $("#veChModalBody")
      .html(`<h4>Einstellungen für alle GRTW  (${grtw.length.toLocaleString()})</h4>
                   <select class="custom-select" id="grtwMode">
                     <option selected value="0">Maximal 7 leichtverletzte Patienten</option>
                     <option value="1">Maximal 3 (auch schwerverletzte) Patienten, Notarzt als Besatzung nötig</option>
                   </select>
                   <br>
                   <a class="btn btn-success" id="veChSaveAll" bullet_point="grtw" style="margin-top:2em">Einstellungen übernehmen</a>`);
  });

  $("body").on("click", "#veChBtnWaterBin", function () {
    $("#veChModalBody")
      .html(`<h4>Einstellungen für alle Außenlastbehälter (${waterBin.length.toLocaleString()})</h4>
                   <div class="form-check">
                     <input class="form-check-input" type="checkbox" value="" id="contCbxRdmWaterBin">
                     <label class="form-check-label" for="contCbxRdmWaterBin">
                       Zufälliger Hubschrauber
                     </label>
                   </div>
                   <div class="form-check hidden">
                     <input class="form-check-input" type="checkbox" value="" id="contCbxEachWaterBin">
                     <label class="form-check-label" for="contCbxEachWaterBin">
                       Hubschrauber von fremden Wachen zulassen
                     </label>
                   </div>
                   <br>
                   <a class="btn btn-success" id="veChSaveAll" bullet_point="waterBin" style="margin-top:2em">Einstellungen übernehmen</a>`);
  });

  $("body").on("click", "#contCbxRdmWlf", function () {
    if ($("#contCbxRdmWlf")[0].checked) {
      $("#contCbxEachWlf").parent().removeClass("hidden");
    } else {
      $("#contCbxEachWlf").parent().addClass("hidden");
      $("#contCbxEachWlf")[0].checked = false;
    }
  });

  $("body").on("click", "#contCbxRdmWaterBin", function () {
    if ($("#contCbxRdmWaterBin")[0].checked) {
      $("#contCbxEachWaterBin").parent().removeClass("hidden");
    } else {
      $("#contCbxEachWaterBin").parent().addClass("hidden");
      $("#contCbxEachWaterBin")[0].checked = false;
    }
  });

  $("body").on("click", "#ldrAutomatic", function () {
    if ($("#ldrAutomatic")[0].checked) {
      $("#ldrHiddenContent").removeClass("hidden");
    } else {
      $("#ldrHiddenContent").addClass("hidden");
      $("#ldrHospOwn")[0].checked = false;
      $("#ldrHospRgtExt")[0].checked = false;
      $("#ldrMaxTax").val(0);
      $("#ldrMaxDrive").val(1);
      $("#ldrMaxEmptPlace").val(0);
    }
  });

  $("body").on("click", "#veChSaveAll", function () {
    progress($(this).attr("bullet_point"));
  });

})();