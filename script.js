if (!window.globalAppointments) {
    window.globalAppointments = [];
}

(function initStorage() {
    try {
        if (window.name && window.name.startsWith('{')) {
            const data = JSON.parse(window.name);
            if (data.appointments && Array.isArray(data.appointments)) {
                window.globalAppointments = data.appointments;
            }
        }
    } catch (e) {
        console.log('Initializing fresh storage');
    }
})();

function loadAppointments() {
    try {
        if (window.name && window.name.startsWith('{')) {
            const data = JSON.parse(window.name);
            if (data.appointments) {
                window.globalAppointments = data.appointments;
                return data.appointments;
            }
        }
    } catch (e) {
        console.log('Error loading appointments');
    }
    return window.globalAppointments || [];
}

function saveAppointment(appointment) {
    const appointments = loadAppointments();
    appointments.push(appointment);
    window.globalAppointments = appointments;

    try {
        window.name = JSON.stringify({ appointments: appointments });
    } catch (e) {
        console.log('Error saving appointments');
    }
}

function getAllAppointments() {
    return loadAppointments();
}

function deleteAppointment(id) {
    const appointments = loadAppointments();
    const filteredAppointments = appointments.filter(apt => apt.id !== id);
    window.globalAppointments = filteredAppointments;
    
    try {
        window.name = JSON.stringify({ appointments: filteredAppointments });
    } catch (e) {
        console.log('Error deleting appointment');
    }
    
    return true;
}

// Hamburger Menu
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Set minimum date for appointment (today)
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Update available time slots based on selected date
const timeSelect = document.getElementById('time');

if (dateInput && timeSelect) {
    dateInput.addEventListener('change', function() {
        updateAvailableTimeSlots();
    });
}

function updateAvailableTimeSlots() {
    const selectedDate = document.getElementById('date').value;
    const timeSelect = document.getElementById('time');
    
    if (!selectedDate || !timeSelect) return;
    
    const allAppointments = loadAppointments();
    const bookedTimes = allAppointments
        .filter(apt => apt.date === selectedDate)
        .map(apt => apt.time);
    
    // Get all time options
    const timeOptions = timeSelect.querySelectorAll('option');
    
    timeOptions.forEach(option => {
        if (option.value === '') return; // Skip the placeholder option
        
        if (bookedTimes.includes(option.value)) {
            option.disabled = true;
            option.textContent = option.value + ' (Foglalt)';
            option.style.color = '#999';
        } else {
            option.disabled = false;
            option.textContent = option.value;
            option.style.color = '';
        }
    });
    
    // Reset selection if currently selected time is now booked
    if (bookedTimes.includes(timeSelect.value)) {
        timeSelect.value = '';
    }
}

// Form submission handler
const appointmentForm = document.getElementById('appointmentForm');
if (appointmentForm) {
    appointmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            id: Date.now(),
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            service: document.getElementById('service').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            notes: document.getElementById('notes').value.trim(),
            timestamp: new Date().toISOString()
        };
        
        // Validate name (only letters and spaces)
        const nameRegex = /^[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű\s]{2,50}$/;
        if (!nameRegex.test(formData.name)) {
            showMessage('Kérjük, érvényes nevet adjon meg (csak betűk, 2-50 karakter)!', 'error');
            return;
        }
        
        // Validate phone (numbers, spaces, +, -)
        const phoneRegex = /^[\+]?[0-9\s\-]{9,15}$/;
        if (!phoneRegex.test(formData.phone)) {
            showMessage('Kérjük, érvényes telefonszámot adjon meg!', 'error');
            return;
        }
        
        // Validate that date is not in the past
        const selectedDate = new Date(formData.date + 'T' + formData.time);
        const now = new Date();
        
        if (selectedDate < now) {
            showMessage('Kérjük, válasszon jövőbeli időpontot!', 'error');
            return;
        }
        
        // Check if time slot is already taken
        const allAppointments = loadAppointments();
        const isBooked = allAppointments.some(apt => 
            apt.date === formData.date && apt.time === formData.time
        );
        
        if (isBooked) {
            showMessage('Ez az időpont már foglalt! Kérjük, válasszon másik időpontot.', 'error');
            return;
        }
        
        // Save appointment
        saveAppointment(formData);
        
        // Show success message
        showMessage(`Köszönjük ${formData.name}! Foglalása sikeresen rögzítve: ${formData.date} ${formData.time}`, 'success');
        
        // Reset form
        appointmentForm.reset();
        
        // Update available time slots
        updateAvailableTimeSlots();
        
        // Log for debugging
        console.log('Appointment saved:', formData);
        console.log('Total appointments:', getAllAppointments().length);
    });
}

function showMessage(message, type) {
    const confirmationMessage = document.getElementById('confirmationMessage');
    if (!confirmationMessage) return;
    
    confirmationMessage.textContent = message;
    confirmationMessage.className = `confirmation-message ${type}`;
    
    // Scroll to message
    confirmationMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Hide message after 5 seconds
    setTimeout(() => {
        confirmationMessage.style.display = 'none';
    }, 5000);
}

