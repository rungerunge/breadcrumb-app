import React, { useState, useCallback, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  RangeSlider,
  Button,
  Checkbox,
  Banner,
  Stack,
  TextContainer,
  Link,
  Tabs,
  Frame,
  Toast,
  Spinner,
  Text
} from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks';

export default function HomePage() {
  const fetch = useAuthenticatedFetch();
  const [settings, setSettings] = useState({
    fontSize: 14,
    marginTop: 20,
    marginBottom: 20,
    separator: '›',
    mobileSlider: true,
    menuHandles: 'main-menu',
    customCssDesktop: '',
    customCssMobile: '',
    customCssAll: '',
    customCssLast: '',
    customCssHover: '',
    globalOverride: false
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);

  const tabs = [
    {
      id: 'layout-settings',
      content: 'Layout Settings',
      panelID: 'layout-settings-content',
    },
    {
      id: 'custom-css',
      content: 'Custom CSS',
      panelID: 'custom-css-content',
    },
    {
      id: 'help',
      content: 'Help',
      panelID: 'help-content',
    },
    {
      id: 'debug',
      content: 'Debug Info',
      panelID: 'debug-info-content',
    },
  ];

  // Check server connectivity first with retry logic
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await checkServerConnection();
      } catch (err) {
        console.error("Connection check failed", err);
        
        // Retry logic - wait 3 seconds and try again up to 3 times
        if (retryCount < 3) {
          console.log(`Retrying connection (${retryCount + 1}/3) in 3 seconds...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000);
        } else {
          // If still failing after 3 retries, try a fallback approach
          console.log("Retries exhausted, loading default settings");
          setConnectionStatus('failed');
          setSettings({
            fontSize: 14,
            marginTop: 20,
            marginBottom: 20,
            separator: '›',
            mobileSlider: true,
            menuHandles: 'main-menu',
            customCssDesktop: '',
            customCssMobile: '',
            customCssAll: '',
            customCssLast: '',
            customCssHover: '',
            globalOverride: false
          });
          setInitialLoading(false);
        }
      }
    };
    
    checkConnection();
  }, [retryCount]);

  // Only load settings if connection is OK
  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadSettings();
    }
  }, [connectionStatus]);

  const checkServerConnection = async () => {
    try {
      console.log("Checking server health...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
      
      const response = await fetch('/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log("Server health check passed");
        setConnectionStatus('connected');
        return true;
      } else {
        console.error("Server health check failed with status:", response.status);
        throw new Error(`Server returned ${response.status} status`);
      }
    } catch (err) {
      console.error("Server connection error:", err);
      if (err.name === 'AbortError') {
        setError("Connection timed out. Server may be starting up, please wait.");
      } else {
        setError(`Cannot connect to server: ${err.message}`);
      }
      throw err;
    }
  };

  const loadSettings = async () => {
    try {
      console.log("Loading settings from API...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
      
      const response = await fetch('/api/settings', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Settings loaded:", data);
      
      if (data && data.settings) {
        setSettings(data.settings);
      } else {
        console.warn("Received empty or invalid settings from API");
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      if (error.name === 'AbortError') {
        setError("Settings request timed out. Please try again.");
      } else {
        setError(`Failed to load settings: ${error.message}`);
        showToast('Failed to load settings');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        showToast('Settings saved successfully');
      } else {
        throw new Error(`Failed to save settings: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(`Failed to save settings: ${error.message}`);
    }
    setLoading(false);
  };

  const showToast = (content) => {
    setToastContent(content);
    setToastActive(true);
  };

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelectedTab(selectedTabIndex),
    [],
  );

  const toastMarkup = toastActive ? (
    <Toast content={toastContent} onDismiss={() => setToastActive(false)} />
  ) : null;

  if (initialLoading) {
    return (
      <Frame>
        <Page>
          <Layout>
            <Layout.Section>
              <Card sectioned>
                <Stack distribution="center" alignment="center" spacing="loose">
                  <Spinner accessibilityLabel="Loading settings" size="large" />
                  <Text variant="headingMd">Loading Smart Breadcrumbs Settings...</Text>
                  {retryCount > 0 && (
                    <Text variant="bodyMd">Retry attempt {retryCount}/3...</Text>
                  )}
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </Frame>
    );
  }

  if (error) {
    return (
      <Frame>
        <Page title="Smart Breadcrumbs Settings">
          <Layout>
            <Layout.Section>
              <Card sectioned>
                <Banner
                  title="There was a problem loading the app"
                  status="critical"
                >
                  <p>{error}</p>
                  <p>If this is the first time you're running the app, it may take a minute for the server to start.</p>
                  <Stack distribution="center" spacing="tight">
                    <Button primary onClick={() => window.location.reload()}>Reload Page</Button>
                    <Button onClick={() => setRetryCount(0)}>Retry Connection</Button>
                  </Stack>
                </Banner>
                
                <div style={{marginTop: '20px'}}>
                  <Card.Section title="Debug Information">
                    <p>Connection Status: {connectionStatus}</p>
                    <p>Error: {error}</p>
                    <p>Retry Count: {retryCount}/3</p>
                    <p>Time: {new Date().toLocaleString()}</p>
                    <p>Host URL: {window.location.href}</p>
                  </Card.Section>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </Frame>
    );
  }

  return (
    <Frame>
      <Page
        title="Smart Breadcrumbs Settings"
        primaryAction={{
          content: 'Save',
          onAction: handleSave,
          loading: loading,
        }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
                <Card.Section>
                  {selectedTab === 0 && (
                    <FormLayout>
                      <Checkbox
                        label="Enable Global Override"
                        checked={settings.globalOverride}
                        onChange={(checked) =>
                          setSettings({ ...settings, globalOverride: checked })
                        }
                        helpText="When enabled, these settings will override individual block settings"
                      />
                      <RangeSlider
                        label="Font Size (px)"
                        value={settings.fontSize}
                        min={10}
                        max={24}
                        onChange={(value) =>
                          setSettings({ ...settings, fontSize: value })
                        }
                      />
                      <RangeSlider
                        label="Margin Top (px)"
                        value={settings.marginTop}
                        min={0}
                        max={50}
                        onChange={(value) =>
                          setSettings({ ...settings, marginTop: value })
                        }
                      />
                      <RangeSlider
                        label="Margin Bottom (px)"
                        value={settings.marginBottom}
                        min={0}
                        max={50}
                        onChange={(value) =>
                          setSettings({ ...settings, marginBottom: value })
                        }
                      />
                      <TextField
                        label="Breadcrumb Separator"
                        value={settings.separator}
                        onChange={(value) =>
                          setSettings({ ...settings, separator: value })
                        }
                      />
                      <Checkbox
                        label="Enable horizontal slider on mobile"
                        checked={settings.mobileSlider}
                        onChange={(checked) =>
                          setSettings({ ...settings, mobileSlider: checked })
                        }
                      />
                      <TextField
                        label="Menu Handles"
                        value={settings.menuHandles}
                        onChange={(value) =>
                          setSettings({ ...settings, menuHandles: value })
                        }
                        helpText="Comma-separated menu handles. Use * as wildcard."
                      />
                    </FormLayout>
                  )}
                  {selectedTab === 1 && (
                    <FormLayout>
                      <TextField
                        label="Desktop/Tablet CSS"
                        value={settings.customCssDesktop}
                        onChange={(value) =>
                          setSettings({ ...settings, customCssDesktop: value })
                        }
                        multiline={4}
                      />
                      <TextField
                        label="Mobile CSS"
                        value={settings.customCssMobile}
                        onChange={(value) =>
                          setSettings({ ...settings, customCssMobile: value })
                        }
                        multiline={4}
                      />
                      <TextField
                        label="All Breadcrumbs CSS"
                        value={settings.customCssAll}
                        onChange={(value) =>
                          setSettings({ ...settings, customCssAll: value })
                        }
                        multiline={4}
                      />
                      <TextField
                        label="Last Breadcrumb CSS"
                        value={settings.customCssLast}
                        onChange={(value) =>
                          setSettings({ ...settings, customCssLast: value })
                        }
                        multiline={4}
                      />
                      <TextField
                        label="Hover State CSS"
                        value={settings.customCssHover}
                        onChange={(value) =>
                          setSettings({ ...settings, customCssHover: value })
                        }
                        multiline={4}
                      />
                    </FormLayout>
                  )}
                  {selectedTab === 2 && (
                    <Stack vertical>
                      <TextContainer>
                        <h2>How to Use Smart Breadcrumbs</h2>
                        <p>Add the breadcrumb snippet to your theme:</p>
                        <div>
                          <pre style={{background: '#f4f6f8', padding: '10px', overflowX: 'auto'}}>
                            {`{% render 'smart-breadcrumbs' %}`}
                          </pre>
                        </div>
                        <p>That's it! The app will automatically detect your page type and display the appropriate breadcrumbs.</p>
                        <h2>Frequently Asked Questions</h2>
                        <p>
                          <Link url="https://github.com/rungerunge/breadcrumb-app">View our Documentation</Link>
                        </p>
                        <h2>Need Help?</h2>
                        <p>
                          <Link url="mailto:support@smartbreadcrumbs.com">
                            Contact Support
                          </Link>
                        </p>
                      </TextContainer>
                    </Stack>
                  )}
                  {selectedTab === 3 && (
                    <Stack vertical>
                      <TextContainer>
                        <h2>Debug Information</h2>
                        <pre style={{background: '#f4f6f8', padding: '10px', overflowX: 'auto'}}>
                          {`Connection Status: ${connectionStatus}
Server Timestamp: ${new Date().toISOString()}
App Version: 2.0.0
Settings Loaded: ${initialLoading ? 'No' : 'Yes'}
Render.com URL: ${window.location.origin}
API Endpoint: ${window.location.origin}/api/settings
Health Endpoint: ${window.location.origin}/health
`}
                        </pre>
                        <Stack distribution="leading" spacing="tight">
                          <Button onClick={checkServerConnection}>Check Connection</Button>
                          <Button onClick={loadSettings}>Reload Settings</Button>
                          <Button onClick={() => window.location.reload()}>Reload Page</Button>
                        </Stack>
                      </TextContainer>
                    </Stack>
                  )}
                </Card.Section>
              </Tabs>
            </Card>
          </Layout.Section>
          <Layout.Section secondary>
            <Card title="Quick Tips">
              <Card.Section>
                <TextContainer>
                  <p>
                    Use the main snippet <code>smart-breadcrumbs</code> for automatic page type detection.
                  </p>
                  <p>
                    The app will automatically find the best path in your menu
                    structure to create accurate breadcrumbs.
                  </p>
                  <p>
                    Enable the mobile slider for better navigation on small
                    screens.
                  </p>
                  {connectionStatus !== 'connected' && (
                    <Banner status="warning">
                      Server connection issues detected. Some features may not work correctly.
                    </Banner>
                  )}
                </TextContainer>
              </Card.Section>
            </Card>
          </Layout.Section>
        </Layout>
        {toastMarkup}
      </Page>
    </Frame>
  );
} 