/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoidGNhcnJpYWdhIiwiYSI6ImNta3lqMmN0YTA3eTMzZm9qaWwzcDN4dG8ifQ.FhKRFFY4h0NDKwgglg1J6w';

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/light-v11',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.7],  // starting point, longitude/latitude
    zoom: 10, // starting zoom level
    scrollZoom: true,
    dragPan: true 
});


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
// 1. Create variables
let crashData;
let maxcollis = 0; // store highest collision count in hex bins

// 2. Fetch the GeoJSON from repo
fetch('https://raw.githubusercontent.com/t-carriaga/Lab-4---Tyler-Carriaga/main/data/pedcyc_collision_06-21.geojson')
  .then(response => response.json())
  .then(response => {
        console.log(response);
        crashData = response;
  });

  // 3. Show Crash Data
  map.on('load', () => {

      // Add source
      map.addSource('crashes', {
        type: 'geojson',
        data: crashData
      });

      // Add layer
      map.addLayer({
        id: 'crash-points',
        type: 'circle',
        source: 'crashes',
        paint: {
          'circle-radius': 2,
          'circle-color': 'red'
        }
      });
      





/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/


    // 1. Create bounding box from crash data
    const bbox = turf.bbox(crashData);

    // 2. Expand bbox to cover all crash data
    const NewBbox = [
    bbox[0] - 0.01, // minX
    bbox[1] - 0.01, // minY
    bbox[2] + 0.01, // maxX
    bbox[3] + 0.01  // maxY
    ];

    // 3. Create hexgrid
    const hexgrid = turf.hexGrid(NewBbox, 0.5, {
    units: 'kilometers'
    });

    // 4. Add hexgrid as source
    map.addSource('hexgrid', {
    type: 'geojson',
    data: hexgrid
    });

    /* 5. Add hexgrid layer
    map.addLayer({
    id: 'hexgrid-layer',
    type: 'fill',
    source: 'hexgrid',
    paint: {
        'fill-color': 'blue',
        'fill-opacity': 0.3,
        'fill-outline-color': '#000'
    }
    });
    */


/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
// note: maxcollis variable is defined in line 25
    // 1. Turf collect function to collect all '_id' properties from the collision points data for each heaxagon    
    const collishex = turf.collect(
        hexgrid,                // hex bins
        crashData,              // crashpoints
        '_id',                  // property to collect
        'values'                // output array name
    );

    // 2. foreach loop to find largest hexbin crash count
    collishex.features.forEach((feature) => {

        // Count the number of crashes recorded inside each hex bin
        feature.properties.COUNT = feature.properties.values.length;

        // Check if this hex bin has more crashes than the current max
        if (feature.properties.COUNT > maxcollis) {

            // Update max value
            maxcollis = feature.properties.COUNT;
        }
        // logs when the count of a hex bin each time a larger count is identifed
        console.log(maxcollis);

    });

    map.addSource('collishex', {
    type: 'geojson',
    data: collishex
    });

    map.addLayer({
    id: 'hexgrid-layer',
    type: 'fill',
    source: 'collishex',
    filter: ['>', ['get', 'COUNT'], 0],
    paint: {
        'fill-color': [
        'step',
        ['get', 'COUNT'],

        '#ffffff',                // 0–20%

        maxcollis * 0.2, '#FAC7C8', // >20%
        maxcollis * 0.4, '#F58F92', // >40%
        maxcollis * 0.6, '#EF575C', // >60%
        maxcollis * 0.8, '#EA1D25'  // >80%
        ],
        'fill-opacity': 0.9,
        'fill-outline-color': 'black'
    }

    });

  map.moveLayer('crash-points'); // force on top




// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/

    // Create popup on click
    map.on('mouseenter', 'hexgrid-layer', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'hexgrid-layer', () => map.getCanvas().style.cursor = '');
    map.on('click', 'hexgrid-layer', e => {
        const count = e.features[0].properties.COUNT;
        new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<strong>Total crashes: ${count}</strong>`)
        .addTo(map);
    });

    // Toggle crash points
    document.getElementById('toggle-points').addEventListener('change', function () {
    map.setLayoutProperty(
        'crash-points',
        'visibility',
        this.checked ? 'visible' : 'none'
    );
    });

    // Toggle hexgrid
    document.getElementById('toggle-hex').addEventListener('change', function () {
    map.setLayoutProperty(
        'hexgrid-layer',
        'visibility',
        this.checked ? 'visible' : 'none'
    );
    });

});

