/**
 * PolarSense Physical Oceanography & Telemetry Utilities
 * Implements UNESCO Equation of State (EOS-80) approximations,
 * QC flag specifications (Argo table 2), and data export encoders.
 */

// UNESCO 1983 / EOS-80 approximation for 1-atm potential density sigma-theta (kg/m^3)
// sigma_theta = density(S, T, 0) - 1000 kg/m^3
export function calculateSigmaTheta(salinity, temperature) {
  const S = Number(salinity);
  const T = Number(temperature);

  // Pure water density at atmospheric pressure
  const rhow = 999.842594 + 6.793952e-2 * T - 9.095290e-3 * Math.pow(T, 2) +
               1.001685e-4 * Math.pow(T, 3) - 1.120083e-6 * Math.pow(T, 4) + 6.536332e-9 * Math.pow(T, 5);

  // Salinity adjustment terms
  const A = 8.24493e-1 - 4.0899e-3 * T + 7.6438e-5 * Math.pow(T, 2) - 8.2467e-7 * Math.pow(T, 3) + 5.3875e-9 * Math.pow(T, 4);
  const B = -5.72466e-3 + 1.0227e-4 * T - 1.6546e-6 * Math.pow(T, 2);
  const C = 4.8314e-4;

  const rho = rhow + A * S + B * Math.pow(S, 1.5) + C * Math.pow(S, 2);
  return Number((rho - 1000).toFixed(3));
}

// Generate contour curves for sigma-theta across a given (S, T) grid
export function generateIsopycnals(sMin = 33.0, sMax = 35.5, tMin = -2.5, tMax = 8.0, targetSigmas = [26.0, 26.5, 27.0, 27.2, 27.4, 27.6, 27.8, 28.0]) {
  const curves = [];

  targetSigmas.forEach((targetSigma) => {
    const points = [];
    const stepT = 0.25;
    for (let t = tMin; t <= tMax; t += stepT) {
      // Find S that gives targetSigma using binary search / secant method
      let lowS = sMin;
      let highS = sMax;
      let foundS = null;

      for (let iter = 0; iter < 16; iter++) {
        const midS = (lowS + highS) / 2;
        const testSigma = calculateSigmaTheta(midS, t);
        if (Math.abs(testSigma - targetSigma) < 0.005) {
          foundS = midS;
          break;
        }
        if (testSigma < targetSigma) {
          lowS = midS;
        } else {
          highS = midS;
        }
      }

      if (foundS !== null && foundS >= sMin && foundS <= sMax) {
        points.push({ sal: Number(foundS.toFixed(3)), temp: Number(t.toFixed(2)), sigma: targetSigma });
      }
    }

    if (points.length > 1) {
      curves.push({
        sigma: targetSigma,
        points: points
      });
    }
  });

  return curves;
}

// Color scale for depth in T-S diagram (0m to 500m)
// 0m (Surface): Teal/Cyan -> 250m: Deep Blue -> 500m: Navy/Violet
export function getDepthColor(depth) {
  const d = Math.max(0, Math.min(500, Number(depth)));
  const t = d / 500;
  
  if (t < 0.3) {
    // 0 to 150m: Teal to Blue-Green (#0E7C8B -> #1D9A81)
    return '#0E7C8B';
  } else if (t < 0.7) {
    // 150 to 350m: Slate to Deep Blue (#2E5B88)
    return '#2E5B88';
  } else {
    // 350 to 500m: Indigo-Slate (#4338CA / #312E81)
    return '#1E293B';
  }
}

// Format simulated 340-byte raw hex payload
export function generateRawPayload(floatId, cycleNum, levelsCount = 28) {
  let hex = '';
  const header = `01${floatId.replace(/[^0-9]/g, '').padStart(4, '0')}${cycleNum.toString(16).padStart(4, '0')}A8`;
  hex += header;
  
  // Deterministic pseudo-random payload generator based on float and cycle
  let seed = (cycleNum * 1337) ^ parseInt(floatId.replace(/[^0-9]/g, '1') || '1', 10);
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  while (hex.length < 680) { // 340 bytes = 680 hex chars
    const byte = Math.floor(pseudoRand() * 256).toString(16).padStart(2, '0');
    hex += byte.toUpperCase();
  }
  return hex.substring(0, 680);
}

