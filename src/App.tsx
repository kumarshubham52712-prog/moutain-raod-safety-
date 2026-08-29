import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout }           from './components/layout/Layout';
import { lazy, Suspense }   from 'react';
import { LoadingSpinner }   from './components/common';
import { ErrorBoundary }    from './components/common/ErrorBoundary';

// Lazy-load pages for code splitting
const Overview          = lazy(() => import('./pages/Overview'));
const DataFlow          = lazy(() => import('./pages/DataFlow'));
const NetworkTopology   = lazy(() => import('./pages/NetworkTopology'));
const LiveMap           = lazy(() => import('./pages/LiveMap'));
const SensorAnalytics   = lazy(() => import('./pages/SensorAnalytics'));
const Substations       = lazy(() => import('./pages/Substations'));
const MasterStations    = lazy(() => import('./pages/MasterStations'));
const DangerZones       = lazy(() => import('./pages/DangerZones'));
const Alerts            = lazy(() => import('./pages/Alerts'));
const DataImport        = lazy(() => import('./pages/DataImport'));
const SimulationControl = lazy(() => import('./pages/SimulationControl'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"               element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Overview /></Suspense></ErrorBoundary>} />
          <Route path="/dataflow"       element={<ErrorBoundary><Suspense fallback={<PageLoader />}><DataFlow /></Suspense></ErrorBoundary>} />
          <Route path="/topology"       element={<ErrorBoundary><Suspense fallback={<PageLoader />}><NetworkTopology /></Suspense></ErrorBoundary>} />
          <Route path="/map"            element={<ErrorBoundary><Suspense fallback={<PageLoader />}><LiveMap /></Suspense></ErrorBoundary>} />
          <Route path="/analytics"      element={<ErrorBoundary><Suspense fallback={<PageLoader />}><SensorAnalytics /></Suspense></ErrorBoundary>} />
          <Route path="/substations"    element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Substations /></Suspense></ErrorBoundary>} />
          <Route path="/master-stations" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><MasterStations /></Suspense></ErrorBoundary>} />
          <Route path="/danger-zones"   element={<ErrorBoundary><Suspense fallback={<PageLoader />}><DangerZones /></Suspense></ErrorBoundary>} />
          <Route path="/alerts"         element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Alerts /></Suspense></ErrorBoundary>} />
          <Route path="/import"         element={<ErrorBoundary><Suspense fallback={<PageLoader />}><DataImport /></Suspense></ErrorBoundary>} />
          <Route path="/simulation"     element={<ErrorBoundary><Suspense fallback={<PageLoader />}><SimulationControl /></Suspense></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
