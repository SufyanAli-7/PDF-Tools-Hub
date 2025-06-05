// Main navigation functionality
function navigateToTool(toolPage) {
    // Add a smooth transition effect
    document.body.style.opacity = '0.8';
    document.body.style.transform = 'scale(0.98)';
    document.body.style.transition = 'all 0.3s ease';
    
    // Navigate after a short delay for the animation
    setTimeout(() => {
        window.location.href = toolPage;
    }, 200);
}

// Add loading animation when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add entrance animation to elements
    const toolCards = document.querySelectorAll('.tool-card');
    const header = document.querySelector('.header');
    
    // Animate header
    header.style.opacity = '0';
    header.style.transform = 'translateY(-30px)';
    header.style.transition = 'all 0.6s ease';
    
    setTimeout(() => {
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
    }, 100);
    
    // Add hover sound effect (optional)
    toolCards.forEach(card => {
        if (!card.classList.contains('coming-soon')) {
            card.addEventListener('mouseenter', () => {
                // Subtle scale effect on hover
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        }
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === '1') {
            navigateToTool('image-to-pdf.html');
        } else if (e.key === '2') {
            navigateToTool('merge-pdf.html');
        }
    });
});

// Add a subtle particle effect (optional enhancement)
function createParticleEffect() {
    const particles = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    canvas.style.opacity = '0.1';
    
    document.body.appendChild(canvas);
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        };
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(99, 102, 241, ${particle.opacity})`;
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    for (let i = 0; i < 30; i++) {
        particles.push(createParticle());
    }
    
    animate();
}

// Uncomment the line below to enable particle effect
// createParticleEffect();
