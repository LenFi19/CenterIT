export type NormalizedServicePayload = {
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
  categoryId: number | null;
  categoryName: string | null;
  favorite: boolean;
  adminOnly: boolean;
  order: number;
};

type ValidationSuccess = {
  success: true;
  data: NormalizedServicePayload;
};

type ValidationFailure = {
  success: false;
  message: string;
  details?: Record<string, string>;
};

type ValidationResult = ValidationSuccess | ValidationFailure;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateServicePayload(payload: unknown): ValidationResult {
  if (!isObject(payload)) {
    return { success: false, message: "Ungültige Nutzlast." };
  }

  const errors: Record<string, string> = {};

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) {
    errors.name = "Name ist erforderlich.";
  } else if (name.length > 120) {
    errors.name = "Name darf maximal 120 Zeichen haben.";
  }

  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  if (!url) {
    errors.url = "URL ist erforderlich.";
  } else {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        errors.url = "URL muss mit http:// oder https:// beginnen.";
      }
    } catch {
      errors.url = "URL ist ungültig.";
    }
  }

  const description = normalizeOptionalString(payload.description);
  if (typeof payload.description !== "undefined" && payload.description !== null && typeof payload.description !== "string") {
    errors.description = "Beschreibung muss Text sein.";
  } else if (description && description.length > 500) {
    errors.description = "Beschreibung darf maximal 500 Zeichen haben.";
  }

  const icon = normalizeOptionalString(payload.icon);
  if (typeof payload.icon !== "undefined" && payload.icon !== null && typeof payload.icon !== "string") {
    errors.icon = "Icon muss Text sein.";
  } else if (icon && icon.length > 120) {
    errors.icon = "Icon darf maximal 120 Zeichen haben.";
  }

  const categoryName = normalizeOptionalString(payload.category);
  if (typeof payload.category !== "undefined" && payload.category !== null && typeof payload.category !== "string") {
    errors.category = "Kategorie muss Text sein.";
  } else if (categoryName && categoryName.length > 80) {
    errors.category = "Kategorie darf maximal 80 Zeichen haben.";
  }

  let categoryId: number | null = null;
  if (payload.categoryId !== undefined && payload.categoryId !== null) {
    const parsedCategoryId = Number(payload.categoryId);
    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId < 1) {
      errors.categoryId = "categoryId muss eine positive Ganzzahl sein.";
    } else {
      categoryId = parsedCategoryId;
    }
  }

  if (payload.favorite !== undefined && typeof payload.favorite !== "boolean") {
    errors.favorite = "favorite muss true oder false sein.";
  }

  if (payload.adminOnly !== undefined && typeof payload.adminOnly !== "boolean") {
    errors.adminOnly = "adminOnly muss true oder false sein.";
  }

  let order = 0;
  if (payload.order !== undefined) {
    const parsedOrder = Number(payload.order);
    if (!Number.isInteger(parsedOrder)) {
      errors.order = "order muss eine Ganzzahl sein.";
    } else if (parsedOrder < 0 || parsedOrder > 100000) {
      errors.order = "order muss zwischen 0 und 100000 liegen.";
    } else {
      order = parsedOrder;
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Nutzlast ist ungültig.",
      details: errors,
    };
  }

  return {
    success: true,
    data: {
      name,
      description,
      url,
      icon,
      categoryId,
      categoryName,
      favorite: Boolean(payload.favorite),
      adminOnly: Boolean(payload.adminOnly),
      order,
    },
  };
}
