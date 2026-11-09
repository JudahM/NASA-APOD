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


const quotaEl = document.querySelector('.api-quota');
const hdLink = document.querySelector('.link-hd');
const copyrightItem = document.querySelectorAll('.metadata-item')[1];

const today = new Date().toISOString().split('T')[0];
dateInput.max = today;
dateInput.min = "1995-06-16";

searchForm.addEventListener('submit', (event) => {
    event.preventDefault(); 
    fetchApod(dateInput.value);
});

async function fetchApod(date = '') {
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
        renderData(data);

    } catch (error) {
        showError(error.message);
    } finally {
        setLoadingState(false);
    }
}

function renderData(data) {
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
    alertMessage.style.display = 'flex';
    alertMessage.querySelector('p').textContent = message;
}

function setLoadingState(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
        alertMessage.style.display = 'none';
        submitBtn.innerHTML = '<i class="icon-search"></i> Carregando...';
    } else {
        submitBtn.innerHTML = '<i class="icon-search"></i> Buscar';
    }
}

alertMessage.style.display = 'none';
fetchApod();
