// Shared Components Loader
// This script loads the shared header and footer components

function loadSharedComponents() {
    // Determine the correct path based on current location
    const isRootPage = !window.location.pathname.includes('/pages/');
    const basePath = isRootPage ? 'pages/' : '../';
    
    const headerPath = `${basePath}shared/header.html`;
    const footerPath = `${basePath}shared/footer.html`;
    
    // Load shared header
    fetch(headerPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const headerElement = document.getElementById('shared-header');
            if (headerElement) {
                headerElement.innerHTML = data;
                console.log('Shared header loaded successfully');
            }
        })
        .catch(error => console.error('Error loading header:', error));
    
    // Load shared footer
    fetch(footerPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const footerElement = document.getElementById('shared-footer');
            if (footerElement) {
                footerElement.innerHTML = data;
                console.log('Shared footer loaded successfully');
            }
        })
        .catch(error => console.error('Error loading footer:', error));
}

// Load components when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSharedComponents);
} else {
    loadSharedComponents();
}
