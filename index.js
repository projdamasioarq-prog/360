/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');
  var portfolioActionsElement = document.querySelector('#portfolioActions');
  var portfolioPairs = portfolioActionsElement ? portfolioActionsElement.querySelectorAll('.portfolio-pair') : [];
  var lobbyActionsElement = document.querySelector('#lobbyActions');
  var aboutActionElement = document.querySelector('#aboutAction');
  var aboutPanelElement = document.querySelector('#aboutPanel');
  var aboutCloseElement = document.querySelector('#aboutClose');
  var menuPortfolioElement = document.querySelector('#menuPortfolio');
  var menuAboutElement = document.querySelector('#menuAbout');
  var menuHomeElement = document.querySelector('#menuHome');
  var quickPortfolioElement = document.querySelector('#quickPortfolio');

  // Navegação restaurada da visualização 360 anterior.
  function goToPortfolio() {
    var portfolioScene = findSceneById('1-portiflio');
    if (portfolioScene) switchScene(portfolioScene);
  }
  function goToHome() {
    var homeScene = findSceneById('0-lobby');
    if (homeScene) switchScene(homeScene);
    closeAboutPanel();
  }
  if (menuPortfolioElement) menuPortfolioElement.addEventListener('click', goToPortfolio);
  if (quickPortfolioElement) quickPortfolioElement.addEventListener('click', goToPortfolio);
  if (menuAboutElement) menuAboutElement.addEventListener('click', openAboutPanel);
  if (menuHomeElement) menuHomeElement.addEventListener('click', goToHome);

  // Ações fixas sobre a cena inicial, independentes da câmera 360°.

  // Toda a interface HTML fica numa camada fixa no viewport.
  // O Marzipano permanece isolado em #pano; nenhum controle de tela é filho dele.
  var screenOverlay = document.getElementById('screenOverlay');
  if (!screenOverlay) {
    screenOverlay = document.createElement('div');
    screenOverlay.id = 'screenOverlay';
  }
  document.documentElement.appendChild(screenOverlay);

  var fixedInterfaceSelectors = [
    '.site-header',
    '.quick-actions',
    '#titleBar',
    '#sceneList',
    '#sceneListToggle',
    '#autorotateToggle',
    '#fullscreenToggle',
    '.bottom-note',
    '#viewUp',
    '#viewDown',
    '#viewLeft',
    '#viewRight',
    '#viewIn',
    '#viewOut',
    '#portfolioActions',
    '#lobbyActions',
  ];
  fixedInterfaceSelectors.forEach(function(selector) {
    var element = document.querySelector(selector);
    if (element) screenOverlay.appendChild(element);
  });

  // Mesmo mecanismo do site de referência: o HUD é filho da camada
  // screenOverlay, que fica fora do body e do elemento #pano do Marzipano.
  if (lobbyActionsElement) screenOverlay.appendChild(lobbyActionsElement);
  if (aboutPanelElement) screenOverlay.appendChild(aboutPanelElement);

  // Ações do Lobby: os botões ficam na camada fixa, fora do panorama.
  if (aboutActionElement && aboutPanelElement && aboutCloseElement) {
    aboutActionElement.addEventListener('click', openAboutPanel);
    aboutCloseElement.addEventListener('click', closeAboutPanel);
    aboutPanelElement.addEventListener('click', function(event) {
      if (event.target === aboutPanelElement) closeAboutPanel();
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') closeAboutPanel();
    });
  }

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Create scenes.
  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "https://projdamasioarq-prog.github.io/ProArqui-3D/tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Os marcadores são desenhados na camada fixa usando a posição que
    // ocupam na tela no enquadramento inicial da cena.
    var fixedHotspots = [];
    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      element.classList.add('fixed-scene-hotspot');
      element.setAttribute('data-scene-id', data.id);
      screenOverlay.appendChild(element);
      fixedHotspots.push({ element: element, coordinates: { yaw: hotspot.yaw, pitch: hotspot.pitch } });
    });

    data.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      element.classList.add('fixed-scene-hotspot');
      element.setAttribute('data-scene-id', data.id);
      screenOverlay.appendChild(element);
      fixedHotspots.push({ element: element, coordinates: { yaw: hotspot.yaw, pitch: hotspot.pitch } });
    });

    return {
      data: data,
      scene: scene,
      view: view,
      fixedHotspots: fixedHotspots
    };
  });

  // Cada marcador mantém sua própria posição na tela, calculada a partir
  // do enquadramento inicial da cena. Apenas os marcadores da cena ativa
  // aparecem; os demais ficam ocultos até a respectiva cena ser aberta.
  function positionFixedHotspots(activeScene) {
    if (viewer.updateSize) viewer.updateSize();
    scenes.forEach(function(sceneItem) {
      var isActive = !activeScene || sceneItem === activeScene;
      sceneItem.fixedHotspots.forEach(function(item) {
        if (!isActive) {
          item.element.style.display = 'none';
          return;
        }
      });
      if (!isActive) return;

      var currentParameters = sceneItem.view.parameters();
      sceneItem.view.setParameters(sceneItem.data.initialViewParameters);
      sceneItem.fixedHotspots.forEach(function(item) {
        var point = sceneItem.view.coordinatesToScreen(item.coordinates);
        if (point && isFinite(point.x) && isFinite(point.y)) {
          item.element.style.left = point.x + 'px';
          item.element.style.top = point.y + 'px';
          item.element.style.display = 'block';
        } else {
          item.element.style.display = 'none';
        }
      });
      sceneItem.view.setParameters(currentParameters);
    });
  }

  window.addEventListener('resize', function() {
    window.requestAnimationFrame(function() {
      var active = scenes.filter(function(item) {
        return item.data.id === currentSceneId;
      })[0];
      positionFixedHotspots(active);
    });
  });

  // Set up autorotate, if enabled.
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });
  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }

  // Set handler for autorotate toggle.
  autorotateToggleElement.addEventListener('click', toggleAutorotate);

  // Set up fullscreen mode, if supported.
  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });
    screenfull.on('change', function() {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Set handler for scene list toggle.
  sceneListToggleElement.addEventListener('click', toggleSceneList);

  // Start with the scene list open on desktop.
  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  // Set handler for scene switch.
  scenes.forEach(function(scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    el.addEventListener('click', function() {
      switchScene(scene);
      // On mobile, hide scene list after selecting a scene.
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });

  // DOM elements for view controls.
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  // Dynamic parameters for controls.
  var velocity = 0.7;
  var friction = 3;

  // Associate view controls with elements.
  var controls = viewer.controls();
  controls.registerMethod('upElement',    new Marzipano.ElementPressControlMethod(viewUpElement,     'y', -velocity, friction), true);
  controls.registerMethod('downElement',  new Marzipano.ElementPressControlMethod(viewDownElement,   'y',  velocity, friction), true);
  controls.registerMethod('leftElement',  new Marzipano.ElementPressControlMethod(viewLeftElement,   'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement,  'x',  velocity, friction), true);
  controls.registerMethod('inElement',    new Marzipano.ElementPressControlMethod(viewInElement,  'zoom', -velocity, friction), true);
  controls.registerMethod('outElement',   new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom',  velocity, friction), true);

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function openAboutPanel() {
    if (!aboutPanelElement) return;
    aboutPanelElement.classList.add('is-open');
    aboutPanelElement.setAttribute('aria-hidden', 'false');
    if (aboutCloseElement) aboutCloseElement.focus();
  }

  function closeAboutPanel() {
    if (!aboutPanelElement) return;
    aboutPanelElement.classList.remove('is-open');
    aboutPanelElement.setAttribute('aria-hidden', 'true');
  }

  var currentSceneId = null;

  function switchScene(scene) {
    currentSceneId = scene.data.id;
    stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    window.requestAnimationFrame(function() {
      positionFixedHotspots(scene);
    });
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
    var isLobby = scene.data.id === '0-lobby';
    var isPortfolio = scene.data.id === '1-portiflio';
    if (lobbyActionsElement) {
      lobbyActionsElement.classList.toggle('is-visible', isLobby);
      lobbyActionsElement.style.display = isLobby ? 'block' : 'none';
      lobbyActionsElement.setAttribute('aria-hidden', isLobby ? 'false' : 'true');
    }
    if (!isLobby) closeAboutPanel();
    var fixedHotspots = screenOverlay.querySelectorAll('.fixed-scene-hotspot');
    for (var h = 0; h < fixedHotspots.length; h++) {
      fixedHotspots[h].classList.toggle(
        'is-current',
        fixedHotspots[h].getAttribute('data-scene-id') === scene.data.id
      );
    }
    if (portfolioActionsElement) {
      portfolioActionsElement.classList.toggle('is-visible', isPortfolio);
      portfolioActionsElement.style.display = isPortfolio ? 'block' : 'none';
      // Mantém o primeiro par na posição inicial, sem acompanhar o yaw da câmera.
      for (var i = 0; i < portfolioPairs.length; i++) {
        portfolioPairs[i].classList.add('is-active');
      }
    }
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

  function createLinkHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    // Create image element.
    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    // Set rotation transform.
    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    // Add click event handler.
    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    // Create tooltip element.
    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = 'img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    // Create close element.
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    // Create text element.
    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    // Place header and text into wrapper element.
    wrapper.appendChild(header);
    wrapper.appendChild(text);

    // Create a modal for the hotspot content to appear on mobile mode.
    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);

    var toggle = function() {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    // Show content when hotspot is clicked.
    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

    // Hide content when close icon is clicked.
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element, eventList) {
    var eventList = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel',
                      'wheel', 'mousewheel' ];
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

  // Display the initial scene.
  switchScene(scenes[0]);

})();
