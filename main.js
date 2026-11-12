const API_KEY = 'z8DqKCrqbdk8kmhQtcPCQbBq8HKj9rtdmWjRRwq6';
const BASE_URL = 'https://api.nasa.gov/planetary/apod';

const searchForm = document.getElementById('date-search-form');
const dateInput = document.querySelector('input[name="apod-date"]');
const titleEl = document.querySelector('.apod-title');
const descriptionEl = document.querySelector('.apod-description');
const dateEl = document.querySelector('time');
const mediaContainer = document.querySelector('.apod-media');
const alertMessage = document.querySelector('.alert-message');
const submitBtn = document.querySelector('.btn-search');
const mediaStatus = document.querySelector('.media-status');
const retryBtn = document.querySelector('.btn-retry');
const prevBtn = document.querySelector('.btn-prev');
const nextBtn = document.querySelector('.btn-next');
const randomBtn = document.querySelector('.btn-random');
let lastRequestedDate = '';
retryBtn.addEventListener('click', () => fetchApod(lastRequestedDate));


const quotaEl = document.querySelector('.api-quota');
const hdLink = document.querySelector('.link-hd');
const copyrightItem = document.querySelectorAll('.metadata-item')[1];

const today = new Date().toISOString().split('T')[0];
dateInput.max = today;
dateInput.value = today;
dateInput.min = "1995-06-16";
let currentDate = today;
const dayInMilliseconds = 24 * 60 * 60 * 1000;

prevBtn.addEventListener('click', () => changeDay(-1));
nextBtn.addEventListener('click', () => changeDay(1));
randomBtn.addEventListener('click', () => {
    const firstDay = Date.parse(`${dateInput.min}T00:00:00Z`);
    const lastDay = Date.parse(`${today}T00:00:00Z`);
    const totalDays = Math.floor((lastDay - firstDay) / dayInMilliseconds) + 1;
    const randomDay = Math.floor(Math.random() * totalDays);
    const date = new Date(firstDay + randomDay * dayInMilliseconds);

    fetchApod(date.toISOString().split('T')[0]);
});

function changeDay(offset) {
    // modelo UTC
    const date = new Date(`${currentDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    const selectedDate = date.toISOString().split('T')[0];

    if (selectedDate < dateInput.min || selectedDate > today) return;

    fetchApod(selectedDate);
}

searchForm.addEventListener('submit', (event) => {
    event.preventDefault(); 
    fetchApod(dateInput.value);
});

async function fetchApod(date = '') {
    lastRequestedDate = date;
    try {
        setLoadingState(true);

        let url = `${BASE_URL}?api_key=${API_KEY}`;
        if (date) url += `&date=${date}`;

        const response = await fetch(url);

        // Extrair o limite de requisições
        const remaining = response.headers.get('X-RateLimit-Remaining');
        if (remaining !== null) {
            quotaEl.innerHTML = `<i class="icon-layers" aria-hidden="true"></i> Consultas restantes: <strong>${remaining}</strong>`;
        }

        if (!response.ok) {
            if (response.status === 400) throw new Error("Data inválida. Verifique o limite de datas.");
            if (response.status === 429) throw new Error("Limite de requisições excedido. Crie sua chave em api.nasa.gov.");
            throw new Error("Falha na rede ou servidor indisponível.");
        }

        const data = await response.json();

        // Se a API antiga devolver a logo, buscar a foto no novo serviço da NASA
        if (data.hdurl && data.hdurl.includes('nasa-logo')) {
            const dateCode = data.date.replaceAll('-', '').slice(2);
            const photoResponse = await fetch(`https://science.nasa.gov/wp-json/wp/v2/apod-basic/${dateCode}`);
            if (!photoResponse.ok) throw new Error('Não foi possível buscar a foto. Tente novamente.');

            const photoData = await photoResponse.json();
            if (!photoData.hdurl || photoData.hdurl.includes('nasa-logo')) {
                throw new Error('Imagem indisponível para esta data.');
            }
            data.hdurl = photoData.hdurl;
        }

        renderData(data);

    } catch (error) {
        showError(error.message);
    } finally {
        setLoadingState(false);
    }
}

function renderData(data) {
    currentDate = data.date;
    dateInput.value = data.date;
    mediaStatus.hidden = true;
    alertMessage.hidden = true;
    alertMessage.style.display = 'none'; 
    titleEl.textContent = data.title;
    descriptionEl.textContent = data.explanation;
    dateEl.textContent = data.date;
    dateEl.dateTime = data.date;

    // Lógica imagem e vídeo
    if (data.media_type === 'video') {
        // Vídeos
        mediaContainer.innerHTML = `<iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>`;
    } else {
        // Para imagens, a foto real fica no hdurl
        if (data.hdurl) {
            mediaContainer.innerHTML = `<img src="${data.hdurl}" alt="${data.title}">`;
        } else {
            // Tratamento caso a imagem não exista
            mediaContainer.innerHTML = `<p style="text-align: center;">Imagem indisponível para esta data.</p>`;
        }
    }

    // Tratamento de campos
    if (data.hdurl) {
        hdLink.href = data.hdurl;
        hdLink.style.display = 'inline';
    } else {
        hdLink.style.display = 'none';
    }

    if (copyrightItem) {
        if (data.copyright) {
            copyrightItem.style.display = 'flex';
            copyrightItem.querySelector('span').textContent = data.copyright;
        } else {
            copyrightItem.style.display = 'none';
        }
    }
}

function showError(message) {
    alertMessage.hidden = false;
    mediaStatus.hidden = false;
    mediaStatus.querySelector('h3').textContent = 'Não foi possível buscar a foto';
    mediaStatus.querySelector('p').textContent = 'Tente novamente em alguns instantes.';
    retryBtn.hidden = false;
    alertMessage.style.display = 'flex';
    alertMessage.querySelector('p').textContent = message;
}

function setLoadingState(isLoading) {
    document.querySelector('.media-panel').setAttribute('aria-busy', String(isLoading));
    retryBtn.disabled = isLoading;
    submitBtn.disabled = isLoading;
    prevBtn.disabled = isLoading || currentDate <= dateInput.min;
    nextBtn.disabled = isLoading || currentDate >= today;
    randomBtn.disabled = isLoading;
    dateInput.disabled = isLoading;
    if (isLoading) {
        alertMessage.hidden = true;
        mediaStatus.hidden = false;
        mediaStatus.querySelector('h3').textContent = 'Buscando a foto...';
        mediaStatus.querySelector('p').textContent = 'Consultando a NASA APOD, aguarde alguns instantes.';
        retryBtn.hidden = true;
        alertMessage.style.display = 'none';
        submitBtn.innerHTML = '<i class="icon-search"></i> Carregando...';
    } else {
        submitBtn.innerHTML = '<i class="icon-search"></i> Buscar';
    }
}

alertMessage.style.display = 'none';
fetchApod();
