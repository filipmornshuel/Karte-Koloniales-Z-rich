let addCheckpointMode = false;
let title;
let description;
let coordinate;
let blobImg;
let blobAudio;
let vectorSource = new ol.source.Vector();
let checkpoints = [];
let currentCheckpoint;
const btn = document.getElementById('send');
const addStatBtn = document.getElementById('open-button');

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

function createTableElement(element, content, trh){
  let th = document.createElement(element);
  th.innerHTML = content;
  trh.appendChild(th);
}

function accept() {
  var checkpoint = new ol.Feature({
    geometry: new ol.geom.Point(coordinate),
    title: title,
    description: description,
    img: blobImg,
  });
  vectorSource.addFeature(checkpoint);
}

async function addCheckpoint(coordinate, name, description, blobImg) {
  console.log(coordinate, name, description, blobImg);
  addCheckpointMode = false;
  if (name != null && name != '') {
    try {
      const response = await fetch('/api/checkpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          lng: coordinate[0],
          lat: coordinate[1],
          description: description,
          img: blobImg,
        })
      });
      if (response.status === 200) {
        console.log('Checkpoint saved to database');
      } else {
        console.log('Error saving checkpoint to database');
      }
    } catch (error) {
      console.error('Error saving checkpoint to database', error);
    }
  }
}

async function updateCheckpoint(id, coordinate, name, description, blobImg) {
  if (name != null && name != '') {
    try {
      const response = await fetch('/api/updateCheckpoints', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: id,
          name: name,
          lng: coordinate[0],
          lat: coordinate[1],
          description: description,
          img: blobImg,
        })
      });
      if (response.status === 200) {
        console.log('Checkpoint updated');
      } else {
        console.log('Error updating checkpoint');
      }
    } catch (error) {
      console.error('Error updating checkpoint', error);
    }
  }
}

async function removeRequest(id) {
  if (id != null && id != '') {
    try {
      const response = await fetch('/api/removeRequest', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({id: id})
      });
      if (response.status === 200) {
        console.log('Checkpoint deleted');
      } else {
        console.log('No affected rows');
      }
    } catch (error) {
      console.error('Error deleting checkpoint', error);
    }
  }
}

async function loadHistory() {
  try {
    const response = await fetch('/api/getHistory', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      const histroyEntries = await response.json();
      const listMenu = document.getElementById('vertical-menu');
      for (let i = 0; i < histroyEntries.length; i++) {
        const entry = histroyEntries[i];
        const listElement = document.createElement('p');
        listElement.innerHTML = histroyEntries[i].name;
        listElement.addEventListener('click', () => {
          document.getElementById('name').innerHTML = entry.name;
          document.getElementById('description').innerHTML = entry.description;
        });
        listMenu.appendChild(listElement);
      }
    }
  } catch (error) {
    console.error('Error loading history', error);
  }
}
function loadRequests() {
  fetch('/api/loadRequests')
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        console.log('no data has been found.');
        throw new Error('Network response was not ok.');
      }
    })
    .then(checkpoints => {
      let entries = document.getElementById('checkpoint-entries');
      let entriesTable = document.createElement('table');
      const trh = entriesTable.insertRow();

      createTableElement('th', 'Titel', trh);
      createTableElement('th', 'Beschreibung', trh);
      createTableElement('th', 'Bild', trh);
      createTableElement('th', 'Audio', trh);
      createTableElement('th', 'Entscheid', trh);

      for (let i = 0; i < checkpoints.length; i++) {
        const checkpoint = checkpoints[i];
        const entry = {
          title: checkpoint.title,
          description: checkpoint.description,
          img: checkpoint.img,
          audio: checkpoint.audio
        }
        
        const trd = entriesTable.insertRow();
        let titleCell = trd.insertCell(0);
        let descCell = trd.insertCell(1);
        let imgCell = trd.insertCell(2);
        let audioCell = trd.insertCell(3);
        let buttonCell = trd.insertCell(4);

        let imgElement = document.createElement('img');
        let audioElement = document.createElement('audio');
        audioElement.setAttribute('controls', true);

        imgElement.src = entry.img.toString();
        imgCell.appendChild(imgElement);

        if (entry.audio) {
          audioElement.src = entry.audio.toString();
          audioCell.appendChild(audioElement);
        }

        titleCell.innerHTML = entry.title;
        descCell.innerHTML = entry.description;

        let accept = document.createElement('button');
        accept.innerHTML = 'Akzeptieren';

        accept.addEventListener('click', () => {
          addCheckpoint([checkpoint.lng, checkpoint.lat], entry.name, entry.description, entry.img);
          removeRequest(checkpoint.id);
          window.location.reload();
        });

        let decline = document.createElement('button');
        decline.innerHTML = 'Ablehnen';

        decline.addEventListener('click', () => {
          removeRequest(checkpoint.id);
          window.location.reload();
        });

        let edit = document.createElement('button');
        edit.innerHTML = 'Bearbeiten';

        edit.addEventListener('click', () => {
          accept.setAttribute('hidden', 'true');
          decline.setAttribute('hidden', 'ture');
          save.removeAttribute('hidden');
          edit.setAttribute('hidden', 'true');
          titleCell.setAttribute('contenteditable', 'true');
          descCell.setAttribute('contenteditable', 'true');
        });

        let save = document.createElement('button');
        save.innerHTML = 'Speichern';
        save.setAttribute('hidden', 'ture');

        save.addEventListener('click', () => {
          accept.removeAttribute('hidden');
          decline.removeAttribute('hidden');
          edit.removeAttribute('hidden');
          save.setAttribute('hidden', true);
          titleCell.setAttribute('contenteditable', 'false');
          descCell.setAttribute('contenteditable', 'false');
          updateCheckpoint(checkpoint.id, [checkpoint.lng, checkpoint.lat], titleCell.innerHTML, descCell.innerHTML, entry.img);
          window.location.reload();
        });

        buttonCell.appendChild(accept);
        buttonCell.appendChild(decline);
        buttonCell.appendChild(edit);
        buttonCell.appendChild(save);

        const feature = new ol.Feature({
          geometry: new ol.geom.Point([checkpoint.lng, checkpoint.lat]),
          title: checkpoint.title
        });
        vectorSource.addFeature(feature);
      }

      entries.appendChild(entriesTable);
    })
    .catch((error) => {
      console.log('no data has been found.', error);
    });
}

loadHistory();

loadRequests();