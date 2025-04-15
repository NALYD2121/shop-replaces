// Configuration
const API_URL = 'https://worker-production-26e1.up.railway.app/api';
const CHANNEL_IDS = {
    ARME: {
        'AWP MK2': '1339958173125050422',
        'AWP': '1339960807630442537',
        'MM': '1140765599442681876',
        'MM MK2': '1084882482614251550',
        'MUSKET': '1361748945285546066',
        'RPG': '1140765568958464044',
        'HOMING': '1339962232821387367',
        'MG': '1361756925221404692',
        'M60': '1339962316489363600',
        'M60 MK2': '1339962304795771001',
        'CARA SPE MK2': '1339962492494942228',
        'CARA SPE': '1348367385366761493',
        'CARA MK2': '1361748935026413658',
        'CARA': '1361756958163468390',
        'GUSENBERG': '1361756949196308641',
        'AUTRES WEAPONS': '1361757850648580272'
    },
    VEHICULE: {
        'Deluxo': '1084884675090190346',
        'op': '1084884747173499010',
        'op mk2': '1348366117462216724',
        'scarab': '1338167326197022750',
        'AUTRES VEHICLES': '1361757898040016976'
    },
    PERSONNAGE: {
        'Fitness-1': '1348367616103944262',
        'Fitness-2': '1361746869008601150',
        'Beach': '1361748862829854885',
        'Indian': '1361748891589939421',
        'Hiker': '1361748905775202314',
        'Autres PEDS': '1361748924540522636'
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
    allButton.onclick = () => filterByName('');
    filterContainer.appendChild(allButton);
    
    // Utiliser les noms des mods de CHANNEL_IDS pour les filtres
    Object.keys(CHANNEL_IDS[currentCategory]).forEach(modName => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.textContent = modName;
        button.onclick = () => filterByName(modName);
        filterContainer.appendChild(button);
    });
}

// Nouvelle fonction de filtrage par nom
function filterByName(name) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === (name || 'Tout voir'));
    });
    
    if (!name) {
        displayMods(loadedMods);
        return;
    }

    const filteredMods = loadedMods.filter(mod => 
        cleanDisplayText(mod.name).toUpperCase() === name.toUpperCase()
    );
    displayMods(filteredMods);
}

