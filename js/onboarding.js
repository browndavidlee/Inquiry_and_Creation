export const Onboarding = {
    init() {
        const tourEnabled = localStorage.getItem('tour_enabled') !== 'false';
        if (!tourEnabled) return;
        console.log("Onboarding: System Active.");
        this.checkAndShowTour();
    },
    checkAndShowTour() {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view') || 'welcome';
        // Map 'tool' to 'tool-focus-view' to match onboarding_content.json
        const viewId = view === 'tool' ? 'tool-focus-view' : view + '-view';
        
        if (sessionStorage.getItem('tour-seen-' + viewId)) return;

        const data = window.cognitiveToolkitData.onboarding_content.onboarding[viewId];
        if (data) {
            this.renderOverlay(data, viewId);
        }
    },
    renderOverlay(data, viewId) {
        const main = document.getElementById('main-content');
        if (!main) return;
        const div = document.createElement('div');
        div.className = 'onboarding-toast fade-in';
        div.innerHTML = `
            <div class="onboarding-toast-content">
                <h5><i class="fas fa-compass"></i> ${data.title}</h5>
                <p>${data.text}</p>
                <button class="onboarding-btn-close">Got it</button>
            </div>`;
        main.prepend(div);
        div.querySelector('.onboarding-btn-close').onclick = () => {
            div.classList.add('fade-out');
            sessionStorage.setItem('tour-seen-' + viewId, 'true');
            setTimeout(() => div.remove(), 500);
        };
    }
};
if (window.cognitiveToolkitData) Onboarding.init();