// Admin page functionality
if (window.location.pathname.includes('admin.html') || document.getElementById('loginSection')) {
    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    
    // Check if already logged in (this session only)
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showDashboard();
    }
    
    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            
            // Simple password check (in production, use proper authentication)
            if (password === 'palfi') {
                sessionStorage.setItem('adminLoggedIn', 'true');
                showDashboard();
            } else {
                alert('Helytelen jelszó!');
            }
        });
    }
    
    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('adminLoggedIn');
            if (loginSection) loginSection.style.display = 'flex';
            if (dashboardSection) dashboardSection.style.display = 'none';
        });
    }
    
    function showDashboard() {
        if (loginSection) loginSection.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'block';
        displayAppointments();
    }
    
    function displayAppointments() {
        const appointmentsList = document.getElementById('appointmentsList');
        if (!appointmentsList) return;
        
        const allAppointments = getAllAppointments();
        
        console.log('Displaying appointments:', allAppointments.length); // Debug
        
        if (allAppointments.length === 0) {
            appointmentsList.innerHTML = '<div class="no-appointments">Még nincsenek foglalások.</div>';
            return;
        }
        
        // Sort appointments by date and time
        allAppointments.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateA - dateB;
        });
        
        appointmentsList.innerHTML = allAppointments.map(apt => `
            <div class="appointment-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>👤 ${apt.name}</h3>
                    <button class="delete-button" onclick="handleDeleteAppointment(${apt.id})">🗑️ Törlés</button>
                </div>
                <div class="appointment-details">
                    <div class="detail-item">
                        <span class="detail-label">📅 Dátum:</span>
                        <span>${apt.date}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🕐 Időpont:</span>
                        <span>${apt.time}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">✂️ Szolgáltatás:</span>
                        <span>${apt.service}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📞 Telefon:</span>
                        <span>${apt.phone}</span>
                    </div>
                    ${apt.email ? `
                    <div class="detail-item">
                        <span class="detail-label">📧 Email:</span>
                        <span>${apt.email}</span>
                    </div>
                    ` : ''}
                    ${apt.notes ? `
                    <div class="detail-item" style="grid-column: 1/-1;">
                        <span class="detail-label">📝 Megjegyzés:</span>
                        <span>${apt.notes}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    
    // Add refresh button functionality
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            displayAppointments();
            showAdminMessage('Foglalások frissítve!', 'success');
        });
    }
}

// Delete appointment handler (global function so it can be called from onclick)
function handleDeleteAppointment(id) {
    if (confirm('Biztosan törölni szeretné ezt a foglalást?')) {
        deleteAppointment(id);
        displayAppointments();
        showAdminMessage('Foglalás sikeresen törölve!', 'success');
    }
}

function showAdminMessage(message, type) {
    const existingMsg = document.querySelector('.admin-message');
    if (existingMsg) existingMsg.remove();
    
    const msg = document.createElement('div');
    msg.className = `admin-message ${type}`;
    msg.textContent = message;
    msg.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#00b894' : '#e74c3c'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

// Add navbar scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(26, 26, 26, 0.98)';
    } else {
        navbar.style.background = 'var(--dark)';
    }
    
    lastScroll = currentScroll;
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Reviews Slider functionality
const reviewsSlider = document.querySelector('.reviews-slider');
if (reviewsSlider) {
    const reviewCards = document.querySelectorAll('.review-card');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('sliderDots');
    let currentSlide = 0;
    let autoPlayInterval;

    // Create dots
    reviewCards.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');

    function updateSlider() {
        reviewCards.forEach((card, index) => {
            card.classList.remove('active');
            if (index === currentSlide) {
                card.classList.add('active');
            }
        });

        dots.forEach((dot, index) => {
            dot.classList.remove('active');
            if (index === currentSlide) {
                dot.classList.add('active');
            }
        });
    }

    function goToSlide(index) {
        currentSlide = index;
        updateSlider();
        resetAutoPlay();
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % reviewCards.length;
        updateSlider();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + reviewCards.length) % reviewCards.length;
        updateSlider();
    }

    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000); // Auto advance every 5 seconds
    }

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoPlay();
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoPlay();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            resetAutoPlay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            resetAutoPlay();
        }
    });

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    reviewsSlider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    reviewsSlider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            nextSlide();
            resetAutoPlay();
        }
        if (touchEndX > touchStartX + 50) {
            prevSlide();
            resetAutoPlay();
        }
    }

    // Start autoplay
    startAutoPlay();

    // Pause autoplay when hovering
    reviewsSlider.addEventListener('mouseenter', () => {
        clearInterval(autoPlayInterval);
    });

    reviewsSlider.addEventListener('mouseleave', () => {
        startAutoPlay();
    });
}
