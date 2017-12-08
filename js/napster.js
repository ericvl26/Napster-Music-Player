(function() { // protect the lemmings!

    /*******************
        PLAYLIST MANAGEMENT
    ********************/

    const PlaylistManager = {};

    // this array will store the trackIds for all the
    // chosen songs by user
    PlaylistManager.tracks = [];

    // this number will refer to the CURRENT song
    // since our tracks variable is an array, current song
    // is really just an index of that array
    PlaylistManager.currentSong = 0;

    /*
        @func addTrack
        @param {string} track

        @desc - takes a trackId and
        adds it to the end of the array
        @example - here's how you would use this code:
                   PlaylistManager.addTrack('trackId');
    */
    PlaylistManager.addTrack = (track = reqParam()) => {
        PlaylistManager.tracks.push(track);
    }; // PlaylistManager.addTrack

    PlaylistManager.removeById = (trackId) => {
        for (let i = 0; i < PlaylistManager.tracks.length; i++) {
            const track = PlaylistManager.tracks[i];
            if (track.id === trackId) {
                PlaylistManager.tracks.splice(i, 1);

                break;
            }
        }
    }

    /*******************
        GENERAL UTILITY FUNCTIONS
    ********************/

    function reqParam() {
        throw new Error('This is a required param!');
    }

    /*******************
        DATA TASKS
    ********************/

    const NapsterAPI = {};

    // http://api.napster.com/v2.2/search?apikey=YTkxZTRhNzAtODdlNy00ZjMzLTg0MWItOTc0NmZmNjU4Yzk4&query=weezer&type=track
    // key = YzE3ODhkNTctMzg1Yi00MzE2LWEzMmMtNzNlYjcxMmJhYjNh
    // ^^ api url & key

    // @param urlBase {string}
    NapsterAPI.urlBase = 'http://api.napster.com';
    // @param version {number}
    NapsterAPI.version = 'v2.2';
    NapsterAPI.userKey = 'YzE3ODhkNTctMzg1Yi00MzE2LWEzMmMtNzNlYjcxMmJhYjNh';

    /*
        @func urlBuilder
        @returns {string}
    */

    NapsterAPI.getUrlBase = () => {
        const {urlBase, version, userKey} = NapsterAPI;
        return urlBase + '/' + version + '/search?apikey=' + userKey;
    }; // getUrlBase

    /*
        @func getUrlString
        @returns {string}
    */

    NapsterAPI.getUrlString = (endpoint) => {
        return NapsterAPI.getUrlBase() + '&query=' + endpoint + '&type=track';
    }; // getUrlString

    /*
        @func search
        @param {string} q
        @param {string} type
        @returns {Promise}
        @desc - takes a searchQuery and optional
        type arg, returns promise that makes
        call to Spotify API
    */
    NapsterAPI.search = (q = reqParam()) => {
        // search?q=adele&type=track
        return new Promise((resolve, reject) => {
            const url = NapsterAPI.getUrlString(q);

            const http = new XMLHttpRequest();
            http.open('GET', url);

            http.onload = () => {
                const data = JSON.parse(http.responseText);
                console.log(data);
                resolve(data);
            };

            http.send();
        });
    }; // NapsterAPI.search


    /*
        UI TASKS
    */

    const validateSearch = (value) => {
        return new Promise((resolve, reject) => {
            if (value.trim() === "") {
                reject('Input a value');
            }

            resolve(value);
        });
    };

    // both should call the *same* function
    // that runs NapsterAPI.search
    // the results are then added to a div or something
    // that lives below your input fields

    // OPTIONAL: you can build your UI task functions in the same
    // way we built the PlaylistManager and NapsterAPI tasks

    const button = document.querySelector('.js-search');
    const input = document.querySelector('.js-input');
    const results = document.querySelector('.js-result');
    const playlist = document.querySelector('.js-playlist');

    const autoPlayNext = () => {
        const audio = document.getElementsByTagName('audio');
        // const $audio = $('audio');

        //Create listeners
        for (var i = 0; i < audio.length; i++) {
            // $('audio[i]').replaceWith($('audio[i]').clone());
            audioListeners(i);

            // pauses all other tracks when another track is played.
            $(audio[i]).on('play', function(event) {
                for (var y = 0; y < audio.length; y++) {
                    if (audio[y] != event.target) {
                       audio[y].pause(); 
                       audio[y].currentTime = 0; 
                    }  
                }
            });
        }

        function audioListeners(i) {
            //Remove any event handlers..if they exist.  Reset*
            $(audio[i]).off();

            // Add listener to auto play next track
            $(audio[i]).on('ended', function() {
              audio[i+1].play();
              audio[i].currentTime = 0; 
            });
        }
    };

    const getCardMarkup = (album, artist, trackName, previewURL, albumId, trackId, isDimmed) => {
        let html = `
            <div class="container">
                <div class="row">
                    <div class="image col-4">
                        <img src="http://direct.rhapsody.com/imageserver/v2/albums/${albumId}/images/150x150.jpg">
                    </div>
                    <div class="content col-8">
                        <a class="header">${trackName}</a>
                        <div class="meta">${album}</div>
                        <div class="meta">${artist}</div>
                    </div>
                </div>
            </div>
        `;

        if (isDimmed) {
            html += `<div class="ui dimmer transition visible active" style="display: block !important;"></div>`;
        }

        return html;
    }

    const getPlaylistCardMarkup = (album, artist, trackName, previewURL, albumId, trackId) => {
        let html = `
            <div class="container">
                <div class="row">
                    <div class="pl-image col-2">
                        <img src="http://direct.rhapsody.com/imageserver/v2/albums/${albumId}/images/150x150.jpg">
                    </div>
                    <div class="col-10">
                        <a class="header">${trackName}</a>
                        <div class="meta">${artist} - ${album}</div>
                    </div>
                </div>
            </div>
            <div>
                <audio controls style="width: 100%;">
                    <source src="${previewURL}">
                </audio>
            </div>
        `;
        return html;
    }

    const runSearchQuery = () => {
        const {value} = input;

        validateSearch(value)
            .then((query) => {
                console.log('about to search for: ', query);

                input.value = '';
                input.setAttribute('disabled', 'disabled');
                button.setAttribute('disabled', 'disabled');

                return NapsterAPI.search(query);
            })
            .then((data) => {
                // bring back the input fields
                input.removeAttribute('disabled');
                button.removeAttribute('disabled');
                // clear search results
                results.innerHTML = "";
                // append new results
                const tracks = data.search.data.tracks;
                for(const track of tracks) {

                    // const {name, url, album} = album;
                    // ^^^^ simpler version of the below set of lines
                    // const name = track.name
                    // const preview_url = track.preview_url
                    // const id = track.id
                    // const album = track.album

                    const album = track.albumName;
                    const artist = track.artistName;
                    const trackName = track.name;
                    const previewURL = track.previewURL;
                    const albumId = track.albumId;
                    const id = track.id;
                    const trackId = id.replace('.', '');

                    let isDimmed = false;

                    const div = document.createElement('div');
                    const html = getCardMarkup(album, artist, trackName, previewURL, albumId, trackId, isDimmed);
                    div.classList.add('ui', 'card', 'dimmable');
                    div.innerHTML = html;
                    results.appendChild(div);

                    div.addEventListener('click',() => {
                        // this is adding to playlist
                        if (isDimmed === false) {
                            isDimmed = true;
                            PlaylistManager.addTrack(track);

                            const playlistTrack = document.createElement('div');
                            playlistTrack.id = trackId;
                            playlistTrack.classList.add('ui', 'card');
                            playlistTrack.innerHTML = getPlaylistCardMarkup(album, artist, trackName, previewURL, albumId, trackId);
                            playlist.appendChild(playlistTrack)
                            console.log('adding track --', PlaylistManager.tracks)

                            // const $trackAudio = $('audio:last');
                            // console.log($trackAudio);

                            // $trackAudio.on('play', function() {
                            //     const $audios = $('audios');
                            //     for (audio of audios) {
                            //         audio.stop();
                            //     }
                            // });                           
   


                        }
                        else {
                            isDimmed = false;
                            // playlist.removeChild(document.querySelector('.' + trackId))
                            // PlaylistManager.removeById(trackId);

                            var item = document.getElementById(trackId);
                            item.parentNode.removeChild(item);

                            console.log('removing track --', PlaylistManager.tracks)
                        }

                        autoPlayNext();
                        div.innerHTML = getCardMarkup(album, artist, trackName, previewURL, albumId, trackId, isDimmed);
                    })
                    // console.log(html)
                }

                // console.log(tracks)
            })
            .catch((e) => {
                alert(e);
            });
    }

    button.addEventListener('click', (e) => runSearchQuery());
    // ^^^^ shortcuts
    input.addEventListener('keydown', (e) => {
        const {keyCode, which} = e;
        // ^^^^ equivalent to: const keyCode = e.keyCode
        //                     const which = e.which
        // this is called object destructuring #es6

        if (keyCode === 13 || which === 13) {
           runSearchQuery();
        }
    });



})();
