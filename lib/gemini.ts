import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  console.warn('GOOGLE_GEMINI_API_KEY is not set. AI features will be disabled.');
}

const genAI = process.env.GOOGLE_GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
  : null;

export interface TireAnalysisResult {
  dotCodes: string[];
  condition: {
    wearLevel: number; // 0-100
    damages: string[];
    recommendation: string;
  };
  confidence: number;
}

/**
 * Анализ фото шины с помощью Gemini Vision
 * Извлекает DOT-коды и оценивает состояние
 */
export async function analyzeTirePhoto(imageUrl: string): Promise<TireAnalysisResult | null> {
  if (!genAI) {
    console.warn('Gemini API not configured');
    return null;
  }

  try {
    // Используем Gemini Pro Vision
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
Проанализируй это изображение автомобильной шины и предоставь следующую информацию в формате JSON:

1. DOT-коды (если видны на изображении) - массив строк
2. Оценка износа протектора (0-100%, где 0 - полностью изношена, 100 - новая)
3. Видимые повреждения (массив описаний: порезы, грыжи, неравномерный износ и т.д.)
4. Рекомендация (годна к использованию, требует замены, требует ремонта)
5. Уверенность в анализе (0-100%)

Верни ТОЛЬКО валидный JSON без дополнительного текста в следующем формате:
{
  "dotCodes": ["DOT..."],
  "condition": {
    "wearLevel": 85,
    "damages": ["небольшой порез сбоку", "неравномерный износ"],
    "recommendation": "годна к использованию"
  },
  "confidence": 90
}

Если на изображении нет шины или изображение неясное, верни:
{
  "dotCodes": [],
  "condition": {
    "wearLevel": 0,
    "damages": ["невозможно определить"],
    "recommendation": "требуется более четкое изображение"
  },
  "confidence": 0
}
    `;

    // Загружаем изображение
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageResponse.headers.get('content-type') || 'image/jpeg',
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Извлекаем JSON из ответа
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to extract JSON from Gemini response:', text);
      return null;
    }

    const analysis: TireAnalysisResult = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Error analyzing tire photo with Gemini:', error);
    return null;
  }
}

/**
 * Извлечение только DOT-кодов (более легкая операция)
 */
export async function extractDotCodes(imageUrl: string): Promise<string[]> {
  if (!genAI) {
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Найди и извлеки все DOT-коды с этого изображения автомобильной шины.
DOT-код обычно выглядит как "DOT" + буквы и цифры (например, DOT XXXX XXXX 1234).

Верни ТОЛЬКО массив найденных DOT-кодов в формате JSON:
["DOT XXXX XXXX 1234", "DOT YYYY YYYY 5678"]

Если DOT-коды не найдены, верни пустой массив: []
    `;

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageResponse.headers.get('content-type') || 'image/jpeg',
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error extracting DOT codes:', error);
    return [];
  }
}

/**
 * Пакетный анализ нескольких фото
 */
export async function analyzeTirePhotos(
  imageUrls: string[]
): Promise<(TireAnalysisResult | null)[]> {
  return Promise.all(imageUrls.map((url) => analyzeTirePhoto(url)));
}
