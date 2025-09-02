
        // Configuration API
        const API_BASE_URL = 'http://localhost:8000/api';
        
        // État global
        let currentUser = null;
        let reservations = [];

        // Initialisation
        document.addEventListener('DOMContentLoaded', async () => {
            await checkAuth();
            await loadUserData();
            await loadReservations();
            initializeNavigation();
            setMinDateForSearch();
        });

        // Vérification de l'authentification
        async function checkAuth() {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/auth';
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/profile`, {
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error('Token invalide');
                }

                currentUser = await response.json();
                document.getElementById('userName').textContent = currentUser.user.nom;
            } catch (error) {
                console.error('Erreur d\'authentification:', error);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/auth';
            }
        }

        // Headers d'authentification
        function getAuthHeaders() {
            return {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };
        }

        // Chargement des données utilisateur
        async function loadUserData() {
            try {
                const response = await fetch(`${API_BASE_URL}/profile`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    currentUser = data;
                    
                    // Remplir le formulaire de profil
                    document.getElementById('profileNom').value = data.user.nom;
                    document.getElementById('profileEmail').value = data.user.email;
                }
            } catch (error) {
                console.error('Erreur lors du chargement du profil:', error);
            }
        }

        // Chargement des réservations
        async function loadReservations() {
            try {
                const response = await fetch(`${API_BASE_URL}/reservations/historique`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    reservations = data.reservations || [];
                    updateDashboardStats();
                    displayRecentReservations();
                    displayAllReservations();
                }
            } catch (error) {
                console.error('Erreur lors du chargement des réservations:', error);
                document.getElementById('recentReservations').innerHTML = '<p>Aucune réservation trouvée.</p>';
                document.getElementById('reservationsList').innerHTML = '<p>Aucune réservation trouvée.</p>';
            }
        }

        // Mise à jour des statistiques
        function updateDashboardStats() {
            const totalReservations = reservations.length;
            const activeReservations = reservations.filter(r => r.statut === 'confirmee').length;
            const totalFlights = reservations.filter(r => r.statut === 'confirmee').length;

            document.getElementById('totalReservations').textContent = totalReservations;
            document.getElementById('activeReservations').textContent = activeReservations;
            document.getElementById('totalFlights').textContent = totalFlights;
        }

        // Affichage des réservations récentes
        function displayRecentReservations() {
            const recentContainer = document.getElementById('recentReservations');
            const recentReservations = reservations.slice(0, 3);

            if (recentReservations.length === 0) {
                recentContainer.innerHTML = '<p>Aucune réservation récente.</p>';
                return;
            }

            recentContainer.innerHTML = recentReservations.map(reservation => `
                <div class="reservation-card">
                    <div class="reservation-header">
                        <div class="reservation-number">Réservation #${reservation.id}</div>
                        <span class="status-badge status-${getStatusClass(reservation.statut)}">
                            ${getStatusText(reservation.statut)}
                        </span>
                    </div>
                    <div class="flight-route">
                        <div class="airport-info">
                            <div class="airport-code">${reservation.vol?.ville_depart || 'N/A'}</div>
                            <div class="airport-name">Départ</div>
                        </div>
                        <div class="flight-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div class="airport-info">
                            <div class="airport-code">${reservation.vol?.ville_arrivee || 'N/A'}</div>
                            <div class="airport-name">Arrivée</div>
                        </div>
                    </div>
                    <div class="flight-details">
                        <div class="detail-item">
                            <div class="detail-label">Date départ</div>
                            <div class="detail-value">${formatDate(reservation.vol?.date_depart)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Heure départ</div>
                            <div class="detail-value">${reservation.vol?.heure_depart || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Prix total</div>
                            <div class="detail-value">${reservation.prix_total}€</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Passagers</div>
                            <div class="detail-value">${reservation.nombre_passagers}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Classe</div>
                            <div class="detail-value">${reservation.classe || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Créé le</div>
                            <div class="detail-value">${formatDate(reservation.created_at)}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="viewReservation(${reservation.id})">
                            <i class="fas fa-eye"></i> Voir détails
                        </button>
                        ${reservation.statut === 'confirmee' ? `
                            <button class="btn btn-secondary" onclick="cancelReservation(${reservation.id})">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        // Affichage de toutes les réservations
        function displayAllReservations() {
            const container = document.getElementById('reservationsList');

            if (reservations.length === 0) {
                container.innerHTML = '<div class="card"><p>Aucune réservation trouvée.</p></div>';
                return;
            }

            container.innerHTML = reservations.map(reservation => `
                <div class="reservation-card">
                    <div class="reservation-header">
                        <div class="reservation-number">Réservation #${reservation.id}</div>
                        <span class="status-badge status-${getStatusClass(reservation.statut)}">
                            ${getStatusText(reservation.statut)}
                        </span>
                    </div>
                    <div class="flight-route">
                        <div class="airport-info">
                            <div class="airport-code">${reservation.vol?.ville_depart || 'N/A'}</div>
                            <div class="airport-name">Départ</div>
                        </div>
                        <div class="flight-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div class="airport-info">
                            <div class="airport-code">${reservation.vol?.ville_arrivee || 'N/A'}</div>
                            <div class="airport-name">Arrivée</div>
                        </div>
                    </div>
                    <div class="flight-details">
                        <div class="detail-item">
                            <div class="detail-label">Date</div>
                            <div class="detail-value">${formatDate(reservation.vol?.date_depart)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Prix</div>
                            <div class="detail-value">${reservation.prix_total}€</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Passagers</div>
                            <div class="detail-value">${reservation.nombre_passagers}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="viewReservation(${reservation.id})">
                            <i class="fas fa-eye"></i> Voir détails
                        </button>
                        ${reservation.statut === 'confirmee' ? `
                            <button class="btn btn-secondary" onclick="cancelReservation(${reservation.id})">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        // Recherche de vols
        document.getElementById('flightSearchForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const searchData = {
    ville_depart: formData.get('ville_depart'),
    ville_arrivee: formData.get('ville_arrivee'),
    date_depart: formData.get('date_depart'),
    date_retour: formData.get('date_retour'),
    adultes: parseInt(formData.get('adultes')) || 1,
    enfants: parseInt(formData.get('enfants')) || 0,
    bebes: parseInt(formData.get('bebes')) || 0,
    classe: formData.get('classe')
};
console.log('Données de recherche:', searchData);


            showLoading('flightResults');
            document.getElementById('searchResults').style.display = 'block';

            try {
                const response = await fetch(`${API_BASE_URL}/rechercher-vols`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(searchData)
                });

                const data = await response.json();

                if (response.ok && data.vols) {
                    displayFlightResults(data.vols);
                } else {
                    document.getElementById('flightResults').innerHTML = 
                        '<p>Aucun vol trouvé pour ces critères.</p>';
                }
            } catch (error) {
                console.error('Erreur lors de la recherche:', error);
                document.getElementById('flightResults').innerHTML = 
                    '<p>Erreur lors de la recherche. Veuillez réessayer.</p>';
            }
        });

        // Affichage des résultats de recherche
        function displayFlightResults(flights) {
            const container = document.getElementById('flightResults');
            
            if (flights.length === 0) {
                container.innerHTML = '<p>Aucun vol disponible pour ces critères.</p>';
                return;
            }

            container.innerHTML = flights.map(flight => `
                <div class="flight-card">
                    <div class="flight-header">
                        <div class="flight-route">
                            <div class="airport-info">
                                <div class="airport-code">${flight.ville_depart}</div>
                                <div class="airport-name">${flight.aeroport_depart || 'Départ'}</div>
                                <div class="airport-name">${flight.heure_depart}</div>
                            </div>
                            <div class="flight-arrow">
                                <i class="fas fa-plane"></i>
                            </div>
                            <div class="airport-info">
                                <div class="airport-code">${flight.ville_arrivee}</div>
                                <div class="airport-name">${flight.aeroport_arrivee || 'Arrivée'}</div>
                                <div class="airport-name">${flight.heure_arrivee}</div>
                            </div>
                        </div>
                        <div class="flight-price">
                            <div class="price">${flight.prix}€</div>
                            <div class="price-label">par personne</div>
                        </div>
                    </div>
                    <div class="flight-details">
                        <div class="detail-item">
                            <div class="detail-label">Compagnie</div>
                            <div class="detail-value">${flight.compagnie_aerienne}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Durée</div>
                            <div class="detail-value">${flight.duree || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Places disponibles</div>
                            <div class="detail-value">${flight.places_disponibles}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Date</div>
                            <div class="detail-value">${formatDate(flight.date_depart)}</div>
                        </div>
                    </div>
                    <button class="book-btn" onclick="bookFlight(${flight.id})">
                        Réserver ce vol
                    </button>
                </div>
            `).join('');
        }

        // Réservation d'un vol
        async function bookFlight(flightId) {
            const formData = new FormData(document.getElementById('flightSearchForm'));
            
            const reservationData = {
                vol_id: flightId,
                nombre_passagers: parseInt(formData.get('passagers')),
                classe: formData.get('classe')
            };

            try {
                const response = await fetch(`${API_BASE_URL}/reservations`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(reservationData)
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Réservation créée avec succès !', 'success');
                    await loadReservations();
                    showSection('reservations');
                } else {
                    showAlert(data.message || 'Erreur lors de la réservation', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la réservation:', error);
                showAlert('Erreur de connexion', 'error');
            }
        }

        // Voir les détails d'une réservation
        async function viewReservation(reservationId) {
            try {
                const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
                    headers: getAuthHeaders()
                });

                const data = await response.json();

                if (response.ok) {
                    // Ici vous pouvez ouvrir une modale ou naviguer vers une page de détails
                    showAlert('Fonctionnalité de détails à implémenter', 'success');
                } else {
                    showAlert('Erreur lors du chargement des détails', 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showAlert('Erreur de connexion', 'error');
            }
        }

        // Annuler une réservation
        async function cancelReservation(reservationId) {
            if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Réservation annulée avec succès', 'success');
                    await loadReservations();
                } else {
                    showAlert(data.message || 'Erreur lors de l\'annulation', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'annulation:', error);
                showAlert('Erreur de connexion', 'error');
            }
        }

        // Mise à jour du profil
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const password = formData.get('password');
            const passwordConfirm = formData.get('password_confirmation');

            // Vérification des mots de passe
            if (password && password !== passwordConfirm) {
                showAlert('Les mots de passe ne correspondent pas', 'error');
                return;
            }

            const updateData = {
                nom: formData.get('nom'),
                email: formData.get('email')
            };

            if (password) {
                updateData.password = password;
                updateData.password_confirmation = passwordConfirm;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/profile`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(updateData)
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Profil mis à jour avec succès', 'success');
                    document.getElementById('userName').textContent = updateData.nom;
                    document.getElementById('profilePassword').value = '';
                    document.getElementById('profilePasswordConfirm').value = '';
                } else {
                    if (data.errors) {
                        const errorMessages = Object.values(data.errors).flat().join(', ');
                        showAlert(errorMessages, 'error');
                    } else {
                        showAlert(data.message || 'Erreur lors de la mise à jour', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour:', error);
                showAlert('Erreur de connexion', 'error');
            }
        });

        // Navigation
        function initializeNavigation() {
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const section = link.getAttribute('data-section');
                    if (section) {
                        e.preventDefault();
                        showSection(section);
                        
                        // Mise à jour de la navigation active
                        navLinks.forEach(l => l.classList.remove('active'));
                        link.classList.add('active');
                    }
                });
            });
        }

        function showSection(sectionId) {
            const sections = document.querySelectorAll('.section');
            sections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
        }

        // Fonctions utilitaires
        function formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        }

        function getStatusClass(status) {
            const statusMap = {
                'confirmee': 'confirmed',
                'en_attente': 'pending',
                'annulee': 'cancelled'
            };
            return statusMap[status] || 'pending';
        }

        function getStatusText(status) {
            const statusMap = {
                'confirmee': 'Confirmée',
                'en_attente': 'En attente',
                'annulee': 'Annulée'
            };
            return statusMap[status] || status;
        }

        function showAlert(message, type) {
            const alert = document.getElementById('alert');
            alert.textContent = message;
            alert.className = `alert ${type}`;
            alert.style.display = 'block';
            
            setTimeout(() => {
                alert.style.display = 'none';
            }, 5000);
        }

        function showLoading(containerId) {
            document.getElementById(containerId).innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            `;
        }

        function setMinDateForSearch() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('dateDepart').min = today;
            document.getElementById('dateRetour').min = today;
        }

        // Chargement du profil
        function loadProfile() {
            if (currentUser) {
                document.getElementById('profileNom').value = currentUser.user.nom;
                document.getElementById('profileEmail').value = currentUser.user.email;
                document.getElementById('profilePassword').value = '';
                document.getElementById('profilePasswordConfirm').value = '';
            }
        }

        // Gestion des dates dans le formulaire de recherche
        document.getElementById('dateDepart').addEventListener('change', function() {
            const departDate = this.value;
            const returnDateInput = document.getElementById('dateRetour');
            
            if (departDate) {
                returnDateInput.min = departDate;
                if (returnDateInput.value && returnDateInput.value < departDate) {
                    returnDateInput.value = '';
                }
            }
        });

        // Auto-refresh des données toutes les 5 minutes
        setInterval(async () => {
            await loadReservations();
        }, 300000); // 5 minutes

        // Gestion des erreurs réseau globales
        window.addEventListener('online', () => {
            showAlert('Connexion rétablie', 'success');
        });

        window.addEventListener('offline', () => {
            showAlert('Connexion perdue. Vérifiez votre réseau.', 'error');
        });

        // Validation en temps réel du formulaire de profil
        document.getElementById('profilePassword').addEventListener('input', function() {
            const password = this.value;
            const confirmInput = document.getElementById('profilePasswordConfirm');
            
            if (password) {
                confirmInput.required = true;
                if (password.length < 8) {
                    this.setCustomValidity('Le mot de passe doit contenir au moins 8 caractères');
                } else {
                    this.setCustomValidity('');
                }
            } else {
                confirmInput.required = false;
                this.setCustomValidity('');
            }
        });

        document.getElementById('profilePasswordConfirm').addEventListener('input', function() {
            const password = document.getElementById('profilePassword').value;
            const confirmPassword = this.value;
            
            if (password && confirmPassword) {
                if (password !== confirmPassword) {
                    this.setCustomValidity('Les mots de passe ne correspondent pas');
                } else {
                    this.setCustomValidity('');
                }
            } else {
                this.setCustomValidity('');
            }
        });

        // Gestion du responsive - fermeture automatique du menu mobile
        function handleResize() {
            if (window.innerWidth <= 768) {
                // Mode mobile - ajuster l'interface si nécessaire
                document.body.classList.add('mobile-view');
            } else {
                document.body.classList.remove('mobile-view');
            }
        }

        window.addEventListener('resize', handleResize);
        handleResize(); // Appel initial

        // Sauvegarde automatique des données de recherche
        function saveSearchData() {
            const form = document.getElementById('flightSearchForm');
            const formData = new FormData(form);
            const searchData = {};
            
            for (let [key, value] of formData.entries()) {
                searchData[key] = value;
            }
            
            localStorage.setItem('lastSearch', JSON.stringify(searchData));
        }

        // Restauration des données de recherche
        function restoreSearchData() {
            const savedSearch = localStorage.getItem('lastSearch');
            if (savedSearch) {
                try {
                    const searchData = JSON.parse(savedSearch);
                    const form = document.getElementById('flightSearchForm');
                    
                    Object.keys(searchData).forEach(key => {
                        const input = form.querySelector(`[name="${key}"]`);
                        if (input && searchData[key]) {
                            input.value = searchData[key];
                        }
                    });
                } catch (error) {
                    console.error('Erreur lors de la restauration des données de recherche:', error);
                }
            }
        }

        // Appliquer la restauration des données après le chargement
        window.addEventListener('load', () => {
            restoreSearchData();
        });

        // Sauvegarder les données de recherche avant la soumission
        document.getElementById('flightSearchForm').addEventListener('submit', () => {
            saveSearchData();
        });

        // Fonction pour calculer et afficher la durée estimée du vol
        function calculateFlightDuration(departure, arrival) {
            // Estimation basique basée sur les villes (à améliorer avec une vraie API)
            const distances = {
                'paris-newyork': '8h 30m',
                'paris-tokyo': '12h 15m',
                'paris-london': '1h 20m',
                'paris-dubai': '7h 05m',
                'default': '2h 30m'
            };
            
            const key = `${departure.toLowerCase()}-${arrival.toLowerCase()}`;
            return distances[key] || distances['default'];
        }

        // Amélioration de l'affichage des résultats de vols
        function enhanceFlightDisplay(flight) {
            const duration = calculateFlightDuration(flight.ville_depart, flight.ville_arrivee);
            return {
                ...flight,
                duree: flight.duree || duration
            };
        }

        // Gestion des notifications push (si supportées par le navigateur)
        async function requestNotificationPermission() {
            if ('Notification' in window && 'serviceWorker' in navigator) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('Notifications activées');
                }
            }
        }

        // Notification pour les changements de statut de réservation
        function notifyReservationUpdate(message) {
            if (Notification.permission === 'granted') {
                new Notification('AeroVoyage', {
                    body: message,
                    icon: '/favicon.ico'
                });
            }
        }

        // Export des données de réservation (CSV)
        function exportReservations() {
            if (reservations.length === 0) {
                showAlert('Aucune réservation à exporter', 'error');
                return;
            }

            const csvContent = [
                ['ID', 'Vol', 'Départ', 'Arrivée', 'Date', 'Prix', 'Statut'],
                ...reservations.map(res => [
                    res.id,
                    res.vol?.numero_vol || 'N/A',
                    res.vol?.ville_depart || 'N/A',
                    res.vol?.ville_arrivee || 'N/A',
                    formatDate(res.vol?.date_depart),
                    res.prix_total + '€',
                    getStatusText(res.statut)
                ])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reservations-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

        // Fonction de recherche rapide dans les réservations
        function setupReservationSearch() {
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Rechercher dans mes réservations...';
            searchInput.style.cssText = `
                width: 100%;
                padding: 10px;
                margin-bottom: 20px;
                border: 2px solid #e1e5e9;
                border-radius: 10px;
                font-size: 16px;
            `;

            const reservationsSection = document.getElementById('reservations');
            const pageHeader = reservationsSection.querySelector('.page-header');
            pageHeader.appendChild(searchInput);

            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                filterReservations(query);
            });
        }

        function filterReservations(query) {
            if (!query) {
                displayAllReservations();
                return;
            }

            const filteredReservations = reservations.filter(res => 
                res.vol?.ville_depart?.toLowerCase().includes(query) ||
                res.vol?.ville_arrivee?.toLowerCase().includes(query) ||
                res.vol?.compagnie_aerienne?.toLowerCase().includes(query) ||
                res.statut.toLowerCase().includes(query) ||
                res.id.toString().includes(query)
            );

            displayFilteredReservations(filteredReservations);
        }

        function displayFilteredReservations(filteredReservations) {
            const container = document.getElementById('reservationsList');

            if (filteredReservations.length === 0) {
                container.innerHTML = '<div class="card"><p>Aucune réservation ne correspond à votre recherche.</p></div>';
                return;
            }

            // Utilise la même logique d'affichage que displayAllReservations mais avec les réservations filtrées
            container.innerHTML = filteredReservations.map(reservation => `
                <div class="reservation-card">
                    <div class="reservation-header">
                        <div class="reservation-number">Réservation #${reservation.id}</div>
                        <span class="status-badge status-${getStatusClass(reservation.statut)}">
                            ${getStatusText(reservation.statut)}
                        </span>
                    </div>
                    <div class="flight-route">
                        <div class="airport-info">
                            <div class="airport-code">${reservation.vol?.ville_depart || 'N/A'}</div>
                            <div class="airport-name">Départ</div>
                        </div>
                        <div class="flight-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div class="airport-info">
                            <div class="airport-code">${reservation.vol?.ville_arrivee || 'N/A'}</div>
                            <div class="airport-name">Arrivée</div>
                        </div>
                    </div>
                    <div class="flight-details">
                        <div class="detail-item">
                            <div class="detail-label">Date départ</div>
                            <div class="detail-value">${formatDate(reservation.vol?.date_depart)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Prix total</div>
                            <div class="detail-value">${reservation.prix_total}€</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Statut</div>
                            <div class="detail-value">${getStatusText(reservation.statut)}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="viewReservation(${reservation.id})">
                            <i class="fas fa-eye"></i> Voir détails
                        </button>
                        ${reservation.statut === 'confirmee' ? `
                            <button class="btn btn-secondary" onclick="cancelReservation(${reservation.id})">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        // Initialisation des fonctionnalités supplémentaires
        document.addEventListener('DOMContentLoaded', () => {
            requestNotificationPermission();
            
            // Ajouter le bouton d'export dans la section réservations
            setTimeout(() => {
                const reservationsHeader = document.querySelector('#reservations .page-header');
                if (reservationsHeader) {
                    const exportBtn = document.createElement('button');
                    exportBtn.className = 'btn btn-secondary';
                    exportBtn.innerHTML = '<i class="fas fa-download"></i> Exporter CSV';
                    exportBtn.onclick = exportReservations;
                    exportBtn.style.marginTop = '10px';
                    reservationsHeader.appendChild(exportBtn);
                    
                    // Ajouter la recherche dans les réservations
                    setupReservationSearch();
                }
            }, 1000);
        });

        // Déconnexion
        async function logout() {
            if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                return;
            }

            try {
                await fetch(`${API_BASE_URL}/logout`, {
                    method: 'POST',
                    headers: getAuthHeaders()
                });
            } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
            } finally {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                localStorage.removeItem('lastSearch');
                window.location.href = '/auth';
            }
        }

        // Message de bienvenue personnalisé
        function showWelcomeMessage() {
            if (currentUser && currentUser.user) {
                const hour = new Date().getHours();
                let greeting;
                
                if (hour < 12) {
                    greeting = 'Bonjour';
                } else if (hour < 18) {
                    greeting = 'Bon après-midi';
                } else {
                    greeting = 'Bonsoir';
                }
                
                setTimeout(() => {
                    showAlert(`${greeting} ${currentUser.user.nom} ! Bienvenue dans votre espace AeroVoyage.`, 'success');
                }, 1000);
            }
        }

        // Appel du message de bienvenue après le chargement complet
        window.addEventListener('load', () => {
            setTimeout(showWelcomeMessage, 2000);
        });
