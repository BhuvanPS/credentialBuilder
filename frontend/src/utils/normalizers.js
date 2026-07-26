import { FIELD_SCHEMA } from '../constants/schema';

/**
 * Attempts to parse a string as JSON.
 * Returns the parsed JSON if successful, or the original input string on failure.
 *
 * @param {any} input - The input to parse
 * @returns {any}
 */
export const tryParseJsonString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  const trimmed = input.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return input;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return input;
  }
};

/**
 * Checks if a value returned by Azure Content Understanding is a placeholder/empty object structure.
 *
 * @param {any} value - The value to inspect
 * @returns {boolean}
 */
export const isPlaceholderValue = (value) => {
  if (value == null) {
    return true;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value);
    // Matches { "type": "string" } placeholder shapes
    if (keys.length === 1 && keys[0] === 'type') {
      return true;
    }
    // Matches { "type": "...", "confidence": 0 } placeholder shapes
    if (keys.length === 2 && keys.includes('type') && keys.includes('confidence')) {
      return true;
    }
  }
  if (typeof value === 'string' && value.trim().startsWith('{') && value.trim().endsWith('}')) {
    const parsed = tryParseJsonString(value);
    return isPlaceholderValue(parsed);
  }
  return false;
};

/**
 * Traverses a raw field value structure, strips out Azure placeholders, and flattens
 * nested values while keeping confidence metadata intact.
 *
 * @param {any} value - Raw field value from Azure response
 * @returns {any} Cleaned value or null
 */
export const cleanValue = (value) => {
  if (value == null || isPlaceholderValue(value)) {
    return null;
  }

  if (typeof value === 'string') {
    const parsed = tryParseJsonString(value);
    if (parsed !== value) {
      return cleanValue(parsed);
    }
    return value;
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .map(cleanValue)
      .filter((item) => item != null && !(typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0));
    return cleaned.length ? cleaned : null;
  }

  if (typeof value === 'object') {
    if ('value' in value || 'valueString' in value) {
      const rawValue = value.valueString ?? value.value ?? value.text ?? '';
      const parsed = tryParseJsonString(rawValue);
      if (isPlaceholderValue(parsed)) {
        return null;
      }
      if (parsed !== rawValue) {
        return cleanValue(parsed);
      }
      return {
        value: String(rawValue ?? ''),
        confidence: value.confidence ?? null,
      };
    }
    const cleaned = {};
    Object.entries(value).forEach(([key, subValue]) => {
      const cleanedValue = cleanValue(subValue);
      if (cleanedValue != null) {
        cleaned[key] = cleanedValue;
      }
    });
    return Object.keys(cleaned).length ? cleaned : null;
  }

  return value;
};

/**
 * Retrieves the default state value for a given schema field key.
 *
 * @param {string} key - Schema field key name
 * @returns {any} Default value structure
 */
export const getDefaultFieldValue = (key) => {
  const fieldDef = FIELD_SCHEMA.find((field) => field.key === key);
  if (!fieldDef) {
    return null;
  }
  if (fieldDef.type === 'text') {
    return { value: '', confidence: null };
  }
  return [];
};

/**
 * Cleans the entire form data object by applying schema defaults to missing values.
 *
 * @param {object} rawFormData - The form data object to clean
 * @returns {object} Cleaned form data mapping
 */
export const cleanFormData = (rawFormData = {}) =>
  FIELD_SCHEMA.reduce((acc, field) => {
    const cleaned = cleanValue(rawFormData[field.key]);
    acc[field.key] = cleaned != null ? cleaned : getDefaultFieldValue(field.key);
    return acc;
  }, {});

/**
 * Normalizes nested cells/structures in complex objects or arrays into flat { value, confidence } structures.
 *
 * @param {any} subValue - The child element to normalize
 * @returns {any} Flat value structure or null
 */
