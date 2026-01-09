/**
 * Template Browser Component
 * Displays organization templates for users to select
 */

import { FormattedMessage, useIntl } from "react-intl";
import {
  Button,
  Rows,
  Title,
} from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import * as styles from "styles/components.css";

interface TemplateBrowserProps {
  onBack: () => void;
}

export const TemplateBrowser = ({
  onBack,
}: TemplateBrowserProps) => {
  const intl = useIntl();

  const handleOpenLuggageTags = async () => {
    const url = "https://www.canva.com/design/DAGPQ1Ic0tA/_uoeoSbWsPhLFMeSWlO1OQ/view?utm_content=DAGPQ1Ic0tA&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview";
    try {
      await requestOpenExternalUrl({ url });
    } catch {
      // Error is handled by not doing anything visible to the user
      // console.error("Failed to open luggage tags link:", err);
    }
  };

  return (
    <div className={styles.container}>
      <Rows spacing="2u">
        <Title size="medium">
          <FormattedMessage
            defaultMessage="Select a Template"
            description="Title for template selection screen"
          />
        </Title>

        <Button variant="primary" onClick={handleOpenLuggageTags}>
          {intl.formatMessage({
            defaultMessage: "Luggage Tags (Direct Link)",
            description: "Button label to open luggage tags template directly"
          })}
        </Button>

        <Button variant="secondary" onClick={onBack}>
          {intl.formatMessage({
            defaultMessage: "Back",
            description: "Button to go back to previous screen"
          })}
        </Button>
      </Rows>
    </div>
  );
};
