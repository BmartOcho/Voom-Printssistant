/**
 * Welcome view with branding and call-to-action.
 */

import { Button, Rows, Text, Title } from '@canva/app-ui-kit';
import { FormattedMessage, useIntl } from 'react-intl';
import * as styles from 'styles/components.css';

interface WelcomeViewProps {
  onGetStarted: () => void;
}

export function WelcomeView({ onGetStarted }: WelcomeViewProps) {
  const intl = useIntl();

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="3u" align="center">
        {/* Branding */}
        <div style={{ fontSize: '48px', textAlign: 'center' }}>
          <span role="img" aria-hidden="true">🖨️</span>
        </div>

        <Title size="large" alignment="center">
          {intl.formatMessage({
            defaultMessage: 'Printssistant',
            description: 'App name displayed on welcome screen',
          })}
        </Title>

        <Text alignment="center" tone="tertiary">
          {intl.formatMessage({
            defaultMessage: 'Expert prepress prep in Canva',
            description: 'App tagline on welcome screen',
          })}
        </Text>

        <Text alignment="center">
          {intl.formatMessage({
            defaultMessage:
              'Get your designs print-ready with automatic DPI analysis, bleed checks, and professional preflight verification.',
            description: 'App description on welcome screen',
          })}
        </Text>

        {/* Features list */}
        <Rows spacing="1u">
          <Text size="small">
            <span role="img" aria-hidden="true">✓</span>
            {' '}
            {intl.formatMessage({
              defaultMessage: 'Automatic resolution analysis',
              description: 'Feature item',
            })}
          </Text>
          <Text size="small">
            <span role="img" aria-hidden="true">✓</span>
            {' '}
            {intl.formatMessage({
              defaultMessage: 'Bleed and safe zone verification',
              description: 'Feature item',
            })}
          </Text>
          <Text size="small">
            <span role="img" aria-hidden="true">✓</span>
            {' '}
            {intl.formatMessage({
              defaultMessage: 'Print-specific tips and guidance',
              description: 'Feature item',
            })}
          </Text>
        </Rows>

        {/* Call to action */}
        <Button variant="primary" onClick={onGetStarted} stretch>
          {intl.formatMessage({
            defaultMessage: 'Get Started',
            description: 'Button to start print preparation',
          })}
        </Button>
      </Rows>
    </div>
  );
}
