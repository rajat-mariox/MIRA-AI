import { request } from './client';
import type { ZodiacSignKey } from './user';

export type HoroscopePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type HoroscopeDay = 'today' | 'tomorrow' | 'yesterday';

export type HoroscopePrediction = {
  personal: string;
  health: string;
  profession: string;
  emotions: string;
  travel: string;
  /** "Label : value" lines, e.g. "Colors of the day : Goldenrod, Teal" */
  luck: string[];
};

export type HoroscopeData = {
  sign: ZodiacSignKey;
  /** 'daily-today' | 'daily-tomorrow' | 'daily-yesterday' | 'weekly' | 'monthly' | 'yearly' */
  period: string;
  cached: boolean;
  prediction: HoroscopePrediction;
  special?: {
    lucky_color_codes: string[];
    /** personal, health, profession, emotions, travel, luck -> 0..100 */
    horoscope_percentage: Record<string, number>;
    [k: string]: unknown;
  };
};

/** Returned (200) instead of a horoscope when the user has no DOB and no `sign` was sent. */
export type HoroscopeSetupRequired = {
  requiresProfileSetup: true;
  profileSetupStep: number;
  isProfileComplete: boolean;
};

export type HoroscopeResult = HoroscopeData | HoroscopeSetupRequired;

export function isSetupRequired<T extends object>(r: T | HoroscopeSetupRequired | null | undefined): r is HoroscopeSetupRequired {
  return !!r && (r as HoroscopeSetupRequired).requiresProfileSetup === true;
}

/** GET /horoscope?period&day&sign */
export function getHoroscope(params: {
  period: HoroscopePeriod;
  day?: HoroscopeDay;
  sign?: ZodiacSignKey;
}) {
  return request<HoroscopeResult>('/horoscope', { query: params });
}

export type InsightTopic = 'career' | 'finance' | 'marriage' | 'health';

/** GET /horoscope/insights/:topic: personalised from the birth chart for the user's own rashi. */
export type InsightData = {
  topic: InsightTopic;
  sign: ZodiacSignKey;
  /** false = generic sign horoscope (other sign picked, or no birth chart / AI) */
  personalized: boolean;
  /** 0..100, null when unknown */
  score: number | null;
  today: string;
  periods: { id: 'week' | 'month' | 'year'; title: string; text: string }[];
  remedies: string[];
  /** e.g. "Based on your Leo ascendant, Rahu–Mercury dasha and today's horoscope" */
  basis: string;
};

export type InsightResult = InsightData | HoroscopeSetupRequired;

/** GET /horoscope/insights/:topic?sign */
export function getInsight(topic: InsightTopic, sign?: ZodiacSignKey) {
  return request<InsightResult>(`/horoscope/insights/${topic}`, { query: { sign } });
}
