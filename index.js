
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

  // Identifica o botão PORTFÓLIO, ignorando acentos e maiúsculas.
  var isPortfolio = (hotspot.title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .includes('PORTFOLIO');

  button.addEventListener('click', function(event) {
    event.preventDefault();
    event.stopPropagation();

    if (isPortfolio) {
      abrirCarrosselPortfolio();
    } else {
      description.hidden = !description.hidden;
      marker.textContent = description.hidden ? '+' : '−';
    }
  });

  wrapper.appendChild(button);
  wrapper.appendChild(description);

  stopTouchAndScrollEventPropagation(wrapper);

  return wrapper;
}


// Cria a galeria apenas uma vez.
var portfolioModal = null;
var portfolioIndice = 0;

var portfolioImagens = [
  {
    src: 'portfolio/projeto-01.jpg',
    titulo: 'Projeto 01'
  },
  {
    src: 'portfolio/projeto-02.jpg',
    titulo: 'Projeto 02'
  },
  {
    src: 'portfolio/projeto-03.jpg',
    titulo: 'Projeto 03'
  },
  {
    src: 'portfolio/projeto-04.jpg',
    titulo: 'Projeto 04'
  }
];

function criarCarrosselPortfolio() {
  if (portfolioModal) return;

  portfolioModal = document.createElement('div');
  portfolioModal.className = 'portfolio-modal';
  portfolioModal.setAttribute('role', 'dialog');
  portfolioModal.setAttribute('aria-modal', 'true');
  portfolioModal.setAttribute('aria-label', 'Portfólio de projetos');

  portfolioModal.innerHTML = `
    <div class="portfolio-window">
      <button class="portfolio-close"
              aria-label="Fechar portfólio">&times;</button>

      <div class="portfolio-heading">
        <span>DAMASIO ARQUITETURA</span>
        <h2>Nosso portfólio</h2>
        <p>Arquitetura · Interiores · Visualização 3D</p>
      </div>

      <div class="portfolio-viewer">
        <button class="portfolio-arrow portfolio-prev"
                aria-label="Imagem anterior">&#10094;</button>

        <img class="portfolio-image"
             src=""
             alt="Projeto de arquitetura">

        <button class="portfolio-arrow portfolio-next"
                aria-label="Próxima imagem">&#10095;</button>
      </div>

      <div class="portfolio-caption">
        <span class="portfolio-image-title"></span>
        <span class="portfolio-counter"></span>
      </div>

      <div class="portfolio-thumbnails"></div>
    </div>
  `;

  document.body.appendChild(portfolioModal);

  portfolioModal.querySelector('.portfolio-close')
    .addEventListener('click', fecharCarrosselPortfolio);

  portfolioModal.querySelector('.portfolio-prev')
    .addEventListener('click', function() {
      mudarImagemPortfolio(-1);
    });

  portfolioModal.querySelector('.portfolio-next')
    .addEventListener('click', function() {
      mudarImagemPortfolio(1);
    });

  portfolioModal.addEventListener('click', function(event) {
    if (event.target === portfolioModal) {
      fecharCarrosselPortfolio();
    }
  });

  var thumbnails = portfolioModal.querySelector('.portfolio-thumbnails');

  portfolioImagens.forEach(function(imagem, indice) {
    var thumb = document.createElement('button');
    thumb.className = 'portfolio-thumb';
    thumb.setAttribute('aria-label', imagem.titulo);

    var img = document.createElement('img');
    img.src = imagem.src;
    img.alt = '';

    thumb.appendChild(img);

    thumb.addEventListener('click', function() {
      portfolioIndice = indice;
      atualizarCarrosselPortfolio();
    });

    thumbnails.appendChild(thumb);
  });
}

function abrirCarrosselPortfolio() {
  criarCarrosselPortfolio();

  portfolioIndice = 0;
  atualizarCarrosselPortfolio();

  portfolioModal.classList.add('portfolio-open');

  // Interrompe a rotação enquanto o visitante vê as imagens.
  if (typeof stopAutorotate === 'function') {
    stopAutorotate();
  }
}

function fecharCarrosselPortfolio() {
  if (!portfolioModal) return;

  portfolioModal.classList.remove('portfolio-open');
}

function mudarImagemPortfolio(direcao) {
  portfolioIndice =
    (portfolioIndice + direcao + portfolioImagens.length)
    % portfolioImagens.length;

  atualizarCarrosselPortfolio();
}

function atualizarCarrosselPortfolio() {
  var imagem = portfolioImagens[portfolioIndice];

  var imageElement =
    portfolioModal.querySelector('.portfolio-image');

  imageElement.src = imagem.src;
  imageElement.alt = imagem.titulo;

  portfolioModal.querySelector('.portfolio-image-title')
    .textContent = imagem.titulo;

  portfolioModal.querySelector('.portfolio-counter')
    .textContent =
      (portfolioIndice + 1) + ' / ' + portfolioImagens.length;

  portfolioModal.querySelectorAll('.portfolio-thumb')
    .forEach(function(thumb, indice) {
      thumb.classList.toggle('active', indice === portfolioIndice);
    });
}

// Navegação pelo teclado.
document.addEventListener('keydown', function(event) {
  if (!portfolioModal ||
      !portfolioModal.classList.contains('portfolio-open')) {
    return;
  }

  if (event.key === 'Escape') {
    fecharCarrosselPortfolio();
  }

  if (event.key === 'ArrowRight') {
    mudarImagemPortfolio(1);
  }

  if (event.key === 'ArrowLeft') {
    mudarImagemPortfolio(-1);
  }
});
