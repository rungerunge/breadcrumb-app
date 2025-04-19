// Initialize App Bridge
const host = new URLSearchParams(window.location.search).get('host');
const config = {
    apiKey: window.apiKey,
    host: host,
    forceRedirect: true
};
const app = window.createApp(config);

// Create authenticated fetch function
const authenticatedFetch = async (uri, options = {}) => {
    try {
        const response = await fetch(uri, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${window.sessionToken}`,
            },
        });
        
        if (response.status === 401) {
            // Redirect to auth if unauthorized
            const authUrl = `/api/auth?shop=${host}`;
            window.location.href = authUrl;
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

// Initialize settings content
const settingsContent = document.getElementById('settings-content');

// Function to load settings
async function loadSettings() {
    try {
        const response = await authenticatedFetch('/api/settings');
        if (!response) return null;
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.settings;
    } catch (error) {
        console.error('Error loading settings:', error);
        document.querySelector('.error-container').style.display = 'block';
        return null;
    }
}

// Function to save settings
async function saveSettings(settings) {
    try {
        const response = await authenticatedFetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });
        
        if (!response) return false;
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

// Function to render settings form
function renderSettingsForm(settings = {}) {
    settingsContent.innerHTML = `
        <div class="Polaris-Page">
            <div class="Polaris-Page__Header Polaris-Page__Header--hasBreadcrumbs Polaris-Page__Header--hasSecondaryActions">
                <div class="Polaris-Page__Title">
                    <h1 class="Polaris-Header-Title">SmartBreadcrumbs Settings</h1>
                </div>
            </div>
            <div class="Polaris-Page__Content">
                <div class="Polaris-Layout">
                    <div class="Polaris-Layout__Section">
                        <div class="Polaris-Card">
                            <div class="Polaris-Card__Header">
                                <h2 class="Polaris-Heading">Breadcrumb Appearance</h2>
                            </div>
                            <div class="Polaris-Card__Section">
                                <div class="Polaris-FormLayout">
                                    <div class="Polaris-FormLayout__Item">
                                        <div class="Polaris-Labelled__LabelWrapper">
                                            <div class="Polaris-Label">
                                                <label class="Polaris-Label__Text">Font Size (px)</label>
                                            </div>
                                        </div>
                                        <div class="Polaris-TextField">
                                            <input type="number" class="Polaris-TextField__Input" id="fontSize" value="${settings.fontSize || '14'}" />
                                        </div>
                                    </div>
                                    <div class="Polaris-FormLayout__Item">
                                        <div class="Polaris-Labelled__LabelWrapper">
                                            <div class="Polaris-Label">
                                                <label class="Polaris-Label__Text">Separator</label>
                                            </div>
                                        </div>
                                        <div class="Polaris-TextField">
                                            <input type="text" class="Polaris-TextField__Input" id="separator" value="${settings.separator || '>'}" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="Polaris-Card" style="margin-top: 2rem;">
                            <div class="Polaris-Card__Header">
                                <h2 class="Polaris-Heading">Mobile Settings</h2>
                            </div>
                            <div class="Polaris-Card__Section">
                                <div class="Polaris-FormLayout">
                                    <div class="Polaris-FormLayout__Item">
                                        <div class="Polaris-Labelled__LabelWrapper">
                                            <div class="Polaris-Choice">
                                                <label class="Polaris-Choice__Label">
                                                    <input type="checkbox" class="Polaris-Choice__Input" id="useSlider" ${settings.useSlider ? 'checked' : ''} />
                                                    <span class="Polaris-Choice__Label">Enable horizontal slider on mobile</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="Polaris-Card" style="margin-top: 2rem;">
                            <div class="Polaris-Card__Header">
                                <h2 class="Polaris-Heading">Custom CSS</h2>
                            </div>
                            <div class="Polaris-Card__Section">
                                <div class="Polaris-FormLayout">
                                    <div class="Polaris-FormLayout__Item">
                                        <div class="Polaris-Labelled__LabelWrapper">
                                            <div class="Polaris-Label">
                                                <label class="Polaris-Label__Text">Desktop CSS</label>
                                            </div>
                                        </div>
                                        <div class="Polaris-TextField Polaris-TextField--multiline">
                                            <textarea class="Polaris-TextField__Input" id="desktopCSS" rows="4">${settings.desktopCSS || ''}</textarea>
                                        </div>
                                    </div>
                                    <div class="Polaris-FormLayout__Item">
                                        <div class="Polaris-Labelled__LabelWrapper">
                                            <div class="Polaris-Label">
                                                <label class="Polaris-Label__Text">Mobile CSS</label>
                                            </div>
                                        </div>
                                        <div class="Polaris-TextField Polaris-TextField--multiline">
                                            <textarea class="Polaris-TextField__Input" id="mobileCSS" rows="4">${settings.mobileCSS || ''}</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="Polaris-PageActions" style="margin-top: 2rem;">
                            <button class="Polaris-Button Polaris-Button--primary" id="saveButton">
                                <span class="Polaris-Button__Content">Save Settings</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add event listener for save button
    document.getElementById('saveButton').addEventListener('click', async () => {
        const newSettings = {
            fontSize: document.getElementById('fontSize').value,
            separator: document.getElementById('separator').value,
            useSlider: document.getElementById('useSlider').checked,
            desktopCSS: document.getElementById('desktopCSS').value,
            mobileCSS: document.getElementById('mobileCSS').value,
        };

        const success = await saveSettings(newSettings);
        if (success) {
            app.toast.show('Settings saved successfully');
        } else {
            app.toast.show('Failed to save settings', { isError: true });
        }
    });
}

// Initialize the app
async function initializeApp() {
    const settings = await loadSettings();
    renderSettingsForm(settings);
}

// Start the app when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp); 