import { useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { WORLDS } from '../data/worlds';
import { loadLandDots } from '../globe/landDots';
import { buildLandDots, buildNetworkShell } from '../globe/networkOverlay';
import './WorldGlobe.css';

function makeMarkerEl(user, world, onOpen) {
  const el = document.createElement('div');
  el.className = 'rb-marker';
  el.innerHTML = `
    <div class="rb-marker-photo" style="border-color:${world.color}">
      <img src="${user.avatar}" alt="${user.name}" loading="lazy" />
      <span class="rb-marker-dot" style="background:${world.color}"></span>
    </div>
  `;
  el.title = `${user.name} · ${user.city}`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onOpen(user);
  });
  return el;
}

export default function WorldGlobe({ world, users, onSelectUser, containerRef, flyTo }) {
  const globeRef = useRef();
  const overlayRef = useRef(null);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const globeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: '#050508',
        transparent: true,
        opacity: 0.85,
        shininess: 6,
      }),
    []
  );

  // Guscio "a rete" (wireframe + nodi luminosi), come nelle immagini di riferimento.
  // Non dipende da nessuna immagine: appare subito, a prescindere dai puntini dei continenti.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return undefined;

    const scene = g.scene();
    const shell = buildNetworkShell();
    const group = new THREE.Group();
    group.add(shell.lines, shell.nodes);
    scene.add(group);
    overlayRef.current = { group, shell, landDots: null };
    applyOverlayColor(overlayRef.current, world.atmosphereColor);

    return () => {
      scene.remove(group);
      shell.icoGeometry.dispose();
      shell.edgesGeometry.dispose();
      shell.lineMaterial.dispose();
      shell.nodeMaterial.dispose();
      overlayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Puntini dei continenti: caricati a parte (dipendono dall'immagine terra/acqua),
  // se falliscono il resto della scena resta comunque visibile.
  useEffect(() => {
    let cancelled = false;

    loadLandDots()
      .then((landPoints) => {
        if (cancelled || !overlayRef.current) return;
        const landDots = buildLandDots(landPoints);
        overlayRef.current.group.add(landDots);
        overlayRef.current.landDots = landDots;
        applyOverlayColor(overlayRef.current, world.atmosphereColor);
      })
      .catch((err) => {
        console.error('Impossibile caricare la mappa dei continenti', err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (overlayRef.current) applyOverlayColor(overlayRef.current, world.atmosphereColor);
  }, [world.atmosphereColor]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.35;
    g.controls().enableZoom = true;
    g.pointOfView({ altitude: 2.4 }, 0);
  }, []);

  // Quando si cerca una città nota nei filtri, il globo smette di ruotare da solo
  // e vola sopra quella città con una transizione morbida.
  useEffect(() => {
    const g = globeRef.current;
    if (!g || !flyTo) return undefined;

    const controls = g.controls();
    controls.autoRotate = false;
    g.pointOfView({ lat: flyTo.lat, lng: flyTo.lng, altitude: 1.3 }, 1800);

    const resumeTimer = setTimeout(() => {
      controls.autoRotate = true;
    }, 4000);

    return () => clearTimeout(resumeTimer);
  }, [flyTo]);

  return (
    <div className="rb-globe-shell" ref={containerRef}>
      <Globe
        ref={globeRef}
        globeMaterial={globeMaterial}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor={world.atmosphereColor}
        atmosphereAltitude={0.3}
        htmlElementsData={users}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.03}
        htmlElement={(user) => makeMarkerEl(user, world, onSelectUser)}
        width={size.width}
        height={size.height}
      />
    </div>
  );
}

function applyOverlayColor(overlay, color) {
  if (overlay.landDots) overlay.landDots.material.color.set(color);
  overlay.shell.lineMaterial.color.set(color);
  overlay.shell.nodeMaterial.color.set(color);
}

export { WORLDS };
