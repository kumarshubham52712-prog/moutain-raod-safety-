import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout }           from './components/layout/Layout';
import { lazy, Suspense }   from 'react';
import { LoadingSpinner }   from './components/common';
import { ErrorBoundary }    from './components/common/ErrorBoundary';

// Lazy-load pages for code splitting
const Overview              = lazy(() => import('./pages/Overview'));
const DataFlow              = lazy(() => import('./pages/DataFlow'));
const NetworkTopology       = lazy(() => import('./pages/NetworkTopology'));
const LiveMap               = lazy(() => import('./pages/LiveMap'));
const SensorAnalytics       = lazy(() => import('./pages/SensorAnalytics'));
const Substations           = lazy(() => import('./pages/Substations'));
const SubstationDetail      = lazy(() => import('./pages/SubstationDetail'));
const MasterStations        = lazy(() => import('./pages/MasterStations'));
const MasterStationDetail   = lazy(() => import('./pages/MasterStationDetail'));
const SensorsListPage       = lazy(() => import('./pages/SensorsListPage'));
const SensorDetail          = lazy(() => import('./pages/SensorDetail'));
const DangerZones           = lazy(() => import('./pages/DangerZones'));
const Alerts                = lazy(() => import('./pages/Alerts'));
const DataImport            = lazy(() => import('./pages/DataImport'));
const LiveSimulation      = lazy(() => import('./pages/LiveSimulation'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"                      element={<P><Overview /></P>} />
          <Route path="/master-stations"       element={<P><MasterStations /></P>} />
          <Route path="/master-stations/:id"   element={<P><MasterStationDetail /></P>} />
          <Route path="/substations"           element={<P><Substations /></P>} />
          <Route path="/substations/:id"       element={<P><SubstationDetail /></P>} />
          <Route path="/sensors"               element={<P><SensorsListPage /></P>} />
          <Route path="/sensors/:id"           element={<P><SensorDetail /></P>} />
          <Route path="/map"                   element={<P><LiveMap /></P>} />
          <Route path="/dataflow"              element={<P><DataFlow /></P>} />
          <Route path="/analytics"             element={<P><SensorAnalytics /></P>} />
          <Route path="/topology"              element={<P><NetworkTopology /></P>} />
          <Route path="/danger-zones"          element={<P><DangerZones /></P>} />
          <Route path="/alerts"                element={<P><Alerts /></P>} />
          <Route path="/import"                element={<P><DataImport /></P>} />
          <Route path="/simulation"            element={<P><LiveSimulation /></P>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
