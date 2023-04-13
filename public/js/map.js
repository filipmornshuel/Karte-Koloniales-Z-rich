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

function openForm() {
  document.getElementById('myForm').style.display = 'block';
  document.getElementsByClassName('open-button')[0].style.display = 'none';
  addCheckpointMode = true;
}

function closeForm() {
  document.getElementById('myForm').style.display = 'none';
  document.getElementsByClassName('open-button')[0].style.display = 'block';
}

let vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: function (feature) {
    let title = feature.get('title');
    let textStyle = new ol.style.Text({
      textAlign: 'center',
      textBaseline: 'middle',
      font: '12px Arial',
      text: title,
      fill: new ol.style.Fill({ color: 'black' }),
      stroke: new ol.style.Stroke({ color: 'white', width: 3 }),
      offsetX: 0,
      offsetY: 15,
      rotation: 0,
    });

    let iconStyle = new ol.style.Icon({
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

let map = new ol.Map({
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
  let modeButton = document.getElementById('modeButton');
  if (addCheckpointMode) {
    addCheckpointMode = false;
    modeButton.innerHTML = 'Switch to Add Checkpoint Mode';
  } else {
    addCheckpointMode = true;
    modeButton.innerHTML = 'Switch to Exploration Mode';
  }
}

function saveCheckpointData() {
  title = document.getElementById('titleMorn').value;
  description = document.getElementById('description').value;
  blobImg = document.getElementById('img');
  blobAudio = document.getElementById('audio');

  let fileImg = blobImg.files[0];
  let fileAudio = blobAudio.files[0];

  if (fileImg && fileAudio) {
    let frImg = new FileReader();
    let frAudio = new FileReader();

    frImg.readAsDataURL(fileImg);
    frAudio.readAsDataURL(fileAudio);

    frImg.addEventListener('load', () => {
      let imgUrl = frImg.result;
      frAudio.addEventListener('load', () => {
        let audioUrl = frAudio.result;
        addCheckpoint(
          coordinate,
          title,
          description,
          imgUrl.toString(),
          audioUrl.toString()
        );
        addHistoryEntry(
          coordinate,
          title,
          description,
          imgUrl.toString()
        );
      });
    });
  } else if (fileImg) {
    let frImg = new FileReader();

    frImg.readAsDataURL(fileImg);

    frImg.addEventListener('load', () => {
      let imgUrl = frImg.result;
      addCheckpoint(coordinate, title, description, imgUrl.toString(), '');
      addHistoryEntry(coordinate, title, description, imgUrl.toString());
    });
  } else if (fileAudio) {
    let frAudio = new FileReader();

    frAudio.readAsDataURL(fileAudio);

    frAudio.addEventListener('load', () => {
      let audioUrl = frAudio.result;
      addCheckpoint(coordinate, title, description, '', audioUrl.toString());
      addHistoryEntry(coordinate, title, description, imgUrl.toString());
    });
  }
}

function addCheckpoint(coordinate, title, description, blobImg) {
  console.log(coordinate, title, description, blobImg, blobAudio);
  addCheckpointMode = false;

  if (title != null && title != '') {
    fetch('/api/sendProposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        lng: coordinate[0],
        lat: coordinate[1],
        description: description,
        img: blobImg,
        audio: blobAudio,
      }),
    })
      .then((response) => {
        if (response.ok) {
          console.log('Checkpoint saved to database');
        } else {
          console.log('Error saving checkpoint to database');
        }
      })
      .catch((error) => {
        console.log('Error saving checkpoint to database', error);
      });

    let checkpoint = new ol.Feature({
      geometry: new ol.geom.Point(coordinate),
      title: title,
      description: description,
      img: blobImg,
      audio: blobAudio,
    });
    //vectorSource.addFeature(checkpoint);
  }
}

function addHistoryEntry(coordinate, title, description, blobImg) {

  if (title != null && title != '') {

    // send checkpoint data to server

    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/addHistory');
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
        name: title,
        lng: coordinate[0],
        lat: coordinate[1],
        description: description,
        img: blobImg,
      })
    );
  }
}

/*
// Diese Funktion sollte noch überarbeitet werden, wenn Zeit übrig bleibt,
// dass man denn Checkpoint noch letiabel verschieben kann, bevor man den Vorschlag gemacht hat.
function fakeAddCheckpoint(coordinate, title) {
  console.log(coordinate, title, description, blobImg);
  addCheckpointMode = false;
  if (title != null && title != '') {
    // Remove previous checkpoint if it exists
    if (currentCheckpoint) {
      vectorSource.removeFeature(currentCheckpoint);
    }
    // Create new checkpoint
    let checkpoint = new ol.Feature({
      geometry: new ol.geom.Point(coordinate),
      title: title,
      description: description,
      img: blobImg
    });
    // Add new checkpoint to the vector source and store it in the currentCheckpoint variable
    vectorSource.addFeature(checkpoint);
    currentCheckpoint = checkpoint;
  }
}*/

