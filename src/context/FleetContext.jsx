import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import initialFleetData from '../data/fleet.json';
import { regionFromCoords } from '../data/regionFromCoords';

const FleetContext = createContext(null);

// Canonical mission state labels (operational terminology)
const STATE_LABELS = {
  SURFACE: 'Surface',
  DESCENT: 'Diving',
  DRIFTING: 'Profiling',
  ASCENDING: 'Ascending',
  ICE_CHECK: 'Under Ice',
  RECOVERED: 'Recovered',
  SILENT: 'Silent',
};

// Enrich each float at load time: auto-derive region from coordinates
const enrichedInitial = initialFleetData.map((f) => ({
  ...f,
  region: regionFromCoords(f.position?.lat ?? 0, f.position?.lon ?? 0),
}));

export function FleetProvider({ children }) {
  const [fleet, setFleet] = useState(enrichedInitial);
  const [lastNetworkUpdate, setLastNetworkUpdate] = useState(new Date());
  const [networkCycleCount, setNetworkCycleCount] = useState(0);
  const [alerts, setAlerts] = useState([
    { id: 'ALT-1', floatId: 'PS-003', severity: 'error', message: 'No contact for 41 days (battery depleted or crushed by multi-year ice pack)', timestamp: '2026-07-16T11:20:00Z' },
    { id: 'ALT-2', floatId: 'PS-005', severity: 'warning', message: 'Internal humidity rising (68%). Possible slow seal ingress.', timestamp: '2026-08-26T07:15:00Z' },
    { id: 'ALT-3', floatId: 'PS-002', severity: 'warning', message: 'Ice-abort triggered in Ross Sea (cycle 19). Data cached in flash.', timestamp: '2026-08-26T04:10:00Z' },
  ]);
  const [uplinks, setUplinks] = useState([
    { id: 'UP-101', floatId: 'PS-001', cycle: 14, timestamp: '2026-08-26T08:12:00Z', status: 'SUCCESS', bytes: 680 },
    { id: 'UP-100', floatId: 'PS-005', cycle: 28, timestamp: '2026-08-26T07:15:00Z', status: 'SUCCESS', bytes: 680 },
    { id: 'UP-099', floatId: 'PS-004', cycle: 9,  timestamp: '2026-08-26T06:50:00Z', status: 'SUCCESS', bytes: 680 },
    { id: 'UP-098', floatId: 'PS-002', cycle: 19, timestamp: '2026-08-26T04:10:00Z', status: 'ABORT_ICE', bytes: 64 },
    { id: 'UP-097', floatId: 'PS-001', cycle: 13, timestamp: '2026-08-16T08:00:00Z', status: 'SUCCESS', bytes: 680 },
  ]);
  const [simTick, setSimTick] = useState(0);

  // Simulation engine — advances every 15 seconds (realistic polling cadence)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setSimTick((t) => t + 1);
      setLastNetworkUpdate(now);
      setNetworkCycleCount((c) => c + 1);

      setFleet((prevFleet) => {
        return prevFleet.map((float) => {
          if (float.status === 'silent' || float.status === 'recovered') {
            return float;
          }

          const states = ['SURFACE', 'DESCENT', 'DRIFTING', 'ASCENDING', 'ICE_CHECK'];
          const currentIndex = states.indexOf(float.missionState);
          let nextIndex = (currentIndex + 1) % states.length;
          let nextState = states[nextIndex];
          let updatedFloat = { ...float };

          if (nextState === 'ICE_CHECK') {
            const isPolar =
              float.position?.lat < -60 || float.position?.lat > 70;
            const abortRoll = Math.random();
            if (isPolar && abortRoll < 0.30) {
              updatedFloat.status = 'under_ice';
              updatedFloat.iceAborts = (updatedFloat.iceAborts || 0) + 1;
              updatedFloat.missionState = 'DRIFTING';
              updatedFloat.currentDepth = 380 + Math.random() * 80;
              updatedFloat.position = {
                ...updatedFloat.position,
                lat: updatedFloat.position.lat + (Math.random() - 0.5) * 0.04,
                lon: updatedFloat.position.lon + (Math.random() - 0.5) * 0.06,
                fixQuality: 'dead_reckoned',
                uncertaintyKm: Number(((updatedFloat.position.uncertaintyKm || 0) + 0.3).toFixed(1)),
              };
              setAlerts((prev) => [
                {
                  id: `ALT-${Date.now()}`,
                  floatId: float.id,
                  severity: 'warning',
                  message: `Ice abort triggered on cycle ${(float.cyclesCompleted || 0) + 1} (${float.region}). Telemetry retained in flash.`,
                  timestamp: now.toISOString(),
                },
                ...prev.slice(0, 15),
              ]);
              return updatedFloat;
            }
          }

          if (nextState === 'SURFACE') {
            updatedFloat.status = 'active';
            updatedFloat.currentDepth = 0.0;
            updatedFloat.cyclesCompleted = (updatedFloat.cyclesCompleted || 0) + 1;
            updatedFloat.lastContact = now.toISOString();
            updatedFloat.position = {
              lat: updatedFloat.position.lat + (Math.random() - 0.45) * 0.05,
              lon: updatedFloat.position.lon + (Math.random() - 0.45) * 0.08,
              fixQuality: 'gps',
              uncertaintyKm: 0.05,
            };
            // Re-derive region on position update
            updatedFloat.region = regionFromCoords(updatedFloat.position.lat, updatedFloat.position.lon);

            setUplinks((prev) => [
              {
                id: `UP-${Date.now()}`,
                floatId: float.id,
                cycle: updatedFloat.cyclesCompleted,
                timestamp: now.toISOString(),
                status: 'SUCCESS',
                bytes: 680,
              },
              ...prev.slice(0, 20),
            ]);

            const baseLevels = float.profiles?.[0]?.levels || [];
            const newLevels = baseLevels.length > 0
              ? baseLevels.map((lv) => ({
                  ...lv,
                  temp: Number((lv.temp + (Math.random() - 0.5) * 0.15).toFixed(3)),
                  psal: Number((lv.psal + (Math.random() - 0.5) * 0.02).toFixed(4)),
                  doxy: Number((lv.doxy + (Math.random() - 0.5) * 2.0).toFixed(1)),
                }))
              : [
                  { pres: 4.0,   temp: -0.8, psal: 33.90, doxy: 320.0, qc: 1 },
                  { pres: 50.0,  temp: -1.4, psal: 34.05, doxy: 315.0, qc: 1 },
                  { pres: 150.0, temp: -0.4, psal: 34.45, doxy: 275.0, qc: 1 },
                  { pres: 300.0, temp:  1.5, psal: 34.72, doxy: 235.0, qc: 1 },
                  { pres: 498.0, temp:  1.4, psal: 34.76, doxy: 228.0, qc: 1 },
                ];

            updatedFloat.profiles = [
              {
                cycle: updatedFloat.cyclesCompleted,
                timestamp: now.toISOString(),
                dataMode: 'R',
                aborted: false,
                levels: newLevels,
              },
              ...updatedFloat.profiles,
            ];

            updatedFloat.trajectory = [
              ...updatedFloat.trajectory,
              {
                cycle: updatedFloat.cyclesCompleted,
                lat: updatedFloat.position.lat,
                lon: updatedFloat.position.lon,
                timestamp: now.toISOString(),
                estimated: false,
                uncertaintyKm: 0.05,
                fixQuality: 'gps',
              },
            ];
          }

          if (nextState === 'DESCENT')   updatedFloat.currentDepth = 250.0;
          else if (nextState === 'DRIFTING')  updatedFloat.currentDepth = 498.0;
          else if (nextState === 'ASCENDING') updatedFloat.currentDepth = 150.0;

          updatedFloat.missionState = nextState;
          return updatedFloat;
        });
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getFloatById = (id) =>
    fleet.find((f) => f.id.toUpperCase() === (id || '').toUpperCase());

  // Fleet summary stats
  const totalFloats     = fleet.length;
  const activeCount     = fleet.filter((f) => f.status === 'active').length;
  const underIceCount   = fleet.filter((f) => f.status === 'under_ice').length;
  const silentCount     = fleet.filter((f) => f.status === 'silent').length;
  const recoveredCount  = fleet.filter((f) => f.status === 'recovered').length;
  const totalProfiles   = fleet.reduce((acc, f) => acc + (f.profiles?.length || 0), 0);

  // Most recent successful uplink (for telemetry widget)
  const latestUplink = uplinks.find((u) => u.status === 'SUCCESS') || uplinks[0] || null;

  return (
    <FleetContext.Provider
      value={{
        fleet,
        alerts,
        uplinks,
        simTick,
        lastNetworkUpdate,
        networkCycleCount,
        latestUplink,
        getFloatById,
        totalFloats,
        activeCount,
        underIceCount,
        silentCount,
        recoveredCount,
        totalProfiles,
        STATE_LABELS,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error('useFleet must be used within a FleetProvider');
  return context;
}
