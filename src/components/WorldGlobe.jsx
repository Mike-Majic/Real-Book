import { useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { WORLDS } from '../data/worlds';
import { loadLandDots } from '../globe/landDots';
import { loadLandGeo } from '../globe/landGeo';
import { buildLandDots, buildNetworkShell, buildShellNodeGeometry } from '../globe/networkOverlay';
import { buildCategoryShell } from '../globe/categoryShell';
import './WorldGlobe.css';

// Durata dell'animazione "volo" della camera verso una categoria/città:
// esportata così chi apre un pannello dopo il volo (App.jsx) può aspettare
// esattamente questo tempo, invece di un numero magico duplicato altrove.
export const CATEGORY_FLY_MS = 1800;

// Esperimento: continenti con contorni reali (GeoJSON) al posto dei puntini.
// Per tornare al vecchio sistema basta rimettere questa a false, il codice
// dei puntini (src/globe/landDots.js, buildLandDots) è ancora tutto qui,
// intatto, sotto l'else.
const USE_REALISTIC_CONTINENTS = true;

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

// Quando una città ha più utenti della soglia, invece di un marker per
// persona (che a migliaia diventerebbe illeggibile, oltre che lento) si
// mostra un solo "grumo" col conteggio. Un click lo apre (rivela i marker
// singoli di quella città) e centra la camera li' sopra.
const CLUSTER_THRESHOLD = 12;

function makeClusterEl(cluster, world, onExpand) {
  const el = document.createElement('div');
  el.className = 'rb-marker-cluster';
  el.style.borderColor = world.color;
  el.style.background = `color-mix(in srgb, ${world.color} 28%, rgba(0,0,0,0.55))`;
  el.innerHTML = `<span>${cluster.count}</span>`;
  el.title = `${cluster.city} · ${cluster.count} persone`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onExpand(cluster);
  });
  return el;
}

// Raggruppa gli utenti per città: sotto soglia restano marker singoli,
// sopra soglia diventano un unico "grumo" (a meno che quella città non sia
// già stata aperta con un click).
function clusterUsers(users, expandedCities) {
  const byCity = new Map();
  for (const u of users) {
    const key = u.city || `${u.lat},${u.lng}`;
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key).push(u);
  }

  const items = [];
  for (const [city, group] of byCity) {
    if (group.length > CLUSTER_THRESHOLD && !expandedCities.has(city)) {
      items.push({ kind: 'cluster', city, lat: group[0].lat, lng: group[0].lng, count: group.length });
    } else {
      for (const u of group) items.push({ kind: 'user', ...u });
    }
  }
  return items;
}

export default function WorldGlobe({ world, users, onSelectUser, containerRef, flyTo, categories, activeCategory, onCategorySelect, onCategoryPositionsReady }) {
  const globeRef = useRef();
  const overlayRef = useRef(null);
  const categoryShellRef = useRef(null);
  const landPointsRef = useRef(null);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [landPolygons, setLandPolygons] = useState([]);
  const [expandedCities, setExpandedCities] = useState(() => new Set());

  // Cambiando mondo, si riparte con tutte le città "chiuse" (raggruppate).
  useEffect(() => {
    setExpandedCities(new Set());
  }, [world.id]);

  const displayItems = useMemo(() => clusterUsers(users, expandedCities), [users, expandedCities]);

  const expandCluster = (cluster) => {
    setExpandedCities((prev) => new Set(prev).add(cluster.city));
    const g = globeRef.current;
    if (g) g.pointOfView({ lat: cluster.lat, lng: cluster.lng, altitude: 0.4 }, 1200);
  };
  // Puntatore "grezzo" (touch) = dispositivo mobile: li' il globo deve stare
  // fermo di default e muoversi solo con le dita (trascinamento/pizzico),
  // mai da solo. Su desktop invece ruota da solo finche' il mouse non ci
  // passa sopra.
  const isTouchDevice = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);
  const isHoveringRef = useRef(false);

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

  // Continenti: due sistemi alternativi, scelti da USE_REALISTIC_CONTINENTS.
  // Puntini (vecchio): caricati dall'immagine terra/acqua, se falliscono il
  // resto della scena resta comunque visibile.
  useEffect(() => {
    if (USE_REALISTIC_CONTINENTS) return undefined;
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

  // Contorni reali (nuovo): GeoJSON precalcolato (vedi scripts/build-land-geojson.mjs),
  // nessuna richiesta di rete oltre al file statico.
  useEffect(() => {
    if (!USE_REALISTIC_CONTINENTS) return undefined;
    let cancelled = false;

    loadLandGeo()
      .then((features) => {
        if (cancelled) return;
        setLandPolygons(features);
      })
      .catch((err) => {
        console.error('Impossibile caricare i contorni dei continenti', err);
      });

    return () => {
      cancelled = true;
    };
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
    g.controls().autoRotate = !isTouchDevice;
    g.controls().autoRotateSpeed = 0.35;
    g.controls().enableZoom = true;
    g.pointOfView({ altitude: 2.4 }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Solo su desktop: passando il mouse sopra il globo, la rotazione automatica
  // si ferma; togliendolo, riparte. Su mobile non c'e' mai auto-rotazione, quindi
  // non serve gestire l'hover (il touch non "passa sopra", tocca e basta).
  useEffect(() => {
    if (isTouchDevice) return undefined;
    const g = globeRef.current;
    if (!g) return undefined;
    const canvas = g.renderer().domElement;
    const controls = g.controls();
    const onEnter = () => {
      isHoveringRef.current = true;
      controls.autoRotate = false;
    };
    const onLeave = () => {
      isHoveringRef.current = false;
      controls.autoRotate = true;
    };
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointerleave', onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Su mobile il globo resta sempre fermo (si muove solo con le dita), quindi
    // dopo il volo non riparte mai da solo.
    if (isTouchDevice) return undefined;

    const resumeTimer = setTimeout(() => {
      if (!isHoveringRef.current) controls.autoRotate = true;
    }, 4000);

    return () => clearTimeout(resumeTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        polygonsData={USE_REALISTIC_CONTINENTS ? landPolygons : []}
        polygonCapColor={() => polygonFillColor(world.atmosphereColor)}
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={() => world.atmosphereColor}
        polygonAltitude={0.006}
        htmlElementsData={displayItems}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.03}
        htmlElement={(item) =>
          item.kind === 'cluster' ? makeClusterEl(item, world, expandCluster) : makeMarkerEl(item, world, onSelectUser)
        }
        width={size.width}
        height={size.height}
      />
    </div>
  );
}

// Colore del "riempimento" dei continenti: stesso colore del mondo ma molto
// trasparente, così i contorni (lo stroke) restano il segno principale.
const capColorCache = new Map();
function polygonFillColor(hexColor) {
  let cached = capColorCache.get(hexColor);
  if (!cached) {
    const c = new THREE.Color(hexColor);
    cached = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, 0.1)`;
    capColorCache.set(hexColor, cached);
  }
  return cached;
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
