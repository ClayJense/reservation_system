
        // Configuration API
        const API_BASE_URL = 'http://localhost:8000/api';
        
        // Éléments DOM
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const alert = document.getElementById('alert');

        // Gestion des onglets
        function switchTab(tab) {
            const tabButtons = document.querySelectorAll('.tab-button');
            const forms = document.querySelectorAll('.auth-form');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            forms.forEach(form => form.classList.remove('active'));
            
            if (tab === 'login') {
                tabButtons[0].classList.add('active');
                loginForm.classList.add('active');
            } else {
                tabButtons[1].classList.add('active');
                registerForm.classList.add('active');
            }
            
            hideAlert();
        }

        // Affichage des alertes
        function showAlert(message, type) {
            alert.textContent = message;
            alert.className = `alert ${type}`;
            alert.style.display = 'block';
            
            setTimeout(() => {
                hideAlert();
            }, 5000);
        }

        function hideAlert() {
            alert.style.display = 'none';
        }

        // Gestion des boutons de chargement
        function setLoading(button, loading) {
            if (loading) {
                button.classList.add('loading');
                button.disabled = true;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
            }
        }

        // Connexion
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('.submit-btn');
            setLoading(submitBtn, true);
            
            const formData = new FormData(loginForm);
            const data = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Stockage du token et des informations utilisateur
                    localStorage.setItem('auth_token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    
                    showAlert('Connexion réussie ! Redirection...', 'success');
                    
                    setTimeout(() => {
                        // Redirection vers le dashboard client
                        if (result.user.role === 'admin') {
                            window.location.href = '/admin/dashboard';
                        } else {
                            // Connexion réussie
                            window.location.href = 'client/dashboard.html';

                        }
                    }, 1500);
                } else {
                    if (result.errors) {
                        const errorMessages = Object.values(result.errors).flat().join(', ');
                        showAlert(errorMessages, 'error');
                    } else {
                        showAlert(result.message || 'Erreur de connexion', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur:', error);
                showAlert('Erreur de connexion au serveur', 'error');
            } finally {
                setLoading(submitBtn, false);
            }
        });

        // Inscription
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = registerForm.querySelector('.submit-btn');
            setLoading(submitBtn, true);
            
            const formData = new FormData(registerForm);
            
            // Vérification de la confirmation du mot de passe côté client
            const password = formData.get('password');
            const passwordConfirm = formData.get('password_confirmation');
            
            if (password !== passwordConfirm) {
                showAlert('Les mots de passe ne correspondent pas', 'error');
                setLoading(submitBtn, false);
                return;
            }

            const data = {
                nom: formData.get('nom'),
                email: formData.get('email'),
                password: password,
                password_confirmation: passwordConfirm
            };

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Stockage du token et des informations utilisateur
                    localStorage.setItem('auth_token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    
                    showAlert('Inscription réussie ! Redirection...', 'success');
                    
                    setTimeout(() => {
                        // Connexion réussie
                            window.location.href = 'client/dashboard.html';

                    }, 1500);
                } else {
                    if (result.errors) {
                        const errorMessages = Object.values(result.errors).flat().join(', ');
                        showAlert(errorMessages, 'error');
                    } else {
                        showAlert(result.message || 'Erreur lors de l\'inscription', 'error');
                    }
                }
            } catch (error) {
                console.error('Erreur:', error);
                showAlert('Erreur de connexion au serveur', 'error');
            } finally {
                setLoading(submitBtn, false);
            }
        });

        // Vérification si l'utilisateur est déjà connecté
        window.addEventListener('DOMContentLoaded', () => {
            const token = localStorage.getItem('auth_token');
            const user = localStorage.getItem('user');
            
            if (token && user) {
                const userData = JSON.parse(user);
                // Redirection automatique si déjà connecté
                if (userData.role === 'admin') {
                    window.location.href = '/admin/dashboard';
                } else {
                    window.location.href = 'client/dashboard.html';


                }
            }
        });

        // Fonction utilitaire pour les requêtes authentifiées (à utiliser dans d'autres pages)
        function getAuthHeaders() {
            const token = localStorage.getItem('auth_token');
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };
        }

        // Fonction de déconnexion (à utiliser dans d'autres pages)
        async function logout() {
            const token = localStorage.getItem('auth_token');
            
            if (token) {
                try {
                    await fetch(`${API_BASE_URL}/logout`, {
                        method: 'POST',
                        headers: getAuthHeaders()
                    });
                } catch (error) {
                    console.error('Erreur lors de la déconnexion:', error);
                }
            }
            
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