// Format raw hex dump with offsets and ASCII representation
export function formatHexDump(hexString) {
  const lines = [];
  for (let i = 0; i < hexString.length; i += 32) {
    const chunk = hexString.substring(i, i + 32);
    const offset = (i / 2).toString(16).padStart(4, '0');
    
    // Group into 2-char bytes
    const bytes = [];
    let ascii = '';
    for (let b = 0; b < chunk.length; b += 2) {
      const byteHex = chunk.substring(b, b + 2);
      bytes.push(byteHex);
      const charCode = parseInt(byteHex, 16);
      ascii += (charCode >= 32 && charCode <= 126) ? String.fromCharCode(charCode) : '.';
    }
    
    const hexFormatted = bytes.slice(0, 8).join(' ') + '  ' + bytes.slice(8).join(' ');
    lines.push(`${offset}  ${hexFormatted.padEnd(49, ' ')}  |${ascii}|`);
  }
  return lines.join('\n');
}

// Argo QC Flag Descriptions
export const QC_FLAGS = {
  1: { label: 'Good', desc: 'Real-time passed all automated tests or validated in DMQC', className: 'qc-1' },
  2: { label: 'Probably good', desc: 'Minor instrument drift or statistical anomaly', className: 'qc-2' },
  3: { label: 'Probably bad', desc: 'Spike or gradient test failure, potential biofouling', className: 'qc-3' },
  4: { label: 'Bad', desc: 'Sensor failure, out of range, or unrecoverable corrupt packet', className: 'qc-4' }
};

// Export Generators
export function generateCSV(selectedFloats, parameters = ['pres', 'temp', 'psal', 'doxy']) {
  let csv = `# PolarSense Ocean Float Telemetry Export\n`;
  csv += `# Generated: ${new Date().toISOString()}\n`;
  csv += `# Convention: Argo Data Management 3.1 Standard\n`;
  csv += `PLATFORM_NUMBER,CYCLE_NUMBER,DATE_TIME,LATITUDE,LONGITUDE,DATA_MODE,PRES_DBAR,TEMP_C,PSAL_PSU,SIGMA_THETA_KG_M3,QC_FLAG\n`;

  selectedFloats.forEach((float) => {
    (float.profiles || []).forEach((profile) => {
      const lat = float.position?.lat || 0;
      const lon = float.position?.lon || 0;
      (profile.levels || []).forEach((lvl) => {
        const sigma = calculateSigmaTheta(lvl.psal, lvl.temp);
        csv += `${float.wmo},${profile.cycle},${profile.timestamp},${lat},${lon},${profile.dataMode},${lvl.pres.toFixed(1)},${lvl.temp.toFixed(2)},${lvl.psal.toFixed(2)},${sigma},${lvl.qc}\n`;
      });
    });
  });

  return csv;
}

export function generateNetCDFAscii(selectedFloats) {
  let text = `netcdf polarsense_argo_profile_export {\n`;
  text += `dimensions:\n\tN_PROF = ${selectedFloats.reduce((acc, f) => acc + (f.profiles?.length || 0), 0)} ;\n\tN_LEVELS = 30 ;\n\tN_PARAM = 4 ;\n`;
  text += `variables:\n\tchar DATA_TYPE(N_PROF) ;\n\t\tDATA_TYPE:long_name = "Argo core profile" ;\n`;
  text += `\tdouble JULD(N_PROF) ;\n\t\tJULD:long_name = "Julian day (UTC) of the profile" ;\n`;
  text += `\tfloat LATITUDE(N_PROF) ;\n\tfloat LONGITUDE(N_PROF) ;\n`;
  text += `\tfloat PRES(N_PROF, N_LEVELS) ;\n\t\tPRES:units = "decibar" ;\n`;
  text += `\tfloat TEMP(N_PROF, N_LEVELS) ;\n\t\tTEMP:units = "degree_Celsius" ;\n`;
  text += `\tfloat PSAL(N_PROF, N_LEVELS) ;\n\t\tPSAL:units = "psu" ;\n\n`;
  text += `// global attributes:
		:title = "PolarSense Autonomous Ice-Aware Profiling Float Telemetry (PS 26065)" ;
		:institution = "Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR) · Team AQUA LEAGUE" ;
		:source = "Autonomous 450m/500m Polar Profiling Floats (v3.0 Baseline)" ;
		:references = "https://github.com/boomesh11/Polar-sense" ;
		:comment = "Physical profiles collected with RBRlegato4 / SBE-41CP CTD sensors with dual-range sonar ice-risk verification." ;
		:date_created = "${new Date().toISOString()}" ;\n`;
  text += `data:\n\n`;
  text += `// Sample float arrays included in active selection\n`;
  selectedFloats.slice(0, 3).forEach((f) => {
    text += `  // Platform ${f.wmo} (${f.id}) - ${f.region}\n`;
  });
  text += `}\n`;
  return text;
}
