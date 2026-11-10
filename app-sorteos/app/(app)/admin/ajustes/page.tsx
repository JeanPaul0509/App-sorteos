import PasswordReset from "@/components/PasswordReset";
import SocialSettings from "@/components/SocialSettings";
import TermsEditor from "@/components/TermsEditor";

export default function AjustesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Ajustes</h1>
      <div className="space-y-6">
        <SocialSettings />
        <PasswordReset />
        <TermsEditor />
      </div>
    </div>
  );
}
