/**
 * Contextual tips based on job category.
 */

import { Rows, Text } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import type { PrintJob } from "../data/printJobs";
import { getGuidelineForCategory } from "../data/dpiGuidelines";

interface ContextualTipsProps {
  job: PrintJob;
}

export function ContextualTips({ job }: ContextualTipsProps) {
  const intl = useIntl();
  const guideline = getGuidelineForCategory(job.category);

  return (
    <Rows spacing="1u">
      <Text>
        <strong>
          {intl.formatMessage(
            {
              defaultMessage: "Tips for {category}",
              description: "Tips section title",
            },
            { category: job.category },
          )}
        </strong>
      </Text>

      <Rows spacing="0.5u">
        {guideline.tips.map((tip, index) => (
          <Text key={index} size="small" tone="secondary">
            <span role="img" aria-hidden="true">
              {/* \uD83D\uDCA1 is the light bulb emoji */}
              {"\uD83D\uDCA1"}
            </span>{" "}
            {intl.formatMessage(tip)}
          </Text>
        ))}
      </Rows>
    </Rows>
  );
}
