/**
 * Manual check item with expandable details, friendly language, and help suggestions.
 */

import { useState } from 'react';
import { Alert, Button, Checkbox, Rows, Text } from '@canva/app-ui-kit';
import { useIntl } from 'react-intl';
import type { ManualCheck } from '../data/manualChecks';

interface ManualCheckItemProps {
  check: ManualCheck;
  completed: boolean;
  onToggle: (id: string) => void;
}

// Friendly descriptions that explain WHY each check matters
const FRIENDLY_DESCRIPTIONS: Record<string, { title: string; description: string; help?: string }> = {
  'bleed-check': {
    title: 'Bleed Area',
    description: 'Extend your background colors and images to the edge to prevent white lines after cutting.',
    help: 'Your design should extend 0.125" past the trim line on all sides.',
  },
  'safe-zone-check': {
    title: 'Safe Zone',
    description: 'Keep important text and logos away from the edges so nothing gets trimmed off.',
    help: 'Keep critical content at least 0.125" from the trim edge.',
  },
  'color-mode-check': {
    title: 'Color Check',
    description: 'Some bright screen colors may look different when printed. This is normal!',
    help: 'Bright neons, electric blues, and vivid greens are most affected.',
  },
  'rich-black-check': {
    title: 'Rich Black',
    description: 'For large black areas, rich black prints deeper than plain black.',
    help: 'This mainly matters for large solid black backgrounds.',
  },
  'font-check': {
    title: 'Font Safety',
    description: 'Canva typically embeds fonts, but custom fonts should be verified.',
    help: 'If using custom fonts, check with your printer.',
  },
  'spell-check': {
    title: 'Spelling Check',
    description: 'A quick read-through can save costly reprints!',
    help: 'Double-check phone numbers, emails, and URLs.',
  },
};

export function ManualCheckItem({ check, completed, onToggle }: ManualCheckItemProps) {
  const [expanded, setExpanded] = useState(false);
  const intl = useIntl();

  const friendly = FRIENDLY_DESCRIPTIONS[check.id] || {
    title: check.title,
    description: check.description,
    help: check.tip,
  };

  const labelText = check.required 
    ? `${friendly.title} *` 
    : friendly.title;

  return (
    <Rows spacing="0.5u">
      <Checkbox
        checked={completed}
        onChange={() => onToggle(check.id)}
        label={labelText}
      />

      <div style={{ marginLeft: '24px' }}>
        {/* Always show the friendly description */}
        <Text size="small" tone="secondary">
          {friendly.description}
        </Text>

        {/* Expandable help section */}
        {friendly.help && (
          <>
            <Button variant="tertiary" onClick={() => setExpanded(!expanded)}>
              {expanded
                ? intl.formatMessage({
                    defaultMessage: 'Hide help',
                    description: 'Hide help button',
                  })
                : intl.formatMessage({
                    defaultMessage: 'How do I check this?',
                    description: 'Show help button',
                  })}
            </Button>

            {expanded && (
              <Alert tone="info">
                <Rows spacing="0.5u">
                  <Text size="small">
                    {`💡 ${friendly.help}`}
                  </Text>
                  {check.id === 'bleed-check' && (
                    <Text size="small" tone="tertiary">
                      {intl.formatMessage({
                        defaultMessage:
                          'In Canva, go to File → View settings → Show print bleed to see the bleed area.',
                        description: 'Bleed help tip',
                      })}
                    </Text>
                  )}
                  {check.id === 'safe-zone-check' && (
                    <Text size="small" tone="tertiary">
                      {intl.formatMessage({
                        defaultMessage:
                          'In Canva, enable Show margins to see the safe zone guides.',
                        description: 'Safe zone help tip',
                      })}
                    </Text>
                  )}
                </Rows>
              </Alert>
            )}
          </>
        )}

        {/* Mark as complete suggestion when not completed */}
        {!completed && check.required && (
          <Text size="xsmall" tone="tertiary">
            {intl.formatMessage({
              defaultMessage: 'Check this off once verified',
              description: 'Check reminder',
            })}
          </Text>
        )}
      </div>
    </Rows>
  );
}
