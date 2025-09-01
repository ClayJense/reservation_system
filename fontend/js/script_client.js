// Animation au scroll
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        });

        // Fonction de recherche de vols
        function searchFlights() {
            const depart = document.getElementById('depart').value;
            const arrivee = document.getElementById('arrivee').value;
            const dateDepart = document.getElementById('date-depart').value;
            const dateRetour = document.getElementById('date-retour').value;
            const passagers = document.getElementById('passagers').value;
            const classe = document.getElementById('classe').value;

            if (!depart || !arrivee || !dateDepart) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }

            // Simulation de la recherche
            document.querySelector('.search-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recherche en cours...';
            
            setTimeout(() => {
                alert(`Recherche de vols:\n${depart} → ${arrivee}\nDépart: ${dateDepart}\nRetour: ${dateRetour}\nPassagers: ${passagers}\nClasse: ${classe}\n\nRedirection vers les résultats...`);
                document.querySelector('.search-btn').innerHTML = '<i class="fas fa-search"></i> Rechercher des vols';
            }, 2000);
        }

        // Fonction pour les destinations populaires
        function searchDestination(destination) {
            const destinations = {
                'tokyo': 'Tokyo, Japon',
                'newyork': 'New York, USA',
                'dubai': 'Dubaï, EAU',
                'londres': 'Londres, UK',
                'sydney': 'Sydney, Australie',
                'singapour': 'Singapour'
            };

            document.getElementById('arrivee').value = destinations[destination];
            document.querySelector('.search-form').scrollIntoView({ behavior: 'smooth' });
        }

        // Initialisation des dates
        document.addEventListener('DOMContentLoaded', function() {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            document.getElementById('date-depart').value = tomorrow.toISOString().split('T')[0];
            document.getElementById('date-retour').value = nextWeek.toISOString().split('T')[0];
        });

        // Animation des cartes au scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observer les éléments
        document.querySelectorAll('.feature-card, .destination-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });

        // Gestion du type de voyage
        document.querySelectorAll('input[name="trip"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const dateRetour = document.getElementById('date-retour');
                if (this.value === 'aller-simple') {
                    dateRetour.disabled = true;
                    dateRetour.style.opacity = '0.5';
                } else {
                    dateRetour.disabled = false;
                    dateRetour.style.opacity = '1';
                }
            });
        });