const cjs = new Castjs();

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

const mediaData = {
  mediaUrl: "",
  title: "",
  description: "",
  releaseDate: "",
  posterUrl: ""
};

async function fetchKalturaData(entryId) {
  const requestBody = {
		"1": {
			"service": "session",
			"action": "startWidgetSession",
			"widgetId": "_397"
		},
		"2": {
			"service": "baseEntry",
			"action": "list",
			"ks": "{1:result:ks}",
			"filter": {
				"redirectFromEntryId": entryId
			},
			"responseProfile": {
				"type": 1,
				"fields": "id"
			}
		},
		"3": {
			"service": "baseEntry",
			"action": "getPlaybackContext",
			"entryId": "{2:result:objects:0:id}",
			"ks": "{1:result:ks}",
			"contextDataParams": {
				"objectType": "KalturaContextDataParams",
				"flavorTags": "all"
			}
		},
		"apiVersion": "3.3.0",
		"format": 1,
		"ks": "",
		"clientTag": "html5:v3.14.4",
		"partnerId": 397
	};

  try {
    const response = await fetch("https://api.kaltura.nordu.net/api_v3/service/multirequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data[1] && data[1].objects && data[1].objects.length > 0) {
      const mediaInfo = data[1].objects[0];
      mediaData.title = mediaInfo.name;
      mediaData.description = mediaInfo.description;
      mediaData.posterUrl = "https://vod-cache.kaltura.nordu.net/p/397/sp/39700/thumbnail/entry_id/" + entryId + "/version/100002/height/640/width/640";
      mediaData.duration = mediaInfo.duration;
      updateMetadata();

      console.log(data);
    }
  } catch (error) {
    console.error("Mangler svar fra Kaltura", error);
  }
}

function generateKalturaLink(entryId, flavorId, ext) {
  return `https://api.kltr.nordu.net/p/397/sp/39700/serveFlavor/entryId/${entryId}/flavorId/${flavorId}/name/a.${fileExt}`;
}

function updateMetadata() {
  document.getElementById('title').innerText = mediaData.title || '';
  document.getElementById('description').innerText = mediaData.description || '';
  document.getElementById('releaseDate').innerText = formatPrettyDate(mediaData.releaseDate);
  const posterElement = document.getElementById('poster');
  if (mediaData.posterUrl) {
    posterElement.src = mediaData.posterUrl;
    posterElement.style.display = 'block';
  } else {
    posterElement.style.display = 'none';
  }
}

function initializeCast() {
  disableAllControls();

  cjs.on('available', () => {
    document.getElementById('state').innerText = 'Klar til at caste';
    document.getElementById('cast').disabled = false;
  });

  cjs.on('connect', () => {
    document.getElementById('state').innerText = 'Forbundet til enhed!';
    enableMediaControls();
  });

  cjs.on('disconnect', () => {
    document.getElementById('state').innerText = 'Frakoblet enhed.';
    disableMediaControls();
  });

  cjs.on('statechange', () => {
    handleStateChange(cjs.state);
  });

  cjs.on('timeupdate', () => {
    document.getElementById('time').innerText = cjs.timePretty;
    document.getElementById('duration').innerText = cjs.durationPretty;

    const progress = cjs.progress;
    document.getElementById('range').value = progress;
    document.getElementById('rangeslider').style.width = `${progress}%`;
  });

  cjs.on('playing', () => {
    document.getElementById('play').classList.replace('fa-play', 'fa-pause');
    document.getElementById('play').disabled = false;
  });

  cjs.on('pause', () => {
    document.getElementById('play').classList.replace('fa-pause', 'fa-play');
    document.getElementById('play').disabled = false;
  });

  cjs.on('error', (error) => {
    console.error('Fejl:', error);
    document.getElementById('state').innerText = 'Fejl: ' + error.message;
    disableMediaControls();
  });

  disableAllControls();
}

function enableMediaControls() {
  document.getElementById('play').disabled = false;
  document.getElementById('back').disabled = false;
  document.getElementById('forward').disabled = false;
  document.getElementById('mute').disabled = false;
  document.getElementById('captions').disabled = false;
  document.getElementById('range').disabled = false;
}

