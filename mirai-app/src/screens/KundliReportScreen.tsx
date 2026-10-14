import React, { useMemo } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ReportPage } from '../components/kundli/report/ReportBlocks';
import { REPORTS, REPORT_TITLES } from '../components/kundli/report/reports';
import type { KundliOverrides } from '../api/kundli';
import type { RootStackParamList } from '../navigation/types';

/**
 * Full-screen kundli report (Planets, Dasha, Ascendant, doshas, divisional charts) for the
 * user's own kundli or a saved profile (`profileId`). One route, `type` picks the report.
 */
export default function KundliReportScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'KundliReport'>>();
  const { type, profileId, name } = params;
  const overrides = useMemo<KundliOverrides | undefined>(() => (profileId ? { profileId } : undefined), [profileId]);
  const Report = REPORTS[type];
  return (
    <ReportPage title={REPORT_TITLES[type]}>
      <Report overrides={overrides} name={profileId ? name : undefined} />
    </ReportPage>
  );
}
