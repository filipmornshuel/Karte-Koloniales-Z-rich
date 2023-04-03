var vectorSource = new ol.source.Vector();

var vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: function (feature) {
    var name = feature.get('name');
    var textStyle = new ol.style.Text({
      textAlign: 'center',
      textBaseline: 'middle',
      font: '12px Arial',
      text: name,
      fill: new ol.style.Fill({ color: 'black' }),
      stroke: new ol.style.Stroke({ color: 'white', width: 3 }),
      offsetX: 0,
      offsetY: 15,
      rotation: 0,
    });

    var iconStyle = new ol.style.Icon({
      anchor: [0.5, 1],
      //blockiert in firefox wegen CORP
      src: 'https://cdn4.iconfinder.com/data/icons/small-n-flat/24/map-marker-512.png',
      scale: 0.1,
    });

    return new ol.style.Style({
      text: textStyle,
      image: iconStyle,
    });
  },
});

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
    vectorLayer,
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([8.5432, 47.369]),
    zoom: 12,
  }),
});

const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/loadRequests', true);
xhr.onload = function () {
  if (xhr.status === 200) {
    let checkpoints = JSON.parse(xhr.responseText);
    let entries = document.getElementById('checkpoint-entries');
    let entriesTable = document.createElement('table');
    const trh = entriesTable.insertRow();

    let th1 = document.createElement('th');
    th1.innerHTML = 'Name';
    trh.appendChild(th1);

    let th2 = document.createElement('th');
    th2.innerHTML = 'Beschreibung';
    trh.appendChild(th2);

    let th3 = document.createElement('th');
    th3.innerHTML = 'Bild';
    trh.appendChild(th3);

    let th4 = document.createElement('th');
    th4.innerHTML = 'Audio';
    trh.appendChild(th4);

    let th5 = document.createElement('th');
    th5.innerHTML = 'Entscheid';
    trh.appendChild(th5);

    console.log(checkpoints);

    for (let i = 0; i < checkpoints.length; i++) {
      const checkpoint = checkpoints[i];
      console.log(checkpoint);
      const entry = {
        name: checkpoint.name,
        description: checkpoint.description,
        img: checkpoint.img,
        audio: checkpoint.audio,
      };

      const trd = entriesTable.insertRow();
      let nameCell = trd.insertCell(0);
      let descCell = trd.insertCell(1);
      let imgCell = trd.insertCell(2);
      let audioCell = trd.insertCell(3);
      let buttonCell = trd.insertCell(4);

      nameCell.innerHTML = entry.name;
      descCell.innerHTML = entry.description;
      imgCell.innerHTML = entry.img;
      audioCell.innerHTML = entry.audio;

      let accept = document.createElement('button');
      accept.innerHTML = 'Akzeptieren';

      accept.addEventListener('click', () => {
        addCheckpoint([checkpoint.lng, checkpoint.lat], entry.name, entry.description, entry.img);
      });
      let decline = document.createElement('button');
      decline.innerHTML = 'Ablehnen';
      buttonCell.appendChild(accept);
      buttonCell.appendChild(decline);


      // Ein neues ol.Feature-Objekt erstellen
      const feature = new ol.Feature({
        geometry: new ol.geom.Point([checkpoint.lng, checkpoint.lat]),
        name: checkpoint.name,
      });
      // Füge das Feature zum Vektorlayer hinzu
      vectorSource.addFeature(feature);
    }
    entries.appendChild(entriesTable);
  } else {
    console.log('no data has been found.');
  }
};
xhr.send();

function accept() {
  var checkpoint = new ol.Feature({
    geometry: new ol.geom.Point(coordinate),
    name: name,
    description: description,
    img: blobImg,
  });
  vectorSource.addFeature(checkpoint);
}

function addCheckpoint(coordinate, name, description, blobImg) {
  console.log(coordinate, name, description, blobImg);
  addCheckpointMode = false;
  if (name != null && name != '') {

    // send checkpoint data to server

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/checkpoints');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status === 200) {
        console.log('Checkpoint saved to database');
      } else {
        console.log('Error saving checkpoint to database');
      }
    };
    xhr.send(
      JSON.stringify({
        name: name,
        lng: coordinate[0],
        lat: coordinate[1],
        description: description,
        img: blobImg,
      })
    );
  }
}