function disableMediaControls() {
  document.getElementById('play').disabled = true;
  document.getElementById('back').disabled = true;
  document.getElementById('forward').disabled = true;
  document.getElementById('mute').disabled = true;
  document.getElementById('captions').disabled = true;
  document.getElementById('range').disabled = true;
}

function disableAllControls() {
  disableMediaControls();
  document.getElementById('cast').disabled = true;
}

function handleStateChange(state) {
  switch (state) {
    case 'idle':
    case 'stopped':
      disableMediaControls();
      break;
    case 'playing':
      enableMediaControls();
      break;
    case 'paused':
      enableMediaControls();
      break;
    default:
      break;
  }
}

const descriptionElement = document.getElementById('description');
descriptionElement.addEventListener('click', function() {
  this.classList.toggle('expanded');
});

// Event-listeners til kontrolknapper
document.getElementById('cast').addEventListener('click', () => {
  if (cjs.available) {
    document.getElementById('state').innerText = 'Forsøger at caste...';
    cjs.cast(mediaData.mediaUrl, {
      poster: mediaData.posterUrl,
      title: mediaData.title,
      description: mediaData.description,
      releaseDate: mediaData.releaseDate,
    }).then(() => {
      document.getElementById('state').innerText = 'Casting påbegyndt!';
    }).catch((error) => {
      document.getElementById('state').innerText = 'Casting fejlslået: ' + error.message;
    });
  } else {
    document.getElementById('state').innerText = 'Ingen enheder klar';
  }
});

document.getElementById('play').addEventListener('click', () => {
  if (cjs.paused) {
    cjs.play();
  } else {
    cjs.pause();
  }
});

document.getElementById('back').addEventListener('click', () => {
  const currentTime = cjs.time - 10;
  cjs.seek(currentTime > 0 ? currentTime : 0);
});

document.getElementById('forward').addEventListener('click', () => {
  const currentTime = cjs.time + 10;
  const duration = cjs.duration;
  cjs.seek(currentTime < duration ? currentTime : duration);
});

document.getElementById('mute').addEventListener('click', () => {
  if (cjs.muted) {
    cjs.unmute();
    document.getElementById('mute').classList.replace('fa-volume-mute', 'fa-volume-up');
  } else {
    cjs.mute();
    document.getElementById('mute').classList.replace('fa-volume-up', 'fa-volume-mute');
  }
});

document.getElementById('captions').addEventListener('click', () => {
  const currentSubtitleIndex = cjs.subtitles ? cjs.subtitles.findIndex(sub => sub.active) : -1;
  const nextSubtitleIndex = (currentSubtitleIndex + 1) % cjs.subtitles.length;
  cjs.subtitle(nextSubtitleIndex);
});

document.getElementById('range').addEventListener('input', () => {
  const progress = document.getElementById('range').value;
  const seekTime = (progress / 100) * cjs.duration;
  cjs.seek(seekTime);
});

function uncastDate(compact) {
  const year = compact.slice(0, 4);
  const month = compact.slice(4, 6);
  const day = compact.slice(6, 8);
  const hours = compact.slice(8, 10);
  const minutes = compact.slice(10, 12);
  
  releaseDate = `${year}-${month}-${day}T${hours}:${minutes}:00Z`;

  mediaData.releaseDate = releaseDate;
  return releaseDate;
}

function formatPrettyDate(isoDateStr) {
  const date = new Date(isoDateStr);

  const weekdays = [
    "Søndag", "Mandag", "Tirsdag", "Onsdag",
    "Torsdag", "Fredag", "Lørdag"
  ];

  const months = [
    "januar", "februar", "marts", "april", "maj", "juni",
    "juli", "august", "september", "oktober", "november", "december"
  ];

  const dayName = weekdays[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${dayName} ${day}. ${month} ${year}`;
}


// Initialisering
document.addEventListener("DOMContentLoaded", () => {
  let entryId = getUrlParameter("entryId");
  let flavorId = getUrlParameter("flavorId");
  let fileExt = getUrlParameter("ext");
  let releaseDate = uncastDate(getUrlParameter("d"));
  
  fetchKalturaData(entryId);
  mediaData.mediaUrl = generateKalturaLink(entryId, flavorId, fileExt);
  updateMetadata();
  initializeCast();
});
