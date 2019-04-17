$('document').ready(function(){

  $.ajax({
    url:"/data/catchments.geojson",
    dataType: "json",
    success: function () {},
    error: function (xhr) {console.log(xhr.statusText);}
  }).done(function(catchments) {

    catchments.features.forEach(function(cat) { // generate random average risk score, delete when real data
      cat = cat.properties;
      cat.risk = Math.round(Math.random()*50);
      cat.count = Math.round(Math.random()*500);
    })

    thres(catchments);
    $('#thres-slider').on('change click',function() {
      thres(catchments);
    });

    $('#catchments').DataTable({
        "paging"   : false,
        "info"     : false,
        "searching": false
    });

    c = L.geoJSON(catchments, {
      style: style,
      onEachFeature: function(feature,layer) {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
        });
      }
    }).addTo(map);
    map.setMinZoom(13);
    map.setMaxBounds(c.getBounds());
    map.fitBounds(c.getBounds());

  })




  var thres = (catchments) => {
    let t = $('#thres-slider').val();

    $('#catchments tbody').html('')

    let props = 0;
    catchments.features.forEach(function(cat) {
      cat = cat.properties;
      let count = cat.count*Math.round(6.5*Math.pow(1.1,-t/1.9));
      props += count;
      // jquery append table for each catchment
      $('#catchments tbody').append(`
        <tr id="c${cat.OBJECTID}">
          <td><h4 class="m-1">${cat.OBJECTID}</h4></td>
          <td>${count}</td>
          <td>${cat.risk}</td>
        </tr>
      `);
    });



    $('.thres-count').text(props);
    $('.thres-risk').text(t);
  }


  function getColor(d) {
    return d > 45 ? '#4d004b' :
           d > 40 ? '#810f7c' :
           d > 35 ? '#88419d' :
           d > 30 ? '#8c6bb1' :
           d > 25 ? '#8c96c6' :
           d > 20 ? '#9ebcda' :
           d > 15 ? '#bfd3e6' :
           d > 10 ? '#e0ecf4' :
           d > 5 ? '#f7fcfd' :
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


  }

  function resetHighlight(e) {
    c.resetStyle(e.target);
  }

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }

});
