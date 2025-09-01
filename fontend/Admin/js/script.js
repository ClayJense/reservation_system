
        // Configuration API
        const API_BASE = 'http://localhost:8000/api';
        let authToken = localStorage.getItem('admin_token');
        let currentUser = null;

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            if (authToken) {
                verifyToken();
            } else {
                showLogin();
            }
            updateTime();
            setInterval(updateTime, 1000);
        });

        // Gestion de l'authentification
        function verifyToken() {
            fetch(`${API_BASE}/profile`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Token invalide');
            })
            .then(data => {
                if (data.user.role === 'admin') {
                    currentUser = data.user;
                    showDashboard();
                    loadDashboardData();
                } else {
                    showAlert('Accès refusé: Vous devez être administrateur', 'error');
                    showLogin();
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                localStorage.removeItem('admin_token');
                showLogin();
            });
        }

        // Connexion
        document.getElementById('login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('login-btn');
            
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
            
            fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    if (data.user.role !== 'admin') {
                        showAlert('Accès refusé: Vous devez être administrateur', 'error');
                        return;
                    }
                    
                    authToken = data.token;
                    currentUser = data.user;
                    localStorage.setItem('admin_token', authToken);
                    
                    showAlert('Connexion réussie!', 'success');
                    setTimeout(() => {
                        showDashboard();
                        loadDashboardData();
                    }, 1000);
                } else {
                    showAlert(data.message || 'Erreur de connexion', 'error');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showAlert('Erreur de connexion', 'error');
            })
            .finally(() => {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
            });
        });

        // Déconnexion
        function logout() {
            fetch(`${API_BASE}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                }
            })
            .finally(() => {
                localStorage.removeItem('admin_token');
                authToken = null;
                currentUser = null;
                showLogin();
            });
        }

        // Affichage des sections
        function showLogin() {
            document.getElementById('login-page').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
        }

        function showDashboard() {
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            
            if (currentUser) {
                document.getElementById('user-name').textContent = currentUser.nom;
                document.getElementById('user-avatar').textContent = currentUser.nom.charAt(0).toUpperCase();
            }
        }

        function showSection(sectionName) {
            // Masquer toutes les sections
            document.querySelectorAll('.section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Retirer la classe active de tous les liens
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Afficher la section demandée
            document.getElementById(sectionName + '-section').style.display = 'block';
            
            // Ajouter la classe active au lien cliqué
            event.target.classList.add('active');
            
            // Mettre à jour le titre
            const titles = {
                'dashboard': 'Tableau de bord',
                'vols': 'Gestion des vols',
                'reservations': 'Réservations',
                'statistiques': 'Statistiques'
            };
            document.getElementById('page-title').textContent = titles[sectionName];
            
            // Charger les données selon la section
            switch(sectionName) {
                case 'dashboard':
                    loadDashboardData();
                    break;
                case 'vols':
                    loadVols();
                    break;
                case 'reservations':
                    loadReservations();
                    break;
            }
        }

        // Chargement des données du dashboard
        function loadDashboardData() {
            loadStatistiques();
            loadRecentReservations();
        }

        function loadStatistiques() {
            fetch(`${API_BASE}/admin/vols/statistiques`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    console.warn('Endpoint statistiques non disponible');
                    document.getElementById('total-vols').textContent = '0';
                    document.getElementById('vols-mois').textContent = '0';
                    document.getElementById('taux-occupation').textContent = '0%';
                    document.getElementById('revenus-mensuels').textContent = '0€';
                    return;
                }
                return response.json();
            })
            .then(data => {
                if (data) {
                    document.getElementById('total-vols').textContent = data.total_vols || 0;
                    document.getElementById('vols-mois').textContent = data.vols_ce_mois || 0;
                    document.getElementById('taux-occupation').textContent = (data.taux_occupation || 0).toFixed(1) + '%';
                    document.getElementById('revenus-mensuels').textContent = (data.revenus_mensuels || 0).toLocaleString() + '€';
                }
            })
            .catch(error => {
                console.error('Erreur chargement statistiques:', error);
            });
        }

        function loadRecentReservations() {
            fetch(`${API_BASE}/admin/reservations?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('recent-reservations');
                
                if (data.data && data.data.length > 0) {
                    container.innerHTML = `
                        <table>
                            <thead>
                                <tr>
                                    <th>Réservation</th>
                                    <th>Passager</th>
                                    <th>Vol</th>
                                    <th>Statut</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.data.map(reservation => `
                                    <tr>
                                        <td>#${reservation.id}</td>
                                        <td>${reservation.user ? reservation.user.nom : 'N/A'}</td>
                                        <td>${reservation.vol ? reservation.vol.code_vol : 'N/A'}</td>
                                        <td><span class="status-badge status-${reservation.statut}">${reservation.statut}</span></td>
                                        <td>${new Date(reservation.created_at).toLocaleDateString('fr-FR')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                } else {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-ticket-alt"></i>
                            <p>Aucune réservation récente</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Erreur chargement réservations:', error);
                document.getElementById('recent-reservations').innerHTML = `
                    <div class="empty-state">
                        <p>Erreur lors du chargement des réservations</p>
                    </div>
                `;
            });
        }

        // Gestion des vols
        function loadVols() {
            fetch(`${API_BASE}/admin/vols`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('vols-table');
                
                if (data.data && data.data.length > 0) {
                    container.innerHTML = `
                        <table>
                            <thead>
                                <tr>
                                    <th>Code vol</th>
                                    <th>Itinéraire</th>
                                    <th>Départ</th>
                                    <th>Arrivée</th>
                                    <th>Places</th>
                                    <th>Réservations</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.data.map(vol => `
                                    <tr>
                                        <td><strong>${vol.code_vol}</strong></td>
                                        <td>${vol.ville_depart} → ${vol.ville_arrivee}</td>
                                        <td>${new Date(vol.date_depart).toLocaleDateString('fr-FR')}<br><small>${vol.heure_depart}</small></td>
                                        <td>${new Date(vol.date_arrivee).toLocaleDateString('fr-FR')}<br><small>${vol.heure_arrivee}</small></td>
                                        <td>${vol.nombre_places_disponibles}/${vol.nombre_total_places}</td>
                                        <td>${vol.reservations_count || 0}</td>
                                        <td>
                                            <button class="btn btn-warning" onclick="editVol(${vol.id})" style="padding: 0.3rem 0.8rem; margin-right: 0.5rem;">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-danger" onclick="deleteVol(${vol.id})" style="padding: 0.3rem 0.8rem;">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                } else {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-plane"></i>
                            <p>Aucun vol enregistré</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Erreur chargement vols:', error);
                document.getElementById('vols-table').innerHTML = `
                    <div class="empty-state">
                        <p>Erreur lors du chargement des vols</p>
                    </div>
                `;
            });
        }

        // Gestion des réservations
        function loadReservations() {
            const statut = document.getElementById('filter-statut').value;
            let url = `${API_BASE}/admin/reservations`;
            
            if (statut) {
                url += `?statut=${statut}`;
            }
            
            fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('reservations-table');
                
                if (data.data && data.data.length > 0) {
                    container.innerHTML = `
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Passager</th>
                                    <th>Vol</th>
                                    <th>Itinéraire</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.data.map(reservation => `
                                    <tr>
                                        <td>#${reservation.id}</td>
                                        <td>${reservation.user ? reservation.user.nom : 'N/A'}<br><small>${reservation.user ? reservation.user.email : ''}</small></td>
                                        <td><strong>${reservation.vol ? reservation.vol.code_vol : 'N/A'}</strong></td>
                                        <td>${reservation.vol ? `${reservation.vol.ville_depart} → ${reservation.vol.ville_arrivee}` : 'N/A'}</td>
                                        <td>${new Date(reservation.created_at).toLocaleDateString('fr-FR')}</td>
                                        <td><span class="status-badge status-${reservation.statut}">${reservation.statut}</span></td>
                                        <td>
                                            <button class="btn btn-warning" onclick="editReservation(${reservation.id})" style="padding: 0.3rem 0.8rem; margin-right: 0.5rem;">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            ${reservation.statut !== 'annule' ? `
                                                <button class="btn btn-danger" onclick="cancelReservation(${reservation.id})" style="padding: 0.3rem 0.8rem;">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                } else {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-ticket-alt"></i>
                            <p>Aucune réservation trouvée</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Erreur chargement réservations:', error);
                document.getElementById('reservations-table').innerHTML = `
                    <div class="empty-state">
                        <p>Erreur lors du chargement des réservations</p>
                    </div>
                `;
            });
        }

        // Modal gestion
        function showAddVolModal() {
            document.getElementById('add-vol-modal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('add-vol-modal').classList.remove('active');
        }

        // Fonction utilitaire pour récupérer les valeurs des champs
        function getFormValue(selector) {
            const element = document.querySelector(selector);
            return element ? element.value : null;
        }

        // Fonction spécifique pour les champs de classe
        function getClassValue(className) {
            const element = document.querySelector(`input[name="${className}"]`);
            return element ? parseInt(element.value) || 0 : 0;
        }

        // Création d'un nouveau vol - CORRIGÉ
        document.getElementById('add-vol-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Récupération des données du formulaire
            const formData = {
                code_vol: getFormValue('input[name="code_vol"]'),
                ville_depart: getFormValue('input[name="ville_depart"]'),
                ville_arrivee: getFormValue('input[name="ville_arrivee"]'),
                date_depart: getFormValue('input[name="date_depart"]'),
                heure_depart: getFormValue('input[name="heure_depart"]'),
                date_arrivee: getFormValue('input[name="date_arrivee"]'),
                heure_arrivee: getFormValue('input[name="heure_arrivee"]'),
                type_avion: getFormValue('input[name="type_avion"]'),
                nombre_total_places: parseInt(getFormValue('input[name="nombre_total_places"]') || 0),
                // CORRECTION: Utiliser les noms de classe que votre base de données attend
                classes: {
                        eco: getClassValue('eco'),
                        affaires: getClassValue('affaires')
                    }
            };
            
            // Vérification que tous les champs requis sont remplis
            for (const key in formData) {
                if (key !== 'classes' && !formData[key]) {
                    showAlert(`Le champ ${key} est requis`, 'error');
                    return;
                }
            }
            
            console.log('Données envoyées:', formData);
            
            // Envoi de la requête
            fetch(`${API_BASE}/admin/vols`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                console.log('Status:', response.status);
                return response.json().then(data => {
                    return { status: response.status, data: data };
                });
            })
            .then(({ status, data }) => {
                console.log('Réponse complète:', data);
                if (status === 200 || status === 201) {
                    showAlert('Vol créé avec succès!', 'success');
                    closeModal();
                    loadVols();
                    document.getElementById('add-vol-form').reset();
                } else if (status === 422) {
                    const errors = data.errors ? Object.values(data.errors).flat().join(', ') : data.message;
                    showAlert('Erreur de validation: ' + errors, 'error');
                } else {
                    showAlert(data.message || 'Erreur lors de la création', 'error');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showAlert('Erreur réseau: ' + error.message, 'error');
            });
        });

        // Actions sur les vols
        function editVol(id) {
            showAlert('Fonction de modification en cours de développement', 'info');
        }

        function deleteVol(id) {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce vol ?')) {
                fetch(`${API_BASE}/admin/vols/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Accept': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(result => {
                    if (result.message) {
                        showAlert('Vol supprimé avec succès!', 'success');
                        loadVols();
                    } else {
                        showAlert(result.error || 'Erreur lors de la suppression', 'error');
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    showAlert('Erreur lors de la suppression du vol', 'error');
                });
            }
        }

        // Actions sur les réservations
        function editReservation(id) {
            showAlert('Fonction de modification en cours de développement', 'info');
        }

        function cancelReservation(id) {
            if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
                fetch(`${API_BASE}/admin/reservations/${id}/annuler`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Accept': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(result => {
                    if (result.message) {
                        showAlert('Réservation annulée avec succès!', 'success');
                        loadReservations();
                    } else {
                        showAlert('Erreur lors de l\'annulation', 'error');
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    showAlert('Erreur lors de l\'annulation de la réservation', 'error');
                });
            }
        }

        // Utilitaires
        function showAlert(message, type) {
            const alertContainer = document.getElementById('alert-container');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = message;
            
            alertContainer.innerHTML = '';
            alertContainer.appendChild(alert);
            
            setTimeout(() => {
                alert.remove();
            }, 5000);
        }

        function updateTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const dateString = now.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
            
            document.getElementById('current-time').textContent = `${dateString} - ${timeString}`;
        }

        // Fermeture modal avec ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        // Fermeture modal en cliquant à l'extérieur
        document.getElementById('add-vol-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
