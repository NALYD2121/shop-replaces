// Configuration
const API_URL = 'http://localhost:3000/api';
const CHANNEL_IDS = {
    ARME: {
        'AWP MK2': '1339958173125050422',
        'AWP': '1339960807630442537',
        'MM': '1140765599442681876',
        'MM MK2': '1084882482614251550',
        'M60': '1339962316489363600',
        'M60 MK2': '1339962304795771001',
        'CARA SPE MK2': '1339962492494942228',
        'CARA SPE': '1348367385366761493',
        'RPG': '1140765568958464044',
        'HOMING': '1339962232821387367'
    },
    VEHICULE: {
        'DELUXO': '1084884675090190346',
        'OP': '1084884747173499010',
        'OP MK2': '1348366117462216724',
        'SCARAB': '1338167326197022750'
    },
    PERSONNAGE: {
        'FITNESS': '1348367616103944262'
    }
};

// État global
let currentCategory = '';
let currentType = '';
let loadedMods = [];

// Initialisation de la page
async function initModPage(category) {
    // Attendre que le DOM soit complètement chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initModPageInternal(category));
        return;
    }
    await initModPageInternal(category);
}

// Fonction interne d'initialisation
async function initModPageInternal(category) {
    try {
        currentCategory = category;
        
        // Créer la structure de base si elle n'existe pas
        createBaseStructure();
        
        // Initialiser les composants
        await initializeFilters();
        await loadMods();
        setupSearch();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showError('Erreur lors de l\'initialisation de la page');
    }
}

// Création de la structure de base
function createBaseStructure() {
    const main = document.querySelector('main');
    if (!main) return;

    // Vérifier si les conteneurs existent déjà
    if (!document.querySelector('.filters-container')) {
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'filters-container';
        filtersContainer.innerHTML = `
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Rechercher un mod...">
                <i class="fas fa-search"></i>
            </div>
            <div id="filterContainer"></div>
        `;
        main.appendChild(filtersContainer);
    }

    if (!document.getElementById('mods-container')) {
        const modsContainer = document.createElement('div');
        modsContainer.id = 'mods-container';
        modsContainer.className = 'mods-container';
        main.appendChild(modsContainer);
    }
}

// Initialisation des filtres
function initializeFilters() {
    const filterContainer = document.getElementById('filterContainer');
    if (!filterContainer) return;
    
    filterContainer.innerHTML = '';
    
    // Ajout du bouton "Tout voir"
    const allButton = document.createElement('button');
    allButton.className = 'filter-btn active';
    allButton.textContent = 'Tout voir';
    allButton.onclick = () => filterByType('');
    filterContainer.appendChild(allButton);
    
    Object.keys(CHANNEL_IDS[currentCategory]).forEach(type => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.textContent = type;
        button.onclick = () => filterByType(type);
        filterContainer.appendChild(button);
    });
}

// Chargement des mods
async function loadMods() {
    showLoading(true);
    try {
        const url = new URL(`${API_URL}/mods/${currentCategory}`);
        if (currentType) url.searchParams.append('type', currentType);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            loadedMods = data.mods;
            displayMods(data.mods);
        } else {
            throw new Error(data.error || 'Erreur lors du chargement des mods');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de charger les mods');
    } finally {
        showLoading(false);
    }
}

// Fonction utilitaire pour nettoyer le texte
function cleanDisplayText(text) {
    if (!text) return '';
    return text
        .replace(/```diff[\s\S]*?\+ /g, '')
        .replace(/```/g, '')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/^\s+|\s+$/g, '')
        .trim();
}

