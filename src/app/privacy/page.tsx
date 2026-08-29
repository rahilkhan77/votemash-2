import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>
        VoteMash does not require an account. We set a signed voter cookie so
        each browser can vote a pair only once.
      </p>
      <p>
        If you enter a product we store the public URL, name, description,
        logo, and category you submit. Payment details are handled by Dodo
        Payments, not stored as card numbers on VoteMash.
      </p>
      <p>
        We use the site URL you paste only to fetch public metadata (title,
        description, and logo) so the listing can be created.
      </p>
    </LegalPage>
  );
}
