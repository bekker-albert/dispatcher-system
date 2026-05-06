type RequiredAuthProfileInput = {
  lastName: string;
  firstName: string;
  middleName: string;
  positionTitle: string;
  email: string;
  phone: string;
};

const requiredAuthProfileFields: Array<{ key: keyof RequiredAuthProfileInput; label: string }> = [
  { key: "lastName", label: "Фамилия" },
  { key: "firstName", label: "Имя" },
  { key: "middleName", label: "Отчество" },
  { key: "positionTitle", label: "Должность" },
  { key: "email", label: "Почта" },
  { key: "phone", label: "Телефон" },
];

const authProfileTextFieldsWithoutDigits: Array<{ key: keyof RequiredAuthProfileInput; label: string }> = [
  { key: "lastName", label: "Фамилия" },
  { key: "firstName", label: "Имя" },
  { key: "middleName", label: "Отчество" },
  { key: "positionTitle", label: "Должность" },
];

export function validateRequiredAuthProfile(input: RequiredAuthProfileInput) {
  for (const field of requiredAuthProfileFields) {
    if (!input[field.key].trim()) {
      throw new Error(`Заполните поле: ${field.label}`);
    }
  }

  for (const field of authProfileTextFieldsWithoutDigits) {
    if (/\d/.test(input[field.key])) {
      throw new Error(`В поле "${field.label}" цифры не допускаются`);
    }
  }
}
