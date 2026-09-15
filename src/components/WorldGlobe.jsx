import { useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { WORLDS } from '../data/worlds';
import { loadLandDots } from '../globe/landDots';
import { buildLandDots, buildNetworkShell, buildShellNodeGeometry } from '../globe/networkOverlay';
import { buildCategoryShell } from '../globe/categoryShell';
import './WorldGlobe.css';

// Durata dell'animazione "volo" della camera verso una categoria/città:
// esportata così chi apre un pannello dopo il volo (App.jsx) può aspettare
// esattamente questo tempo, invece di un numero magico duplicato altrove.
export const CATEGORY_FLY_MS = 1800;

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

export default function WorldGlobe({ world, users, onSelectUser, containerRef, flyTo, categories, activeCategory, onCategorySelect, onCategoryPositionsReady }) {
  const globeRef = useRef();
  const overlayRef = useRef(null);
  const categoryShellRef = useRef(null);
  const landPointsRef = useRef(null);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Materiale opaco (non trasparente): evitiamo che il globo finisca nel canale di
  // rendering "trasparente" insieme ai puntini, che causava sfarfallio/z-fighting
  // durante la rotazione o lo zoom.
  const globeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: '#050508',
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
      shell.nodes.geometry.dispose();
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
        landPointsRef.current = landPoints;
        rebuildLandDots(overlayRef.current, landPoints, categoryShellRef.current?.triangles ?? [], world.atmosphereColor);
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

  // Categorie "incastonate" nel guscio (solo dove servono, es. mondo Arte & Musica):
  // ogni categoria riempie il triangolo più vicino alla sua posizione lat/lng, con
  // un'etichetta sempre rivolta verso la camera (quindi sempre dritta e leggibile).
  useEffect(() => {
    const g = globeRef.current;
    if (!g || !categories || categories.length === 0) {
      categoryShellRef.current = null;
      return undefined;
    }

    const scene = g.scene();
    const shell = buildCategoryShell(categories, { radius: 122, color: world.color });
    scene.add(shell.group);
    categoryShellRef.current = shell;
    shell.setActive(activeCategory);
    onCategoryPositionsReady?.(shell.positions);

    // Toglie i puntini dei continenti e i nodi luminosi della rete da dentro ai
    // triangoli, per lasciare le etichette leggibili; tornano completi appena si
    // esce da questo mondo.
    if (overlayRef.current && landPointsRef.current) {
      rebuildLandDots(overlayRef.current, landPointsRef.current, shell.triangles, world.atmosphereColor);
    }
    if (overlayRef.current) {
      rebuildShellNodes(overlayRef.current, shell.triangles);
    }

    return () => {
      scene.remove(shell.group);
      shell.dispose();
      categoryShellRef.current = null;
      if (overlayRef.current && landPointsRef.current) {
        rebuildLandDots(overlayRef.current, landPointsRef.current, [], world.atmosphereColor);
      }
      if (overlayRef.current) {
        rebuildShellNodes(overlayRef.current, []);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, world.color]);

  useEffect(() => {
    categoryShellRef.current?.setActive(activeCategory);
  }, [activeCategory]);

  // Rileva i click sui triangoli delle categorie, distinguendoli da un trascinamento
  // (che serve invece a ruotare il globo con OrbitControls).
  useEffect(() => {
    const g = globeRef.current;
    if (!g || !categories || !onCategorySelect) return undefined;

    const canvas = g.renderer().domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos = null;

    const onPointerDown = (e) => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e) => {
      if (!downPos) return;
      const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      downPos = null;
      if (moved > 6) return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, g.camera());
      const hits = raycaster.intersectObjects(categoryShellRef.current?.faceMeshes ?? []);
      if (hits.length > 0) onCategorySelect(hits[0].object.userData.categoryId);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, [categories, onCategorySelect]);

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
    const pov = { altitude: flyTo.altitude ?? 1.3 };
    if (flyTo.lat !== undefined) pov.lat = flyTo.lat;
    if (flyTo.lng !== undefined) pov.lng = flyTo.lng;
    g.pointOfView(pov, CATEGORY_FLY_MS);

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

// Ricostruisce i puntini dei continenti, escludendo (o meno) quelli dentro ai
// triangoli delle categorie attive.
function rebuildLandDots(overlay, landPoints, excludeTriangles, color) {
  const old = overlay.landDots;
  if (old) {
    overlay.group.remove(old);
    old.geometry.dispose();
    old.material.dispose();
  }
  const landDots = buildLandDots(landPoints, excludeTriangles);
  landDots.material.color.set(color);
  overlay.group.add(landDots);
  overlay.landDots = landDots;
}

// Rifà la geometria dei nodi luminosi del guscio, escludendo quelli dentro ai
// triangoli delle categorie attive (il materiale/colore resta lo stesso).
function rebuildShellNodes(overlay, excludeTriangles) {
  const newGeometry = buildShellNodeGeometry(overlay.shell.icoGeometry, excludeTriangles);
  overlay.shell.nodes.geometry.dispose();
  overlay.shell.nodes.geometry = newGeometry;
}

export { WORLDS };
