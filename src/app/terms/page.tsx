import { LegalPage } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        VoteMash lets anyone enter a product into a 48-hour league and lets
        visitors vote in head-to-head battles. By using the site you agree to
        these terms.
      </p>
      <p>
        Entry fees, when charged, are calculated on the server at the moment you
        confirm. Free slots can close if others enter first. Paid entries go
        live after Dodo Payments confirms the charge.
      </p>
      <p>
        Votes are one per visitor per pair. Rankings use Elo. Category top 3s
        lock for a 30-minute finals window, and the finals winner becomes the
        featured champion. We may remove spam, illegal, or abusive listings.
      </p>
      <p>
        VoteMash is provided as-is. We are not responsible for third-party
        sites you enter, payment processor outages, or ranking outcomes.
      </p>
    </LegalPage>
  );
}