// Chargement des mods
async function loadMods() {
    showLoading(true);
    try {
        console.log("=== DÉBUT CHARGEMENT DES MODS ===");
        console.log("Catégorie:", currentCategory);
        console.log("Type:", currentType);
        
        const url = new URL(`${API_URL}/mods/${currentCategory}`);
        if (currentType) url.searchParams.append('type', currentType);
        
        console.log("URL de la requête:", url.toString());
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            // Nettoyer les données reçues
            loadedMods = data.mods.map(mod => ({
                ...mod,
                name: cleanDisplayText(mod.name).replace('+ ', ''),
                type: cleanDisplayText(mod.type).replace('+ ', ''),
                description: cleanDisplayText(mod.description).replace('+ ', '')
            }));
            
            console.log("Mods nettoyés:", loadedMods);
            displayMods(loadedMods);
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

        // Gestionnaire d'événements amélioré pour le modal
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        };

        modal.querySelector('.close-modal').onclick = closeModal;
        window.onclick = (event) => {
            if (event.target === modal) {
                closeModal();
            }
        };

        // Ajout de l'événement d'échap pour fermer le modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });
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
        
        // Récupération de l'ID du canal Discord
        console.log("Nom du mod avant nettoyage:", name);
        // Nettoyer le nom pour correspondre au format dans CHANNEL_IDS
        const cleanedName = name.replace(/```diff\n\+ /g, '')
                              .replace(/```/g, '')
                              .replace(/\+ /g, '')
                              .trim();
        console.log("Nom du mod après nettoyage:", cleanedName);
        
        const discordChannelId = CHANNEL_IDS[currentCategory][cleanedName] || '';
        console.log("ID du canal trouvé:", discordChannelId, "pour la catégorie:", currentCategory);
        
        const discordButton = discordChannelId 
            ? `<a href="https://discord.gg/rgBCtthN" class="discord-btn" target="_blank" rel="noopener noreferrer">
                 <i class="fab fa-discord"></i> Discord
               </a>`
            : `<button class="discord-btn disabled" disabled>
                 <i class="fab fa-discord"></i> Discord indisponible
               </button>`;

        const downloadLink = mod.downloadLink;
        if (!downloadLink || downloadLink === '#') {
            console.warn(`Lien de téléchargement manquant pour le mod: ${name}`);
        }
        if (downloadLink && !downloadLink.includes('mediafire.com')) {
            console.warn(`Lien non-MediaFire détecté pour le mod: ${name}`);
        }

        const downloadButton = downloadLink && downloadLink !== '#' 
            ? `<a href="${downloadLink}" class="download-btn" target="_blank" rel="noopener noreferrer">
                 <i class="fas fa-download"></i> Télécharger
               </a>`
            : `<button class="download-btn disabled" disabled>
                 <i class="fas fa-exclamation-circle"></i> Lien indisponible
               </button>`;

        const modCard = document.createElement('div');
        modCard.className = 'mod-card';
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'mod-image-container';
        
        imageContainer.innerHTML = `
            <img src="${imageUrl}" alt="${name}" class="mod-image">
            <div class="mod-overlay">
                <div class="mod-buttons">
                    <button class="view-image-btn">
                        <i class="fas fa-search-plus"></i> Voir l'image
                    </button>
                    ${downloadButton}
                    ${discordButton}
                </div>
            </div>
        `;

        const img = imageContainer.querySelector('.mod-image');
        img.onclick = () => {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            modal.style.display = 'flex';
            modalImg.src = imageUrl;
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        };

        const viewBtn = imageContainer.querySelector('.view-image-btn');
        viewBtn.onclick = () => {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            modal.style.display = 'flex';
            modalImg.src = imageUrl;
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        };

        modCard.innerHTML = `
            <div class="mod-content">
                <h3 class="mod-title">${name}</h3>
                <div class="mod-info">
                    <span class="mod-type">${type}</span>
                    <p class="mod-description">${description}</p>
                </div>
            </div>
        `;

        modCard.insertBefore(imageContainer, modCard.firstChild);
        container.appendChild(modCard);
    });

    // Ajout du style CSS dynamiquement
    const style = document.createElement('style');
    style.textContent = `
        .mod-card {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00f7ff;
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            box-shadow: 0 0 15px rgba(0, 247, 255, 0.1);
            backdrop-filter: blur(5px);
            width: 300px;
            margin: 0;
        }

        .mod-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 0 30px rgba(0, 247, 255, 0.3);
        }

        .mod-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                45deg,
                transparent 0%,
                rgba(0, 247, 255, 0.05) 50%,
                transparent 100%
            );
            z-index: 1;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .mod-card:hover::before {
            opacity: 1;
            animation: shine 1.5s infinite;
        }

        @keyframes shine {
            0% {
                background-position: -200% 0;
            }
            100% {
                background-position: 200% 0;
            }
        }

        .mod-image-container {
            position: relative;
            width: 100%;
            height: 170px;
            overflow: hidden;
        }

        .mod-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
            filter: brightness(0.9) contrast(1.1);
        }

        .mod-card:hover .mod-image {
            transform: scale(1.08);
            filter: brightness(1) contrast(1.2);
        }

        .mod-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.2),
                rgba(0, 0, 0, 0.8)
            );
            opacity: 0;
            transition: all 0.4s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
            backdrop-filter: blur(3px);
        }

        .mod-card:hover .mod-overlay {
            opacity: 1;
        }

        .mod-buttons {
            display: flex;
            gap: 12px;
            flex-direction: column;
            align-items: center;
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.3s ease;
        }

        .mod-card:hover .mod-buttons {
            transform: translateY(0);
            opacity: 1;
        }

        .mod-buttons button,
        .mod-buttons a {
            background: rgba(0, 247, 255, 0.9);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            text-decoration: none;
            transition: all 0.3s ease;
            min-width: 200px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            font-size: 1em;
            position: relative;
            overflow: hidden;
        }

        .mod-buttons button::before,
        .mod-buttons a::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
            );
            transition: 0.5s;
        }

        .mod-buttons button:hover::before,
        .mod-buttons a:hover::before {
            left: 100%;
        }

        .mod-buttons .discord-btn {
            background: #5865F2;
            color: white;
        }

        .mod-buttons button:hover,
        .mod-buttons a:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(0, 247, 255, 0.4);
            letter-spacing: 2px;
        }

        .mod-content {
            padding: 25px;
            position: relative;
            z-index: 2;
        }

        .mod-title {
            color: #00f7ff;
            font-size: 1.8em;
            margin: 0 0 15px 0;
            text-shadow: 0 0 8px rgba(0, 247, 255, 0.5);
            position: relative;
            display: inline-block;
        }

        .mod-title::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 50%;
            height: 2px;
            background: #00f7ff;
            transition: width 0.3s ease;
        }

        .mod-card:hover .mod-title::after {
            width: 100%;
        }

        .mod-info {
            background: rgba(0, 247, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #00f7ff;
            position: relative;
            overflow: hidden;
        }

        .mod-info::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                45deg,
                transparent,
                rgba(0, 247, 255, 0.03),
                transparent
            );
            transform: translateX(-100%);
            transition: transform 0.6s ease;
        }

        .mod-card:hover .mod-info::before {
            transform: translateX(100%);
        }

        .mod-type {
            display: inline-block;
            background: linear-gradient(45deg, #00f7ff, #0099ff);
            color: #000;
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 1em;
            font-weight: bold;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            box-shadow: 0 0 10px rgba(0, 247, 255, 0.3);
        }

        .mod-description {
            color: #fff;
            margin: 12px 0 0 0;
            font-size: 1.05em;
            line-height: 1.6;
            opacity: 0.9;
            transition: opacity 0.3s ease;
        }

        .mod-card:hover .mod-description {
            opacity: 1;
        }

        .download-btn.disabled {
            background: rgba(255, 255, 255, 0.1) !important;
            color: rgba(255, 255, 255, 0.5) !important;
            cursor: not-allowed;
            text-transform: none;
            letter-spacing: normal;
        }

        .download-btn.disabled:hover {
            transform: none !important;
            box-shadow: none !important;
            letter-spacing: normal;
        }

        /* Modal styles */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(10px);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .modal.active {
            opacity: 1;
        }

        .modal-content {
            position: relative;
            max-width: 90%;
            max-height: 90vh;
            transform: scale(0.9);
            opacity: 0;
            transition: all 0.3s ease;
        }

        .modal.active .modal-content {
            transform: scale(1);
            opacity: 1;
        }

        .modal img {
            max-width: 100%;
            max-height: 90vh;
            border: 2px solid #00f7ff;
            border-radius: 8px;
            box-shadow: 0 0 30px rgba(0, 247, 255, 0.2);
            object-fit: contain;
        }

        .close-modal {
            position: absolute;
            top: -40px;
            right: -40px;
            color: #00f7ff;
            font-size: 28px;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            border: 2px solid #00f7ff;
        }

        .close-modal:hover {
            transform: rotate(90deg);
            background: #00f7ff;
            color: #000;
        }

        /* Animation pour l'apparition des cartes */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .mod-card {
            animation: fadeInUp 0.6s ease backwards;
        }

        /* Ajustement du conteneur principal pour 4 colonnes */
        .mods-container {
            display: grid;
            grid-template-columns: repeat(4, 300px);
            gap: 30px;
            padding: 30px;
            justify-content: center;
            margin: 0 auto;
            max-width: 1320px;
        }

        /* Responsive design pour les écrans plus petits */
        @media (max-width: 1400px) {
            .mods-container {
                grid-template-columns: repeat(3, 300px);
                max-width: 990px;
            }
        }
        @media (max-width: 1050px) {
            .mods-container {
                grid-template-columns: repeat(2, 300px);
                max-width: 660px;
            }
        }
        @media (max-width: 700px) {
            .mods-container {
                grid-template-columns: 300px;
                max-width: 330px;
            }
        }
    `;
    document.head.appendChild(style);
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
    const container = document.getElementById('mods-container');
    if (!container) {
        console.error('Container des mods non trouvé');
        return;
    }
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button onclick="loadMods()" class="retry-button">Réessayer</button>
        </div>
    `;
} 