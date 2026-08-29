import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout }           from './components/layout/Layout';
import { lazy, Suspense }   from 'react';
import { LoadingSpinner }   from './components/common';

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
          <Route path="/"               element={<Suspense fallback={<PageLoader />}><Overview /></Suspense>} />
          <Route path="/dataflow"       element={<Suspense fallback={<PageLoader />}><DataFlow /></Suspense>} />
          <Route path="/topology"       element={<Suspense fallback={<PageLoader />}><NetworkTopology /></Suspense>} />
          <Route path="/map"            element={<Suspense fallback={<PageLoader />}><LiveMap /></Suspense>} />
          <Route path="/analytics"      element={<Suspense fallback={<PageLoader />}><SensorAnalytics /></Suspense>} />
          <Route path="/substations"    element={<Suspense fallback={<PageLoader />}><Substations /></Suspense>} />
          <Route path="/master-stations" element={<Suspense fallback={<PageLoader />}><MasterStations /></Suspense>} />
          <Route path="/danger-zones"   element={<Suspense fallback={<PageLoader />}><DangerZones /></Suspense>} />
          <Route path="/alerts"         element={<Suspense fallback={<PageLoader />}><Alerts /></Suspense>} />
          <Route path="/import"         element={<Suspense fallback={<PageLoader />}><DataImport /></Suspense>} />
          <Route path="/simulation"     element={<Suspense fallback={<PageLoader />}><SimulationControl /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
