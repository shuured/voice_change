const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;


//SkywayAuthTokenクラスを使用して、アクセストークン（token）を生成しています。
//このトークンは、Skywayサーバーへのアクセス権を設定します。
//トークンは特定のアプリケーション（app）、アクション、およびルームへのアクセスを制御します。
const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  scope: {
    app: {
      id: '86ee144b-d9aa-4dd2-979f-9cd2a8e2ed1b',
      turn: true,
      actions: ['read'],
      channels: [
        {
          id: '*',
          name: '*',
          actions: ['write'],
          members: [
            {
              id: '*',
              name: '*',
              actions: ['write'],
              publication: {
                actions: ['write'],
              },
              subscription: {
                actions: ['write'],
              },
            },
          ],
          sfuBots: [
            {
              actions: ['write'],
              forwardings: [
                {
                  actions: ['write'],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}).encode('xHVt32xrCNBaDgfa1HDh3qXJbyxrExgbdSmqI2Gp+zg=');


//このコードブロックは非同期関数として宣言され、即時実行されます。アプリケーションの実行を開始します。
(async () => {
  //const localVideo = document.getElementById('local-video');
  const buttonArea = document.getElementById('button-area');
  const remoteMediaArea = document.getElementById('remote-media-area');
  const roomNameInput = document.getElementById('room-name');

  const myId = document.getElementById('my-id');
  const joinButton = document.getElementById('join');

  const { audio } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  // video.attach(localVideo);
  // await localVideo.play();

  joinButton.onclick = async () => {
    if (roomNameInput.value === '') return;

    const context = await SkyWayContext.Create(token);
    const room = await SkyWayRoom.FindOrCreate(context, {
      type: 'p2p',
      name: roomNameInput.value,
    });
    const me = await room.join();

    myId.textContent = me.id;

    await me.publish(audio);
    //await me.publish(video);

    const subscribeAndAttach = (publication) => {
      if (publication.publisher.id === me.id) return;

      const subscribeButton = document.createElement('button');
      subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
      buttonArea.appendChild(subscribeButton);

      subscribeButton.onclick = async () => {
        const { stream } = await me.subscribe(publication.id);

        let newMedia;
        switch (stream.track.kind) {
          case 'video':
            // newMedia = document.createElement('video');
            // newMedia.playsInline = true;
            // newMedia.autoplay = true;
            // break;
          case 'audio':
            newMedia = document.createElement('audio');
            newMedia.controls = false;
            newMedia.autoplay = true;
            newMedia.id = "audio-check";
            break;
          default:
            return;
        }
        stream.attach(newMedia);
        remoteMediaArea.appendChild(newMedia);
      };
    };

    room.publications.forEach(subscribeAndAttach);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
  };
})();
