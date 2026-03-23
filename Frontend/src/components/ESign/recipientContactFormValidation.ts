export type SavedRecipientFormValues = {
  name: string;
  email: string;
  title: string;
  company: string;
  phone: string;
  address: string;
};

export type SavedRecipientFormErrors = Partial<
  Record<keyof SavedRecipientFormValues, string>
>;

const EMAIL_RE =
  /^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(\.[\w-]+)+$/;

/** Name: required, sensible length; allows letters, spaces, common punctuation */
const NAME_RE = /^[\p{L}\p{M}\s'.-]{2,200}$/u;

export function validateSavedRecipientField(
  field: keyof SavedRecipientFormValues,
  form: SavedRecipientFormValues
): string {
  switch (field) {
    case "name": {
      const v = form.name.trim();
      if (!v) return "Name is required";
      if (v.length < 2) return "Name must be at least 2 characters";
      if (v.length > 200) return "Name must be at most 200 characters";
      if (!NAME_RE.test(v)) return "Name contains invalid characters";
      return "";
    }
    case "email": {
      const v = form.email.trim();
      if (!v) return "Email is required";
      if (v.length > 254) return "Email is too long";
      if (!EMAIL_RE.test(v)) return "Enter a valid email address";
      return "";
    }
    case "title": {
      const v = form.title.trim();
      if (v.length > 120) return "Title must be at most 120 characters";
      return "";
    }
    case "company": {
      const v = form.company.trim();
      if (v.length > 200) return "Company must be at most 200 characters";
      return "";
    }
    case "phone": {
      const digits = String(form.phone || "").replace(/\D/g, "");
      if (!digits) return "";
      if (digits.length < 10) return "Enter a valid phone number";
      if (digits.length > 15) return "Phone number is too long";
      return "";
    }
    case "address": {
      const v = form.address.trim();
      if (v.length > 500) return "Address must be at most 500 characters";
      return "";
    }
    default:
      return "";
  }
}

export function validateSavedRecipientForm(
  form: SavedRecipientFormValues
): SavedRecipientFormErrors {
  const keys: (keyof SavedRecipientFormValues)[] = [
    "name",
    "email",
    "title",
    "company",
    "phone",
    "address",
  ];
  const errors: SavedRecipientFormErrors = {};
  for (const k of keys) {
    const msg = validateSavedRecipientField(k, form);
    if (msg) errors[k] = msg;
  }
  return errors;
}

export function isSavedRecipientFormValid(form: SavedRecipientFormValues): boolean {
  return Object.keys(validateSavedRecipientForm(form)).length === 0;
}
