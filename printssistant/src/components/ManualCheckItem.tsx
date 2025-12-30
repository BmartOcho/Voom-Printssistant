/**
 * Manual check item with expandable details, friendly language, and help suggestions.
 */

import { useState } from "react";
import { Alert, Button, Checkbox, Rows, Text } from "@canva/app-ui-kit";
import { defineMessages, useIntl } from "react-intl";
import type { ManualCheck } from "../data/manualChecks";

interface ManualCheckItemProps {
  check: ManualCheck;
  completed: boolean;
  onToggle: (id: string) => void;
}

const messages = defineMessages({
  bleedTitle: { defaultMessage: "Bleed Area", description: "Bleed check title" },
  bleedDesc: {
    defaultMessage:
      "Extend your background colors and images to the edge to prevent white lines after cutting.",
    description: "Bleed check description",
  },
  bleedHelp: {
    defaultMessage:
      "Your design should extend 0.125\" past the trim line on all sides.",
    description: "Bleed check help",
  },
  safeZoneTitle: {
    defaultMessage: "Safe Zone",
    description: "Safe zone check title",
  },
  safeZoneDesc: {
    defaultMessage:
      "Keep important text and logos away from the edges so nothing gets trimmed off.",
    description: "Safe zone check description",
  },
  safeZoneHelp: {
    defaultMessage: "Keep critical content at least 0.125\" from the trim edge.",
    description: "Safe zone check help",
  },
  colorModeTitle: {
    defaultMessage: "Color Check",
    description: "Color check title",
  },
  colorModeDesc: {
    defaultMessage:
      "Some bright screen colors may look different when printed. This is normal!",
    description: "Color check description",
  },
  colorModeHelp: {
    defaultMessage:
      "Bright neons, electric blues, and vivid greens are most affected.",
    description: "Color check help",
  },
  richBlackTitle: {
    defaultMessage: "Rich Black",
    description: "Rich black check title",
  },
  richBlackDesc: {
    defaultMessage:
      "For large black areas, rich black prints deeper than plain black.",
    description: "Rich black check description",
  },
  richBlackHelp: {
    defaultMessage: "This mainly matters for large solid black backgrounds.",
    description: "Rich black check help",
  },
  fontTitle: { defaultMessage: "Font Safety", description: "Font check title" },
  fontDesc: {
    defaultMessage:
      "Canva typically embeds fonts, but custom fonts should be verified.",
    description: "Font check description",
  },
  fontHelp: {
    defaultMessage: "If using custom fonts, check with your printer.",
    description: "Font check help",
  },
  spellTitle: {
    defaultMessage: "Spelling Check",
    description: "Spell check title",
  },
  spellDesc: {
    defaultMessage: "A quick read-through can save costly reprints!",
    description: "Spell check description",
  },
  spellHelp: {
    defaultMessage: "Double-check phone numbers, emails, and URLs.",
    description: "Spell check help",
  },
  hideHelp: { defaultMessage: "Hide help", description: "Hide help button" },
  showHelp: {
    defaultMessage: "How do I check this?",
    description: "Show help button",
  },
  bleedTip: {
    defaultMessage:
      "In Canva, go to File → View settings → Show print bleed to see the bleed area.",
    description: "Bleed help tip",
  },
  safeZoneTip: {
    defaultMessage:
      "In Canva, enable Show margins to see the safe zone guides.",
    description: "Safe zone help tip",
  },
  checkReminder: {
    defaultMessage: "Check this off once verified",
    description: "Check reminder",
  },
});

export function ManualCheckItem({
  check,
  completed,
  onToggle,
}: ManualCheckItemProps) {
  const [expanded, setExpanded] = useState(false);
  const intl = useIntl();

  const getFriendlyContent = (
    id: string,
  ): { title: string; description: string; help?: string } => {
    switch (id) {
      case "bleed-check":
        return {
          title: intl.formatMessage(messages.bleedTitle),
          description: intl.formatMessage(messages.bleedDesc),
          help: intl.formatMessage(messages.bleedHelp),
        };
      case "safe-zone-check":
        return {
          title: intl.formatMessage(messages.safeZoneTitle),
          description: intl.formatMessage(messages.safeZoneDesc),
          help: intl.formatMessage(messages.safeZoneHelp),
        };
      case "color-mode-check":
        return {
          title: intl.formatMessage(messages.colorModeTitle),
          description: intl.formatMessage(messages.colorModeDesc),
          help: intl.formatMessage(messages.colorModeHelp),
        };
      case "rich-black-check":
        return {
          title: intl.formatMessage(messages.richBlackTitle),
          description: intl.formatMessage(messages.richBlackDesc),
          help: intl.formatMessage(messages.richBlackHelp),
        };
      case "font-check":
        return {
          title: intl.formatMessage(messages.fontTitle),
          description: intl.formatMessage(messages.fontDesc),
          help: intl.formatMessage(messages.fontHelp),
        };
      case "spell-check":
        return {
          title: intl.formatMessage(messages.spellTitle),
          description: intl.formatMessage(messages.spellDesc),
          help: intl.formatMessage(messages.spellHelp),
        };
      default:
        return {
          title: check.title,
          description: check.description,
          help: check.tip,
        };
    }
  };

  const friendly = getFriendlyContent(check.id);
  const labelText = check.required ? `${friendly.title} *` : friendly.title;

  return (
    <Rows spacing="0.5u">
      <Checkbox
        checked={completed}
        onChange={() => onToggle(check.id)}
        label={labelText}
      />

      <div style={{ marginLeft: "24px" }}>
        {/* Always show the friendly description */}
        <Text size="small" tone="secondary">
          {friendly.description}
        </Text>

        {/* Expandable help section */}
        {friendly.help && (
          <>
            <Button variant="tertiary" onClick={() => setExpanded(!expanded)}>
              {expanded
                ? intl.formatMessage(messages.hideHelp)
                : intl.formatMessage(messages.showHelp)}
            </Button>

            {expanded && (
              <Alert tone="info">
                <Rows spacing="0.5u">
                  <Text size="small">
                    <span role="img" aria-hidden="true">
                      💡
                    </span>{" "}
                    {friendly.help}
                  </Text>
                  {check.id === "bleed-check" && (
                    <Text size="small" tone="tertiary">
                      {intl.formatMessage(messages.bleedTip)}
                    </Text>
                  )}
                  {check.id === "safe-zone-check" && (
                    <Text size="small" tone="tertiary">
                      {intl.formatMessage(messages.safeZoneTip)}
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
            {intl.formatMessage(messages.checkReminder)}
          </Text>
        )}
      </div>
    </Rows>
  );
}