export const normalizeCellValue = (subValue) => {
  if (subValue == null || isPlaceholderValue(subValue)) {
    return null;
  }

  if (typeof subValue === 'object') {
    if ('valueString' in subValue || 'value' in subValue) {
      const rawValue = subValue.valueString ?? subValue.value ?? subValue.text ?? '';
      const parsed = tryParseJsonString(rawValue);
      if (isPlaceholderValue(parsed)) {
        return null;
      }
      if (typeof parsed === 'object' && parsed != null) {
        return normalizeCellValue(parsed);
      }
      return {
        value: String(parsed ?? ''),
        confidence: subValue.confidence ?? null,
      };
    }
    if ('valueObject' in subValue && typeof subValue.valueObject === 'object') {
      const nested = {};
      Object.entries(subValue.valueObject).forEach(([nestedKey, nestedValue]) => {
        const normalizedNested = normalizeCellValue(nestedValue);
        if (normalizedNested != null) {
          nested[nestedKey] = normalizedNested;
        }
      });
      return Object.keys(nested).length ? nested : null;
    }
    if (Array.isArray(subValue.valueArray)) {
      const normalizedArray = subValue.valueArray
        .map((item) => normalizeCellValue(item))
        .filter((item) => item != null);
      return normalizedArray.length ? normalizedArray : null;
    }

    const normalized = {};
    Object.entries(subValue).forEach(([nestedKey, nestedValue]) => {
      const processed = normalizeCellValue(nestedValue);
      if (processed != null) {
        normalized[nestedKey] = processed;
      }
    });
    return Object.keys(normalized).length ? normalized : null;
  }

  return {
    value: String(subValue),
    confidence: null,
  };
};

/**
 * Standardizes text-based fields into flat { value: string, confidence: float } mapping.
 *
 * @param {any} value - Raw text value
 * @returns {object} Flat text structure
 */
export const normalizeTextField = (value) => {
  if (value == null) {
    return { value: '', confidence: null };
  }
  if (typeof value === 'string') {
    return { value, confidence: null };
  }
  if (typeof value === 'object') {
    return {
      value: value.valueString ?? value.value ?? value.text ?? '',
      confidence: value.confidence ?? null,
    };
  }
  return { value: String(value), confidence: null };
};

/**
 * Standardizes dynamic arrays or list fields into lists of { value: string, confidence: float } structures.
 *
 * @param {any} value - Raw list values
 * @returns {array} Normalized list array
 */
export const normalizeListField = (value) => {
  if (!Array.isArray(value)) {
    if (value == null || value === '') {
      return [];
    }
    if (typeof value === 'string') {
      return [{ value, confidence: null }];
    }
    if (typeof value === 'object') {
      if ('valueString' in value) {
        return [{ value: value.valueString ?? value.value ?? '', confidence: value.confidence ?? null }];
      }
      if (Array.isArray(value.valueArray)) {
        return normalizeListField(value.valueArray);
      }
      return [{ value: value.value ?? value.text ?? JSON.stringify(value), confidence: value.confidence ?? null }];
    }
    return [{ value: String(value), confidence: null }];
  }

  return value
    .map((item) => {
      if (item == null) {
        return null;
      }
      if (typeof item === 'string') {
        return { value: item, confidence: null };
      }
      if (typeof item === 'object') {
        if ('valueString' in item) {
          return { value: item.valueString ?? item.value ?? '', confidence: item.confidence ?? null };
        }
        if (Array.isArray(item.valueArray)) {
          return normalizeListField(item.valueArray)[0];
        }
        return {
          value: item.value ?? item.text ?? JSON.stringify(item),
          confidence: item.confidence ?? null,
        };
      }
      return { value: String(item), confidence: null };
    })
    .filter(Boolean);
};

/**
 * Standardizes complex arrays of nested objects (e.g. Work Experience) into arrays of normalized key-value mappings.
 *
 * @param {any} value - Raw object list values
 * @returns {array} Normalized object array
 */
