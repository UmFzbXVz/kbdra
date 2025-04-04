const cjs = new Castjs();

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

const showId = getUrlParameter("show");
console.log(showId);

const mediaData = {
    mediaUrl: showId,
    title: "Titel",
    description: "Her kommer beskrivelsen til at stå",
    releaseDate: "2006-01-19T17:00:00Z",
    posterUrl: "" 
};

function updateMetadata() {
    document.getElementById('title').innerText = mediaData.title || '';
    document.getElementById('description').innerText = mediaData.description || '';
    document.getElementById('releaseDate').innerText = mediaData.releaseDate ? `${new Date(mediaData.releaseDate).toLocaleDateString()}` : '';
    const posterElement = document.getElementById('poster');
    if (mediaData.posterUrl) {
        posterElement.src = mediaData.posterUrl;
    } else {
        posterElement.style.display = 'none'; 
    }
}

function initializeCast() {
    cjs.on('available', () => {
        document.getElementById('state').innerText = 'Klar til at caste';
    });

    cjs.on('connect', () => {
        document.getElementById('state').innerText = 'Forbundet til enhed!';
    });

    cjs.on('disconnect', () => {
        document.getElementById('state').innerText = 'Frakoblet enhed.';
    });

    cjs.on('statechange', () => {
        console.log('State-ændring til', cjs.state);
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
    });

    cjs.on('pause', () => {
        document.getElementById('play').classList.replace('fa-pause', 'fa-play');
    });

    cjs.on('error', (error) => {
        console.error('Error:', error);
        document.getElementById('state').innerText = 'Error: ' + error.message;
    });
}

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

updateMetadata();
initializeCast();



