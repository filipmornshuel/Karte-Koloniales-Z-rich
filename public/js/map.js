/**
 * Loading the map and form
 * @author filipmornshuel, JoksimovicM
 * @since 01.03.2023
 */

let addCheckpointMode = false;
let title;
let description;
let coordinate;
let blobImg;
let blobAudio;
let vectorSource = new ol.source.Vector();
let checkpoints = [];
let currentCheckpoint;
let addedCurrentCheckpoint = false;
const btn = document.getElementById('send');
const addStatBtn = document.getElementById('open-button');

/**
 * Opens the form from index.html, but edited for my purposes
 * source: https://www.w3schools.com/howto/howto_js_popup_form.asp
 * @author filipmornshuel
 */
function openForm() {
  document.getElementById('myForm').style.display = 'block';
  document.getElementsByClassName('open-button')[0].style.display = 'none';
  addCheckpointMode = true;
}

/**
 * Opens the form from index.html, but edited for my purposes
 * source: https://www.w3schools.com/howto/howto_js_popup_form.asp
 * @author filipmornshuel
 */
function closeForm() {
  document.getElementById('myForm').style.display = 'none';
  document.getElementsByClassName('open-button')[0].style.display = 'block';
  vectorSource.removeFeature(currentCheckpoint);
  addCheckpointMode = false;
}

/**
 * a function to make a picture bigger in a modal
 * @author filipmornshuel
 */
function showImageInModal(imageUrl) {
  // Create a modal
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
  modal.style.zIndex = '1000';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';

  const img = document.createElement('img');
  img.style.maxWidth = '100%';
  img.src = imageUrl;

  modal.appendChild(img);

  // Add a click event listener to the modal to close it when clicked
  modal.addEventListener('click', () => {
    modal.parentNode.removeChild(modal);
  });

  document.body.appendChild(modal);
}

/**
 * switches the checkpointmode for adding checkpoints to the map
 * @author filipmornshuel
 */
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

/**
 * creates the layer for the map and creating an icon for the checkpoints
 * @author filipmornshuel
 */
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
      src: 'https://cdn4.iconfinder.com/data/icons/small-n-flat/24/map-marker-512.png',
      scale: 0.1,
    });

    return new ol.style.Style({
      text: textStyle,
      image: iconStyle,
    });
  },
});

/**
 * loading the map with a view from Zurich
 * @author filipmornshuel
 */
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

/**
 * saving the data from a new added checkpoint and converting the img and audio to base64 string
 * @author filipmornshuel
 */
function saveCheckpointData() {
  title = document.getElementById('titleMorn').value;
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
          imgUrl.toString(),
          audioUrl.toString()
        );
      });
    });
  } else if (fileImg) {
    let frImg = new FileReader();

    frImg.readAsDataURL(fileImg);

    frImg.addEventListener('load', () => {
      let imgUrl = frImg.result;
      addCheckpoint(coordinate, title, description, imgUrl.toString(), '');
      addHistoryEntry(coordinate, title, description, imgUrl.toString(), '');
    });
  } else if (fileAudio) {
    let frAudio = new FileReader();

    frAudio.readAsDataURL(fileAudio);

    frAudio.addEventListener('load', () => {
      let audioUrl = frAudio.result;
      addCheckpoint(coordinate, title, description, '', audioUrl.toString());
      addHistoryEntry(coordinate, title, description, '', audioUrl.toString());
    });
  }
  closeForm();
}

/**
 * sending a post request to the database with the data from above
 * @author filipmornshuel
 */
function addCheckpoint(coordinate, title, description, blobImg, blobAudio) {
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
  }
}

/**
 * sending a history entry to the database for the admin
 * @author JoksimovicM
 */
function addHistoryEntry(coordinate, title, description, blobImg, blobAudio) {
  if (title != null && title != '') {
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
    xhr
      .send(
        JSON.stringify({
          name: title,
          lng: coordinate[0],
          lat: coordinate[1],
          description: description,
          img: blobImg,
          audio: blobAudio,
        })
      )
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
    vectorSource.addFeature(checkpoint);
  }
}

