import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import type {
  SavedRecipientFormErrors,
  SavedRecipientFormValues,
} from "./recipientContactFormValidation";

type Props = {
  values: SavedRecipientFormValues;
  errors: SavedRecipientFormErrors;
  onFieldChange: (field: keyof SavedRecipientFormValues, value: string) => void;
  onPhoneChange: (value: string) => void;
  disabled?: boolean;
  /** Raise country dropdown above high z-index modals (e.g. recipient picker). */
  phoneDropdownZIndex?: number;
};

const fieldClass = (hasError: boolean) =>
  `w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
    hasError
      ? "border-destructive focus:border-destructive focus:ring-destructive"
      : "border-muted focus:border-primary focus:ring-primary"
  }`;

const SavedRecipientContactFields: React.FC<Props> = ({
  values,
  errors,
  onFieldChange,
  onPhoneChange,
  disabled = false,
  phoneDropdownZIndex = 10020,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          disabled={disabled}
          className={fieldClass(!!errors.name)}
          placeholder="Full name"
          autoComplete="name"
        />
        {errors.name ? (
          <p className="mt-1 text-xs text-destructive">{errors.name}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          Email <span className="text-destructive">*</span>
        </label>
        <input
          type="email"
          value={values.email}
          onChange={(e) => onFieldChange("email", e.target.value)}
          disabled={disabled}
          className={fieldClass(!!errors.email)}
          placeholder="email@example.com"
          autoComplete="email"
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-destructive">{errors.email}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-muted-foreground">Title</label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
          disabled={disabled}
          className={fieldClass(!!errors.title)}
          placeholder="Job title"
          autoComplete="organization-title"
        />
        {errors.title ? (
          <p className="mt-1 text-xs text-destructive">{errors.title}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-muted-foreground">Company</label>
        <input
          type="text"
          value={values.company}
          onChange={(e) => onFieldChange("company", e.target.value)}
          disabled={disabled}
          className={fieldClass(!!errors.company)}
          placeholder="Company name"
          autoComplete="organization"
        />
        {errors.company ? (
          <p className="mt-1 text-xs text-destructive">{errors.company}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-muted-foreground">Phone</label>
        <PhoneInput
          country="in"
          value={values.phone}
          onChange={onPhoneChange}
          disabled={disabled}
          inputProps={{
            name: "savedRecipientPhone",
            id: "savedRecipientPhone",
          }}
          containerClass="w-full"
          dropdownStyle={{ zIndex: phoneDropdownZIndex }}
          inputClass={`!w-full !pl-12 !pr-3 !py-2 !text-sm !border !rounded-lg !bg-muted focus:!outline-none focus:!ring-2 !transition-colors ${
            errors.phone
              ? "!border-destructive focus:!border-destructive focus:!ring-destructive"
              : "!border-border focus:!border-primary focus:!ring-primary"
          }`}
          buttonClass="!border !border-border !bg-card !rounded-l-lg"
        />
        {errors.phone ? (
          <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
        ) : null}
      </div>

      <div >
        <label className="mb-1 block text-sm font-medium text-muted-foreground">Address</label>
        <input
        type="text"
          value={values.address}
          onChange={(e) => onFieldChange("address", e.target.value)}
          disabled={disabled}
          className={fieldClass(!!errors.address)}
          placeholder="Address"
          autoComplete="street-address"
        />
        {errors.address ? (
          <p className="mt-1 text-xs text-destructive">{errors.address}</p>
        ) : null}
      </div>
    </div>
  );
};

export default SavedRecipientContactFields;