map.on('click', function (evt) {
  if (addCheckpointMode) {
    coordinate = evt.coordinate;
    document.getElementById('cords').value = coordinate;
    fakeAddCheckpoint(coordinate, title);
    //addTemporaryGeometry(coordinate);
    //fakeAddCheckpoint(coordinate, title)
  } 
});

vectorSource.addFeatures(checkpoints);

map.on('singleclick', function (evt) {
  if (!addCheckpointMode) {
    let feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });

    if (feature) {
      // Show the modal
      let modal = document.getElementById('myModal');
      // When the user clicks the button, open the modal
      modal.style.display = 'block';

      // Fetch the checkpoint data from the server
      fetch(`/api/checkpoint?title=${feature.get('title')}`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Network response was not ok.');
        })
        .then((checkpoint) => {
          // Create the entries table
          let entries = document.getElementById('myModal');
          let entriesTable = document.createElement('table');
          const trh = entriesTable.insertRow();

          // Erstelle ein neues img-Element
          let imgElement = document.createElement('img');
          let audioElement = document.createElement('audio');
          audioElement.setAttribute('controls', true);

          createTableElement('th', 'Titel', trh);
          createTableElement('th', 'Beschreibung', trh)
          createTableElement('th', 'Bild', trh)
          createTableElement('th', 'Audio', trh)

          const entry = {
            title: checkpoint.title,
            description: checkpoint.description,
            img: checkpoint.img.toString(),
            audio: checkpoint.audio,
          };

          const trd = entriesTable.insertRow();
          let titleCell = trd.insertCell(0);

          let descCell = trd.insertCell(1);
          let imgCell = trd.insertCell(2);
          let audioCell = trd.insertCell(3);

          imgElement.src = entry.img.toString();
          imgCell.appendChild(imgElement);
          if (entry.audio) {
            audioElement.src = entry.audio.toString();
            audioCell.appendChild(audioElement);
          }

          descCell.innerHTML = entry.description;

          titleCell.innerHTML = entry.title;

          entries.appendChild(entriesTable);
        })
        .catch((error) => {
          console.error('There was a problem fetching checkpoint data:', error);
        });

      // When the user clicks on <span> (x), close the modal
      let span = document.getElementsByClassName('close')[0];
      span.onclick = function () {
        let modal = document.getElementById('myModal');
        modal.style.display = 'none';
        let entriesTable = document.querySelector('#myModal table');
        entriesTable.parentNode.removeChild(entriesTable);

      };

      // When the user clicks anywhere outside of the modal, close it
      window.onclick = function (event) {
        let modal = document.getElementById('myModal');
        if (event.target == modal) {
          modal.style.display = 'none';
          let entriesTable = document.querySelector('#myModal table');
          entriesTable.parentNode.removeChild(entriesTable);
         
        }
      };
    }
 
  }
});

function loadCheckpoints() {
  fetch('/api/checkpoints')
    .then((response) => response.json())
    .then((checkpoints) => {
      let entries = document.getElementById('checkpoint-entries');
      let entriesTable = document.createElement('table');
      const trh = entriesTable.insertRow();

      createTableElement('th', 'Titel', trh);
      createTableElement('th', 'Beschreibung', trh)
      createTableElement('th', 'Bild', trh)
      createTableElement('th', 'Audio', trh)

      for (let i = 0; i < checkpoints.length; i++) {
        const checkpoint = checkpoints[i];
        const entry = {
          title: checkpoint.title,
          description: checkpoint.description,
          img: checkpoint.img,
          audio: checkpoint.audio,
        };

        const trd = entriesTable.insertRow();
        let titleCell = trd.insertCell(0);
        let descCell = trd.insertCell(1);
        let imgCell = trd.insertCell(2);
        let audioCell = trd.insertCell(3);

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

        // Ein neues ol.Feature-Objekt erstellen
        const feature = new ol.Feature({
          geometry: new ol.geom.Point([checkpoint.lng, checkpoint.lat]),
          title: checkpoint.title,
        });
        // Füge das Feature zum Vektorlayer hinzu
        vectorSource.addFeature(feature);
      }
      entries.appendChild(entriesTable);
    })
    .catch((error) => {
      console.log('no data has been found.', error);
    });
}

function createTableElement(element, content, trh){
  let th = document.createElement(element);
  th.innerHTML = content;
  trh.appendChild(th);
}

loadCheckpoints();