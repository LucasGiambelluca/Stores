/**
 * WIGY COMPETITIVE ANALYSIS PRESENTATION
 * Interactive Slide Navigation & Effects
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentSlideEl = document.getElementById('currentSlide');
    const totalSlidesEl = document.getElementById('totalSlides');
    const progressBar = document.getElementById('progressBar');
    const recipeTabs = document.querySelectorAll('.recipe-tab');
    const recipeContents = document.querySelectorAll('.recipe-content');

    let currentSlide = 0;
    const totalSlides = slides.length;

    // Initialize
    totalSlidesEl.textContent = totalSlides;
    updateSlide();

    // Navigation Functions
    function goToSlide(index) {
        if (index < 0 || index >= totalSlides) return;
        
        slides[currentSlide].classList.remove('active');
        slides[currentSlide].classList.add('prev');
        
        currentSlide = index;
        
        slides.forEach((slide, i) => {
            slide.classList.remove('active', 'prev');
            if (i < currentSlide) {
                slide.classList.add('prev');
            }
        });
        
        slides[currentSlide].classList.add('active');
        updateSlide();
    }

    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1);
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    }

    function updateSlide() {
        currentSlideEl.textContent = currentSlide + 1;
        progressBar.style.width = `${((currentSlide + 1) / totalSlides) * 100}%`;
        
        // Update button states
        prevBtn.style.opacity = currentSlide === 0 ? '0.5' : '1';
        nextBtn.style.opacity = currentSlide === totalSlides - 1 ? '0.5' : '1';
        
        // Trigger animations for current slide elements
        triggerSlideAnimations();
    }

    function triggerSlideAnimations() {
        const currentSlideEl = slides[currentSlide];
        const animatedElements = currentSlideEl.querySelectorAll('.info-card, .widget-category, .gap-card, .dimension-card, .proposal, .step-item');
        
        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.4s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 100 + (index * 80));
        });
    }

    // Event Listeners
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'Escape':
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(totalSlides - 1);
                break;
        }
    });

    // Touch/Swipe Navigation
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }

    // Recipe Tabs Functionality
    recipeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const recipe = tab.dataset.recipe;
            
            // Update tabs
            recipeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content
            recipeContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `recipe-${recipe}`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Dimension Cards Hover Effect
    const dimensionCards = document.querySelectorAll('.dimension-card');
    dimensionCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Stat Cards Counter Animation
    function animateCounters() {
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(stat => {
            const finalValue = stat.textContent;
            const isNumber = !isNaN(parseInt(finalValue));
            
            if (isNumber) {
                const target = parseInt(finalValue);
                let current = 0;
                const increment = target / 30;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        stat.textContent = finalValue;
                        clearInterval(timer);
                    } else {
                        stat.textContent = Math.floor(current);
                    }
                }, 30);
            }
        });
    }

    // Run counter animation when first slide is active
    if (currentSlide === 0) {
        setTimeout(animateCounters, 500);
    }

    // Confetti on CTA Button
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            createConfetti();
        });
    }

    function createConfetti() {
        const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#f59e0b', '#10b981'];
        const confettiCount = 100;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}vw;
                top: -10px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                pointer-events: none;
                z-index: 9999;
                animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
            `;
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }
    }

    // Add confetti animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confettiFall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Parallax effect on cover
    document.addEventListener('mousemove', (e) => {
        if (currentSlide !== 0) return;
        
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        
        const glowingText = document.querySelector('.glowing-text');
        if (glowingText) {
            glowingText.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    });

    // Auto-advance option (disabled by default)
    let autoAdvance = false;
    let autoAdvanceInterval;

    function startAutoAdvance() {
        autoAdvanceInterval = setInterval(() => {
            if (currentSlide < totalSlides - 1) {
                nextSlide();
            } else {
                stopAutoAdvance();
            }
        }, 8000);
    }

    function stopAutoAdvance() {
        clearInterval(autoAdvanceInterval);
        autoAdvance = false;
    }

    // Press 'A' to toggle auto-advance
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'a') {
            autoAdvance = !autoAdvance;
            if (autoAdvance) {
                startAutoAdvance();
                showToast('Auto-avance activado');
            } else {
                stopAutoAdvance();
                showToast('Auto-avance desactivado');
            }
        }
    });

    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(99, 102, 241, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 9999;
            animation: fadeInOut 2s forwards;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 2000);
    }

    // Add toast animation
    const toastStyle = document.createElement('style');
    toastStyle.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
            20% { opacity: 1; transform: translateX(-50%) translateY(0); }
            80% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
    `;
    document.head.appendChild(toastStyle);

    console.log('🕵️ Competitive Spy Presentation Loaded');
    console.log('📋 Controls: ← → Navigate | ESC Home | A Auto-advance');
});
