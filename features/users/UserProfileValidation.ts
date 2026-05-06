export type RequiredUserProfileDraft = {
  lastName: string;
  firstName: string;
  middleName: string;
  positionTitle: string;
  email: string;
  phone: string;
};

export const noDigitsInputPattern = "[^0-9]*";
export const noDigitsInputTitle = "Цифры не допускаются";

const requiredProfileFields: Array<{ key: keyof RequiredUserProfileDraft; label: string }> = [
  { key: "lastName", label: "Фамилия" },
  { key: "firstName", label: "Имя" },
  { key: "middleName", label: "Отчество" },
  { key: "positionTitle", label: "Должность" },
  { key: "email", label: "Почта" },
  { key: "phone", label: "Телефон" },
];

const noDigitsProfileFields: Array<{ key: keyof RequiredUserProfileDraft; label: string }> = [
  { key: "lastName", label: "Фамилия" },
  { key: "firstName", label: "Имя" },
  { key: "middleName", label: "Отчество" },
  { key: "positionTitle", label: "Должность" },
];

export function validateRequiredUserProfileDraft(draft: RequiredUserProfileDraft) {
  for (const field of requiredProfileFields) {
    if (!draft[field.key].trim()) {
      return `Заполните поле: ${field.label}`;
    }
  }

  for (const field of noDigitsProfileFields) {
    if (/\d/.test(draft[field.key])) {
      return `В поле "${field.label}" цифры не допускаются`;
    }
  }

  return "";
}

export function getUserProfileFieldInputWarning(
  key: keyof RequiredUserProfileDraft,
  value: string,
) {
  if (noDigitsProfileFields.some((field) => field.key === key) && /\d/.test(value)) {
    return noDigitsInputTitle;
  }

  return "";
}
