/**
 * Manual check item with expandable details and completion toggle.
 */

import { useState } from 'react';
import { Button, Checkbox, Rows, Text } from '@canva/app-ui-kit';
import { useIntl } from 'react-intl';
import type { ManualCheck } from '../data/manualChecks';

interface ManualCheckItemProps {
  check: ManualCheck;
  completed: boolean;
  onToggle: (id: string) => void;
}

export function ManualCheckItem({ check, completed, onToggle }: ManualCheckItemProps) {
  const [expanded, setExpanded] = useState(false);
  const intl = useIntl();

  const labelText = check.required ? `${check.title} *` : check.title;

  return (
    <Rows spacing="0.5u">
      <Checkbox
        checked={completed}
        onChange={() => onToggle(check.id)}
        label={labelText}
      />

      {check.description && (
        <div style={{ marginLeft: '24px' }}>
          <Button variant="tertiary" onClick={() => setExpanded(!expanded)}>
            {expanded
              ? intl.formatMessage({
                  defaultMessage: '▼ Hide details',
                  description: 'Hide details button',
                })
              : intl.formatMessage({
                  defaultMessage: '▶ Show details',
                  description: 'Show details button',
                })}
          </Button>

          {expanded && (
            <Rows spacing="0.5u">
              <Text size="small" tone="secondary">
                {check.description}
              </Text>
              {check.tip && (
                <Text size="small" tone="tertiary">
                  {`💡 ${check.tip}`}
                </Text>
              )}
            </Rows>
          )}
        </div>
      )}
    </Rows>
  );
}
