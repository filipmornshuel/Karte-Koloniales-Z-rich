var addCheckpointMode = false;
var name;
var description;
var coordinate;
var blobImg;
var blobAudio;
const btn = document.getElementById('send');
function openForm() {
  document.getElementById('myForm').style.display = 'block';
  addCheckpointMode = true;
}

function closeForm() {
  document.getElementById('myForm').style.display = 'none';
}
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

//Die Map laden
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

//Für den Mode wechsel zuständig
function switchMode() {
  var modeButton = document.getElementById('modeButton');
  if (addCheckpointMode) {
    addCheckpointMode = false;
    modeButton.innerHTML = 'Switch to Add Checkpoint Mode';
  } else {
    addCheckpointMode = true;
    modeButton.innerHTML = 'Switch to Exploration Mode';
  }
}

function saveCheckpointData() {
  name = document.getElementById('nameMorn').value;
  description = document.getElementById('description').value;
  blobImg = document.getElementById('img').value;
  blobAudio = document.getElementById('audio').value;
  console.log(name, description, blobImg, blobAudio);
  addCheckpoint(coordinate, name, description, blobImg);
  document.getElementById('nameMorn').value = '';
  document.getElementById('description').value = '';
  document.getElementById('img').value = '';
  document.getElementById('audio').value = '';
  closeForm();
}
/*
function saveRequestCheckpointData() {
  name = document.getElementById('nameMorn').value;
  description = document.getElementById('description').value;
  blobImg = document.getElementById('img').value;
  blobAudio = document.getElementById('audio').value;
  console.log(name, description, blobImg, blobAudio);
  addRequestCheckpoint(coordinate, name, description, blobImg, blobAudio);
  document.getElementById('nameMorn').value = '';
  document.getElementById('description').value = '';
  document.getElementById('img').value = '';
  document.getElementById('audio').value = '';
  closeForm();
}*/

function addCheckpoint(coordinate, name, description, blobImg) {
  console.log(coordinate, name, description, blobImg);
  addCheckpointMode = false;
  if (name != null && name != '') {
    var checkpoint = new ol.Feature({
      geometry: new ol.geom.Point(coordinate),
      name: name,
      description: description,
      img: blobImg
    });
    vectorSource.addFeature(checkpoint);

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
        img: blobImg
      })
    );
  }
}
/*
function addRequestCheckpoint(coordinate, name, description, blobImg, blobAudio) {
  console.log(coordinate, name, description, blobImg, blobAudio);
  addCheckpointMode = false;
  if (name != null && name != '') {
    var checkpoint = new ol.Feature({
      geometry: new ol.geom.Point(coordinate),
      name: name,
      description: description,
      img: blobImg,
      audio: blobAudio
    });
    vectorSource.addFeature(checkpoint);

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
        audio: blobAudio
      })
    );
  }
}*/

/*
// Diese Funktion sollte noch überarbeitet werden, wenn Zeit übrig bleibt,
// dass man denn Checkpoint noch variabel verschieben kann, bevor man den Vorschlag gemacht hat.
function fakeAddCheckpoint(coordinate, name) {
  console.log(coordinate, name, description, blobImg);
  addCheckpointMode = false;
  if (name != null && name != '') {
    var checkpoint = new ol.Feature({
      geometry: new ol.geom.Point(coordinate),
      name: name,
      description: description,
      img: blobImg
    });
    vectorSource.addFeature(checkpoint);
  }
}*/

map.on('click', function (evt) {
  if (addCheckpointMode) {
    coordinate = evt.coordinate;
    //alert(coordinate)
    document.getElementById('cords').value = coordinate;
    //addCheckpoint(coordinate,name,description)
    //fakeAddCheckpoint(coordinate,name);
  }
});

var checkpoints = [
  new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([8.5448, 47.3769])),
    name: 'Checkpoint 1',
  }),
  new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([8.5219, 47.3721])),
    name: 'Checkpoint 2',
  }),
  new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([8.5394, 47.391])),
    name: 'Checkpoint 3',
  }),
  new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([8.5188, 47.3613])),
    name: 'Checkpoint 4',
  }),
];

vectorSource.addFeatures(checkpoints);

map.on('singleclick', function (evt) {
  if (!addCheckpointMode) {
    var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });

    if (feature && feature.getProperties().name.startsWith('Checkpoint')) {
      window.open(
        'https://en.wikipedia.org/wiki/Zurich#' +
          feature.getProperties().name.replace(' ', '_'),
        '_blank'
      );
    }
  }
});

// evtl. in eine Methode einbauen
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/checkpoints', true);
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

    console.log(checkpoints);

    for (let i = 0; i < checkpoints.length; i++) {
      const checkpoint = checkpoints[i];
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

      nameCell.innerHTML = entry.name;
      descCell.innerHTML = entry.description;
      imgCell.innerHTML = entry.img;
      audioCell.innerHTML = entry.audio;

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


