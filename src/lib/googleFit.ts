/**
 * Google Fit REST API Integration
 * Дозволяє зчитувати кількість кроків та спалені калорії активності за конкретну дату.
 */

export interface GoogleFitDailySummary {
  date: string;
  steps: number;
  activeCalories: number;
  distanceMeters: number;
}

const STORAGE_KEY_GFIT_TOKEN = 'bodyplan_gfit_token';

export function getSavedGoogleFitToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_GFIT_TOKEN);
}

export function saveGoogleFitToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(STORAGE_KEY_GFIT_TOKEN);
  } else {
    localStorage.setItem(STORAGE_KEY_GFIT_TOKEN, token);
  }
}

/**
 * Ініціація авторизації Google Fit OAuth2 Implicit Flow
 */
export function requestGoogleFitAuth(clientId: string) {
  if (!clientId) {
    throw new Error('Вкажіть Google OAuth Client ID для Google Fit.');
  }

  const redirectUri = window.location.origin + window.location.pathname;
  const scopes = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=token&scope=${encodeURIComponent(scopes)}&include_granted_scopes=true&prompt=consent`;

  window.location.href = authUrl;
}

/**
 * Перевірка, чи повернувся токен у hash URL після OAuth
 */
export function parseTokenFromUrl(): string | null {
  if (!window.location.hash) return null;
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (accessToken) {
    saveGoogleFitToken(accessToken);
    // Очистити хеш з URL для чистоти
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return accessToken;
  }
  return null;
}

/**
 * Отримання сумарних кроків та спалених калорій за конкретний день
 */
export async function fetchGoogleFitSummaryForDate(
  accessToken: string,
  dateStr: string // "YYYY-MM-DD"
): Promise<GoogleFitDailySummary> {
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`).getTime();
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`).getTime();

  const body = {
    aggregateBy: [
      {
        dataTypeName: 'com.google.step_count.delta',
        dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
      },
      {
        dataTypeName: 'com.google.calories.expended',
        dataSourceId: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
      },
      {
        dataTypeName: 'com.google.distance.delta',
        dataSourceId: 'derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta',
      },
    ],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: startOfDay,
    endTimeMillis: endOfDay,
  };

  const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      saveGoogleFitToken(null);
      throw new Error('Токен Google Fit застарів. Будь ласка, авторизуйтесь знову.');
    }
    throw new Error(`Google Fit API помилка (${response.status})`);
  }

  const data = await response.json();
  let steps = 0;
  let activeCalories = 0;
  let distanceMeters = 0;

  if (data.bucket && data.bucket.length > 0) {
    const datasets = data.bucket[0].dataset || [];
    for (const ds of datasets) {
      if (ds.point && ds.point.length > 0) {
        for (const pt of ds.point) {
          const val = pt.value?.[0];
          if (val) {
            if (val.intVal !== undefined) {
              steps += val.intVal;
            } else if (val.fpVal !== undefined) {
              if (ds.dataSourceId.includes('calories')) {
                activeCalories += Math.round(val.fpVal);
              } else if (ds.dataSourceId.includes('distance')) {
                distanceMeters += Math.round(val.fpVal);
              }
            }
          }
        }
      }
    }
  }

  return {
    date: dateStr,
    steps,
    activeCalories,
    distanceMeters,
  };
}
