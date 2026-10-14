// Design tokens from the MIRAI App Figma file
export const colors = {
  white: '#FFFFFF',
  black: '#000000',
  gradientTop: '#45CAFF',
  gradientBottom: '#FF1B6B',
  gradientOverlay: 'rgba(0, 0, 0, 0.4)',
  primary: '#A7D8F2',
  primaryHalf: 'rgba(167, 216, 242, 0.5)',
  onPrimary: '#0D1D2B',
  inputBackground: 'rgba(255, 255, 255, 0.04)',
  inputBorder: 'rgba(255, 255, 255, 0.4)',
  placeholder: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  textSoft: '#DDDDDD',
  cardBorder: 'rgba(167, 216, 242, 0.2)',
  iconButton: 'rgba(255, 255, 255, 0.1)',
  dotInactive: '#D9D9D9',
  badgeText: '#B388EB',
  badgeBackground: 'rgba(179, 136, 235, 0.2)',
  tabInactive: '#B2B8B2',
  logo: '#3B1A28',
};

// Android uses the font file name, iOS the PostScript name; for these fonts they match
export const fonts = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  nunitoMedium: 'Nunito-Medium',
  interMedium: 'Inter-Medium',
  interBold: 'Inter-Bold',
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Figma frames are drawn at this size
export const DESIGN_WIDTH = 375;
export const DESIGN_HEIGHT = 812;
// Status bar height in the Figma frames; content keeps at least this much room on top
export const DESIGN_STATUS_BAR = 46;

// Card fills used across the onboarding and home screens (CSS angle + stops)
export const cardGradients = {
  idle: [
    { offset: 0.24586, color: colors.primary, opacity: 0.16 },
    { offset: 0.99762, color: colors.primary, opacity: 0 },
  ],
  selected: [
    { offset: 0.24586, color: colors.primary, opacity: 0.4 },
    { offset: 0.99762, color: colors.primary, opacity: 0.1 },
  ],
};