// Affichage des mods
function displayMods(mods) {
    const container = document.getElementById('mods-container');
    container.innerHTML = '';

    // Ajout du modal pour les images
    if (!document.getElementById('imageModal')) {
        const modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <img id="modalImage" src="" alt="Image en grand format">
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.close-modal').onclick = () => {
            modal.style.display = 'none';
        };
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    if (!mods || mods.length === 0) {
        container.innerHTML = `
            <div class="no-mods">
                <h3>Aucun mod trouvé</h3>
                <p>Essayez de modifier vos filtres ou votre recherche</p>
            </div>
        `;
        return;
    }

    mods.forEach(mod => {
        // Nettoyage des données
        const name = cleanDisplayText(mod.name) || 'Sans nom';
        const type = cleanDisplayText(mod.type) || 'Non catégorisé';
        const description = cleanDisplayText(mod.description) || 'Aucune description disponible';
        const imageUrl = mod.image || 'assets/default-mod.jpg';
        
        // Vérification et nettoyage du lien de téléchargement
        let downloadLink = mod.downloadLink;
        if (!downloadLink || downloadLink === '#') {
            console.warn(`Lien de téléchargement manquant pour le mod: ${name}`);
        }
        // S'assurer que le lien est un lien MediaFire valide
        if (downloadLink && !downloadLink.includes('mediafire.com')) {
            console.warn(`Lien non-MediaFire détecté pour le mod: ${name}`);
        }

        const modCard = document.createElement('div');
        modCard.className = 'mod-card';
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'mod-image-container';
        
        const downloadButton = downloadLink && downloadLink !== '#' 
            ? `<a href="${downloadLink}" class="download-btn" target="_blank" rel="noopener noreferrer">
                 <i class="fas fa-download"></i> Télécharger
               </a>`
            : `<button class="download-btn disabled" disabled>
                 <i class="fas fa-exclamation-circle"></i> Lien indisponible
               </button>`;

        imageContainer.innerHTML = `
            <img src="${imageUrl}" alt="${name}" class="mod-image">
            <div class="mod-overlay">
                <div class="mod-buttons">
                    <button class="view-image-btn">
                        <i class="fas fa-search-plus"></i> Voir l'image
                    </button>
                    ${downloadButton}
                    <a href="https://discord.com/channels/${mod.channelId}" class="discord-btn" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-discord"></i> Discord
                    </a>
                </div>
            </div>
        `;

        const img = imageContainer.querySelector('.mod-image');
        img.onclick = () => {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            modal.style.display = 'flex';
            modalImg.src = imageUrl;
        };

        const viewBtn = imageContainer.querySelector('.view-image-btn');
        viewBtn.onclick = () => {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            modal.style.display = 'flex';
            modalImg.src = imageUrl;
        };

        const modInfo = document.createElement('div');
        modInfo.className = 'mod-info';
        modInfo.innerHTML = `
            <h3 class="mod-title">${name}</h3>
            <div class="mod-type">
                <span class="type-badge">${type}</span>
            </div>
            <p class="mod-description">${description}</p>
            <div class="mod-date">
                <i class="far fa-calendar-alt"></i>
                ${new Date(mod.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}
            </div>
        `;

        modCard.appendChild(imageContainer);
        modCard.appendChild(modInfo);
        container.appendChild(modCard);
    });

    // Ajout du style CSS dynamiquement
    const style = document.createElement('style');
    style.textContent = `
        .mod-item {
            background: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .mod-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .mod-name {
            font-size: 1.5em;
            color: #00f7ff;
            margin: 0;
        }

        .mod-type-badge {
            background: #00f7ff;
            color: black;
            padding: 5px 10px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 0.9em;
        }

        .mod-info {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
        }

        .mod-description-container h4 {
            color: #00f7ff;
            margin: 0 0 10px 0;
        }

        .mod-description {
            color: #ffffff;
            margin: 0;
            line-height: 1.4;
        }

        .mod-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .download-button, .discord-button {
            padding: 8px 15px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            transition: transform 0.2s;
            flex: 1;
            text-align: center;
        }

        .download-button {
            background: #00f7ff;
            color: black;
        }

        .discord-button {
            background: #5865F2;
            color: white;
        }

        .download-button:hover, .discord-button:hover {
            transform: translateY(-2px);
        }

        .download-btn.disabled {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.5);
            cursor: not-allowed;
        }
        .download-btn.disabled:hover {
            transform: none;
        }
    `;
    document.head.appendChild(style);
}

// Filtrage par type
function filterByType(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === (type || 'Tout voir'));
    });
    
    currentType = type;
    loadMods();
}

// Configuration de la recherche
function setupSearch() {
    const searchInput = document.querySelector('.search-box');
    if (!searchInput) return;
    
    let debounceTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Si le champ de recherche est vide, afficher tous les mods
            if (!searchTerm) {
                displayMods(loadedMods);
                return;
            }
            
            // Recherche dans le nom, la description et le type
            const filteredMods = loadedMods.filter(mod => {
                const name = (mod.name || '').toLowerCase();
                const description = (mod.description || '').toLowerCase();
                const type = (mod.type || '').toLowerCase().replace(/```.*?\+/g, '').trim();
                
                return name.includes(searchTerm) || 
                       description.includes(searchTerm) ||
                       type.includes(searchTerm);
            });
            
            displayMods(filteredMods);
            
            // Afficher un message si aucun résultat n'est trouvé
            if (filteredMods.length === 0) {
                const container = document.querySelector('.mod-list');
                container.innerHTML = `
                    <div class="no-mods">
                        <p>Aucun mod trouvé pour "${searchTerm}"</p>
                        <button onclick="loadMods()" class="retry-button">Voir tous les mods</button>
                    </div>
                `;
            }
        }, 300);
    });
}

// Utilitaires
function showLoading(show) {
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    const container = document.querySelector('.mod-list');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button onclick="loadMods()" class="retry-button">Réessayer</button>
        </div>
    `;
} 