export const normalizeObjectListField = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (item == null) {
        return null;
      }
      if (typeof item === 'string') {
        const parsed = tryParseJsonString(item);
        if (isPlaceholderValue(parsed)) {
          return null;
        }
        if (typeof parsed === 'object' && parsed != null) {
          return normalizeCellValue(parsed);
        }
        return { value: String(parsed), confidence: null };
      }

      const source = item.valueObject && typeof item.valueObject === 'object' ? item.valueObject : item;
      const normalized = {};

      Object.entries(source).forEach(([subKey, subValue]) => {
        const processed = normalizeCellValue(subValue);
        if (processed != null) {
          normalized[subKey] = processed;
        }
      });

      if (Object.keys(normalized).length > 0) {
        return normalized;
      }

      if (Array.isArray(item.valueArray)) {
        const normalizedArray = item.valueArray
          .map((child) => normalizeCellValue(child))
          .filter((child) => child != null);
        return normalizedArray.length ? normalizedArray : null;
      }

      return null;
    })
    .filter(Boolean);
};

/**
 * Loops through the FIELD_SCHEMA and standardizes all Azure returned raw fields into unified React-state formats.
 * Normalizes education lists (joining course and institution) and achievements/leadership lists.
 *
 * @param {object} rawFormData - Raw JSON dictionary from Content Understanding API
 * @returns {object} Clean, standardized React form state object
 */
export const normalizeAnalysisFormData = (rawFormData = {}) => {
  return FIELD_SCHEMA.reduce((acc, field) => {
    const rawValue = rawFormData[field.key];
    
    if (field.key === 'education') {
      const rawList = Array.isArray(rawValue) ? rawValue : [];
      acc[field.key] = rawList.map((item) => {
        if (!item) return null;
        if (typeof item === 'string') return { value: item, confidence: null };
        if (typeof item === 'object') {
          if ('valueString' in item) {
            return { value: item.valueString ?? item.value ?? '', confidence: item.confidence ?? null };
          }
          const degree = item.Degree?.value || item.Degree || '';
          const institution = item.Institution?.value || item.Institution || '';
          const val = [degree, institution].filter(Boolean).join(', ');
          
          return { value: val, confidence: item.Degree?.confidence ?? null };
        }
        return { value: String(item), confidence: null };
      }).filter(Boolean);
    } else if (field.key === 'achievementsAndLeadership') {
      const rawList = Array.isArray(rawValue) ? rawValue : [];
      acc[field.key] = rawList.map((item) => {
        if (!item) return null;
        if (typeof item === 'string') return { value: item, confidence: null };
        if (typeof item === 'object') {
          if ('valueString' in item) {
            return { value: item.valueString ?? item.value ?? '', confidence: item.confidence ?? null };
          }
          const title = item.Title?.value || item.Title || '';
          const desc = item.Description?.value || item.Description || '';
          let val = title;
          if (desc) val += `: ${desc}`;
          return { value: val, confidence: item.Title?.confidence ?? null };
        }
        return { value: String(item), confidence: null };
      }).filter(Boolean);
    } else if (field.type === 'text') {
      acc[field.key] = normalizeTextField(rawValue);
    } else if (field.type === 'list') {
      acc[field.key] = normalizeListField(rawValue);
    } else if (field.type === 'objectList') {
      acc[field.key] = normalizeObjectListField(rawValue);
    } else {
      acc[field.key] = rawValue ?? [];
    }
    return acc;
  }, {});
};

/**
 * Builds the simplified profile summary mapping for final credential card layout.
 *
 * @param {object} data - Reviewed form state mapping
 * @returns {object|null} Standardized document profile summary or null
 */
export const getCredentialSummary = (data = {}) => {
  if (!data?.fullName?.value) {
    return null;
  }

  return {
    name: data.fullName.value,
    title: data.title?.value || '',
    summary: data.summary?.value || '',
  };
};
