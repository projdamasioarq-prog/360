
/*
 * Marzipano - Damasio Arquitetura
 * Integração do hotspot PORTFÓLIO com o painel do site.
 */
'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  // Modo desktop e celular
  if (window.matchMedia) {
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");

    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };

    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Touch
  document.body.classList.add('no-touch');

  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Criar cenas
  var scenes = data.scenes.map(function(sceneData) {

    var urlPrefix = "tiles";

    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + sceneData.id + "/{z}/{f}/{y}/{x}.jpg",
      {
        cubeMapPreviewUrl:
          urlPrefix + "/" + sceneData.id + "/preview.jpg"
      }
    );

    var geometry = new Marzipano.CubeGeometry(sceneData.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(
      sceneData.faceSize,
      100 * Math.PI / 180,
      120 * Math.PI / 180
    );

    var view = new Marzipano.RectilinearView(
      sceneData.initialViewParameters,
      limiter
    );

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Hotspots
    sceneData.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);

      scene.hotspotContainer().createHotspot(element, {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch
      });
    });

    sceneData.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);

      scene.hotspotContainer().createHotspot(element, {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch
      });
    });

    return {
      data: sceneData,
      scene: scene,
      view: view
    };
  });

  // Rotação automática
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI / 2
  });

  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }

  autorotateToggleElement.addEventListener(
    'click',
    toggleAutorotate
  );

  // Tela cheia
  if (screenfull.enabled && data.settings.fullscreenButton) {

    document.body.classList.add('fullscreen-enabled');

    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });

    screenfull.on('change', function() {
      fullscreenToggleElement.classList.toggle(
        'enabled',
        screenfull.isFullscreen
      );
    });

  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Lista de cenas
  sceneListToggleElement.addEventListener(
    'click',
    toggleSceneList
  );

  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  scenes.forEach(function(scene) {

    var el = document.querySelector(
      '#sceneList .scene[data-id="' + scene.data.id + '"]'
    );

    if (!el) return;

    el.addEventListener('click', function() {
      switchScene(scene);

      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });

  // Controles de visualização
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  var velocity = 0.7;
  var friction = 3;

  var controls = viewer.controls();

  controls.registerMethod(
    'upElement',
    new Marzipano.ElementPressControlMethod(
      viewUpElement, 'y', -velocity, friction
    ),
    true
  );

  controls.registerMethod(
    'downElement',
    new Marzipano.ElementPressControlMethod(
      viewDownElement, 'y', velocity, friction
    ),
    true
  );

  controls.registerMethod(
    'leftElement',
    new Marzipano.ElementPressControlMethod(
      viewLeftElement, 'x', -velocity, friction
    ),
    true
  );

  controls.registerMethod(
    'rightElement',
    new Marzipano.ElementPressControlMethod(
      viewRightElement, 'x', velocity, friction
    ),
    true
  );

  controls.registerMethod(
    'inElement',
    new Marzipano.ElementPressControlMethod(
      viewInElement, 'zoom', -velocity, friction
    ),
    true
  );

  controls.registerMethod(
    'outElement',
    new Marzipano.ElementPressControlMethod(
      viewOutElement, 'zoom', velocity, friction
    ),
    true
  );

  function sanitize(s) {
    return s.replace('&', '&amp;')
      .replace('<', '&lt;')
      .replace('>', '&gt;');
  }

  function switchScene(scene) {
    stopAutorotate();

    scene.view.setParameters(
      scene.data.initialViewParameters
    );

    scene.scene.switchTo();

    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];

      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement.classList.contains('enabled')) {
      return;
    }

    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  // HOTSPOTS E INTEGRAÇÃO COM PORTFÓLIO
  function createInfoHotspotElement(hotspot) {

    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot', 'wall-label-hotspot');

    var button = document.createElement('button');
    button.type = 'button';
    button.classList.add('wall-label-button');

    var marker = document.createElement('span');
    marker.classList.add('wall-label-marker');
    marker.textContent = '+';

    var title = document.createElement('span');
    title.classList.add('wall-label-title');
    title.textContent = hotspot.title || 'Saiba mais';

    button.appendChild(marker);
    button.appendChild(title);

    var description = document.createElement('div');
    description.classList.add('wall-label-description');
    description.textContent = hotspot.text || '';
    description.hidden = true;

    button.addEventListener('click', function(event) {

      event.stopPropagation();

      // CLICOU EM PORTFÓLIO
      if (
        (hotspot.title || '').trim().toUpperCase() === 'PORTFÓLIO'
      ) {

        var portfolioButton = document.querySelector(
          '[data-panel="projetos"]'
        );

        if (portfolioButton) {
          portfolioButton.click();
        }

        return;
      }

      // Outros hotspots continuam funcionando normalmente
      description.hidden = !description.hidden;

      marker.textContent = description.hidden ? '+' : '−';
    });

    wrapper.appendChild(button);
    wrapper.appendChild(description);

    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  function stopTouchAndScrollEventPropagation(element) {

    var eventList = [
      'touchstart',
      'touchmove',
      'touchend',
      'touchcancel',
      'wheel',
      'mousewheel'
    ];

    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) {
        return scenes[i];
      }
    }

    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }

    return null;
  }

  // Inicializar panorama
  switchScene(scenes[0]);

})();