/**
 * adding a temporary checkpoint to the map for the user
 * @author filipmornshuel
 */
function fakeAddCheckpoint(coordinate) {
  console.log(coordinate, title, description, blobImg);
  addCheckpointMode = true;

  if (currentCheckpoint) {
    vectorSource.removeFeature(currentCheckpoint);
  }
  let checkpoint = new ol.Feature({
    geometry: new ol.geom.Point(coordinate),
    title: title,
  });
  vectorSource.addFeature(checkpoint);
  currentCheckpoint = checkpoint;
}

/**
 * event-listener waiting for a click on the map
 * @author filipmornshuel
 */
map.on('click', function (evt) {
  if (addCheckpointMode) {
    coordinate = evt.coordinate;
    document.getElementById('cords').value = coordinate;
    fakeAddCheckpoint(coordinate);
  }
});

/**
 * event-listener waiting for a singleclick on a checkpoint to do a fetch-request to the database
 * @author filipmornshuel
 */
map.on('singleclick', function (evt) {
  if (!addCheckpointMode) {
    let feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });

    if (feature) {
      let modal = document.getElementById('myModal');
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
          document.getElementsByClassName('open-button')[0].style.display =
            'none';
          // Create the entries table
          let modalContent =
            document.getElementsByClassName('modal-content')[0];
          let modalContentTable = document.createElement('table');
          modalContentTable.style.display = 'block';
          modalContentTable.style.width = '100%';

          let imgElement = document.createElement('img');
          let audioElement = document.createElement('audio');
          audioElement.setAttribute('controls', true);

          const entry = {
            title: checkpoint.title,
            description: checkpoint.description,
            img: checkpoint.img.toString(),
            audio: checkpoint.audio,
          };

          const trd = modalContentTable.insertRow();
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

          titleCell.innerHTML = entry.title;
          descCell.innerHTML = entry.description;
          modalContent.appendChild(modalContentTable);
          modal.appendChild(modalContent);
        })
        .catch((error) => {
          console.error('There was a problem fetching checkpoint data:', error);
        });

      // When the user clicks on <span> (x), close the modal
      let span = document.getElementsByClassName('close')[0];
      span.onclick = function () {
        let modal = document.getElementById('myModal');
        modal.style.display = 'none';
        let modalContentTable = document.querySelector('#myModal table');
        modalContentTable.parentNode.removeChild(modalContentTable);
        document.getElementsByClassName('open-button')[0].style.display =
          'block';
      };

      // When the user clicks anywhere outside of the modal, close it
      window.onclick = function (event) {
        let modal = document.getElementById('myModal');
        if (event.target == modal) {
          modal.style.display = 'none';
          let modalContentTable = document.querySelector('#myModal table');
          modalContentTable.parentNode.removeChild(modalContentTable);
          document.getElementsByClassName('open-button')[0].style.display =
            'block';
        }
      };
    }
  }
});

/**
 * a function to load all checkpoints from the database with a fetch
 * @author filipmornshuel
 */
function loadCheckpoints() {
  fetch('/api/checkpoints')
    .then((response) => response.json())
    .then((checkpoints) => {
      let entries = document.getElementById('checkpoint-entries');
      let entriesTable = document.createElement('table');

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

        imgElement.addEventListener('click', () => {
          showImageInModal(entry.img.toString());
        });

        if (entry.audio) {
          audioElement.src = entry.audio.toString();
          audioCell.appendChild(audioElement);
        }

        titleCell.innerHTML = entry.title;
        descCell.innerHTML = entry.description;

        //Drawing the checkpoints on the map
        const feature = new ol.Feature({
          geometry: new ol.geom.Point([checkpoint.lng, checkpoint.lat]),
          title: checkpoint.title,
        });

        vectorSource.addFeature(feature);
      }
      entries.appendChild(entriesTable);
    })
    .catch((error) => {
      console.log('no data has been found.', error);
    });
}

loadCheckpoints();
