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

export default function WorldGlobe({ world, users, onSelectUser, containerRef }) {
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

  // Guscio "a rete" (continenti a puntini + wireframe con nodi luminosi), come nelle
  // immagini di riferimento: sfondo nero, colore che cambia in base al mondo.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return undefined;
    let cancelled = false;

    loadLandDots().then((landPoints) => {
      if (cancelled) return;
      const scene = g.scene();
      const group = new THREE.Group();
      const landDots = buildLandDots(landPoints);
      const shell = buildNetworkShell();
      group.add(landDots, shell.lines, shell.nodes);
      scene.add(group);
      overlayRef.current = { group, landDots, shell };
      applyOverlayColor(overlayRef.current, world.atmosphereColor);
    });

    return () => {
      cancelled = true;
      if (overlayRef.current) {
        const { group, landDots, shell } = overlayRef.current;
        g.scene().remove(group);
        landDots.geometry.dispose();
        landDots.material.dispose();
        shell.icoGeometry.dispose();
        shell.edgesGeometry.dispose();
        shell.lineMaterial.dispose();
        shell.nodeMaterial.dispose();
        overlayRef.current = null;
      }
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
  overlay.landDots.material.color.set(color);
  overlay.shell.lineMaterial.color.set(color);
  overlay.shell.nodeMaterial.color.set(color);
}

export { WORLDS };
