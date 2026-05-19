import { DummyEditorPage } from "@/components/shell/DummyUi";

export default function AccountPage() {
  return (
    <DummyEditorPage
      sectionTag="Account"
      title="Profile & Security"
      description="Current admin profile page scaffold."
      formSections={[
        {
          title: "Profile",
          fields: [
            { label: "Full Name", placeholder: "Vikrant Chaudhary" },
            { label: "Email", placeholder: "vikrant@cryptominingmiles.in" },
            { label: "Role", placeholder: "Super Admin" },
            { label: "Timezone", placeholder: "Asia/Kolkata" }
          ]
        },
        {
          title: "Security",
          fields: [
            { label: "Current Password", placeholder: "••••••••" },
            { label: "New Password", placeholder: "••••••••" },
            { label: "Confirm Password", placeholder: "••••••••" },
            { label: "2FA", placeholder: "optional / required" }
          ]
        }
      ]}
    />
  );
}
