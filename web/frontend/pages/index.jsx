import React, { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  RangeSlider,
  Button,
  Checkbox,
  Stack,
  TextContainer,
  Link,
  Tabs,
  Frame,
  Toast
} from '@shopify/polaris';

export default function HomePage() {
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
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

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
    }
  ];

  const handleSave = () => {
    setLoading(true);
    try {
      // Just simulate saving
      setTimeout(() => {
        setToastContent('Settings saved successfully');
        setToastActive(true);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      setToastContent('Failed to save settings');
      setToastActive(true);
      setLoading(false);
    }
  };

  const handleTabChange = (selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  };

  const toastMarkup = toastActive ? (
    <Toast content={toastContent} onDismiss={() => setToastActive(false)} />
  ) : null;

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
                          <Link url="https://github.com/rungerunge/breadcrumb-app">View Documentation</Link>
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