var APP_DATA = {
  "scenes": [
    {
      "id": "0-lobby",
      "name": "Lobby",
      "levels": [{"tileSize":256,"size":256,"fallbackOnly":true},{"tileSize":512,"size":512},{"tileSize":512,"size":1024},{"tileSize":512,"size":2048}],
      "faceSize": 2048,
      "initialViewParameters": {"yaw":0,"pitch":0,"fov":1.3045929890356736},
      "linkHotspots": [{"yaw":1.351161397145491,"pitch":0.4307484180665142,"rotation":0,"target":"2-servios"}],
      "infoHotspots": []
    },
    {
      "id": "1-portiflio",
      "name": "Portfólio",
      "levels": [{"tileSize":256,"size":256,"fallbackOnly":true},{"tileSize":512,"size":512},{"tileSize":512,"size":1024}],
      "faceSize": 1024,
      "initialViewParameters": {"pitch":0,"yaw":0,"fov":1.5707963267948966},
      "linkHotspots": [{"yaw":3.1050856214418543,"pitch":0.49147626854354876,"rotation":0,"target":"0-lobby"}],
      "infoHotspots": []
    },
    {
      "id": "2-servios",
      "name": "Serviços",
      "levels": [{"tileSize":256,"size":256,"fallbackOnly":true},{"tileSize":512,"size":512},{"tileSize":512,"size":1024},{"tileSize":512,"size":2048}],
      "faceSize": 2048,
      "initialViewParameters": {"pitch":0,"yaw":0,"fov":1.5707963267948966},
      "linkHotspots": [{"yaw":0.30341248141331256,"pitch":0.775389188252479,"rotation":0,"target":"0-lobby"}],
      "infoHotspots": []
    }
  ],
  "name": "ProArqui 3D | Tour Virtual",
  "settings": {"mouseViewMode":"drag","autorotateEnabled":true,"fullscreenButton":true,"viewControlButtons":false}
};