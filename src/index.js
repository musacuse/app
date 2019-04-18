$('document').ready(function(){

  var state = {current:""};
  var data = {};
  var table = {};

  $.ajax({
    url:"../data/catchments.geojson",
    dataType: "json",
    success: function () {},
    error: function (xhr) {console.log(xhr.statusText);}
  }).done(function(catchments) {

    catchments.features.forEach(function(cat) { // generate random average risk score, delete when real data
      cat = cat.properties;
      cat.risk = Math.round(Math.random()*50);
      cat.count = Math.round(Math.random()*500);
    });

    addThings("catchments",catchments,13)

    $('#thres-slider').on('change click',function() {
      thres(catchments,data.parcels);
    });

    $('.title').click(function() {
      addThings("catchments",catchments,13);
    });
  })

  var addThings = (statename,geojson,zoom) => {

    state.current = statename;
    data[statename] = geojson;

    map.eachLayer(function(layer) {
      if (layer != mapBase && layer != mapLabels) {
        map.removeLayer(layer);
      }
    });
    state.parcels = [];
    state[statename] = L.geoJSON(geojson, {
      style: style,
      onEachFeature: function(feature,layer) {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
        });
      }
    }).addTo(map);
    map.setMinZoom(zoom);
    map.setMaxBounds(state[statename].getBounds().pad(.25));
    map.fitBounds(state[statename].getBounds().pad(.25));

    thres(data.catchments,data.parcels);

    $('.catchments,.parcels,.individual').addClass('d-none');
    $(`.${statename}`).removeClass('d-none');

  }

  var thres = (catchments,parcels) => {
    let t = $('#thres-slider').val();

    $('#catchments tbody').html('')

    let total = 0;
    catchments.features.forEach(function(cat) {
      cat = cat.properties;
      let count = cat.count*Math.round(6.5*Math.pow(1.1,-t/1.9));
      total += count;
      // jquery append table for each catchment
      $('#catchments tbody').append(`
        <tr class="text-nowrap" id="c${cat.OBJECTID}">
          <td><h4 class="m-1">${cat.OBJECTID}</h4></td>
          <td>${count}</td>
          <td>${cat.risk}</td>
        </tr>
      `);

      $(`#c${cat.OBJECTID}`).on({
        mouseenter: function() {highlightFeature(match("OBJECTID",cat.OBJECTID,state.catchments))},
        mouseleave: function() {resetHighlight(match("OBJECTID",cat.OBJECTID,state.catchments))},
        click: function() {zoomToFeature(match("OBJECTID",cat.OBJECTID,state.catchments))}
      });

    });

    if (state.current == "parcels") {
      state.parcels.eachLayer(function (layer) {
        layer.setStyle(style);
        state[state.current].resetStyle(layer);
      });

      let props = 0;
      parcels.features.forEach(function(pcl) {
        pcl = pcl.properties;
        if (pcl.risk >= t) {props += 1;}
        // jquery append table for each parcel
        $('#parcels tbody').append(`
          <tr class="text-nowrap" id="p${pcl.SBL_class}">
            <td>${pcl.SBL}</td>
            <td>420 Fake Address</td>
            <td>${pcl.risk}</td>
          </tr>
        `);

        $(`#p${pcl.SBL_class}`).on({
          mouseenter: function() {
            highlightFeature(match("SBL_class",pcl.SBL_class,state.parcels));
          },
          mouseleave: function() {resetHighlight(match("SBL_class",pcl.SBL_class,state.parcels))},
          click: function() {zoomToFeature(match("SBL_class",pcl.SBL_class,state.parcels))}
        });

      });

      $('.thres-count').text(props);
    }

    if (table[state.current] != true) {
      $(`#${state.current}`).DataTable({
        "paging"   : false,
        "info"     : false,
        "searching": false
      });
      table[state.current] = true;
    }

    $('.thres-total').text(total);
    $('.thres-risk').text(t);

    state.threshold = t;

  }






  function match(key,value,stateObj) {
    var out = {};
    stateObj.eachLayer(function(layer) {
      layerKey = layer.feature.properties;
      if (layerKey[key] == value) {
        out.target = layer;
      }
    })

    return out;
  }

  function getColor(d) {
    return state.current == "parcels" && d >= state.threshold ? '#ff0000' :
           d > 45 ? '#4d004b' :
           d > 40 ? '#810f7c' :
           d > 35 ? '#88419d' :
           d > 30 ? '#8c6bb1' :
           d > 25 ? '#8c96c6' :
           d > 20 ? '#9ebcda' :
           d > 15 ? '#bfd3e6' :
           d > 10 ? '#e0ecf4' :
           d > 5  ? '#f7fcfd' :
                    '#ffffff';
  }

  function style(feature) {
    return {
        fillColor: getColor(feature.properties.risk),
        weight: 2,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.7
    };
  }

  function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        color: '#aaa',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    let cid = e.target.feature.properties.OBJECTID;
    $(`#c${cid}`).addClass('hover');

  }

  function resetHighlight(e) {
    state[state.current].resetStyle(e.target);

    let cid = e.target.feature.properties.OBJECTID;
    $(`#c${cid}`).removeClass('hover');
  }

  function zoomToFeature(e) {
    let cid = e.target.feature.properties.OBJECTID;

    if (state.current == "catchments") {
      $.ajax({
        url:`../data/catch${cid}.geojson`,
        dataType: "json",
        success: function () {},
        error: function (xhr) {console.log(xhr.statusText);}
      }).done(function(parcels) {

        parcels.features.forEach(function(pcl) {
          pcl = pcl.properties;
          pcl.SBL_class = pcl.SBL.replace(/[^\w\s]/gi, '');
          pcl.risk = Math.round(Math.random()*50); // generate random risk score, delete when real data
        });

        addThings('parcels',parcels,14);
        $('.parcels .cid').text(`${cid}`)
      });
    }

  }

});
